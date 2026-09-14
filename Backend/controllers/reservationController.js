const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const {
  hasConflictingReservation,
  maybeFreeTable
} = require("../utils/dineInService");

const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
  "no_show"
];
// Customers may cancel up to 2h before the visit.
const CANCEL_CUTOFF_MINUTES = 120;

const sendError = (res, err, fallback) => {
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error("Reservation error:", err.message);
  return res.status(500).json({ success: false, message: fallback });
};

const generateReservationId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RSV-${suffix}`;
};

const parseTime = (value) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const minutesToTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Tables free for the slot: active, big enough, currently available,
// and without an overlapping live reservation.
const findAvailableTables = async ({ date, startMinutes, durationMinutes, guestCount }) => {
  const tables = await Table.find({ isActive: true }).sort({ capacity: 1, tableNumber: 1 });
  const available = [];
  for (const table of tables) {
    if (table.status !== "available") continue;
    if (table.capacity < guestCount) continue;
    const conflict = await hasConflictingReservation({
      tableId: table._id,
      date,
      startMinutes,
      durationMinutes
    });
    if (conflict) continue;
    available.push({
      tableId: table._id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      section: table.section
    });
  }
  return available;
};

// =====================================
// GET AVAILABILITY (authenticated)
// =====================================
const getAvailability = async (req, res) => {
  try {
    const { date, startTime, guests } = req.query;
    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid date"
      });
    }
    const startMinutes = parseTime(startTime);
    if (startMinutes === null) {
      return res.status(400).json({
        success: false,
        message: "Select a valid time"
      });
    }
    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 50) {
      return res.status(400).json({
        success: false,
        message: "Guest count must be 1–50"
      });
    }
    const tables = await findAvailableTables({
      date,
      startMinutes,
      durationMinutes: 120,
      guestCount
    });
    res.status(200).json({ success: true, count: tables.length, tables });
  } catch (error) {
    sendError(error, error, "Server error while checking availability");
  }
};

// =====================================
// CREATE RESERVATION (authenticated)
// =====================================
const createReservation = async (req, res) => {
  try {
    const { date, startTime, guestCount, tableId, specialRequest, customerName, mobile } = req.body;
    if (!isValidDate(date)) {
      return res.status(400).json({ success: false, message: "Select a valid date" });
    }
    const startMinutes = parseTime(startTime);
    if (startMinutes === null) {
      return res.status(400).json({ success: false, message: "Select a valid time" });
    }
    const guests = Number(guestCount);
    if (!Number.isInteger(guests) || guests < 1 || guests > 50) {
      return res.status(400).json({ success: false, message: "Guest count must be 1–50" });
    }
    if (!customerName || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Full name and mobile number are required"
      });
    }
    if (!/^\d{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number"
      });
    }
    // Past slots cannot be booked.
    const startAt = new Date(`${date}T${minutesToTime(startMinutes)}:00`);
    if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Reservations must be for a future time"
      });
    }
    if (!mongoose.isValidObjectId(tableId)) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    const table = await Table.findById(tableId);
    if (!table || !table.isActive) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    if (table.status !== "available" || table.capacity < guests) {
      return res.status(400).json({
        success: false,
        message: "This table is no longer available for the selected time"
      });
    }
    const conflict = await hasConflictingReservation({
      tableId: table._id,
      date,
      startMinutes,
      durationMinutes: 120
    });
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "This table was just reserved by someone else"
      });
    }

    let reservationId = generateReservationId();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const existing = await Reservation.findOne({ reservationId });
      if (!existing) break;
      reservationId = generateReservationId();
    }

    const reservation = await Reservation.create({
      reservationId,
      user: req.user.userId,
      customerName: String(customerName).trim(),
      mobile: String(mobile).trim(),
      date,
      startMinutes,
      durationMinutes: 120,
      guestCount: guests,
      table: table._id,
      tableNumber: table.tableNumber,
      status: "pending",
      specialRequest: String(specialRequest || "").slice(0, 300)
    });
    res.status(201).json({
      success: true,
      message: "Table reserved successfully",
      reservation
    });
  } catch (error) {
    sendError(error, error, "Server error while creating reservation");
  }
};

// =====================================
// OWN RESERVATIONS (authenticated)
// =====================================
const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.userId })
      .populate("table", "tableNumber capacity section status")
      .sort({ date: -1, startMinutes: -1 });
    res.status(200).json({
      success: true,
      count: reservations.length,
      reservations
    });
  } catch (error) {
    sendError(error, error, "Server error while fetching reservations");
  }
};

// =====================================
// CANCEL OWN RESERVATION (2h cutoff, history kept)
// =====================================
const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }
    if (!["pending", "confirmed"].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: "Only upcoming reservations can be cancelled"
      });
    }
    const startAt = new Date(
      `${reservation.date}T${minutesToTime(reservation.startMinutes)}:00`
    );
    if (startAt.getTime() - Date.now() < CANCEL_CUTOFF_MINUTES * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: "Reservations can only be cancelled 2 hours in advance"
      });
    }
    reservation.status = "cancelled";
    await reservation.save();
    if (reservation.table) {
      await maybeFreeTable(reservation.table);
    }
    res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully",
      reservation
    });
  } catch (error) {
    sendError(error, error, "Server error while cancelling reservation");
  }
};

// =====================================
// ADMIN: LIST (filter by status group)
// =====================================
const getAllReservations = async (req, res) => {
  try {
    const filter = req.query.filter || "upcoming";
    const today = new Date().toISOString().slice(0, 10);
    let query = {};
    if (filter === "today") {
      query = { date: today, status: { $nin: ["cancelled"] } };
    } else if (filter === "upcoming") {
      query = {
        $or: [
          { date: { $gt: today } },
          { date: today, status: { $in: ["pending", "confirmed", "seated"] } }
        ],
        status: { $nin: ["cancelled", "completed", "no_show"] }
      };
    } else if (filter === "completed") {
      query = { status: { $in: ["completed", "seated"] } };
    } else if (filter === "cancelled") {
      query = { status: { $in: ["cancelled", "no_show"] } };
    }
    const reservations = await Reservation.find(query)
      .populate("user", "name email")
      .populate("table", "tableNumber capacity section status")
      .sort({ date: 1, startMinutes: 1 });
    res.status(200).json({
      success: true,
      count: reservations.length,
      reservations
    });
  } catch (error) {
    sendError(error, error, "Server error while fetching reservations");
  }
};

// =====================================
// ADMIN: UPDATE STATUS (+ optional table assignment)
// =====================================
const updateReservation = async (req, res) => {
  try {
    const { status, tableId } = req.body;
    const valid = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }
    // Optional reassignment (validated for conflicts, never blind).
    if (tableId !== undefined && tableId !== null && String(tableId) !== String(reservation.table || "")) {
      if (!mongoose.isValidObjectId(tableId)) {
        return res.status(404).json({ success: false, message: "Table not found" });
      }
      const table = await Table.findById(tableId);
      if (!table || !table.isActive) {
        return res.status(404).json({ success: false, message: "Table not found" });
      }
      if (table.capacity < reservation.guestCount) {
        return res.status(400).json({
          success: false,
          message: "Table capacity is smaller than the guest count"
        });
      }
      const conflict = await hasConflictingReservation({
        tableId: table._id,
        date: reservation.date,
        startMinutes: reservation.startMinutes,
        durationMinutes: reservation.durationMinutes,
        ignoreId: reservation._id
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "Table conflicts with another reservation"
        });
      }
      reservation.table = table._id;
      reservation.tableNumber = table.tableNumber;
    }
    reservation.status = status;
    await reservation.save();

    // Side effects: seating occupies, finishing frees when idle.
    if (status === "seated" && reservation.table) {
      await Table.findByIdAndUpdate(reservation.table, { status: "occupied" });
    }
    if (["completed", "cancelled", "no_show"].includes(status) && reservation.table) {
      await maybeFreeTable(reservation.table);
    }
    res.status(200).json({
      success: true,
      message: "Reservation updated successfully",
      reservation
    });
  } catch (error) {
    sendError(error, error, "Server error while updating reservation");
  }
};

module.exports = {
  getAvailability,
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  updateReservation,
  minutesToTime,
  parseTime
};

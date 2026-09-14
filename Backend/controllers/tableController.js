const mongoose = require("mongoose");
const Table = require("../models/Table");
const DineInSession = require("../models/DineInSession");
const Order = require("../models/Order");
const {
  generateQrToken,
  verifyTableAccess,
  getOrCreateActiveSession,
  maybeFreeTable,
  OPEN_ORDER_STATUSES
} = require("../utils/dineInService");

const sendError = (res, err, fallback) => {
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error("Table error:", err.message);
  return res.status(500).json({ success: false, message: fallback });
};

const parseTableInput = (body) => {
  const tableNumber = String(body.tableNumber || "").trim().toUpperCase();
  if (!tableNumber || tableNumber.length > 10) {
    const err = new Error("Table number is required (max 10 characters)");
    err.status = 400;
    throw err;
  }
  const capacity = Number(body.capacity);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
    const err = new Error("Capacity must be 1–50 seats");
    err.status = 400;
    throw err;
  }
  const section = String(body.section ?? "Main Hall").trim() || "Main Hall";
  if (section.length > 60) {
    const err = new Error("Section name is too long");
    err.status = 400;
    throw err;
  }
  const status = String(body.status || "available").toLowerCase();
  if (!["available", "reserved", "occupied", "disabled"].includes(status)) {
    const err = new Error("Invalid table status");
    err.status = 400;
    throw err;
  }
  return {
    tableNumber,
    capacity,
    section,
    status,
    isActive: body.isActive !== false
  };
};

// Public: resolve a scanned QR (guests may be logged out).
// Creates/reuses the table's active session for ordering context.
const resolveTable = async (req, res) => {
  try {
    const table = await verifyTableAccess({
      tableNumber: req.query.tableNumber,
      qrToken: req.query.token
    });
    const session = await getOrCreateActiveSession(table);
    res.status(200).json({
      success: true,
      table: {
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        section: table.section,
        status: table.status
      },
      session: { sessionId: session.sessionId, status: session.status }
    });
  } catch (error) {
    sendError(error, error, "Unable to resolve table.");
  }
};

const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    const enriched = await Promise.all(
      tables.map(async (table) => {
        const [session, openOrders] = await Promise.all([
          DineInSession.findOne({ table: table._id, status: "active" }),
          Order.countDocuments({
            table: table._id,
            orderStatus: { $in: OPEN_ORDER_STATUSES }
          })
        ]);
        return {
          ...table.toObject(),
          activeSession: session
            ? { sessionId: session.sessionId, openedAt: session.createdAt }
            : null,
          openOrders
        };
      })
    );
    res.status(200).json({ success: true, count: enriched.length, tables: enriched });
  } catch (error) {
    sendError(error, error, "Server error while fetching tables");
  }
};

const createTable = async (req, res) => {
  try {
    const fields = parseTableInput(req.body);
    const existing = await Table.findOne({ tableNumber: fields.tableNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A table with this number already exists"
      });
    }
    const table = await Table.create({ ...fields, qrToken: generateQrToken() });
    res.status(201).json({
      success: true,
      message: "Table created successfully",
      table
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A table with this number already exists"
      });
    }
    sendError(error, error, "Server error while creating table");
  }
};

const updateTable = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    const fields = parseTableInput({ ...req.body, tableNumber: req.body.tableNumber ?? table.tableNumber });
    if (fields.tableNumber !== table.tableNumber) {
      const clash = await Table.findOne({ tableNumber: fields.tableNumber });
      if (clash) {
        return res.status(409).json({
          success: false,
          message: "A table with this number already exists"
        });
      }
    }
    Object.assign(table, fields);
    await table.save();
    res.status(200).json({
      success: true,
      message: "Table updated successfully",
      table
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A table with this number already exists"
      });
    }
    sendError(error, error, "Server error while updating table");
  }
};

const deleteTable = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    const Reservation = require("../models/Reservation");
    const [session, reservation, order] = await Promise.all([
      DineInSession.findOne({ table: table._id, status: "active" }),
      Reservation.findOne({
        table: table._id,
        status: { $in: ["pending", "confirmed", "seated"] }
      }),
      Order.findOne({ table: table._id, orderStatus: { $in: OPEN_ORDER_STATUSES } })
    ]);
    if (session || reservation || order) {
      return res.status(400).json({
        success: false,
        message: "Table has live activity and cannot be deleted"
      });
    }
    await table.deleteOne();
    res.status(200).json({ success: true, message: "Table deleted successfully" });
  } catch (error) {
    sendError(error, error, "Server error while deleting table");
  }
};

// Regenerate the QR token (invalidates printed codes).
const regenerateToken = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    table.qrToken = generateQrToken();
    await table.save();
    res.status(200).json({
      success: true,
      message: "QR code regenerated successfully",
      table
    });
  } catch (error) {
    sendError(error, error, "Server error while regenerating QR code");
  }
};

// Mark a table available (only when nothing live depends on it).
const markAvailable = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    if (table.status === "disabled") {
      return res.status(400).json({
        success: false,
        message: "Enable the table before marking it available"
      });
    }
    await maybeFreeTable(table._id);
    const fresh = await Table.findById(table._id);
    if (fresh.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Table has live orders, session or reservations"
      });
    }
    res.status(200).json({
      success: true,
      message: "Table marked as available",
      table: fresh
    });
  } catch (error) {
    sendError(error, error, "Server error while updating table");
  }
};

// Close the table's active session (blocked while open orders exist).
const closeSession = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }
    const session = await DineInSession.findOne({
      table: table._id,
      status: "active"
    });
    if (!session) {
      return res.status(400).json({
        success: false,
        message: "Table has no active session"
      });
    }
    const openOrder = await Order.findOne({
      table: table._id,
      orderStatus: { $in: OPEN_ORDER_STATUSES }
    });
    if (openOrder) {
      return res.status(400).json({
        success: false,
        message: `Close session is blocked by open order #${openOrder.orderId}`
      });
    }
    session.status = "completed";
    session.closedAt = new Date();
    await session.save();
    await maybeFreeTable(table._id);
    res.status(200).json({
      success: true,
      message: "Dine-in session closed successfully",
      session
    });
  } catch (error) {
    sendError(error, error, "Server error while closing session");
  }
};

module.exports = {
  resolveTable,
  getTables,
  createTable,
  updateTable,
  deleteTable,
  regenerateToken,
  markAvailable,
  closeSession
};

const crypto = require("crypto");
const Table = require("../models/Table");
const Reservation = require("../models/Reservation");
const DineInSession = require("../models/DineInSession");
const Order = require("../models/Order");

const ACTIVE_RESERVATION_STATUSES = ["pending", "confirmed", "seated"];
// Dine-in orders still being worked on (block session close).
const OPEN_ORDER_STATUSES = ["Pending", "Confirmed", "Preparing", "Ready"];

const generateQrToken = () => crypto.randomBytes(32).toString("hex");

const generateSessionId = (tableNumber) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DIN-${date}-${String(tableNumber).toUpperCase()}-${suffix}`;
};

// Verify a QR scan: table exists, active, usable, token matches.
// Returns the table or throws { status, message }.
const verifyTableAccess = async ({ tableNumber, qrToken }) => {
  const code = String(tableNumber || "").trim().toUpperCase();
  if (!code) {
    const err = new Error("Table number is required");
    err.status = 400;
    throw err;
  }
  const table = await Table.findOne({ tableNumber: code });
  if (!table || !table.isActive || table.status === "disabled") {
    const err = new Error("This table is not available");
    err.status = 404;
    throw err;
  }
  if (!qrToken || table.qrToken !== String(qrToken)) {
    const err = new Error("Invalid table QR code");
    err.status = 403;
    throw err;
  }
  return table;
};

// Reuse the table's active session, else open a new one.
const getOrCreateActiveSession = async (table) => {
  const existing = await DineInSession.findOne({
    table: table._id,
    status: "active"
  });
  if (existing) return existing;
  const session = await DineInSession.create({
    sessionId: generateSessionId(table.tableNumber),
    table: table._id,
    tableNumber: table.tableNumber,
    status: "active"
  });
  return session;
};

// True when two [start, start+duration) ranges intersect.
const rangesOverlap = (aStart, aDur, bStart, bDur) =>
  aStart < bStart + bDur && bStart < aStart + aDur;

// Any live reservation on this table overlapping the range?
const hasConflictingReservation = async ({
  tableId,
  date,
  startMinutes,
  durationMinutes,
  ignoreId = null
}) => {
  const query = {
    table: tableId,
    date,
    status: { $in: ACTIVE_RESERVATION_STATUSES }
  };
  if (ignoreId) query._id = { $ne: ignoreId };
  const existing = await Reservation.find(query);
  return existing.some((r) =>
    rangesOverlap(
      startMinutes,
      durationMinutes,
      r.startMinutes,
      r.durationMinutes
    )
  );
};

// Free a table only when nothing live depends on it.
const maybeFreeTable = async (tableId) => {
  const table = await Table.findById(tableId);
  if (!table || table.status === "disabled") return table;
  const [session, reservation, order] = await Promise.all([
    DineInSession.findOne({ table: tableId, status: "active" }),
    Reservation.findOne({
      table: tableId,
      status: { $in: ACTIVE_RESERVATION_STATUSES }
    }),
    Order.findOne({
      table: tableId,
      orderStatus: { $in: OPEN_ORDER_STATUSES }
    })
  ]);
  if (!session && !reservation && !order && table.status !== "available") {
    table.status = "available";
    await table.save();
  }
  return table;
};

module.exports = {
  ACTIVE_RESERVATION_STATUSES,
  OPEN_ORDER_STATUSES,
  generateQrToken,
  generateSessionId,
  verifyTableAccess,
  getOrCreateActiveSession,
  rangesOverlap,
  hasConflictingReservation,
  maybeFreeTable
};

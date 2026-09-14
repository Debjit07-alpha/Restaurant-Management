const express = require("express");

const {
  resolveTable,
  getTables,
  createTable,
  updateTable,
  deleteTable,
  regenerateToken,
  markAvailable,
  closeSession
} = require("../controllers/tableController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Public: resolve a scanned QR (guests may be logged out).
router.get("/resolve", resolveTable);

// Admin: manage tables.
router.get("/", protect, adminOnly, getTables);
router.post("/", protect, adminOnly, createTable);
router.put("/:id", protect, adminOnly, updateTable);
router.delete("/:id", protect, adminOnly, deleteTable);
router.post("/:id/regenerate-token", protect, adminOnly, regenerateToken);
router.post("/:id/mark-available", protect, adminOnly, markAvailable);
router.post("/:id/close-session", protect, adminOnly, closeSession);

module.exports = router;

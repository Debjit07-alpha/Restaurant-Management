const express = require("express");

const {
  getSummary,
  getTransactions,
  quote,
  getSettings,
  updateSettings,
  adjustPoints
} = require("../controllers/rewardController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Customer: own balance/history/quote (JWT user, never a body userId).
router.get("/summary", protect, getSummary);
router.get("/transactions", protect, getTransactions);
router.post("/quote", protect, quote);

// Public rules for checkout rendering; writes are admin-only.
router.get("/settings", getSettings);
router.put("/settings", protect, adminOnly, updateSettings);
router.post("/adjust", protect, adminOnly, adjustPoints);

module.exports = router;

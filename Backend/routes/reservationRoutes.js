const express = require("express");

const {
  getAvailability,
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  updateReservation
} = require("../controllers/reservationController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Customer (login required — matches the ordering architecture).
router.get("/availability", protect, getAvailability);
router.post("/", protect, createReservation);
router.get("/mine", protect, getMyReservations);
router.put("/:id/cancel", protect, cancelReservation);

// Admin.
router.get("/", protect, adminOnly, getAllReservations);
router.put("/:id", protect, adminOnly, updateReservation);

module.exports = router;

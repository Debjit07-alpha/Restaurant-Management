const express = require("express");

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  reorderOrder
} = require("../controllers/orderController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Create an order (any logged-in user)
router.post("/", protect, createOrder);

// Own orders for users, all orders for Admin
router.get("/", protect, getOrders);

// Single order: owner or Admin only
router.get("/:id", protect, getOrderById);

// Reorder a past order: owner or Admin only.
// Returns available items with CURRENT prices; unavailable skipped.
router.post("/:id/reorder", protect, reorderOrder);

// Update order status: Admin only
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;

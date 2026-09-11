const express = require("express");

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
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

// Update order status: Admin only
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;

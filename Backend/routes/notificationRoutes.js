const express = require("express");

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Own notifications, latest first (?limit=20, max 50)
router.get("/", protect, getNotifications);

// Unread badge count (declared before /:id routes)
router.get("/unread-count", protect, getUnreadCount);

// Mark all own notifications as read
router.put("/read-all", protect, markAllAsRead);

// Mark one own notification as read
router.put("/:id/read", protect, markAsRead);

module.exports = router;

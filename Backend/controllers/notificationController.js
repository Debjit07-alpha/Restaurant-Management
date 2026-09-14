const Notification = require("../models/Notification");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const parseLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
};

// =====================================
// GET OWN NOTIFICATIONS (authenticated)
// GET /api/notifications?limit=20 — latest first
// =====================================
const getNotifications = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const notifications = await Notification.find({ user: req.user.userId })
      .populate("order", "orderId")
      .sort({ createdAt: -1 })
      .limit(limit);
    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications"
    });
  }
};

// =====================================
// GET UNREAD COUNT (authenticated)
// GET /api/notifications/unread-count
// =====================================
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.userId,
      isRead: false
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Get unread count error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications"
    });
  }
};

// =====================================
// MARK ONE AS READ (owner only)
// PUT /api/notifications/:id/read
// =====================================
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    notification.isRead = true;
    await notification.save();
    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("Mark notification read error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating notification"
    });
  }
};

// =====================================
// MARK ALL AS READ (owner only)
// PUT /api/notifications/read-all
// =====================================
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating notifications"
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};

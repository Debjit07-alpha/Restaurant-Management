const mongoose = require("mongoose");

// In-app notification for a single user (order updates, etc.).
// The user/order hold the canonical data; this stores only what the
// customer needs to see, with an ObjectId link back to the order.
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    type: {
      type: String,
      default: "order_status",
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);

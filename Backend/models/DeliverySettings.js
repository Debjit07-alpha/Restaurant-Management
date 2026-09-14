const mongoose = require("mongoose");

// Global delivery configuration. Exactly one document exists (keyed by
// a fixed _id); reads auto-create it with the legacy defaults so
// behavior never changes until an admin saves new values.
const deliverySettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "global"
    },

    // Orders below this subtotal are rejected (0 = disabled).
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Flat fee used when no zone matches (or no zones exist yet).
    baseDeliveryFee: {
      type: Number,
      default: 40,
      min: 0
    },

    // Payable subtotal (after coupon discount) at/above which delivery
    // is free, regardless of zone.
    freeDeliveryThreshold: {
      type: Number,
      default: 499,
      min: 0
    },

    estimatedDeliveryTime: {
      type: String,
      default: "30–45 minutes",
      trim: true,
      maxlength: 60
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("DeliverySettings", deliverySettingsSchema);

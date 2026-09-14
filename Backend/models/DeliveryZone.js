const mongoose = require("mongoose");

// Delivery zone: a named set of pincodes with its own fee/ETA.
// Orders snapshot the calculated fee, so editing/deleting a zone never
// rewrites historical orders.
const deliveryZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },

    // Indian 6-digit pincodes served by this zone.
    pincodes: {
      type: [String],
      required: true,
      validate: {
        validator: (codes) => Array.isArray(codes) && codes.length > 0,
        message: "At least one pincode is required"
      }
    },

    deliveryFee: {
      type: Number,
      required: true,
      min: 0
    },

    // Zone-level minimum order (null = fall back to global setting).
    minimumOrderAmount: {
      type: Number,
      default: null,
      min: 0
    },

    estimatedDeliveryTime: {
      type: String,
      default: "",
      trim: true,
      maxlength: 60
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

deliveryZoneSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("DeliveryZone", deliveryZoneSchema);

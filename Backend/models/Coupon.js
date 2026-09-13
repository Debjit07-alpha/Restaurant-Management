const mongoose = require("mongoose");

// Coupon / promo code. All money fields are in rupees.
// Discount is ALWAYS computed on the backend from current MongoDB
// prices; the frontend only displays the backend result.
const couponSchema = new mongoose.Schema(
  {
    // Stored uppercase (e.g. "SAVE50"); lookup is case-insensitive.
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 30
    },

    discountType: {
      type: String,
      required: true,
      enum: ["PERCENTAGE", "FIXED"]
    },

    // PERCENTAGE: 1-90 (% off eligible items).
    // FIXED: flat rupees off eligible items.
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },

    // Cart subtotal (after customization, before discount) required.
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Cap on the discount. Null/0 = no cap.
    // Example: 50% off with maximumDiscount 100 on a Rs.1000 order
    // gives Rs.100, NOT Rs.500.
    maximumDiscount: {
      type: Number,
      default: null,
      min: 0
    },

    // Total redemptions allowed across all users. Null = unlimited.
    usageLimit: {
      type: Number,
      default: null,
      min: 1
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Max redemptions per user. 1 = one-time use per customer.
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1
    },

    startDate: {
      type: Date,
      default: null
    },

    expiryDate: {
      type: Date,
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Empty = applies to the whole cart. Non-empty restricts the
    // discount to matching lines only.
    applicableCategories: {
      type: [String],
      default: []
    },

    applicableProducts: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" }],
      default: []
    }
  },
  {
    timestamps: true
  }
);

couponSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model("Coupon", couponSchema);

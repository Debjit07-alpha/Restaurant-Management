const mongoose = require("mongoose");

// One document per coupon redemption (per order). Per-user usage is
// derived by counting documents for (coupon, user), so perUserLimit
// is enforced from the database — never from frontend input.
const couponUsageSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    }
  },
  {
    timestamps: true
  }
);

couponUsageSchema.index({ coupon: 1, user: 1 });
couponUsageSchema.index({ order: 1 }, { unique: true });

module.exports = mongoose.model("CouponUsage", couponUsageSchema);

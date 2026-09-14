const mongoose = require("mongoose");

// Global loyalty rules. Exactly one document (fixed _id); reads
// auto-create it with the defaults below.
const rewardSettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "global"
    },

    // Earn rule: this many points per ₹100 of eligible spend.
    pointsPer100: {
      type: Number,
      default: 10,
      min: 0
    },

    // Redemption value: rupees per point (0.1 = 10 points = ₹1).
    rupeesPerPoint: {
      type: Number,
      default: 0.1,
      min: 0
    },

    // Minimum points per redemption (0 = disabled).
    minimumRedemptionPoints: {
      type: Number,
      default: 100,
      min: 0
    },

    // Maximum points deductible per order.
    maximumRedemptionPoints: {
      type: Number,
      default: 2000,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("RewardSettings", rewardSettingsSchema);

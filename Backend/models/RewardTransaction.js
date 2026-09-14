const mongoose = require("mongoose");

// Auditable loyalty ledger. One document per earn/redeem/reversal/
// manual adjustment. Signed points: earn/adjust-up/reversal positive,
// redeem/adjust-down negative.
const rewardTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },

    type: {
      type: String,
      required: true,
      enum: ["earn", "redeem", "reversal", "adjust"]
    },

    points: {
      type: Number,
      required: true
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200
    }
  },
  {
    timestamps: true
  }
);

rewardTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("RewardTransaction", rewardTransactionSchema);

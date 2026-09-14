const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["Admin", "User"],
      default: "User"
    },

    favorites: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem"
        }
      ],
      default: []
    },

    // Loyalty points (spendable balance + lifetime counters).
    rewardPoints: {
      type: Number,
      default: 0,
      min: 0
    },

    lifetimeRewardPoints: {
      type: Number,
      default: 0,
      min: 0
    },

    redeemedRewardPoints: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
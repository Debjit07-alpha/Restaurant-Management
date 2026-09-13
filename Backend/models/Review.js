const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true
    },

    // The delivered order this review was purchased through.
    // One review per (user, order, menuItem).
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500
    },

    images: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ user: 1, order: 1, menuItem: 1 }, { unique: true });
reviewSchema.index({ menuItem: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);

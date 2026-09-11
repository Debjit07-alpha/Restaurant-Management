const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Starter",
        "Main Course",
        "Dessert",
        "Beverage"
      ]
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    availability: {
      type: Boolean,
      default: true
    },

    image: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
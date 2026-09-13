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
    },

    // Optional per-item customization (absent/empty = one-click Add to Cart).
    // Example: [{ name: "Spice Level", type: "single", required: true,
    //   options: [{ name: "Mild", price: 0 }] }]
    customizationOptions: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          type: {
            type: String,
            enum: ["single", "multiple"],
            default: "single"
          },
          required: { type: Boolean, default: false },
          options: {
            type: [
              {
                name: { type: String, required: true, trim: true },
                price: { type: Number, default: 0, min: 0 }
              }
            ],
            default: []
          }
        }
      ],
      default: undefined
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
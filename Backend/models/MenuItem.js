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

    // Vegetarian classification for search filters. Optional: items
    // written before this field simply don't match veg/non-veg filters
    // (never guessed). Set from Admin Add/Edit forms.
    foodType: {
      type: String,
      enum: ["veg", "non_veg"],
      default: undefined
    },

    // Canonical customer-facing menu category. The course `category`
    // (Starter/Main Course/...) is a different concept and stays
    // separate. Category tabs filter by EXACT equality on this field —
    // never by name/description keywords. Set from Admin Add/Edit
    // forms; backfilled once for legacy items (see
    // scripts/migrateMenuCategories.js).
    menuCategory: {
      type: String,
      enum: ["pizza", "burgers", "indian", "chinese", "desserts", "drinks"],
      default: undefined
    },

    // Explicit healthy flag. A food is healthy ONLY when this is true
    // (never inferred from veg status, price, or description).
    isHealthy: {
      type: Boolean,
      default: false
    },

    availability: {
      type: Boolean,
      default: true
    },

    // Three-state availability (admin controlled). The legacy boolean
    // stays synced (available -> true, otherwise false) so every
    // existing check keeps working. Documents without this field
    // resolve as "available" (or "sold_out" when availability is false).
    availabilityStatus: {
      type: String,
      enum: ["available", "sold_out", "hidden"],
      default: "available"
    },

    image: {
      type: String,
      default: ""
    },

    // Denormalized review summary (recomputed on every review
    // create/update/delete so cards never run per-item aggregations).
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0
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

// Keep the legacy boolean in sync with the three-state field.
menuItemSchema.pre("save", function () {
  if (this.isModified("availabilityStatus")) {
    this.availability = this.availabilityStatus === "available";
  }
});

module.exports = mongoose.model("MenuItem", menuItemSchema);
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    image: {
      type: String,
      default: ""
    },

    // Snapshot of the customization chosen in the cart (unit price already
    // includes validated extras; see orderController). Absent for plain items.
    customization: {
      type: {
        selections: {
          type: [
            {
              group: { type: String, required: true },
              choices: {
                type: [
                  {
                    name: { type: String, required: true },
                    price: { type: Number, required: true, min: 0 }
                  }
                ],
                default: []
              }
            }
          ],
          default: []
        },
        specialInstructions: { type: String, default: "", trim: true }
      },
      default: undefined
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Customer-facing readable identifier (MongoDB _id stays internal)
    orderId: {
      type: String,
      required: true,
      unique: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    customerName: {
      type: String,
      required: true,
      trim: true
    },

    mobile: {
      type: String,
      required: true,
      trim: true
    },

    // Delivery mode (default) vs dine-in mode. Dine-in orders carry a
    // table reference instead of a delivery address.
    orderType: {
      type: String,
      enum: ["delivery", "dine_in"],
      default: "delivery"
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null
    },

    tableNumber: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    // Groups the (possibly multiple) orders of one table visit.
    dineInSessionId: {
      type: String,
      default: "",
      trim: true
    },

    guestCount: {
      type: Number,
      default: null,
      min: 1,
      max: 50
    },

    // Required for delivery; omitted for dine-in (the controller
    // enforces address rules per order type instead).
    address: {
      flat: { type: String, default: "", trim: true },
      street: { type: String, default: "", trim: true },
      landmark: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      pincode: { type: String, default: "", trim: true },
      instructions: { type: String, default: "", trim: true }
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item"
      }
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    deliveryCharge: {
      type: Number,
      required: true,
      min: 0
    },

    // Promo code applied to this order (uppercase code or "").
    // discountAmount is backend-computed; frontend values are ignored.
    couponCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Loyalty redemption snapshot (backend-computed, never trusted).
    rewardPointsUsed: {
      type: Number,
      default: 0,
      min: 0
    },

    rewardDiscount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Earn-on-delivered bookkeeping (idempotency + audit).
    rewardsCredited: {
      type: Boolean,
      default: false
    },

    rewardPointsEarned: {
      type: Number,
      default: 0,
      min: 0
    },

    rewardRedeemReversed: {
      type: Boolean,
      default: false
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash on Delivery", "UPI on Delivery", "Cash at Counter", "UPI at Table"],
      default: "Cash on Delivery"
    },

    // Shared flow with dine-in legs: delivery runs
    // Pending -> Confirmed -> Preparing -> Delivered, dine-in runs
    // Pending -> Confirmed -> Preparing -> Ready -> Served.
    orderStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Preparing", "Ready", "Served", "Delivered", "Cancelled"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);

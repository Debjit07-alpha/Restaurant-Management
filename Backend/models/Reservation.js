const mongoose = require("mongoose");

// Table reservation. Time is stored as a day string + minute offsets so
// overlap checks are exact and timezone-free.
const reservationSchema = new mongoose.Schema(
  {
    reservationId: {
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

    // Day of the visit: "YYYY-MM-DD".
    date: {
      type: String,
      required: true
    },

    // Minutes after midnight, e.g. 19:30 -> 1170.
    startMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 1439
    },

    durationMinutes: {
      type: Number,
      default: 120,
      min: 30,
      max: 480
    },

    guestCount: {
      type: Number,
      required: true,
      min: 1,
      max: 50
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

    status: {
      type: String,
      enum: ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"],
      default: "pending"
    },

    specialRequest: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300
    }
  },
  {
    timestamps: true
  }
);

reservationSchema.index({ table: 1, date: 1, status: 1 });
reservationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Reservation", reservationSchema);

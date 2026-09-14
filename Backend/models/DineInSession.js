const mongoose = require("mongoose");

// Dine-in session: one active session per table groups the (possibly
// multiple) orders of a single visit. History is never deleted.
const dineInSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true
    },

    tableNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active"
    },

    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

dineInSessionSchema.index({ table: 1, status: 1 });

module.exports = mongoose.model("DineInSession", dineInSessionSchema);

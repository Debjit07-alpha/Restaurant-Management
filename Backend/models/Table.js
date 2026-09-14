const mongoose = require("mongoose");

// Physical restaurant table. The QR code encodes only the public URL
// with tableNumber + qrToken — never database ids or secrets.
const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 10
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 50
    },

    section: {
      type: String,
      default: "Main Hall",
      trim: true,
      maxlength: 60
    },

    status: {
      type: String,
      enum: ["available", "reserved", "occupied", "disabled"],
      default: "available"
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Secure random token printed in the QR URL and verified on every
    // dine-in order. Regenerable without changing the table number.
    qrToken: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Table", tableSchema);

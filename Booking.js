const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    pickupLocation: {
      type: String,
      required: true,
      trim: true
    },

    dropLocation: {
      type: String,
      required: true,
      trim: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    totalDays: {
      type: Number,
      required: true,
      min: 1
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    ownerDecision: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    shareUserDetails: {
      type: Boolean,
      default: false
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "completed"],
      default: "pending"
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
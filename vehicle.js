const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleName: {
      type: String,
      required: true,
      trim: true
    },

    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },

    vehicleType: {
      type: String,
      required: true,
      trim: true
    },

    brand: {
      type: String,
      trim: true
    },

    model: {
      type: String,
      trim: true
    },

    year: {
      type: Number
    },

    fuelType: {
      type: String,
      trim: true
    },

    transmissionType: {
      type: String,
      trim: true
    },

    seatingCapacity: {
      type: Number
    },

    pricePerDay: {
      type: Number,
      required: true,
      min: 1
    },

    image: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["available", "booked", "inactive"],
      default: "available"
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
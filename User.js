const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    aadhaarNumber: {
      type: String,
      required: true,
      trim: true
    },

    drivingLicenceNumber: {
      type: String,
      required: true,
      trim: true
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
      required: true
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    // =====================================================
    // EMAIL VERIFICATION
    // =====================================================

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationOTP: {
      type: String,
      default: null
    },

    emailVerificationOTPExpires: {
      type: Date,
      default: null
    },

    lastOTPRequest: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
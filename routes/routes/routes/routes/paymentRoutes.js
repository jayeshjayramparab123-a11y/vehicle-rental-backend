const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Payment = require("../models/Payment.js");
const Booking = require("../models/Booking.js");

const router = express.Router();


// =====================================================
// RAZORPAY INSTANCE
// =====================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post("/create-order", async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        message: "bookingId is required"
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // Owner approval required
    if (booking.ownerDecision !== "approved") {
      return res.status(400).json({
        message: "Payment is allowed only after owner approval"
      });
    }

    // Rejected booking
    if (booking.bookingStatus === "rejected") {
      return res.status(400).json({
        message: "Rejected booking cannot be paid"
      });
    }

    // Already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Booking is already paid"
      });
    }

    // Amount from database
    const amount = Number(booking.totalAmount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid booking amount"
      });
    }

    // Razorpay amount is in paise
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `booking_${booking._id.toString().slice(-20)}`,
      notes: {
        bookingId: booking._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      message: "Razorpay order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingId: booking._id
    });

  } catch (error) {
    console.log("RAZORPAY CREATE ORDER ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
});


// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !bookingId
    ) {
      return res.status(400).json({
        message: "Payment verification data is incomplete"
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // Owner approval required
    if (booking.ownerDecision !== "approved") {
      return res.status(400).json({
        message: "Booking is not approved by owner"
      });
    }

    // Already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Booking is already paid"
      });
    }

    // Create signature
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        razorpay_order_id + "|" + razorpay_payment_id
      )
      .digest("hex");

    // Compare signatures
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed"
      });
    }

    // Check existing payment
    const existingPayment = await Payment.findOne({
      bookingId
    });

    if (existingPayment) {
      return res.status(400).json({
        message: "Payment already exists for this booking"
      });
    }

    // Amount from database
    const amount = booking.totalAmount;

    // Save payment
    const payment = new Payment({
      bookingId,
      amount,
      paymentMethod: "Razorpay",
      transactionId: razorpay_payment_id,
      paymentStatus: "success",
      paymentDate: new Date()
    });

    const savedPayment = await payment.save();

    // Update booking
    booking.paymentStatus = "paid";
    booking.bookingStatus = "confirmed";

    await booking.save();

    res.status(200).json({
      message: "Payment successful",
      payment: savedPayment,
      booking
    });

  } catch (error) {
    console.log("RAZORPAY VERIFY ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
});


// =====================================================
// GET ALL PAYMENTS
// =====================================================

router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: "bookingId",
        populate: [
          {
            path: "vehicleId",
            select: "vehicleName vehicleNumber brand model"
          },
          {
            path: "userId",
            select: "name email phone"
          },
          {
            path: "ownerId",
            select: "name email phone"
          }
        ]
      })
      .sort({ createdAt: -1 });

    res.json(payments);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// =====================================================
// GET PAYMENT BY BOOKING
// =====================================================

router.get("/booking/:bookingId", async (req, res) => {
  try {
    const payment = await Payment.findOne({
      bookingId: req.params.bookingId
    }).populate("bookingId");

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found"
      });
    }

    res.json(payment);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


module.exports = router;

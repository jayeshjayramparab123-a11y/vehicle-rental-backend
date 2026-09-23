const express = require("express");
const mongoose = require("mongoose");

const Booking = require("../models/Booking.js");
const User = require("../models/User.js");
const Vehicle = require("../models/Vehicle.js");

const router = express.Router();

// =====================================================
// CREATE BOOKING
// =====================================================
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      vehicleId,
      pickupLocation,
      dropLocation,
      startDate,
      endDate
    } = req.body;

    if (
      !userId ||
      !vehicleId ||
      !pickupLocation ||
      !dropLocation ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        message: "Please fill all required booking fields"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(vehicleId)
    ) {
      return res.status(400).json({
        message: "Invalid user or vehicle ID"
      });
    }

    const user = await User.findById(userId);

    if (!user || user.status === "inactive") {
      return res.status(404).json({
        message: "User not found or inactive"
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    if (!vehicle.ownerId) {
      return res.status(400).json({
        message: "This vehicle is not assigned to an owner"
      });
    }

    if (vehicle.status !== "available") {
      return res.status(400).json({
        message: "Vehicle is currently not available"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid booking dates"
      });
    }

    if (end <= start) {
      return res.status(400).json({
        message: "End date must be after start date"
      });
    }

    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Check overlapping bookings
    const overlappingBooking = await Booking.findOne({
      vehicleId,
      bookingStatus: {
        $in: ["pending", "confirmed"]
      },
      startDate: { $lt: end },
      endDate: { $gt: start }
    });

    if (overlappingBooking) {
      return res.status(400).json({
        message:
          "Vehicle is already requested/booked for these dates"
      });
    }

    const totalAmount =
      totalDays * Number(vehicle.pricePerDay);

    const booking = new Booking({
      userId,
      vehicleId,
      ownerId: vehicle.ownerId,

      pickupLocation: pickupLocation.trim(),
      dropLocation: dropLocation.trim(),

      startDate: start,
      endDate: end,

      totalDays,
      totalAmount,

      ownerDecision: "pending",
      shareUserDetails: false,

      bookingStatus: "pending",
      paymentStatus: "pending"
    });

    await booking.save();

    const populatedBooking = await Booking.findById(
      booking._id
    )
      .populate("userId", "-password")
      .populate("vehicleId")
      .populate("ownerId", "-password");

    res.status(201).json({
      message: "Booking request sent successfully",
      booking: populatedBooking
    });

  } catch (error) {

    console.error(
      "CREATE BOOKING ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to create booking",
      error: error.message
    });
  }
});


// =====================================================
// GET ALL BOOKINGS
// ADMIN
// =====================================================
router.get("/", async (req, res) => {

  try {

    const bookings = await Booking.find()
      .populate("userId", "-password")
      .populate("vehicleId")
      .populate("ownerId", "-password")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (error) {

    console.error(
      "GET ALL BOOKINGS ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message
    });
  }
});


// =====================================================
// GET USER BOOKINGS
// =====================================================
router.get("/user/:userId", async (req, res) => {

  try {

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {

      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const bookings = await Booking.find({
      userId
    })
      .populate("vehicleId")
      .populate("ownerId", "-password")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (error) {

    console.error(
      "GET USER BOOKINGS ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch user bookings",
      error: error.message
    });
  }
});


// =====================================================
// GET OWNER BOOKINGS
// =====================================================
router.get("/owner/:ownerId", async (req, res) => {

  try {

    const { ownerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {

      return res.status(400).json({
        message: "Invalid owner ID"
      });
    }

    const bookings = await Booking.find({
      ownerId
    })
      .populate("userId", "-password")
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (error) {

    console.error(
      "GET OWNER BOOKINGS ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch owner bookings",
      error: error.message
    });
  }
});


// =====================================================
// OWNER APPROVE / REJECT BOOKING
// =====================================================
router.put(
  "/:id/owner-decision",
  async (req, res) => {

    try {

      const { id } = req.params;

      const {
        ownerId,
        decision,
        shareUserDetails
      } = req.body;


      if (!mongoose.Types.ObjectId.isValid(id)) {

        return res.status(400).json({
          message: "Invalid booking ID"
        });
      }


      if (!mongoose.Types.ObjectId.isValid(ownerId)) {

        return res.status(400).json({
          message: "Invalid owner ID"
        });
      }


      if (
        !["approved", "rejected"].includes(
          decision
        )
      ) {

        return res.status(400).json({
          message:
            "Decision must be approved or rejected"
        });
      }


      const owner = await User.findById(
        ownerId
      );


      if (
        !owner ||
        owner.role !== "owner" ||
        owner.status === "inactive"
      ) {

        return res.status(403).json({
          message:
            "Only an active owner can make this decision"
        });
      }


      const booking =
        await Booking.findById(id);


      if (!booking) {

        return res.status(404).json({
          message: "Booking not found"
        });
      }


      if (
        booking.ownerId.toString() !==
        ownerId.toString()
      ) {

        return res.status(403).json({
          message:
            "You can manage only your own vehicle bookings"
        });
      }


      if (
        booking.ownerDecision !== "pending"
      ) {

        return res.status(400).json({
          message:
            "This booking has already been decided"
        });
      }


      booking.ownerDecision =
        decision;


      if (decision === "approved") {

        booking.bookingStatus =
          "confirmed";

        booking.shareUserDetails =
          Boolean(shareUserDetails);

      } else {

        booking.bookingStatus =
          "rejected";

        booking.shareUserDetails =
          false;
      }


      await booking.save();


      const populatedBooking =
        await Booking.findById(
          booking._id
        )
          .populate("userId", "-password")
          .populate("vehicleId")
          .populate("ownerId", "-password");


      res.status(200).json({

        message:
          decision === "approved"
            ? "Booking approved successfully"
            : "Booking rejected successfully",

        booking:
          populatedBooking
      });

    } catch (error) {

      console.error(
        "OWNER DECISION ERROR:",
        error
      );

      res.status(500).json({

        message:
          "Failed to update booking decision",

        error:
          error.message
      });
    }
  }
);


// =====================================================
// GET BOOKING BY ID
// =====================================================
router.get("/:id", async (req, res) => {

  try {

    const { id } = req.params;


    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {

      return res.status(400).json({
        message: "Invalid booking ID"
      });
    }


    const booking =
      await Booking.findById(id)
        .populate(
          "userId",
          "-password"
        )
        .populate("vehicleId")
        .populate(
          "ownerId",
          "-password"
        );


    if (!booking) {

      return res.status(404).json({
        message: "Booking not found"
      });
    }


    res.status(200).json(
      booking
    );

  } catch (error) {

    console.error(
      "GET BOOKING ERROR:",
      error
    );

    res.status(500).json({

      message:
        "Failed to fetch booking",

      error:
        error.message
    });
  }
});


module.exports = router;

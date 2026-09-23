const express = require("express");

const User = require("../models/User.js");
const Vehicle = require("../models/Vehicle.js");
const Booking = require("../models/Booking.js");

const router = express.Router();


// =====================================================
// OWNER PROFILE
// =====================================================

router.get("/:ownerId", async (req, res) => {
  try {
    const owner = await User.findOne({
      _id: req.params.ownerId,
      role: "owner"
    }).select("-password");

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found"
      });
    }

    res.json(owner);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// =====================================================
// OWNER VEHICLES
// =====================================================

router.get("/:ownerId/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      ownerId: req.params.ownerId
    }).sort({ createdAt: -1 });

    res.json(vehicles);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// =====================================================
// OWNER ADD VEHICLE
// =====================================================

router.post("/:ownerId/vehicles", async (req, res) => {
  try {
    const owner = await User.findOne({
      _id: req.params.ownerId,
      role: "owner",
      status: "active"
    });

    if (!owner) {
      return res.status(403).json({
        message: "Only active vehicle owners can add vehicles"
      });
    }

    const vehicle = new Vehicle({
      ...req.body,
      ownerId: req.params.ownerId
    });

    const savedVehicle = await vehicle.save();

    res.status(201).json({
      message: "Vehicle added successfully",
      vehicle: savedVehicle
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});


// =====================================================
// OWNER UPDATE VEHICLE
// =====================================================

router.put(
  "/:ownerId/vehicles/:vehicleId",
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findOne({
        _id: req.params.vehicleId,
        ownerId: req.params.ownerId
      });

      if (!vehicle) {
        return res.status(404).json({
          message: "Vehicle not found"
        });
      }

      // Prevent changing ownerId through body
      const updateData = {
        ...req.body,
        ownerId: req.params.ownerId
      };

      Object.assign(vehicle, updateData);

      await vehicle.save();

      res.json({
        message: "Vehicle updated successfully",
        vehicle
      });

    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }
);


// =====================================================
// OWNER DELETE VEHICLE
// =====================================================

router.delete(
  "/:ownerId/vehicles/:vehicleId",
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findOne({
        _id: req.params.vehicleId,
        ownerId: req.params.ownerId
      });

      if (!vehicle) {
        return res.status(404).json({
          message: "Vehicle not found"
        });
      }

      // Don't delete vehicle if it has active bookings
      const activeBooking = await Booking.findOne({
        vehicleId: req.params.vehicleId,
        bookingStatus: {
          $in: ["pending", "confirmed"]
        }
      });

      if (activeBooking) {
        return res.status(400).json({
          message:
            "Vehicle cannot be deleted because it has an active booking"
        });
      }

      await Vehicle.deleteOne({
        _id: req.params.vehicleId,
        ownerId: req.params.ownerId
      });

      res.json({
        message: "Vehicle deleted successfully"
      });

    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


// =====================================================
// OWNER BOOKINGS
// =====================================================

router.get("/:ownerId/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find({
      ownerId: req.params.ownerId
    })
      .populate("vehicleId")
      .populate(
        "userId",
        "name email phone aadhaarNumber drivingLicenceNumber address"
      )
      .sort({ createdAt: -1 });

    res.json(bookings);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// =====================================================
// OWNER STATISTICS
// =====================================================

router.get("/:ownerId/stats", async (req, res) => {
  try {
    const vehicles = await Vehicle.countDocuments({
      ownerId: req.params.ownerId
    });

    const bookings = await Booking.countDocuments({
      ownerId: req.params.ownerId
    });

    const pendingBookings =
      await Booking.countDocuments({
        ownerId: req.params.ownerId,
        ownerDecision: "pending"
      });

    const approvedBookings =
      await Booking.countDocuments({
        ownerId: req.params.ownerId,
        ownerDecision: "approved"
      });

    const rejectedBookings =
      await Booking.countDocuments({
        ownerId: req.params.ownerId,
        ownerDecision: "rejected"
      });

    res.json({
      vehicles,
      bookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


module.exports = router;
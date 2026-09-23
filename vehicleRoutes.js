const express = require("express");
const Vehicle = require("../models/Vehicle.js");
const User = require("../models/User.js");

const router = express.Router();


// =====================================================
// GET ALL VEHICLES
// =====================================================

router.get("/", async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate("ownerId", "name email phone")
      .sort({ createdAt: -1 });

    res.json(vehicles);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// =====================================================
// GET SINGLE VEHICLE
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate("ownerId", "name email phone");

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    res.json(vehicle);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


// =====================================================
// ADD VEHICLE
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      vehicleName,
      vehicleNumber,
      vehicleType,
      brand,
      model,
      year,
      fuelType,
      transmissionType,
      seatingCapacity,
      pricePerDay,
      image,
      ownerId
    } = req.body;

    if (!ownerId) {
      return res.status(400).json({
        message: "ownerId is required"
      });
    }

    const owner = await User.findOne({
      _id: ownerId,
      role: "owner",
      status: "active"
    });

    if (!owner) {
      return res.status(403).json({
        message: "Invalid vehicle owner"
      });
    }

    const vehicle = new Vehicle({
      vehicleName,
      vehicleNumber,
      vehicleType,
      brand,
      model,
      year,
      fuelType,
      transmissionType,
      seatingCapacity,
      pricePerDay,
      image,
      ownerId
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
// UPDATE VEHICLE
// =====================================================

router.put("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate("ownerId", "name email phone");

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    res.json({
      message: "Vehicle updated successfully",
      vehicle
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});


// =====================================================
// DELETE VEHICLE
// =====================================================

router.delete("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(
      req.params.id
    );

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    res.json({
      message: "Vehicle deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


module.exports = router;
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());


// =====================================================
// ROUTES
// =====================================================

const vehicleRoutes = require("./routes/vehicleRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const bookingRoutes = require("./routes/bookingRoutes.js");
const paymentRoutes = require("./routes/paymentRoutes.js");
const ownerRoutes = require("./routes/ownerRoutes.js");

app.use("/api/vehicles", vehicleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/owners", ownerRoutes);


// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "Vehicle Rental Portal API Running",
    status: "OK"
  });
});


// =====================================================
// MONGODB CONNECTION
// =====================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("=================================");
    console.log("MongoDB Connected Successfully");
    console.log("=================================");
  })
  .catch((error) => {
    console.log("MongoDB Error:", error);
  });


// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    message: "Internal Server Error"
  });
});


// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log("=================================");
});
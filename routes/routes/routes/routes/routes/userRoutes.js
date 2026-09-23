const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User.js");

const router = express.Router();


// =====================================================
// EMAIL CONFIGURATION
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// =====================================================
// VERIFY GMAIL SMTP CONNECTION
// =====================================================

transporter.verify((error, success) => {

  if (error) {

    console.log("=================================");
    console.log("GMAIL SMTP ERROR:");
    console.log(error);
    console.log("=================================");

  } else {

    console.log("=================================");
    console.log("GMAIL SMTP READY");
    console.log("=================================");

  }

});


// =====================================================
// GENERATE OTP
// =====================================================

function generateOTP() {

  return crypto
    .randomInt(100000, 1000000)
    .toString();

}


// =====================================================
// HASH OTP
// =====================================================

function hashOTP(otp) {

  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

}


// =====================================================
// SEND OTP EMAIL
// =====================================================

async function sendVerificationEmail(user, otp) {

  try {

    console.log("=================================");
    console.log("SENDING VERIFICATION EMAIL");
    console.log("FROM:", process.env.EMAIL_USER);
    console.log("TO:", user.email);
    console.log("=================================");


    const info = await transporter.sendMail({

      from:
        `"Vehicle Rental Portal" <${process.env.EMAIL_USER}>`,

      to:
        user.email,

      subject:
        "Vehicle Rental Portal - Email Verification OTP",

      html: `

        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          border: 1px solid #ddd;
          border-radius: 12px;
          background: #ffffff;
        ">

          <h2 style="
            text-align: center;
            color: #1d4ed8;
          ">
            Vehicle Rental Portal
          </h2>


          <p>
            Hello <b>${user.name}</b>,
          </p>


          <p>
            Thank you for registering with
            Vehicle Rental Portal.
          </p>


          <p>
            Your email verification OTP is:
          </p>


          <div style="
            text-align: center;
            margin: 25px 0;
          ">

            <span style="
              display: inline-block;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              background: #f1f1f1;
              padding: 15px 25px;
              border-radius: 10px;
              color: #111827;
            ">

              ${otp}

            </span>

          </div>


          <p>
            This OTP is valid for
            <b>10 minutes</b>.
          </p>


          <p>
            Do not share this OTP with anyone.
          </p>


          <hr>


          <p style="
            font-size: 12px;
            color: #777;
          ">

            This is an automated email from
            Vehicle Rental Portal.

          </p>

        </div>

      `

    });


    // =================================================
    // EMAIL SUCCESS LOG
    // =================================================

    console.log("=================================");
    console.log("EMAIL SENT SUCCESSFULLY");
    console.log("MESSAGE ID:", info.messageId);
    console.log("ACCEPTED:", info.accepted);
    console.log("REJECTED:", info.rejected);
    console.log("RESPONSE:", info.response);
    console.log("=================================");


    // =================================================
    // TEMPORARY DEVELOPMENT OTP
    // =================================================

    console.log(
      "DEVELOPMENT OTP:",
      otp
    );


    return info;

  } catch (error) {

    console.log("=================================");
    console.log("EMAIL SEND FAILED");
    console.log("ERROR MESSAGE:", error.message);
    console.log("ERROR CODE:", error.code);
    console.log("ERROR RESPONSE:", error.response);
    console.log("=================================");

    throw error;

  }

}


// =====================================================
// REGISTER USER / OWNER
// =====================================================

router.post("/register", async (req, res) => {

  try {

    const {

      name,
      email,
      password,
      phone,
      aadhaarNumber,
      drivingLicenceNumber,
      address,
      role

    } = req.body;


    // =================================================
    // CLEAN DATA
    // =================================================

    const cleanName =
      String(name || "").trim();


    const cleanEmail =
      String(email || "")
        .trim()
        .toLowerCase();


    const cleanPassword =
      String(password || "");


    const cleanPhone =
      String(phone || "").trim();


    const cleanAadhaar =
      String(aadhaarNumber || "").trim();


    const cleanLicence =
      String(drivingLicenceNumber || "").trim();


    const cleanAddress =
      String(address || "").trim();


    const cleanRole =
      String(role || "")
        .trim()
        .toLowerCase();


    // =================================================
    // VALIDATION
    // =================================================

    if (

      !cleanName ||
      !cleanEmail ||
      !cleanPassword ||
      !cleanPhone ||
      !cleanAadhaar ||
      !cleanLicence ||
      !cleanAddress

    ) {

      return res.status(400).json({

        message:
          "Please fill all required fields"

      });

    }


    // =================================================
    // ROLE VALIDATION
    // =================================================

    if (!cleanRole) {

      return res.status(400).json({

        message:
          "Please select User or Vehicle Owner"

      });

    }


    if (
      !["user", "owner"].includes(cleanRole)
    ) {

      return res.status(400).json({

        message:
          "Invalid account type"

      });

    }


    // =================================================
    // EMAIL FORMAT
    // =================================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(cleanEmail)) {

      return res.status(400).json({

        message:
          "Please enter a valid email address"

      });

    }


    // =================================================
    // CHECK EXISTING USER
    // =================================================

    const existingUser =
      await User.findOne({
        email: cleanEmail
      });


    if (existingUser) {

      return res.status(400).json({

        message:
          `Email already registered as ${existingUser.role}`

      });

    }


    // =================================================
    // GENERATE OTP
    // =================================================

    const otp =
      generateOTP();


    const hashedOTP =
      hashOTP(otp);


    const otpExpiry =
      new Date(
        Date.now() +
        10 * 60 * 1000
      );


    // =================================================
    // CREATE USER
    // =================================================

    const user = new User({

      name:
        cleanName,

      email:
        cleanEmail,

      password:
        cleanPassword,

      phone:
        cleanPhone,

      aadhaarNumber:
        cleanAadhaar,

      drivingLicenceNumber:
        cleanLicence,

      address:
        cleanAddress,

      role:
        cleanRole,

      status:
        "active",

      isEmailVerified:
        false,

      emailVerificationOTP:
        hashedOTP,

      emailVerificationOTPExpires:
        otpExpiry,

      lastOTPRequest:
        new Date()

    });


    await user.save();


    console.log("=================================");
    console.log("ACCOUNT CREATED");
    console.log("EMAIL:", user.email);
    console.log("ROLE:", user.role);
    console.log("=================================");


    // =================================================
    // SEND EMAIL
    // =================================================

    try {

      await sendVerificationEmail(
        user,
        otp
      );

    } catch (emailError) {

      console.log(
        "EMAIL SEND ERROR:",
        emailError
      );


      // Delete unverified account
      await User.findByIdAndDelete(
        user._id
      );


      return res.status(500).json({

        message:
          `Verification email could not be sent: ${emailError.message}`

      });

    }


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      "EMAIL VERIFICATION OTP SENT"
    );


    return res.status(201).json({

      message:
        `Registration successful as ${user.role}. Verification OTP sent to your email.`,

      requiresVerification:
        true,

      user: {

        _id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        phone:
          user.phone,

        role:
          user.role,

        status:
          user.status,

        isEmailVerified:
          false

      }

    });


  } catch (error) {

    console.log(
      "REGISTER ERROR:",
      error
    );


    return res.status(500).json({

      message:
        error.message

    });

  }

});


// =====================================================
// VERIFY EMAIL OTP
// =====================================================

router.post("/verify-email", async (req, res) => {

  try {

    const email =
      String(req.body.email || "")
        .trim()
        .toLowerCase();


    const otp =
      String(req.body.otp || "")
        .trim();


    // =================================================
    // VALIDATION
    // =================================================

    if (!email || !otp) {

      return res.status(400).json({

        message:
          "Email and OTP are required"

      });

    }


    if (!/^\d{6}$/.test(otp)) {

      return res.status(400).json({

        message:
          "OTP must be a 6-digit number"

      });

    }


    // =================================================
    // FIND USER
    // =================================================

    const user =
      await User.findOne({
        email
      });


    if (!user) {

      return res.status(404).json({

        message:
          "User not found"

      });

    }


    // =================================================
    // ALREADY VERIFIED
    // =================================================

    if (user.isEmailVerified) {

      return res.json({

        message:
          "Email is already verified",

        verified:
          true

      });

    }


    // =================================================
    // OTP EXPIRY
    // =================================================

    if (

      !user.emailVerificationOTPExpires ||

      user.emailVerificationOTPExpires.getTime() <
        Date.now()

    ) {

      return res.status(400).json({

        message:
          "OTP has expired. Please request a new OTP."

      });

    }


    // =================================================
    // CHECK OTP
    // =================================================

    const hashedOTP =
      hashOTP(otp);


    if (
      hashedOTP !==
      user.emailVerificationOTP
    ) {

      return res.status(400).json({

        message:
          "Invalid OTP"

      });

    }


    // =================================================
    // VERIFY USER EMAIL
    // =================================================

    user.isEmailVerified =
      true;


    user.emailVerificationOTP =
      null;


    user.emailVerificationOTPExpires =
      null;


    user.lastOTPRequest =
      null;


    await user.save();


    console.log("=================================");
    console.log("EMAIL VERIFIED");
    console.log("EMAIL:", user.email);
    console.log("=================================");


    return res.json({

      message:
        "Email verified successfully. You can now login.",

      verified:
        true,

      user: {

        _id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        phone:
          user.phone,

        role:
          user.role,

        status:
          user.status,

        isEmailVerified:
          true

      }

    });


  } catch (error) {

    console.log(
      "VERIFY EMAIL ERROR:",
      error
    );


    return res.status(500).json({

      message:
        error.message

    });

  }

});


// =====================================================
// RESEND OTP
// =====================================================

router.post("/resend-otp", async (req, res) => {

  try {

    const email =
      String(req.body.email || "")
        .trim()
        .toLowerCase();


    if (!email) {

      return res.status(400).json({

        message:
          "Email is required"

      });

    }


    // =================================================
    // FIND USER
    // =================================================

    const user =
      await User.findOne({
        email
      });


    if (!user) {

      return res.status(404).json({

        message:
          "User not found"

      });

    }


    // =================================================
    // ALREADY VERIFIED
    // =================================================

    if (user.isEmailVerified) {

      return res.status(400).json({

        message:
          "Email is already verified"

      });

    }


    // =================================================
    // 60 SECOND LIMIT
    // =================================================

    if (user.lastOTPRequest) {

      const secondsPassed =
        Math.floor(

          (
            Date.now() -
            user.lastOTPRequest.getTime()
          ) / 1000

        );


      if (secondsPassed < 60) {

        return res.status(429).json({

          message:
            `Please wait ${
              60 - secondsPassed
            } seconds before requesting another OTP.`

        });

      }

    }


    // =================================================
    // NEW OTP
    // =================================================

    const otp =
      generateOTP();


    const hashedOTP =
      hashOTP(otp);


    const otpExpiry =
      new Date(
        Date.now() +
        10 * 60 * 1000
      );


    user.emailVerificationOTP =
      hashedOTP;


    user.emailVerificationOTPExpires =
      otpExpiry;


    user.lastOTPRequest =
      new Date();


    await user.save();


    // =================================================
    // SEND EMAIL
    // =================================================

    try {

      await sendVerificationEmail(
        user,
        otp
      );

    } catch (emailError) {

      console.log(
        "RESEND EMAIL ERROR:",
        emailError
      );


      return res.status(500).json({

        message:
          `Unable to resend OTP: ${emailError.message}`

      });

    }


    console.log(
      "NEW OTP SENT:",
      user.email
    );


    return res.json({

      message:
        "New verification OTP sent to your email."

    });


  } catch (error) {

    console.log(
      "RESEND OTP ERROR:",
      error
    );


    return res.status(500).json({

      message:
        error.message

    });

  }

});


// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {

  try {

    const email =
      String(req.body.email || "")
        .trim()
        .toLowerCase();


    const password =
      String(req.body.password || "");


    // =================================================
    // VALIDATION
    // =================================================

    if (!email || !password) {

      return res.status(400).json({

        message:
          "Email and password are required"

      });

    }


    // =================================================
    // FIND USER
    // =================================================

    const user =
      await User.findOne({
        email
      });


    if (!user) {

      return res.status(401).json({

        message:
          "Invalid email or password"

      });

    }


    // =================================================
    // PASSWORD
    // =================================================

    if (
      user.password !==
      password
    ) {

      return res.status(401).json({

        message:
          "Invalid email or password"

      });

    }


    // =================================================
    // ACCOUNT STATUS
    // =================================================

    if (
      user.status ===
      "inactive"
    ) {

      return res.status(403).json({

        message:
          "Your account is inactive"

      });

    }


    // =================================================
    // EMAIL VERIFICATION
    // =====================================================

    if (

      (
        user.role === "user" ||
        user.role === "owner"
      ) &&

      !user.isEmailVerified

    ) {

      return res.status(403).json({

        message:
          "Please verify your email before login.",

        emailNotVerified:
          true,

        email:
          user.email

      });

    }


    // =================================================
    // LOGIN SUCCESS
    // =================================================

    console.log("=================================");
    console.log("LOGIN SUCCESS");
    console.log("EMAIL:", user.email);
    console.log("ROLE:", user.role);
    console.log("=================================");


    return res.json({

      message:
        "Login successful",

      user: {

        _id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        phone:
          user.phone,

        role:
          user.role,

        status:
          user.status,

        isEmailVerified:
          user.isEmailVerified

      }

    });


  } catch (error) {

    console.log(
      "LOGIN ERROR:",
      error
    );


    return res.status(500).json({

      message:
        error.message

    });

  }

});

// =====================================================
// ADMIN USER STATUS MANAGEMENT
// =====================================================

router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be active or inactive"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Admin account cannot be blocked
    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin account status cannot be changed"
      });
    }

    // Update ONLY status.
    // This avoids validation errors from old users
    // whose Aadhaar / Driving Licence fields are missing.
    await User.updateOne(
      { _id: req.params.id },
      { $set: { status: status } }
    );

    user.status = status;

    res.json({
      message:
        status === "inactive"
          ? "Account blocked successfully"
          : "Account activated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.log("UPDATE USER STATUS ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
});


// =====================================================
// GET ALL USERS
// =====================================================

router.get("/", async (req, res) => {

  try {

    const users =
      await User.find()

        .select(
          "-password -emailVerificationOTP"
        )

        .sort({
          createdAt: -1
        });


    res.json(users);


  } catch (error) {

    res.status(500).json({

      message:
        error.message

    });

  }

});


// =====================================================
// GET SINGLE USER
// =====================================================

router.get("/:id", async (req, res) => {

  try {

    const user =
      await User.findById(
        req.params.id
      )

      .select(
        "-password -emailVerificationOTP"
      );


    if (!user) {

      return res.status(404).json({

        message:
          "User not found"

      });

    }


    res.json(user);


  } catch (error) {

    res.status(500).json({

      message:
        error.message

    });

  }

});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;

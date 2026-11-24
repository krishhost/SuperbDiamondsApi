const express = require("express");
const {
  SignUp,
  LogIn,
  LogOut,
  GetUser,
  Me,
  Verify,
  VerifyOtp,
  ForgotPassword,
  ResetPassword,
} = require("../Controller/auth");
const { authenticate } = require("../utils/jwt");
const { rateLimit } = require("../utils/http");

const router = express.Router();

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many login attempts. Please wait a few minutes." });
const emailLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: "Too many codes requested. Please wait a few minutes." });
const otpLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 15 });

router.post("/verify", emailLimit, Verify);
router.post("/verify-otp", otpLimit, VerifyOtp);
router.post("/signup", SignUp);
router.post("/login", loginLimit, LogIn);
router.post("/logout", LogOut);
router.post("/forgot-password", emailLimit, ForgotPassword);
router.post("/reset-password", otpLimit, ResetPassword);

router.use(authenticate);
router.get("/me", Me);
router.get("/user-details/:identifier", GetUser);

module.exports = router;

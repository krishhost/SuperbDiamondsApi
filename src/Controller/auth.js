const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../Schema/user");
const Otp = require("../Schema/otp");
const { comparePass, hashPassword } = require("../utils/hashPassword");
const { createJwt, verifyJwt, setAuthCookie, clearAuthCookie } = require("../utils/jwt");
const { sendOtpEmail } = require("../utils/mailer");

require("dotenv").config();

const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const MIN_PASSWORD = 6;

const normEmail = (email) => String(email || "").trim().toLowerCase();

/** Find a user by username or phone number (the two login identifiers). */
const findByIdentifier = (identifier) =>
  isNaN(identifier) ? User.findOne({ user_name: identifier }) : User.findOne({ phone_number: identifier });

/** Case-insensitive email lookup (older accounts may have mixed-case emails). */
const findByEmail = (email) => User.findOne({ email }).collation({ locale: "en", strength: 2 });

const publicUser = (user) => {
  const { password, confirm_password, __v, ...data } = user.toObject();
  return data;
};

/* ------------------------------------------------------------------ OTP helpers */

const issueOtp = async (email, purpose) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  await Otp.findOneAndUpdate(
    { email, purpose },
    { otp_hash: await bcrypt.hash(otp, 10), attempts: 0, expires_at: new Date(Date.now() + OTP_MINUTES * 60 * 1000) },
    { upsert: true, setDefaultsOnInsert: true }
  );
  await sendOtpEmail(email, otp, purpose, OTP_MINUTES);
};

/** Returns null when the OTP is valid (and consumes it), otherwise an error message. */
const checkOtp = async (email, purpose, otp) => {
  const record = await Otp.findOne({ email, purpose });
  if (!record || record.expires_at < new Date()) return "This code has expired. Please request a new one.";
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await record.deleteOne();
    return "Too many incorrect attempts. Please request a new code.";
  }
  const ok = await bcrypt.compare(String(otp || ""), record.otp_hash);
  if (!ok) {
    record.attempts += 1;
    await record.save();
    return "Incorrect code. Please try again.";
  }
  await record.deleteOne();
  return null;
};

/* ------------------------------------------------------------------ Signup */

/** Step 1 of signup: check email/phone are free and email a verification code. */
const Verify = async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const { phone_number } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    if (await findByEmail(email)) {
      return res.status(400).json({ message: "Email is already registered!" });
    }
    if (phone_number && (await User.findOne({ phone_number }))) {
      return res.status(400).json({ message: "Phone number is already registered!" });
    }

    await issueOtp(email, "signup");
    res.status(200).json({ message: "Verification email sent successfully", data: { email } });
  } catch (error) {
    console.error("Error sending verification email:", error);
    res.status(500).json({ message: "Failed to send verification email" });
  }
};

/** Step 2 of signup: check the code and hand back a short-lived verification token. */
const VerifyOtp = async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const problem = await checkOtp(email, "signup", req.body.otp);
    if (problem) return res.status(400).json({ message: problem });
    const verification_token = createJwt({ email, purpose: "signup" }, "30m");
    res.status(200).json({ message: "Email verified", verification_token });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Could not verify the code" });
  }
};

/** Step 3 of signup: create the account (requires the verification token from step 2). */
const SignUp = async (req, res) => {
  const {
    first_name,
    last_name,
    user_name,
    phone_number,
    password,
    confirm_password,
    company_name,
    company_address,
    occupation,
    country,
    partners,
    verification_token,
  } = req.body;
  const email = normEmail(req.body.email);

  try {
    let verified;
    try {
      verified = verifyJwt(verification_token || "");
    } catch {
      verified = null;
    }
    if (!verified || verified.purpose !== "signup" || verified.email !== email) {
      return res.status(400).json({ message: "Please verify your email address before creating an account." });
    }

    if (await findByEmail(email)) {
      return res.status(400).json({ message: "Email is already registered!" });
    }
    if (await User.findOne({ phone_number })) {
      return res.status(400).json({ message: "Phone number is already registered!" });
    }
    if (await User.findOne({ user_name })) {
      return res.status(400).json({ message: "Username already exists! Please choose another username." });
    }
    if (!password || password.length < MIN_PASSWORD) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters.` });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }
    if (!company_name) {
      return res.status(400).json({ message: "Company name is required." });
    }

    const prefix = String(company_name).slice(0, 3).toUpperCase();
    const trialDays = Number(process.env.TRIAL_DAYS) || 0;
    const now = new Date();

    // Dates and counters are set by the server only, never taken from the request.
    await User.create({
      first_name,
      last_name,
      email,
      user_name,
      phone_number,
      company_name,
      company_address,
      occupation,
      country,
      partners,
      password: hashPassword(password),
      start_date: now,
      update_date: now,
      end_date: trialDays ? new Date(now.getTime() + trialDays * 86400000) : undefined,
      last_stock_id: `${prefix}0`,
      invoice_no: `${prefix}-INV0`,
    });

    res.status(201).json({ message: "User created in DB" });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors)[0]?.message || "Invalid details" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------------------------------------------------------------ Session */

const LogIn = async (req, res) => {
  try {
    const { login_variable, password } = req.body;
    if (!login_variable) return res.status(400).json({ message: "Sorry! please provide valid credentials" });
    if (!password) return res.status(400).json({ message: "Sorry! please provide a password" });

    const user = await findByIdentifier(String(login_variable).trim());
    // Same message for unknown user and wrong password, so accounts can't be probed.
    if (!user || !comparePass(password, user.password)) {
      return res.status(401).json({ message: "Incorrect username/phone number or password" });
    }

    // Only block when an end date is actually set and has passed.
    if (user.end_date && new Date(user.end_date) <= new Date()) {
      return res.status(403).json({ message: "Sorry! your Trial/Subscription pack is over" });
    }

    setAuthCookie(res, createJwt({ userID: user._id, email: user.email }));
    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred during login" });
  }
};

const LogOut = (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: "Logged out" });
};

/** The logged-in user's own profile. */
const Me = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(publicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/** Kept for the existing frontend. Only returns the caller's own record. */
const GetUser = async (req, res) => {
  try {
    const user = await findByIdentifier(req.params.identifier);
    if (!user || user.email !== req.user.email) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(publicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ------------------------------------------------------------------ Password reset */

const ForgotPassword = async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    if (!email) return res.status(400).json({ message: "Email is required." });
    const user = await findByEmail(email);
    if (user) await issueOtp(email, "reset");
    // Same answer whether or not the account exists.
    res.status(200).json({ message: "If that email is registered, a reset code has been sent." });
  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({ message: "Could not send the reset code. Please try again." });
  }
};

const ResetPassword = async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const { otp, password, confirm_password } = req.body;
    if (!password || password.length < MIN_PASSWORD) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters.` });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }
    const problem = await checkOtp(email, "reset", otp);
    if (problem) return res.status(400).json({ message: problem });

    const user = await findByEmail(email);
    if (!user) return res.status(400).json({ message: "This code has expired. Please request a new one." });
    user.password = hashPassword(password);
    user.update_date = new Date();
    await user.save();
    clearAuthCookie(res);
    res.status(200).json({ message: "Password updated. You can now log in." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Could not reset the password" });
  }
};

module.exports = { SignUp, LogIn, LogOut, GetUser, Me, Verify, VerifyOtp, ForgotPassword, ResetPassword };

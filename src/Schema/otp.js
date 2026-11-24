const mongoose = require("mongoose");

/**
 * One-time passwords for email verification and password reset.
 * Only a bcrypt hash is stored; MongoDB deletes the document when it expires.
 */
const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  purpose: { type: String, enum: ["signup", "reset"], required: true },
  otp_hash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expires_at: { type: Date, required: true },
});

OtpSchema.index({ email: 1, purpose: 1 }, { unique: true });
OtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", OtpSchema);

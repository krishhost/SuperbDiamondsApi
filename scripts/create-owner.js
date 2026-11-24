/**
 * Create (or reset the password of) an owner account.
 *
 *   OWNER_EMAIL=you@example.com OWNER_PASSWORD='...' node scripts/create-owner.js
 *   ... node scripts/create-owner.js --reset     # existing account: set a new password
 *
 * Optional: OWNER_FIRST, OWNER_LAST, OWNER_USERNAME, OWNER_PHONE, OWNER_COMPANY.
 * The password is read from the environment so it never lands in the code or git history.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/Schema/user");
const { hashPassword } = require("../src/utils/hashPassword");

const env = (k, d) => (process.env[k] || d || "").trim();

(async () => {
  const email = env("OWNER_EMAIL").toLowerCase();
  const password = process.env.OWNER_PASSWORD || "";
  const reset = process.argv.includes("--reset");

  if (!email || !password) {
    console.error("Set OWNER_EMAIL and OWNER_PASSWORD.");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const existing = await User.findOne({ email }).collation({ locale: "en", strength: 2 });
    if (existing) {
      if (!reset) {
        console.log(`An account for ${email} already exists (username: ${existing.user_name}). Re-run with --reset to set a new password.`);
        return;
      }
      existing.password = hashPassword(password);
      existing.end_date = undefined; // owner never expires
      existing.update_date = new Date();
      await existing.save();
      console.log(`Password reset for ${email}.`);
      return;
    }

    const userName = env("OWNER_USERNAME", email.split("@")[0]);
    const phone = Number(env("OWNER_PHONE").replace(/\D/g, "")) || undefined;
    const company = env("OWNER_COMPANY", "Superb Diamonds");

    const clash = await User.findOne({ $or: [{ user_name: userName }, ...(phone ? [{ phone_number: phone }] : [])] });
    if (clash) {
      console.error(`Username "${userName}" or that phone number is already used by ${clash.email}. Set OWNER_USERNAME / OWNER_PHONE.`);
      process.exitCode = 1;
      return;
    }

    const prefix = company.slice(0, 3).toUpperCase();
    await User.create({
      first_name: env("OWNER_FIRST", "Owner"),
      last_name: env("OWNER_LAST", "Account"),
      user_name: userName,
      phone_number: phone,
      email,
      country: env("OWNER_COUNTRY", "India"),
      company_name: company,
      company_address: env("OWNER_ADDRESS", "306, Nishit Diamond Complex, Mahidarpura, Surat 395003"),
      occupation: ["Owner"],
      password: hashPassword(password),
      start_date: new Date(),
      update_date: new Date(),
      last_stock_id: `${prefix}0`,
      invoice_no: `${prefix}-INV0`,
    });
    console.log(`Created owner account ${email} (username: ${userName}). No expiry date is set.`);
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});

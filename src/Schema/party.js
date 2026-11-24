const mongoose = require("mongoose");

/** A supplier, customer or broker in a user's address book. */
const PartySchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true, index: true },
    party_name: { type: String, required: [true, "Party name is required"], trim: true, maxlength: 120 },
    party_type: { type: String, enum: ["Supplier", "Customer", "Broker"], default: "Supplier" },
    party_number: { type: String, trim: true, maxlength: 20 },
    party_email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    party_address: { type: String, trim: true, maxlength: 500 },
    party_gst: { type: String, trim: true, maxlength: 30 },
    party_opening_balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PartySchema.index(
  { user_email: 1, party_name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

module.exports = mongoose.model("Party", PartySchema);

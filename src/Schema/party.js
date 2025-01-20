const mongoose = require("mongoose");

// Define the User Schema
const PartySchema = new mongoose.Schema({
  identifier: {
    type: Number,
  },
  party_name: {
    type: String,
  },
  party_number: {
    type: Number,
  },
  party_address: {
    type: String,
  },
  party_email: {
    type: String,
  },
  party_opening_balance: {
    type: Number,
  },
});

module.exports = mongoose.model("Party", PartySchema);

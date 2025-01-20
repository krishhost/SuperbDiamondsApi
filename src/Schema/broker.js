const mongoose = require("mongoose");

// Define the User Schema
const BrokerSchema = new mongoose.Schema({
  broker_name: {
    type: String,
  },
  broker_number: {
    type: Number,
  },
  broker_address: {
    type: String,
  },
  broker_email: {
    type: String,
  },
  broker_opening_balance: {
    type: Number,
  },
});

module.exports = mongoose.model("Broker", BrokerSchema);

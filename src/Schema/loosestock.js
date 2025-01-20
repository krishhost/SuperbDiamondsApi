const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

// Define the User Schema
const LooseStockSchema = new mongoose.Schema({
  invoice_no: {
    type: String,
  },
  deal_date: {
    default: Date.now,
    type: Date,
  },
  shape: {
    type: String,
  },
  weight: {
    type: Number,
  },
  broker_name: {
    type: String,
  },
  party_name: {
    type: String,
  },
  purchase_carat: {
    type: Number,
  },
  location: {
    type: String,
  },
  days: {
    type: Number,
  },
  sieve: {
    type: String,
  },
  number_of_stones: {
    type: String,
  },
  total_price: {
    type: Number,
  },
  comment: {
    type: String,
  },
  due_date: {
    type: Date,
  },
  user_email: {
    type: String,
  },
  in_stock: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("LooseStock", LooseStockSchema);

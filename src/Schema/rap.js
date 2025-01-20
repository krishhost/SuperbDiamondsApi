const mongoose = require("mongoose");

// Define the User Schema
const RapSchema = new mongoose.Schema({
  shape: {
    type: String,
  },
  quality: {
    type: String,
  },
  color: {
    type: String,
  },
  size_start: {
    type: Number,
  },
  size_end: {
    type: Number,
  },
  price: {
    type: Number,
  },
});

module.exports = mongoose.model("Rap", RapSchema);

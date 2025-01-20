const mongoose = require("mongoose");

// Define the User Schema
const UserSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, "First name is required"],
  },
  last_name: {
    type: String,
    required: [true, "Last name is required"],
  },
  user_name: {
    type: String,
    unique: true,
    required: [true, "Username is required"],
  },
  phone_number: {
    type: Number,
    unique: true,
    required: [true, "Phone number is required"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Email is required"],
  },
  country: {
    type: String,
    required: [true, "Country is required"],
  },
  company_name: {
    type: String,
    required: [true, "Company name is required"],
  },
  company_address: {
    type: String,
    required: [true, "Company address is required"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  occupation: {
    type: [String],
    required: [true, "Occupation is required"],
  },
  partners: [
    {
      first_name: {
        type: String,
        required: [true, "Partner's first name is required"],
      },
      last_name: {
        type: String,
        required: [true, "Partner's last name is required"],
      },
      email: {
        type: String,
        required: [true, "Partner's email is required"],
      },
      phone_number: {
        type: Number,
        required: [true, "Partner's phone number is required"],
      },
    },
  ],
  start_date: {
    type: Date,
    default: Date.now,
  },
  update_date: {
    type: Date,
    default: Date.now,
  },
  end_date: {
    type: Date,
  },
  stock_in: {
    type: Number,
    default: 0,
  },
  stock_out: {
    type: Number,
    default: 0,
  },
  purchased_diamonds: {
    type: Number,
    default: 0,
  },
  last_stock_id: {
    type: String,
  },
  invoice_no: {
    type: String,
  },
});

module.exports = mongoose.model("User", UserSchema);

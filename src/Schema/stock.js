const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

// Define the User Schema
const StockSchema = new mongoose.Schema({
  last_stock_id: {
    type: String,
  },
  shape: {
    type: String,
    required: false,
    default: undefined,
  },
  size_start: {
    type: Number,
  },
  size_end: {
    type: Number,
  },

  color: {
    type: String,
    required: false,
    default: undefined,
  },
  intensity: {
    type: String,
  },
  overtone: {
    type: String,
  },
  fancy_color: {
    type: String,
  },

  clarity: {
    type: String,
    required: false,
    default: undefined,
  },
  cut_type: {
    type: String,
  },
  cut_from: {
    type: String,
  },
  cut_to: {
    type: String,
  },
  polish_from: {
    type: String,
  },
  polish_to: {
    type: String,
  },
  symmetry_from: {
    type: String,
  },
  symmetry_to: {
    type: String,
  },
  fluorescence: {
    type: String,
    required: false,
    default: undefined,
  },
  color_fluorescence: {
    type: String,
  },
  location: {
    type: String,
  },
  weight: {
    type: Number,
  },
  // kapan_number: {
  //   type: String,
  // },
  lab_reports: {
    type: String,
    required: false,
    default: undefined,
  },
  length: {
    type: Number,
  },
  width: {
    type: Number,
  },
  height: {
    type: Number,
  },
  diameter: {
    type: Number,
  },
  depth: {
    type: Number,
  },
  table_size: {
    type: Number,
  },
  girdle: {
    type: Number,
  },

  age: {
    type: Number,
  },
  cr_angle: {
    type: Number,
  },
  cr_height: {
    type: Number,
  },
  p_angle: {
    type: Number,
  },
  p_depth: {
    type: Number,
  },
  comment: {
    type: String,
  },
  days: {
    type: Number,
  },
  // partners: {
  //   type: [Object],
  // },

  invoice_no: {
    type: String,
  },
  deal_date: {
    default: Date.now,
    type: Date,
  },
  party_name: {
    type: String,
  },
  brokerage: {
    type: Number,
  },
  broker: {
    type: String,
  },
  party: {
    type: String,
  },
  certificate_id: {
    type: String,
  },

  cur_rap: {
    type: Number,
  },
  price: {
    type: Number,
  },
  invoice_cmnt: {
    type: String,
  },
  purchase_back: {
    type: Number,
  },
  purchase_rate: {
    type: Number,
  },
  in_stock: {
    type: Number,
    default: 1,
  },
  user_email: {
    type: String,
  },
  sell_invoice: {
    type: String,
  },
  sell_deal_date: {
    type: Date,
  },
  sell_party_name: {
    type: String,
  },
  sell_broker: {
    type: String,
  },
  sell_brokerage: {
    type: Number,
  },
  sell_days: {
    type: Number,
  },
  sold_price: {
    type: Number,
  },
  sell_invoice_total: {
    type: Number,
  },
  sell_invoice_cmnt: {
    type: String,
  },
});
StockSchema.plugin(AutoIncrement, { inc_field: "id" });

module.exports = mongoose.model("Stock", StockSchema);

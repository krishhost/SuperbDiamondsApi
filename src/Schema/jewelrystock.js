const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const JewelryStockSchema = new mongoose.Schema({
  last_stock_id: {
    type: String,
  },

  color: {
    type: String,
    required: false,
    default: undefined,
  },
  clarity: {
    type: String,
    required: false,
    default: undefined,
  },

  location: {
    type: String,
  },
  weight: {
    type: Number,
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

  comment: {
    type: String,
  },
  invoice_no: {
    type: String,
  },
  deal_date: {
    default: Date.now,
    type: Date,
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
// Separate counter name: sharing the default "id" counter with Stock crashes mongoose-sequence.
JewelryStockSchema.plugin(AutoIncrement, { id: "jewelrystock_seq", inc_field: "id" });

module.exports = mongoose.model("JewelryStock", JewelryStockSchema);

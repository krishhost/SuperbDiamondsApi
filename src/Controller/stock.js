const Stock = require("../Schema/stock");
const { makeStockController } = require("./stockFactory");

/** Certified diamonds. */
module.exports = makeStockController(Stock);

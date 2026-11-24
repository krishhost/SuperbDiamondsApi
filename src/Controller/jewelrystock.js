const JewelryStock = require("../Schema/jewelrystock");
const { makeStockController } = require("./stockFactory");

/** Jewellery inventory (previously saved into the diamond Stock collection by mistake). */
module.exports = makeStockController(JewelryStock);

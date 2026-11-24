const LooseStock = require("../Schema/loosestock");
const { makeStockController } = require("./stockFactory");

/** Non-certified (loose) diamonds. Stores due_date = deal_date + credit days. */
module.exports = makeStockController(LooseStock, { dueDate: true });

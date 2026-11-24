const User = require("../Schema/user");
const { escapeRegex, pickFields, pickFilter } = require("../utils/http");

/**
 * One implementation for the certified, loose and jewellery stock controllers
 * (they used to be three near-identical copies).
 *
 * Status codes are kept exactly as before because the frontend relies on them
 * (e.g. 400 / 404 "No stocks found" for an empty result).
 *
 * Fields a client may never set directly:
 */
const PROTECTED = ["_id", "id", "__v", "user_email", "in_stock"];

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + (Number(days) || 0));
  return d;
};

const periodStart = (period) => {
  const start = new Date();
  switch (period) {
    case "daily":
      start.setDate(start.getDate() - 1);
      return start;
    case "quarterly":
      start.setMonth(start.getMonth() - 3);
      return start;
    case "yearly":
      start.setFullYear(start.getFullYear() - 1);
      return start;
    default:
      return null;
  }
};

/**
 * @param {import("mongoose").Model} Model
 * @param {{ dueDate?: boolean }} options  dueDate: store `due_date = deal_date + days` (loose stock)
 */
const makeStockController = (Model, { dueDate = false } = {}) => {
  const createStock = async (req, res) => {
    try {
      const user_email = req.user.email;
      const data = pickFields(Model, req.body, PROTECTED);

      const dealDate = req.body.deal_date ? new Date(req.body.deal_date) : new Date();
      data.deal_date = isNaN(dealDate.getTime()) ? new Date() : dealDate;
      if (dueDate) data.due_date = addDays(data.deal_date, req.body.days);

      const user = await User.findOne({ email: user_email });
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found." });
      }

      const newStock = new Model({ ...data, user_email, in_stock: 1 });
      await newStock.save();

      if (newStock.invoice_no) user.invoice_no = newStock.invoice_no;
      if (newStock.last_stock_id) user.last_stock_id = newStock.last_stock_id;
      user.stock_in = (user.stock_in || 0) + 1;
      user.purchased_diamonds = (user.purchased_diamonds || 0) + 1;
      await user.save();

      res.status(201).json({ success: true, message: "Stock data saved successfully." });
    } catch (error) {
      console.error("Error saving stock data:", error);
      if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ success: false, error: "Some stock details are invalid." });
      }
      res.status(500).json({ success: false, error: "Failed to save stock data." });
    }
  };

  const viewStock = async (req, res) => {
    try {
      const filters = {
        ...pickFilter(Model, req.query, PROTECTED),
        ...pickFilter(Model, req.body, PROTECTED),
        user_email: req.user.email,
        in_stock: 1,
      };
      const stocks = await Model.find(filters).sort({ deal_date: -1 });
      if (stocks.length === 0) return res.status(404).json({ message: "No stocks found" });
      res.status(200).json(stocks);
    } catch (error) {
      console.error("Error retrieving stock data:", error);
      res.status(500).json({ message: "Failed to retrieve stock data" });
    }
  };

  const viewAllStock = async (req, res) => {
    try {
      const filters = { user_email: req.user.email };
      if (req.query.type === "stock_in") filters.in_stock = 1;
      else if (req.query.type === "stock_out") filters.in_stock = 0;

      const stocks = await Model.find(filters).sort({ deal_date: -1 });
      if (stocks.length === 0) return res.status(400).json({ message: "No stocks found" });
      res.status(200).json(stocks);
    } catch (error) {
      console.error("Error retrieving stock data:", error);
      res.status(500).json({ message: "Failed to retrieve stock data" });
    }
  };

  const viewAllStocksByPeriod = async (req, res) => {
    try {
      const start = periodStart(req.query.period);
      if (!start) {
        return res.status(400).json({ message: "Invalid period. Use 'daily', 'quarterly', or 'yearly'." });
      }
      const end = addDays(new Date(), 1);
      const stocks = await Model.find({ user_email: req.user.email, deal_date: { $gte: start, $lte: end } }).sort({
        deal_date: -1,
      });
      if (stocks.length === 0) return res.status(404).json({ message: "No stocks found" });
      res.status(200).json(stocks);
    } catch (error) {
      console.error("Error retrieving stock data:", error);
      res.status(500).json({ message: "Failed to retrieve stock data" });
    }
  };

  const viewReportStock = async (req, res) => {
    try {
      const body = Array.isArray(req.body) ? req.body[0] || {} : req.body || {};
      const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
      const { fromDate, toDate, outstandingfrom, outstandingto } = body;
      const filters = { user_email: req.user.email };

      if (str(fromDate) && str(toDate)) {
        const from = new Date(fromDate);
        const to = addDays(toDate, 1);
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) filters.deal_date = { $gte: from, $lte: to };
      }
      if (str(body.stockId)) filters.last_stock_id = str(body.stockId);
      if (str(body.certificateId)) filters.certificate_id = str(body.certificateId);
      if (str(body.invoiceNumber)) filters.invoice_no = str(body.invoiceNumber);
      if (str(body.partyName)) filters.party_name = new RegExp(escapeRegex(str(body.partyName)), "i");

      // Outstanding window on due_date ("YYYY-MM" .. "YYYY-MM"), loose stock only.
      if (dueDate && str(outstandingfrom) && str(outstandingto)) {
        const [fy, fm] = outstandingfrom.split("-").map(Number);
        const [ty, tm] = outstandingto.split("-").map(Number);
        if ([fy, fm, ty, tm].every((n) => Number.isFinite(n))) {
          filters.due_date = { $gte: new Date(fy, fm - 1, 1), $lte: new Date(ty, tm, 0, 23, 59, 59) };
        }
      }

      const stocks = await Model.find(filters).sort({ deal_date: -1 });
      if (stocks.length === 0) return res.status(400).json({ message: "No stocks found" });
      res.status(200).json(stocks);
    } catch (error) {
      console.error("Error retrieving stock data:", error);
      res.status(500).json({ message: "Failed to retrieve stock data" });
    }
  };

  const sellStock = async (req, res) => {
    try {
      const user_email = req.user.email;
      const stock_id = typeof req.body.stock_id === "string" ? req.body.stock_id.trim() : "";
      const certificate_id = typeof req.body.certificate_id === "string" ? req.body.certificate_id.trim() : "";

      if (!stock_id && !certificate_id) {
        return res.status(400).json({ message: "Either stock_id or certificate_id is required and should not be empty" });
      }

      const query = { user_email };
      if (stock_id) query.last_stock_id = stock_id;
      if (certificate_id) query.certificate_id = certificate_id;

      const stock = await Model.findOne(query);
      if (!stock) {
        return res.status(404).json({ message: "Stock not found for the provided stock_id or certificate_id and user" });
      }
      if (Number(stock.in_stock) === 0) {
        return res.status(400).json({ message: "This stone has already been sold." });
      }

      // Only sale details may change; ownership, ids and the stone identity are locked.
      const updates = pickFields(Model, req.body, [...PROTECTED, "last_stock_id", "certificate_id", "stock_id"]);
      Object.assign(stock, updates, { in_stock: 0 });
      if (!stock.sell_deal_date) stock.sell_deal_date = new Date();
      await stock.save();

      await User.updateOne({ email: user_email }, { $inc: { stock_out: 1, stock_in: -1 } });
      await User.updateOne({ email: user_email, stock_in: { $lt: 0 } }, { $set: { stock_in: 0 } });

      return res.status(200).json({ message: "Stock updated successfully" });
    } catch (error) {
      console.error("Error updating stock:", error);
      if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ message: "Some sale details are invalid." });
      }
      res.status(500).json({ message: "Failed to update stock" });
    }
  };

  return { createStock, viewStock, viewAllStock, viewAllStocksByPeriod, viewReportStock, sellStock };
};

module.exports = { makeStockController };

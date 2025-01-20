const LooseStock = require("../Schema/loosestock");
const User = require("../Schema/user");

const createStock = async (req, res) => {
  try {
    const user_email = req.user.email;
    const { deal_date, days, ...otherData } = req.body;

    const dealDate = new Date(deal_date);
    const dueDate = new Date(dealDate);

    console.log("Prior -->", dueDate);

    // Check if 'days' is provided and is a number
    if (days && !isNaN(days)) {
      const monthsToAdd = Math.floor(days / 30);
      dueDate.setMonth(dealDate.getMonth() + monthsToAdd);
      console.log("Due Date:", dueDate);
    }

    const newStock = new LooseStock({
      ...otherData,
      user_email,
      deal_date: dealDate,
      due_date: dueDate,
      days, // Save 'days' in the database
    });

    const { invoice_no } = newStock;

    const user = await User.findOne({ email: user_email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    user.invoice_no = invoice_no;
    user.stock_in = (user.stock_in || 0) + 1;
    user.purchased_diamonds = (user.purchased_diamonds || 0) + 1;

    await newStock.save();
    await user.save();

    res.status(201).json({
      success: true,
      message: "Stock data saved successfully.",
    });
  } catch (error) {
    console.error("Error saving stock data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save stock data.",
    });
  }
};

const viewStock = async (req, res) => {
  try {
    const user_email = req.user.email;
    if (!user_email) {
      return res.status(400).json({ message: "User email is required" });
    }

    const filters = { ...req.body, ...req.query, user_email, in_stock: 1 };

    if (req.body.certificate_id && req.body.certificate_id.trim() !== "") {
      filters.certificate_id = req.body.certificate_id;
    } else {
      delete filters.certificate_id;
    }

    const stocks = await LooseStock.find(filters).sort({ deal_date: -1 });

    if (stocks.length === 0) {
      return res.status(404).json({ message: "No stocks found" });
    }

    res.status(200).json(stocks);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve stock data", error });
  }
};

const viewAllStock = async (req, res) => {
  try {
    const user_email = req.user.email;
    if (!user_email) {
      return res.status(400).json({ message: "User email is required" });
    }

    const filters = { user_email };

    if (req.query.type === "purchased_diamonds") {
    } else if (req.query.type === "stock_in") {
      filters.in_stock = 1;
    } else if (req.query.type === "stock_out") {
      filters.in_stock = 0;
    }

    const stocks = await LooseStock.find(filters).sort({ deal_date: -1 });

    if (stocks.length === 0) {
      return res.status(400).json({ message: "No stocks found" });
    }

    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error retrieving stock data:", error);
    res.status(500).json({ message: "Failed to retrieve stock data", error });
  }
};

const viewAllStocksByPeriod = async (req, res) => {
  try {
    const user_email = req.user.email;

    if (!user_email) {
      return res.status(400).json({ message: "User email is required" });
    }

    const { period } = req.query;
    let currentDate = new Date();

    // Add 1 day to the current date
    currentDate.setDate(currentDate.getDate() + 1);

    let startDate;

    switch (period) {
      case "daily":
        // Daily: from 1 day before today
        startDate = new Date();
        startDate.setDate(currentDate.getDate() - 2); // Subtract 2 days to include today as 1 day is added already
        break;

      case "quarterly":
        // Quarterly: from 3 months before today
        startDate = new Date();
        startDate.setMonth(currentDate.getMonth() - 3); // Subtract 3 months
        break;

      case "yearly":
        // Yearly: from 1 year before today
        startDate = new Date();
        startDate.setFullYear(currentDate.getFullYear() - 1); // Subtract 1 year
        break;

      default:
        return res.status(400).json({
          message: "Invalid period. Use 'daily', 'quarterly', or 'yearly'.",
        });
    }

    const filters = {
      user_email,
      deal_date: {
        $gte: startDate,
        $lte: currentDate,
      },
    };

    const stocks = await LooseStock.find(filters).sort({ deal_date: -1 });

    if (stocks.length === 0) {
      return res.status(404).json({ message: "No stocks found" });
    }

    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error retrieving stock data:", error);
    res.status(500).json({ message: "Failed to retrieve stock data", error });
  }
};

const viewReportStock = async (req, res) => {
  try {
    const user_email = req.user.email;

    if (!user_email) {
      return res.status(400).json({ message: "User email is required" });
    }

    // Check if req.body is an array and has at least one item
    const requestBody =
      Array.isArray(req.body) && req.body.length > 0 ? req.body[0] : {};
    const {
      fromDate,
      toDate,
      partyName,
      invoiceNumber,
      outstandingfrom,
      outstandingto,
    } = requestBody;

    const filters = { user_email };

    // Filter by fromDate and toDate on deal_date
    if (fromDate && toDate) {
      const toDatePlusOne = new Date(toDate);
      toDatePlusOne.setDate(toDatePlusOne.getDate() + 1);

      filters.deal_date = {
        $gte: new Date(fromDate),
        $lte: toDatePlusOne,
      };
    }

    // Filter by party name (case-insensitive)
    if (partyName) {
      filters.party_name = new RegExp(partyName, "i");
    }

    // Filter by invoice number
    if (invoiceNumber) {
      filters.invoice_no = invoiceNumber;
    }

    // Filter by outstandingfrom and outstandingto on due_date
    if (outstandingfrom && outstandingto) {
      // Safely parse year and month parts
      const [outFromYear, outFromMonth] = outstandingfrom
        .split("-")
        .map((part) => parseInt(part, 10));
      const [outToYear, outToMonth] = outstandingto
        .split("-")
        .map((part) => parseInt(part, 10));

      // Check if the parsed values are valid numbers
      if (
        !isNaN(outFromYear) &&
        !isNaN(outFromMonth) &&
        !isNaN(outToYear) &&
        !isNaN(outToMonth)
      ) {
        const startOfOutstandingFrom = new Date(
          outFromYear,
          outFromMonth - 1,
          1
        ); // First day of the month
        const endOfOutstandingTo = new Date(outToYear, outToMonth, 0); // Last day of the month

        filters.due_date = {
          $gte: startOfOutstandingFrom,
          $lte: endOfOutstandingTo,
        };
      } else {
        console.warn("Invalid outstanding date format");
      }
    }

    // Fetch and sort stocks
    const stocks = await LooseStock.find(filters).sort({ deal_date: -1 });

    if (stocks.length === 0) {
      return res.status(400).json({ message: "No stocks found" });
    }

    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error retrieving stock data:", error);
    res.status(500).json({ message: "Failed to retrieve stock data", error });
  }
};

const sellStock = async (req, res) => {
  try {
    const { stock_id, certificate_id, ...otherFields } = req.body;
    const user_email = req.user.email;

    if (
      (!stock_id || stock_id.trim() === "") &&
      (!certificate_id || certificate_id.trim() === "")
    ) {
      return res.status(400).json({
        message:
          "Either stock_id or certificate_id is required and should not be empty",
      });
    }

    const query = { user_email };
    if (stock_id && stock_id.trim()) query.last_stock_id = stock_id.trim();
    if (certificate_id && certificate_id.trim())
      query.certificate_id = certificate_id.trim();

    const stock = await LooseStock.findOne(query);
    if (!stock) {
      return res.status(404).json({
        message:
          "Stock not found for the provided stock_id or certificate_id and user",
      });
    }

    stock.in_stock = 0;

    Object.keys(otherFields).forEach((key) => {
      const value = otherFields[key];
      if (typeof value === "string" && value.trim() !== "") {
        stock[key] = value.trim();
      } else if (value !== "" && value !== null && value !== undefined) {
        stock[key] = value;
      }
    });

    await stock.save();

    return res.status(200).json({ message: "Stock updated successfully" });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: "Failed to update stock", error });
  }
};

module.exports = {
  createStock,
  viewStock,
  sellStock,
  viewAllStock,
  viewAllStocksByPeriod,
  viewReportStock,
};

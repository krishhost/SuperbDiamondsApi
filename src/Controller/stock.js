const Stock = require("../Schema/stock");
const User = require("../Schema/user");

const createStock = async (req, res) => {
  try {
    const user_email = req.user.email;
    console.log(req.body.invoice_no);

    const newStock = new Stock({
      ...req.body,
      user_email, // Set the user_email field in the stock data
    });

    // Extract stock details from the new stock instance
    const { last_stock_id, invoice_no } = newStock;

    // Find the user by their email
    const user = await User.findOne({ email: user_email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    if (invoice_no) {
      user.invoice_no = invoice_no;
    }
    if (last_stock_id) {
      user.last_stock_id = last_stock_id;
    }

    user.stock_in = (user.stock_in || 0) + 1;
    user.purchased_diamonds = (user.purchased_diamonds || 0) + 1;
    await newStock.save();
    await user.save();
    res
      .status(201)
      .json({ success: true, message: "Stock data saved successfully." });
  } catch (error) {
    console.error("Error saving stock data:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to save stock data." });
  }
};

const viewStock = async (req, res) => {
  try {
    const user_email = req.user.email;
    if (!user_email) {
      return res.status(400).json({ message: "User email is required" });
    }

    const filters = { ...req.body, ...req.query, user_email, in_stock: 1 };

    if (req.body.last_stock_id && req.body.last_stock_id.trim() !== "") {
      filters.last_stock_id = req.body.last_stock_id;
    } else {
      delete filters.last_stock_id;
    }

    if (req.body.certificate_id && req.body.certificate_id.trim() !== "") {
      filters.certificate_id = req.body.certificate_id;
    } else {
      delete filters.certificate_id;
    }

    const stocks = await Stock.find(filters).sort({ deal_date: -1 });

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

    const stocks = await Stock.find(filters).sort({ deal_date: -1 });

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

    const stocks = await Stock.find(filters).sort({ deal_date: -1 });

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
    const {
      fromDate,
      toDate,
      stockId,
      certificateId,
      partyName,
      invoiceNumber,
    } = req.body[0];

    const filters = { user_email };
    if (fromDate && toDate) {
      // Add one day to the 'toDate' to make the $lte condition inclusive of the entire day
      const toDatePlusOne = new Date(toDate);
      toDatePlusOne.setDate(toDatePlusOne.getDate() + 1);

      filters.deal_date = {
        $gte: new Date(fromDate),
        $lte: toDatePlusOne,
      };
    }

    if (stockId) {
      filters.last_stock_id = stockId;
    }
    if (certificateId) {
      filters.certificate_id = certificateId;
    }
    if (partyName) {
      filters.party_name = new RegExp(partyName, "i"); // case-insensitive match
    }

    if (invoiceNumber) {
      filters.invoice_no = invoiceNumber;
    }

    const stocks = await Stock.find(filters).sort({ deal_date: -1 });

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

    const stock = await Stock.findOne(query);
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

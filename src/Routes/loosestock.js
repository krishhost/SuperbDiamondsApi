const express = require("express");
const {
  createStock,
  viewStock,
  viewAllStock,
  sellStock,
  viewReportStock,
  viewAllStocksByPeriod,
} = require("../Controller/loosestock");
const { authenticate } = require("../utils/jwt");

const router = express.Router();

router.use(authenticate);
router.post("/create-stock", createStock);
router.post("/view-stock", viewStock);
router.get("/view-allstock", viewAllStock);
router.post("/view-report", viewReportStock);
router.get("/view-periodreport", viewAllStocksByPeriod);
router.post("/sell-stock", sellStock);

module.exports = router;

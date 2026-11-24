const express = require("express");
const {
  createStock,
  viewStock,
  sellStock,
  viewAllStock,
} = require("../Controller/jewelrystock");
const { authenticate } = require("../utils/jwt");

const router = express.Router();

router.use(authenticate);
router.post("/create-jewelrystock", createStock);
router.post("/view-jewelrystock", viewStock);
router.get("/view-allstock", viewAllStock);
router.post("/sell-jewelrystock", sellStock);

module.exports = router;

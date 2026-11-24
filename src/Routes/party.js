const express = require("express");
const { ListParties, AddParty, UpdateParty, DeleteParty } = require("../Controller/party");
const { authenticate } = require("../utils/jwt");

const router = express.Router();

router.use(authenticate);
router.get("/", ListParties);
router.post("/", AddParty);
router.put("/:id", UpdateParty);
router.delete("/:id", DeleteParty);

module.exports = router;

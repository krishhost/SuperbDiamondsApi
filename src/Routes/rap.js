const express = require("express");
const multer = require("multer");
const { viewRap } = require("../Controller/findrap");
const { authenticate } = require("../utils/jwt");
const UploadCsv = require("../Controller/rap");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(authenticate);
router.post("/view-rap", viewRap);
router.post("/upload", upload.single("file"), UploadCsv.upload);

module.exports = router;

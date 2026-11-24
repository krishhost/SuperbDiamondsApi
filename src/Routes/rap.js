const express = require("express");
const multer = require("multer");
const { viewRap } = require("../Controller/findrap");
const { authenticate } = require("../utils/jwt");
const UploadCsv = require("../Controller/rap");

const router = express.Router();

// Keep uploads in memory (works on read-only hosts like Vercel and leaves no temp files).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, /csv|excel|text\/plain/.test(file.mimetype) || file.originalname.toLowerCase().endsWith(".csv")),
});

router.use(authenticate);
router.post("/view-rap", viewRap);
router.post("/upload", upload.single("file"), UploadCsv.upload);

module.exports = router;

const csv = require("csvtojson");
const Rap = require("../Schema/rap");

const HEADERS = ["shape", "quality", "color", "size_start", "size_end", "price"];

/**
 * RAP price lists are shared by every account. If ADMIN_EMAILS is set
 * (comma-separated), only those accounts may replace them.
 */
const canUpload = (email) => {
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.length === 0 || admins.includes(String(email).toLowerCase());
};

exports.upload = async (req, res) => {
  try {
    if (!canUpload(req.user.email)) {
      return res.status(403).json({ error: "Only administrators can replace the RAP price list." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Please attach a CSV file." });
    }

    const rows = await csv({ headers: HEADERS, noheader: true }).fromString(req.file.buffer.toString("utf8"));

    // Validate every row before touching the existing prices.
    const clean = [];
    for (const [i, r] of rows.entries()) {
      const row = {
        shape: String(r.shape || "").trim(),
        quality: String(r.quality || "").trim(),
        color: String(r.color || "").trim(),
        size_start: parseFloat(r.size_start),
        size_end: parseFloat(r.size_end),
        price: parseFloat(r.price),
      };
      // Skip a header line if the file has one.
      if (i === 0 && isNaN(row.price)) continue;
      if (!row.shape || !row.quality || !row.color || [row.size_start, row.size_end, row.price].some(isNaN)) {
        return res.status(400).json({ error: `Row ${i + 1} is incomplete or not numeric. Nothing was changed.` });
      }
      clean.push(row);
    }
    if (clean.length === 0) {
      return res.status(400).json({ error: "The file has no price rows. Nothing was changed." });
    }

    await Rap.deleteMany({});
    await Rap.insertMany(clean);

    res.json({ message: "File uploaded and data saved to database successfully.", rows: clean.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while processing the file." });
  }
};

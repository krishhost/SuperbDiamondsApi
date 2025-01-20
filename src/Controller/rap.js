const csv = require("csvtojson");
const Rap = require("../Schema/rap");
const fs = require("fs");

exports.upload = async (req, res) => {
  try {
    const filePath = req.file.path;

    // Define your custom column names
    const customHeaders = [
      "shape",
      "quality",
      "color",
      "size_start",
      "size_end",
      "price",
    ];

    // Convert CSV to JSON using custom headers
    const jsonArray = await csv({
      headers: customHeaders,
      noheader: true,
    }).fromFile(filePath);

    // Delete all previous data
    await Rap.deleteMany({});

    // Save JSON data to MongoDB
    await Rap.insertMany(jsonArray);

    // Remove the file after processing
    fs.unlinkSync(filePath);

    res.json({
      message: "File uploaded and data saved to database successfully.",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the file." });
  }
};

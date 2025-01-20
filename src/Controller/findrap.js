const Rap = require("../Schema/rap");

const viewRap = async (req, res) => {
  try {
    const { shape, quality, color, size_start, size_end, weight } = req.body;

    // Validate input parameters with specific error messages
    if (!shape) {
      return res.status(400).json({ message: "Shape parameter is empty." });
    }
    if (!color) {
      return res.status(400).json({ message: "Color parameter is empty." });
    }
    if (!quality) {
      return res.status(400).json({ message: "Clarity parameter is empty." });
    }
    if (!size_start && !size_end && !weight) {
      return res
        .status(400)
        .json({ message: "Either size or weight parameter is required." });
    }

    // Prepare the query based on available parameters
    const query = {
      shape: shape,
      quality: quality,
      color: color,
    };

    // Parse `size_start`, `size_end`, and `weight` as floats if they are provided
    const parsedSizeStart = size_start ? parseFloat(size_start) : null;
    const parsedSizeEnd = size_end ? parseFloat(size_end) : null;
    const parsedWeight = weight ? parseFloat(weight) : null;

    // Add conditions based on the presence of `size_start`, `size_end`, and `weight`
    if (parsedSizeStart !== null) query.size_start = parsedSizeStart;
    if (parsedSizeEnd !== null) query.size_end = parsedSizeEnd;
    if (parsedWeight !== null) {
      query.$expr = {
        $and: [
          { $lte: ["$size_start", parsedWeight] },
          { $gte: ["$size_end", parsedWeight] },
        ],
      };
    }

    // Execute the query
    const data = await Rap.findOne(query)
      .sort({ size_start: 1 }) // Sort by size_start in ascending order to get the nearest match
      .limit(1); // Only return the first closest match

    if (!data) {
      return res
        .status(400)
        .json({ valid: false, message: "There is no rap available." });
    }

    res.json({ price: data.price });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the data." });
  }
};

module.exports = { viewRap };

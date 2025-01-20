const Party = require("../Schema/party"); // Adjust the path as necessary

const GetParty = async (req, res) => {
  try {
    const identifier = req.params.identifier;

    // Find the party by identifier
    const party = await Party.findOne({ identifier: identifier });

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    // Return the party_name
    res.json({ party_name: party.party_name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const AddParty = async (req, res) => {
  try {
    const { identifier } = req.params;
    const {
      party_name,
      party_number,
      party_address,
      party_email,
      party_opening_balance,
    } = req.body;

    // Validate input
    if (
      !identifier ||
      !party_name ||
      !party_number ||
      !party_address ||
      !party_email ||
      party_opening_balance === undefined
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create new party
    const newParty = new Party({
      identifier,
      party_name,
      party_number,
      party_address,
      party_email,
      party_opening_balance,
    });

    // Save party to database
    await newParty.save();

    res.status(201).json(newParty);
  } catch (error) {
    console.error("Error adding party:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { AddParty, GetParty };

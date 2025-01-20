const Broker = require("../Schema/broker"); // Adjust the path as necessary

const GetBroker = async (req, res) => {
  try {
    const identifier = req.params.identifier;

    // Find the broker by identifier
    const broker = await Broker.findOne({ identifier: identifier });

    if (!broker) {
      return res.status(404).json({ message: "Broker not found" });
    }

    // Return the Broker_name
    res.json({ Broker_name: broker.broker_name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const AddBroker = async (req, res) => {
  try {
    const { identifier } = req.params;
    const {
      broker_name,
      broker_number,
      broker_address,
      broker_email,
      broker_opening_balance,
    } = req.body;

    // Validate input
    if (
      !identifier ||
      !broker_name ||
      !broker_number ||
      !broker_address ||
      !broker_email ||
      broker_opening_balance === undefined
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create new broker
    const newBroker = new Broker({
      identifier,
      broker_name,
      broker_number,
      broker_address,
      broker_email,
      broker_opening_balance,
    });

    // Save broker to database
    await newBroker.save();

    res.status(201).json(newBroker);
  } catch (error) {
    console.error("Error adding broker:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { AddBroker, GetBroker };

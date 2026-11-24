const mongoose = require("mongoose");
const Party = require("../Schema/party");
const { pickFields } = require("../utils/http");

const PROTECTED = ["_id", "__v", "user_email", "createdAt", "updatedAt"];

const handleError = (res, error, fallback) => {
  if (error.code === 11000) return res.status(400).json({ message: "A party with this name already exists." });
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(error.errors)[0]?.message || "Invalid party details." });
  }
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
};

/** GET /party — every party for the logged-in user. */
const ListParties = async (req, res) => {
  try {
    const parties = await Party.find({ user_email: req.user.email }).sort({ party_name: 1 }).collation({ locale: "en" });
    res.status(200).json(parties);
  } catch (error) {
    handleError(res, error, "Could not load parties.");
  }
};

/** POST /party */
const AddParty = async (req, res) => {
  try {
    const party = await Party.create({ ...pickFields(Party, req.body, PROTECTED), user_email: req.user.email });
    res.status(201).json(party);
  } catch (error) {
    handleError(res, error, "Could not add the party.");
  }
};

/** PUT /party/:id */
const UpdateParty = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Party not found." });
    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, user_email: req.user.email },
      { $set: pickFields(Party, req.body, PROTECTED) },
      { new: true, runValidators: true }
    );
    if (!party) return res.status(404).json({ message: "Party not found." });
    res.status(200).json(party);
  } catch (error) {
    handleError(res, error, "Could not update the party.");
  }
};

/** DELETE /party/:id */
const DeleteParty = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Party not found." });
    const result = await Party.deleteOne({ _id: req.params.id, user_email: req.user.email });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Party not found." });
    res.status(200).json({ message: "Party deleted." });
  } catch (error) {
    handleError(res, error, "Could not delete the party.");
  }
};

module.exports = { ListParties, AddParty, UpdateParty, DeleteParty };

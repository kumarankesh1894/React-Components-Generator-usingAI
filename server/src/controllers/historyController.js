const Generation = require("../models/Generation");

// GET user's generation history
const getGenerations = async (req, res) => {
  try {
    const generations = await Generation.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ generations });
  } catch (err) {
    console.error("Error fetching generations:", err);
    res.status(500).json({ error: "Failed to fetch generation history" });
  }
};

// DELETE a generation
const deleteGeneration = async (req, res) => {
  try {
    const deleted = await Generation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!deleted) return res.status(404).json({ error: "Generation not found" });
    res.json({ message: "Generation deleted successfully" });
  } catch (err) {
    console.error("Error deleting generation:", err);
    res.status(500).json({ error: "Failed to delete generation" });
  }
};

// UPDATE a generation
const updateGeneration = async (req, res) => {
  const { prompt, code } = req.body;
  try {
    const updated = await Generation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { prompt, code },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Generation not found" });
    res.json({ generation: updated });
  } catch (err) {
    console.error("Error updating generation:", err);
    res.status(500).json({ error: "Failed to update generation" });
  }
};

module.exports = {
  getGenerations,
  deleteGeneration,
  updateGeneration,
};

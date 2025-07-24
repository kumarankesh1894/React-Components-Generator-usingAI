const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  getGenerations,
  deleteGeneration,
  updateGeneration,
} = require("../controllers/historyController");

router.get("/", auth, getGenerations);
router.delete("/:id", auth, deleteGeneration);
router.put("/:id", auth, updateGeneration);

module.exports = router;

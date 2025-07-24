const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createSession,
  getSessions,
} = require("../controllers/sessionController");

router.post("/", auth, createSession);
router.get("/", auth, getSessions);

module.exports = router;

const express = require("express");
const {
  renderProfile,
  saveAdhanSettings,
} = require("../controllers/dashboardController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderProfile);
router.post("/adhan-settings", requireAuth, saveAdhanSettings);

module.exports = router;


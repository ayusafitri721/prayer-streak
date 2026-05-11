const express = require("express");
const {
  renderDashboard,
  completePrayerAction,
} = require("../controllers/dashboardController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderDashboard);
router.post("/prayer/:prayer/complete", requireAuth, completePrayerAction);

module.exports = router;


const express = require("express");
const {
  renderDashboard,
  completePrayerAction,
  markRestoreReflectionAction,
  getHijriCalendarMonthAction,
} = require("../controllers/dashboardController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderDashboard);
router.get("/hijri-calendar", requireAuth, getHijriCalendarMonthAction);
router.post("/prayer/:prayer/complete", requireAuth, completePrayerAction);
router.post("/restore/reflection", requireAuth, markRestoreReflectionAction);

module.exports = router;


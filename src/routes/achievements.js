const express = require("express");
const { renderAchievements } = require("../controllers/dashboardController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderAchievements);

module.exports = router;


const express = require("express");
const { renderStatistics } = require("../controllers/dashboardController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderStatistics);

module.exports = router;


const express = require("express");
const { renderProfile } = require("../controllers/dashboardController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderProfile);

module.exports = router;


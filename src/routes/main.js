const express = require("express");
const { renderHome, renderRobots, renderSitemap } = require("../controllers/mainController");
const { syncPrayerLocation } = require("../controllers/locationController");
const router = express.Router();

router.get("/robots.txt", renderRobots);
router.get("/sitemap.xml", renderSitemap);
router.get("/", renderHome);
router.post("/location/prayer", syncPrayerLocation);

module.exports = router;


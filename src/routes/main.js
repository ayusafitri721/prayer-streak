const express = require("express");
const { renderHome } = require("../controllers/mainController");
const { syncPrayerLocation } = require("../controllers/locationController");
const router = express.Router();

router.get("/", renderHome);
router.post("/location/prayer", syncPrayerLocation);

module.exports = router;


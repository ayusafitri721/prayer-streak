const express = require("express");
const { renderProfile } = require("../controllers/dashboardController");
const { uploadProfilePhoto } = require("../controllers/profileController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderProfile);
router.post("/photo", requireAuth, uploadProfilePhoto);

module.exports = router;

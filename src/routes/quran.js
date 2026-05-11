const express = require("express");
const { renderQuranIndex, renderQuranDetail } = require("../controllers/quranController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderQuranIndex);
router.get("/:nomor", requireAuth, renderQuranDetail);

module.exports = router;

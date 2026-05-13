const express = require("express");
const { renderQuranIndex, renderQuranDetail } = require("../controllers/quranController");

const router = express.Router();

router.get("/", renderQuranIndex);
router.get("/:nomor", renderQuranDetail);

module.exports = router;

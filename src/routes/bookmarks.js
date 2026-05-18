const express = require("express");
const { storeQuranBookmark, deleteQuranBookmark } = require("../controllers/bookmarkController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.post("/", requireAuth, storeQuranBookmark);
router.post("/:surahNumber/:verseNumber/delete", requireAuth, deleteQuranBookmark);

module.exports = router;

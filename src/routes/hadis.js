const express = require("express");
const { renderHadisIndex, renderHadisCollection, renderHadisDetail } = require("../controllers/hadisController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderHadisIndex);
router.get("/:slug", requireAuth, renderHadisCollection);
router.get("/:slug/:number", requireAuth, renderHadisDetail);

module.exports = router;

const express = require("express");
const {
  renderLearningIndex,
  renderLearningDetail,
  getIqroLevelsAction,
  getIqroLevelDetailAction,
} = require("../controllers/learningController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderLearningIndex);
router.get("/iqro-api/levels", requireAuth, getIqroLevelsAction);
router.get("/iqro-api/levels/:level", requireAuth, getIqroLevelDetailAction);
router.get("/:slug", requireAuth, renderLearningDetail);

module.exports = router;

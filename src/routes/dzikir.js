const express = require("express");
const {
  renderDzikirHub,
  renderDzikirList,
  renderDzikirPractice,
} = require("../controllers/dzikirController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderDzikirHub);
router.get("/list", requireAuth, renderDzikirList);
router.get("/practice/:session/:index", requireAuth, renderDzikirPractice);

module.exports = router;

const express = require("express");
const {
  renderDoaIndex,
  renderDoaCollection,
  renderDoaDetail,
} = require("../controllers/doaController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAuth, renderDoaIndex);
router.get("/:slug", requireAuth, renderDoaCollection);
router.get("/:slug/:id", requireAuth, renderDoaDetail);

module.exports = router;

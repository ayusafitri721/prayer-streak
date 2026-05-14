const express = require("express");
const { deleteFavorite, storeFavorite } = require("../controllers/favoriteController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.post("/", requireAuth, storeFavorite);
router.post("/:id/delete", requireAuth, deleteFavorite);

module.exports = router;

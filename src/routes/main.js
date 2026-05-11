const express = require("express");
const { renderHome } = require("../controllers/mainController");
const router = express.Router();

router.get("/", renderHome);

module.exports = router;


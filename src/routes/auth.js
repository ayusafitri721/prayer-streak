const express = require("express");
const {
  showLogin,
  showRegister,
  doRegister,
  doLogin,
  logout,
} = require("../controllers/authController");
const { requireAuth, requireGuest } = require("../middlewares/flash");

const router = express.Router();

router.get("/login", requireGuest, showLogin);
router.post("/login", requireGuest, doLogin);
router.get("/register", requireGuest, showRegister);
router.post("/register", requireGuest, doRegister);
router.post("/logout", requireAuth, logout);

module.exports = router;


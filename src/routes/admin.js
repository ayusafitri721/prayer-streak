const express = require("express");
const {
  renderAdminDashboard,
  renderAdminUsers,
  renderAdminUserDetail,
  updateUserRoleAction,
  resetUserProgressAction,
} = require("../controllers/adminController");
const { requireAdmin } = require("../middlewares/flash");

const router = express.Router();

router.get("/", requireAdmin, renderAdminDashboard);
router.get("/users", requireAdmin, renderAdminUsers);
router.get("/users/:id", requireAdmin, renderAdminUserDetail);
router.post("/users/:id/role", requireAdmin, updateUserRoleAction);
router.post("/users/:id/reset-progress", requireAdmin, resetUserProgressAction);

module.exports = router;

const express = require("express");
const {
  getPublicPushKeyAction,
  getNotificationStateAction,
  subscribeNotificationAction,
  unsubscribeNotificationAction,
  updateNotificationPreferencesAction,
  sendTestNotificationAction,
} = require("../controllers/notificationController");
const { requireAuth } = require("../middlewares/flash");

const router = express.Router();

router.get("/public-key", requireAuth, getPublicPushKeyAction);
router.get("/state", requireAuth, getNotificationStateAction);
router.post("/subscribe", requireAuth, subscribeNotificationAction);
router.post("/unsubscribe", requireAuth, unsubscribeNotificationAction);
router.post("/preferences", requireAuth, updateNotificationPreferencesAction);
router.post("/test", requireAuth, sendTestNotificationAction);

module.exports = router;

const {
  getPushStatus,
  getUserNotificationState,
  subscribeUser,
  unsubscribeUser,
  updateUserPreferences,
  sendNotificationToUser,
} = require("../services/notificationService");

function getPublicPushKeyAction(req, res) {
  const status = getPushStatus();
  if (!status.enabled) {
    return res.status(503).json({
      ok: false,
      message: status.reason || "Push notification belum aktif.",
    });
  }

  return res.json({
    ok: true,
    publicKey: status.publicKey,
  });
}

function getNotificationStateAction(req, res) {
  const userId = req.session.user.id;
  return res.json({
    ok: true,
    ...getUserNotificationState(userId),
  });
}

function subscribeNotificationAction(req, res) {
  const userId = req.session.user.id;
  const { subscription, metadata, preferences } = req.body || {};

  if (preferences && typeof preferences === "object") {
    updateUserPreferences(userId, preferences);
  }

  const result = subscribeUser(userId, subscription, {
    ...(metadata || {}),
    userAgent: req.get("user-agent") || "",
  });

  if (!result.ok) {
    return res.status(400).json({
      ok: false,
      message: result.message,
    });
  }

  return res.json({
    ok: true,
    subscriptionCount: result.subscriptionCount,
  });
}

function unsubscribeNotificationAction(req, res) {
  const userId = req.session.user.id;
  const endpoint = req.body?.endpoint || null;
  const result = unsubscribeUser(userId, endpoint);
  return res.json({
    ok: true,
    subscriptionCount: result.subscriptionCount,
  });
}

function updateNotificationPreferencesAction(req, res) {
  const userId = req.session.user.id;
  const preferences = updateUserPreferences(userId, req.body || {});
  return res.json({
    ok: true,
    preferences,
  });
}

async function sendTestNotificationAction(req, res) {
  const userId = req.session.user.id;
  const type = req.body?.type === "prayer" ? "prayer" : "motivation";
  const stamp = Date.now();
  const payload =
    type === "prayer"
      ? {
          title: "Test Pengingat Waktu Shalat",
          body: "Ini notifikasi test. Kalau ini muncul, push notification perangkatmu sudah aktif.",
          url: "/dashboard",
          tag: `test-prayer-${stamp}`,
        }
      : {
          title: "Test Motivasi Harian",
          body: "Notifikasi penyemangat berhasil aktif. InsyaAllah konsisten hari ini.",
          url: "/dashboard",
          tag: `test-motivation-${stamp}`,
        };

  const result = await sendNotificationToUser(userId, payload);
  if (!result.ok) {
    return res.status(503).json({
      ok: false,
      message: result.reason || "Push notification belum aktif.",
      attempted: result.attempted || 0,
      sent: result.sent || 0,
      failed: result.failed || 0,
      failures: result.failures || [],
    });
  }

  return res.json({
    ok: true,
    attempted: result.attempted || 0,
    sent: result.sent,
    failed: result.failed || 0,
    failures: result.failures || [],
  });
}

module.exports = {
  getPublicPushKeyAction,
  getNotificationStateAction,
  subscribeNotificationAction,
  unsubscribeNotificationAction,
  updateNotificationPreferencesAction,
  sendTestNotificationAction,
};

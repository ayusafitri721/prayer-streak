const fs = require("fs");
const path = require("path");

const PRAYER_LABELS = {
  shubuh: "Shubuh",
  dzuhur: "Dzuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya",
};

const DEFAULT_PREFERENCES = {
  prayerEnabled: true,
  motivationEnabled: true,
  motivationHour: 7,
  motivationMinute: 0,
  prayerReminderMinutes: 10,
  timezoneOffsetMinutes: 0,
};

const FALLBACK_PRAYER_TIMES = {
  shubuh: "04:45",
  dzuhur: "11:55",
  ashar: "15:20",
  maghrib: "18:05",
  isya: "19:55",
};

const MOTIVATION_MESSAGES = [
  {
    title: "Pengingat Pagi",
    body: "Mulai hari ini dengan dzikir ringan. Sedikit tapi konsisten itu bernilai.",
  },
  {
    title: "Semangat Ibadah Hari Ini",
    body: "Jaga salat tepat waktu. Satu waktu yang dijaga hari ini bisa menguatkan semuanya.",
  },
  {
    title: "Ayat Penyemangat",
    body: "\"Fa inna ma'al usri yusra\" - bersama kesulitan ada kemudahan.",
  },
  {
    title: "Hadis Harian",
    body: "Amalan yang paling dicintai Allah adalah yang kontinu walau sedikit.",
  },
];

let webPush = null;
let webPushDisabledReason = "";
let vapidDetails = null;
let schedulerTimer = null;
const vapidFilePath =
  process.env.PUSH_VAPID_FILE ||
  path.join(process.cwd(), ".runtime", "push-vapid-keys.json");

const subscriptionsByUser = new Map();
const preferencesByUser = new Map();
const sentNotificationCache = new Map();

function tryLoadWebPush() {
  if (webPush || webPushDisabledReason) return webPush;

  try {
    webPush = require("web-push");
    return webPush;
  } catch (error) {
    webPushDisabledReason =
      "Paket web-push belum terpasang. Jalankan: npm install web-push";
    return null;
  }
}

function ensureVapidDetails() {
  const library = tryLoadWebPush();
  if (!library) return null;
  if (vapidDetails) return vapidDetails;

  const subject = process.env.PUSH_VAPID_SUBJECT || "mailto:admin@prayerstreak.app";
  const publicKey = process.env.PUSH_VAPID_PUBLIC_KEY || "";
  const privateKey = process.env.PUSH_VAPID_PRIVATE_KEY || "";

  if (publicKey && privateKey) {
    vapidDetails = { subject, publicKey, privateKey };
  } else {
    try {
      const raw = fs.readFileSync(vapidFilePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed?.publicKey && parsed?.privateKey) {
        vapidDetails = {
          subject: parsed.subject || subject,
          publicKey: parsed.publicKey,
          privateKey: parsed.privateKey,
        };
      }
    } catch {}

    if (!vapidDetails) {
      vapidDetails = {
        subject,
        ...library.generateVAPIDKeys(),
      };

      try {
        fs.mkdirSync(path.dirname(vapidFilePath), { recursive: true });
        fs.writeFileSync(
          vapidFilePath,
          JSON.stringify(vapidDetails, null, 2),
          "utf8"
        );
        console.warn(
          `[push] VAPID key disimpan otomatis di ${vapidFilePath}.`
        );
      } catch (error) {
        console.warn(
          `[push] Gagal simpan VAPID key ke file (${vapidFilePath}). Push key bisa berubah saat restart.`
        );
      }
    }
  }

  library.setVapidDetails(vapidDetails.subject, vapidDetails.publicKey, vapidDetails.privateKey);
  return vapidDetails;
}

function getPushStatus() {
  const details = ensureVapidDetails();
  if (!details) {
    return {
      enabled: false,
      reason: webPushDisabledReason || "Web Push tidak aktif.",
      publicKey: null,
    };
  }

  return {
    enabled: true,
    reason: null,
    publicKey: details.publicKey,
  };
}

function sanitizePreferences(input = {}) {
  const hour = Number(input.motivationHour);
  const minute = Number(input.motivationMinute);
  const reminder = Number(input.prayerReminderMinutes);
  const offset = Number(input.timezoneOffsetMinutes);

  return {
    prayerEnabled:
      typeof input.prayerEnabled === "boolean"
        ? input.prayerEnabled
        : DEFAULT_PREFERENCES.prayerEnabled,
    motivationEnabled:
      typeof input.motivationEnabled === "boolean"
        ? input.motivationEnabled
        : DEFAULT_PREFERENCES.motivationEnabled,
    motivationHour: Number.isInteger(hour) && hour >= 0 && hour <= 23
      ? hour
      : DEFAULT_PREFERENCES.motivationHour,
    motivationMinute: Number.isInteger(minute) && minute >= 0 && minute <= 59
      ? minute
      : DEFAULT_PREFERENCES.motivationMinute,
    prayerReminderMinutes: Number.isInteger(reminder) && reminder >= 0 && reminder <= 45
      ? reminder
      : DEFAULT_PREFERENCES.prayerReminderMinutes,
    timezoneOffsetMinutes: Number.isInteger(offset) && offset >= -840 && offset <= 840
      ? offset
      : DEFAULT_PREFERENCES.timezoneOffsetMinutes,
  };
}

function getUserPreferences(userId) {
  const id = Number(userId);
  const existing = preferencesByUser.get(id);
  if (existing) return existing;

  const defaults = { ...DEFAULT_PREFERENCES };
  preferencesByUser.set(id, defaults);
  return defaults;
}

function updateUserPreferences(userId, patch = {}) {
  const id = Number(userId);
  const merged = sanitizePreferences({
    ...getUserPreferences(id),
    ...patch,
  });
  preferencesByUser.set(id, merged);
  return merged;
}

function getUserSubscriptions(userId) {
  const id = Number(userId);
  const existing = subscriptionsByUser.get(id);
  if (existing) return existing;

  const subscriptions = new Map();
  subscriptionsByUser.set(id, subscriptions);
  return subscriptions;
}

function normalizeSubscriptionPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const endpoint = payload.endpoint;
  const keys = payload.keys || {};
  const auth = keys.auth;
  const p256dh = keys.p256dh;

  if (!endpoint || !auth || !p256dh) return null;
  return {
    endpoint: String(endpoint),
    keys: {
      auth: String(auth),
      p256dh: String(p256dh),
    },
  };
}

function subscribeUser(userId, subscription, metadata = {}) {
  const id = Number(userId);
  const normalized = normalizeSubscriptionPayload(subscription);
  if (!normalized) {
    return {
      ok: false,
      message: "Payload subscription tidak valid.",
    };
  }

  const userSubscriptions = getUserSubscriptions(id);
  userSubscriptions.set(normalized.endpoint, {
    subscription: normalized,
    createdAt: new Date().toISOString(),
    metadata: {
      userAgent: metadata.userAgent || "",
      timezoneOffsetMinutes: Number(metadata.timezoneOffsetMinutes || 0),
      locale: metadata.locale || "id-ID",
    },
  });

  updateUserPreferences(id, {
    timezoneOffsetMinutes: Number(metadata.timezoneOffsetMinutes || 0),
  });

  return {
    ok: true,
    subscriptionCount: userSubscriptions.size,
  };
}

function unsubscribeUser(userId, endpoint = null) {
  const id = Number(userId);
  const userSubscriptions = getUserSubscriptions(id);

  if (endpoint) {
    userSubscriptions.delete(String(endpoint));
  } else {
    userSubscriptions.clear();
  }

  return {
    ok: true,
    subscriptionCount: userSubscriptions.size,
  };
}

function getUserNotificationState(userId) {
  const status = getPushStatus();
  const subscriptions = getUserSubscriptions(userId);
  return {
    enabled: status.enabled,
    reason: status.reason,
    subscribed: subscriptions.size > 0,
    subscriptionCount: subscriptions.size,
    preferences: getUserPreferences(userId),
  };
}

async function sendNotificationToUser(userId, payload = {}) {
  const status = getPushStatus();
  if (!status.enabled) {
    return {
      ok: false,
      reason: status.reason,
      sent: 0,
    };
  }

  const library = tryLoadWebPush();
  const subscriptions = getUserSubscriptions(userId);
  if (!subscriptions.size) {
    return {
      ok: true,
      attempted: 0,
      sent: 0,
      failed: 0,
      failures: [],
    };
  }

  let sent = 0;
  let failed = 0;
  const staleEndpoints = [];
  const failures = [];
  const message = JSON.stringify({
    title: payload.title || "Prayer Streak",
    body: payload.body || "",
    url: payload.url || "/dashboard",
    tag: payload.tag || "prayer-streak-alert",
  });

  for (const [endpoint, item] of subscriptions.entries()) {
    try {
      await library.sendNotification(item.subscription, message, { TTL: 120 });
      sent += 1;
    } catch (error) {
      const statusCode = Number(error?.statusCode || 0);
      failed += 1;
      failures.push({
        endpoint,
        statusCode: statusCode || null,
        message: error?.message || "Unknown push error",
      });
      if (statusCode === 404 || statusCode === 410) {
        staleEndpoints.push(endpoint);
      } else {
        console.warn(`[push] gagal kirim endpoint ${endpoint}: ${error?.message || error}`);
      }
    }
  }

  staleEndpoints.forEach((endpoint) => subscriptions.delete(endpoint));

  if (sent === 0 && failed > 0) {
    return {
      ok: false,
      reason: failures[0]?.message || "Semua endpoint gagal dikirim.",
      attempted: subscriptions.size + staleEndpoints.length,
      sent,
      failed,
      failures,
    };
  }

  return {
    ok: true,
    attempted: subscriptions.size + staleEndpoints.length,
    sent,
    failed,
    failures,
  };
}

function parseClockToMinutes(value) {
  const [hoursRaw, minutesRaw] = String(value || "").split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  return hours * 60 + minutes;
}

function getLocalDateFromOffset(now, timezoneOffsetMinutes) {
  return new Date(now.getTime() - timezoneOffsetMinutes * 60 * 1000);
}

function buildDateKeyUtc(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function randomMotivationMessage() {
  const index = Math.floor(Math.random() * MOTIVATION_MESSAGES.length);
  return MOTIVATION_MESSAGES[index];
}

function shouldSendKey(key) {
  const now = Date.now();
  const existing = sentNotificationCache.get(key);
  if (existing && now - existing < 50 * 60 * 1000) {
    return false;
  }

  sentNotificationCache.set(key, now);

  for (const [cacheKey, time] of sentNotificationCache.entries()) {
    if (now - time > 1000 * 60 * 60 * 36) {
      sentNotificationCache.delete(cacheKey);
    }
  }

  return true;
}

async function runSchedulerTick({
  getActiveUserIds,
  getPrayerSchedule,
} = {}) {
  const status = getPushStatus();
  if (!status.enabled) return;
  if (typeof getActiveUserIds !== "function" || typeof getPrayerSchedule !== "function") return;

  const userIds = await getActiveUserIds();
  if (!Array.isArray(userIds) || !userIds.length) return;

  const now = new Date();
  const schedule = await getPrayerSchedule(now, null).catch(() => ({ times: FALLBACK_PRAYER_TIMES }));
  const prayerTimes = schedule?.times || FALLBACK_PRAYER_TIMES;

  for (const userId of userIds) {
    const subscriptionCount = getUserSubscriptions(userId).size;
    if (!subscriptionCount) continue;

    const prefs = getUserPreferences(userId);
    const userLocal = getLocalDateFromOffset(now, prefs.timezoneOffsetMinutes);
    const dateKey = buildDateKeyUtc(userLocal);
    const localHour = userLocal.getUTCHours();
    const localMinute = userLocal.getUTCMinutes();
    const minuteOfDay = localHour * 60 + localMinute;

    if (prefs.motivationEnabled) {
      const motivationKey = `motivation:${userId}:${dateKey}:${prefs.motivationHour}:${prefs.motivationMinute}`;
      if (
        localHour === prefs.motivationHour &&
        localMinute === prefs.motivationMinute &&
        shouldSendKey(motivationKey)
      ) {
        const motivation = randomMotivationMessage();
        await sendNotificationToUser(userId, {
          title: motivation.title,
          body: motivation.body,
          url: "/dashboard",
          tag: `motivation-${dateKey}`,
        });
      }
    }

    if (!prefs.prayerEnabled) continue;

    for (const [key, time] of Object.entries(prayerTimes)) {
      const prayerMinute = parseClockToMinutes(time);
      if (prayerMinute == null) continue;

      const reminderMinute = prayerMinute - prefs.prayerReminderMinutes;
      const reminderKey = `prayer-reminder:${userId}:${dateKey}:${key}`;
      const startKey = `prayer-start:${userId}:${dateKey}:${key}`;

      if (minuteOfDay === reminderMinute && shouldSendKey(reminderKey)) {
        await sendNotificationToUser(userId, {
          title: `Sebentar lagi ${PRAYER_LABELS[key] || key}`,
          body: `${prefs.prayerReminderMinutes} menit lagi masuk waktu ${PRAYER_LABELS[key] || key}.`,
          url: "/dashboard",
          tag: `prayer-${key}-reminder`,
        });
      }

      if (minuteOfDay === prayerMinute && shouldSendKey(startKey)) {
        await sendNotificationToUser(userId, {
          title: `Waktu ${PRAYER_LABELS[key] || key}`,
          body: `Sudah masuk waktu ${PRAYER_LABELS[key] || key}. Yuk lanjutkan checklist salat.`,
          url: "/dashboard",
          tag: `prayer-${key}-start`,
        });
      }
    }
  }
}

function startNotificationScheduler(options = {}) {
  if (schedulerTimer) return;
  schedulerTimer = setInterval(() => {
    runSchedulerTick(options).catch((error) => {
      console.error("[push] scheduler error:", error?.message || error);
    });
  }, 30 * 1000);
}

module.exports = {
  getPushStatus,
  getUserNotificationState,
  subscribeUser,
  unsubscribeUser,
  updateUserPreferences,
  sendNotificationToUser,
  startNotificationScheduler,
};

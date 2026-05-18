const axios = require("axios");
const prisma = require("../utils/prisma");

const FARDHU_PRAYER_KEYS = ["shubuh", "dzuhur", "ashar", "maghrib", "isya"];
const SUNNAH_PRAYER_KEYS = ["qabliyah_subuh", "dhuha", "ba_diyah_dzuhur", "witir", "tahajud"];
const ALL_PRAYER_KEYS = [...FARDHU_PRAYER_KEYS, ...SUNNAH_PRAYER_KEYS];
const PRAYER_LABELS = {
  shubuh: "Shubuh",
  dzuhur: "Dzuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya",
  qabliyah_subuh: "Qabliyah Subuh",
  dhuha: "Dhuha",
  ba_diyah_dzuhur: "Ba'diyah Dzuhur",
  witir: "Witir",
  tahajud: "Tahajud",
};
const SUNNAH_PRAYER_META = {
  qabliyah_subuh: {
    time: "04:20",
    note: "Sebelum Subuh",
  },
  dhuha: {
    time: "08:00",
    note: "Setelah matahari naik",
  },
  ba_diyah_dzuhur: {
    time: "12:20",
    note: "Setelah Dzuhur",
  },
  witir: {
    time: "20:15",
    note: "Setelah Isya",
  },
  tahajud: {
    time: "03:30",
    note: "Sepertiga malam terakhir",
  },
};
const DEFAULT_PRAYER_TIMES = {
  imsak: "04:35",
  shubuh: "04:45",
  dzuhur: "11:55",
  ashar: "15:20",
  maghrib: "18:05",
  isya: "19:55",
};
const PRAYER_API_BASE_URL = process.env.PRAYER_API_BASE_URL || "https://equran.id/api/v2";
const PRAYER_PROVINCE = process.env.PRAYER_PROVINCE || "DKI Jakarta";
const PRAYER_KABKOTA = process.env.PRAYER_KABKOTA || "Kota Jakarta";
const PRAYER_API_DOCS_URL = "https://equran.id/apidev/shalat";
const PRAYER_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const prayerApi = axios.create({
  baseURL: PRAYER_API_BASE_URL,
  timeout: 10000,
});

const XP_PER_PRAYER = 10;
const XP_PER_SUNNAH_PRAYER = 3;
const MAX_SUNNAH_XP_PER_DAY = 15;
const DAILY_BONUS_XP = 25;
const MAX_STREAK_PROTECTION = 3;
const RESTORE_CHALLENGE_TARGET = 3;
const ON_TIME_GRACE_MINUTES = 30;

const achievementsSeed = [
  { slug: "first-step", name: "First Step", description: "Checklist salat pertama" },
  { slug: "full-day", name: "Full Day", description: "Menyelesaikan 5 salat dalam sehari" },
  { slug: "streak-3", name: "3 Days Streak", description: "Mendapat streak selama 3 hari" },
  { slug: "streak-7", name: "7 Days Consistent", description: "Mendapat streak selama 7 hari" },
  { slug: "streak-30", name: "30 Days Journey", description: "Mendapat streak selama 30 hari" },
  { slug: "level-5", name: "Level 5 Reached", description: "Mencapai level 5" },
];

const prayerScheduleCache = new Map();

function toDateString(date) {
  if (!(date instanceof Date)) {
    return String(date).split("T")[0];
  }

  return formatLocalDateKey(date);
}

function formatLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocationConfig(locationOverride = null) {
  if (locationOverride?.provinsi && locationOverride?.kabkota) {
    return {
      provinsi: locationOverride.provinsi,
      kabkota: locationOverride.kabkota,
      sourceType: "browser",
    };
  }

  return {
    provinsi: PRAYER_PROVINCE,
    kabkota: PRAYER_KABKOTA,
    sourceType: "fallback",
  };
}

function getPrayerCacheKey(date = new Date(), locationOverride = null) {
  const location = getLocationConfig(locationOverride);
  return `${location.provinsi}::${location.kabkota}::${date.getFullYear()}-${date.getMonth() + 1}`;
}

function dateKeyToDbDate(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function formatPrayerLogTime(date) {
  if (!date) return null;

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countCompletedByKeys(dayLogs = {}, keys = FARDHU_PRAYER_KEYS) {
  return keys.reduce((total, key) => total + (dayLogs?.[key] ? 1 : 0), 0);
}

function pickPrayerState(dayLogs = {}, keys = FARDHU_PRAYER_KEYS) {
  return keys.reduce((result, key) => {
    result[key] = dayLogs?.[key] || null;
    return result;
  }, {});
}

function getInitialState() {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    logsByDate: new Map(),
    onTimeByDate: new Map(),
    achievements: new Set(),
    unlockedAt: new Map(),
    xpByDate: new Map(),
    lastFullDayDate: null,
    latestAchievement: null,
    streakProtection: MAX_STREAK_PROTECTION,
    restoreChallengeActive: false,
    restoreChallengeProgress: 0,
    restoreChallengeTarget: RESTORE_CHALLENGE_TARGET,
    restoreReflectionDone: false,
  };
}

function nextDateString(dateString) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split("T")[0];
}

function startOfTodayKey() {
  return formatLocalDateKey(new Date());
}

function daysBetweenDateKeys(startDateKey, endDateKey) {
  const days = [];
  let cursor = startDateKey;

  while (cursor <= endDateKey) {
    days.push(cursor);
    cursor = nextDateString(cursor);
  }

  return days;
}

function buildStateFromLogs(logs, streakDays = [], user = null) {
  const state = getInitialState();

  logs.forEach((log) => {
    const dateKey = toDateString(log.date);
    const dayLogs = state.logsByDate.get(dateKey) || {};
    dayLogs[log.prayerType] = formatPrayerLogTime(log.prayedAt) || "Tercatat";
    state.logsByDate.set(dateKey, dayLogs);
    if (log.isOnTime) {
      const onTimeLogs = state.onTimeByDate.get(dateKey) || {};
      onTimeLogs[log.prayerType] = true;
      state.onTimeByDate.set(dateKey, onTimeLogs);
    }
    const dayXp = state.xpByDate.get(dateKey) || { total: 0, fardhu: 0, sunnah: 0 };
    let earnedXp = log.xpEarned || XP_PER_PRAYER;

    if (SUNNAH_PRAYER_KEYS.includes(log.prayerType)) {
      const remainingSunnahXp = Math.max(MAX_SUNNAH_XP_PER_DAY - dayXp.sunnah, 0);
      earnedXp = Math.min(XP_PER_SUNNAH_PRAYER, remainingSunnahXp);
    }

    dayXp.total += earnedXp;
    if (FARDHU_PRAYER_KEYS.includes(log.prayerType)) {
      dayXp.fardhu += earnedXp;
    } else if (SUNNAH_PRAYER_KEYS.includes(log.prayerType)) {
      dayXp.sunnah += earnedXp;
    }
    state.xpByDate.set(dateKey, dayXp);
    state.xp += earnedXp;
  });

  const fullDates = Array.from(state.logsByDate.entries())
    .filter(([, dayLogs]) => countCompletedByKeys(dayLogs, FARDHU_PRAYER_KEYS) >= FARDHU_PRAYER_KEYS.length)
    .map(([dateKey]) => dateKey)
    .sort();
  const protectedDates = streakDays
    .filter((day) => day.status === "PROTECTED")
    .map((day) => toDateString(day.date))
    .sort();
  const streakEligibleDates = Array.from(new Set([...fullDates, ...protectedDates])).sort();

  state.lastFullDayDate = fullDates.at(-1) || null;
  state.streakProtection = user?.streakProtection ?? MAX_STREAK_PROTECTION;
  state.restoreChallengeActive = Boolean(user?.restoreChallengeActive);
  state.restoreChallengeProgress = user?.restoreChallengeProgress ?? 0;
  state.restoreChallengeTarget = RESTORE_CHALLENGE_TARGET;
  state.restoreReflectionDone =
    Boolean(user?.restoreReflectionDone) &&
    user?.restoreReflectionDate &&
    toDateString(user.restoreReflectionDate) === startOfTodayKey();

  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate = null;

  streakEligibleDates.forEach((dateKey) => {
    if (previousDate && nextDateString(previousDate) === dateKey) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }

    longestStreak = Math.max(longestStreak, runningStreak);
    previousDate = dateKey;
  });

  state.longestStreak = longestStreak;

  const lastStreakDate = streakEligibleDates.at(-1) || null;

  if (lastStreakDate) {
    const today = formatLocalDateKey(new Date());
    const yesterday = prevDateString(today);

    if (lastStreakDate === today || lastStreakDate === yesterday) {
      let streak = 0;
      let cursor = lastStreakDate;
      const streakDateSet = new Set(streakEligibleDates);

      while (streakDateSet.has(cursor)) {
        streak += 1;
        cursor = prevDateString(cursor);
      }

      state.streak = streak;
    }
  }

  state.level = computeLevel(state.xp);
  updateAchievements(state);

  return state;
}

async function evaluateStreakDays(userId) {
  const id = Number(userId);
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      streakProtection: true,
      restoreChallengeActive: true,
      restoreChallengeProgress: true,
      restoreReflectionDone: true,
      restoreReflectionDate: true,
      lastStreakEvaluatedDate: true,
    },
  });

  if (!user) return;

  const todayKey = startOfTodayKey();
  const yesterdayKey = prevDateString(todayKey);

  if (user.lastStreakEvaluatedDate && toDateString(user.lastStreakEvaluatedDate) >= yesterdayKey) {
    return;
  }

  const firstLog = await prisma.prayerLog.findFirst({
    where: {
      userId: id,
      status: true,
    },
    orderBy: { date: "asc" },
    select: { date: true },
  });

  if (!firstLog) {
    await prisma.user.update({
      where: { id },
      data: { lastStreakEvaluatedDate: dateKeyToDbDate(yesterdayKey) },
    });
    return;
  }

  const startDateKey = user.lastStreakEvaluatedDate
    ? nextDateString(toDateString(user.lastStreakEvaluatedDate))
    : toDateString(firstLog.date);
  const daysToEvaluate = daysBetweenDateKeys(startDateKey, yesterdayKey);

  let protection = user.streakProtection;
  let restoreActive = user.restoreChallengeActive;
  let restoreProgress = user.restoreChallengeProgress;
  let restoreReflectionDone = user.restoreReflectionDone;
  let restoreReflectionDate = user.restoreReflectionDate ? toDateString(user.restoreReflectionDate) : null;

  for (const dateKey of daysToEvaluate) {
    const existing = await prisma.streakDay.findUnique({
      where: {
        userId_date: {
          userId: id,
          date: dateKeyToDbDate(dateKey),
        },
      },
    });

    if (existing) continue;

    const completedCount = await prisma.prayerLog.count({
      where: {
        userId: id,
        status: true,
        date: dateKeyToDbDate(dateKey),
        prayerType: {
          in: FARDHU_PRAYER_KEYS,
        },
      },
    });
    const onTimeCount = await prisma.prayerLog.count({
      where: {
        userId: id,
        status: true,
        isOnTime: true,
        date: dateKeyToDbDate(dateKey),
        prayerType: {
          in: FARDHU_PRAYER_KEYS,
        },
      },
    });
    const reflectionDoneForDay = restoreReflectionDone && restoreReflectionDate === dateKey;

    let status = "BROKEN";
    let protectionUsed = false;

    if (
      restoreActive &&
      completedCount >= FARDHU_PRAYER_KEYS.length &&
      onTimeCount >= 3 &&
      reflectionDoneForDay
    ) {
      status = "FULL";
      protection = Math.min(MAX_STREAK_PROTECTION, protection + 1);
      restoreActive = false;
      restoreProgress = RESTORE_CHALLENGE_TARGET;
      restoreReflectionDone = false;
      restoreReflectionDate = null;
    } else if (restoreActive) {
      status = "BROKEN";
      restoreActive = false;
      restoreProgress = 0;
      restoreReflectionDone = false;
      restoreReflectionDate = null;
    } else if (completedCount >= FARDHU_PRAYER_KEYS.length) {
      status = "FULL";
    } else if (completedCount === FARDHU_PRAYER_KEYS.length - 1 && protection > 0 && !restoreActive) {
      status = "PROTECTED";
      protection -= 1;
      protectionUsed = true;

      if (protection === 0) {
        restoreActive = true;
        restoreProgress = 0;
      }
    } else {
      status = "BROKEN";
      restoreActive = false;
      restoreProgress = 0;
    }

    await prisma.streakDay.create({
      data: {
        userId: id,
        date: dateKeyToDbDate(dateKey),
        completedCount,
        status,
        protectionUsed,
        restoreProgressAfter: restoreProgress,
      },
    });
  }

  await prisma.user.update({
    where: { id },
    data: {
      streakProtection: protection,
      restoreChallengeActive: restoreActive,
      restoreChallengeProgress: restoreProgress,
      restoreReflectionDone,
      restoreReflectionDate: restoreReflectionDate ? dateKeyToDbDate(restoreReflectionDate) : null,
      lastStreakEvaluatedDate: dateKeyToDbDate(yesterdayKey),
    },
  });
}

async function getUserState(userId) {
  await evaluateStreakDays(userId);

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      streakProtection: true,
      restoreChallengeActive: true,
      restoreChallengeProgress: true,
      restoreReflectionDone: true,
      restoreReflectionDate: true,
    },
  });
  const logs = await prisma.prayerLog.findMany({
    where: {
      userId: Number(userId),
      status: true,
    },
    orderBy: [{ date: "asc" }, { prayedAt: "asc" }],
  });
  const streakDays = await prisma.streakDay.findMany({
    where: {
      userId: Number(userId),
    },
    orderBy: { date: "asc" },
  });

  return buildStateFromLogs(logs, streakDays, user);
}

function prevDateString(dateString) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().split("T")[0];
}

function timeToMinutes(time) {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function getCurrentMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

function getFallbackPrayerSchedule(date = new Date(), reason = null, locationOverride = null) {
  const location = getLocationConfig(locationOverride);
  return {
    dateKey: formatLocalDateKey(date),
    locationLabel: `${location.kabkota}, ${location.provinsi}`,
    sourceName: "Jadwal default aplikasi",
    sourceUrl: PRAYER_API_DOCS_URL,
    warning: reason,
    locationSourceType: location.sourceType,
    times: { ...DEFAULT_PRAYER_TIMES },
  };
}

function resolveImsakTime(entry = {}) {
  const imsak = String(entry.imsak || "").trim();
  if (/^\d{1,2}:\d{2}$/.test(imsak)) {
    return imsak;
  }

  const subuh = String(entry.subuh || "").trim();
  if (!/^\d{1,2}:\d{2}$/.test(subuh)) {
    return DEFAULT_PRAYER_TIMES.imsak;
  }

  const [hoursRaw, minutesRaw] = subuh.split(":").map(Number);
  const totalSubuhMinutes = hoursRaw * 60 + minutesRaw;
  const totalImsakMinutes = Math.max(totalSubuhMinutes - 10, 0);
  const imsakHours = String(Math.floor(totalImsakMinutes / 60)).padStart(2, "0");
  const imsakMinutes = String(totalImsakMinutes % 60).padStart(2, "0");
  return `${imsakHours}:${imsakMinutes}`;
}

function normalizePrayerScheduleEntry(entry, date = new Date(), metadata = {}) {
  return {
    dateKey: entry.tanggal_lengkap || formatLocalDateKey(date),
    locationLabel: [metadata.kabkota, metadata.provinsi].filter(Boolean).join(", "),
    sourceName: "EQuran Shalat API",
    sourceUrl: PRAYER_API_DOCS_URL,
    warning: null,
    times: {
      imsak: resolveImsakTime(entry),
      shubuh: entry.subuh || DEFAULT_PRAYER_TIMES.shubuh,
      dzuhur: entry.dzuhur || DEFAULT_PRAYER_TIMES.dzuhur,
      ashar: entry.ashar || DEFAULT_PRAYER_TIMES.ashar,
      maghrib: entry.maghrib || DEFAULT_PRAYER_TIMES.maghrib,
      isya: entry.isya || DEFAULT_PRAYER_TIMES.isya,
    },
  };
}

async function fetchMonthlyPrayerSchedulesForLocation(date = new Date(), locationOverride = null) {
  const location = getLocationConfig(locationOverride);
  const cacheKey = getPrayerCacheKey(date, location);
  const cached = prayerScheduleCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < PRAYER_CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await prayerApi.post("/shalat", {
    provinsi: location.provinsi,
    kabkota: location.kabkota,
    bulan: date.getMonth() + 1,
    tahun: date.getFullYear(),
  });

  const payload = response.data?.data;
  const jadwal = payload?.jadwal;

  if (!payload || !Array.isArray(jadwal) || !jadwal.length) {
    throw new Error("Prayer schedule API returned an invalid response.");
  }

  const normalized = jadwal.map((entry) => ({
    ...normalizePrayerScheduleEntry(entry, date, payload),
    locationSourceType: location.sourceType,
  }));

  prayerScheduleCache.set(cacheKey, {
    fetchedAt: now,
    data: normalized,
  });

  return normalized;
}

async function getPrayerScheduleForDate(date = new Date(), locationOverride = null) {
  try {
    const schedules = await fetchMonthlyPrayerSchedulesForLocation(date, locationOverride);
    const dateKey = formatLocalDateKey(date);
    const exactMatch = schedules.find((entry) => entry.dateKey === dateKey);

    if (exactMatch) {
      return exactMatch;
    }

    return getFallbackPrayerSchedule(
      date,
      "Jadwal salat harian tidak ditemukan untuk tanggal ini.",
      locationOverride
    );
  } catch (error) {
    return getFallbackPrayerSchedule(
      date,
      "Jadwal salat dari EQuran sedang tidak tersedia. Aplikasi memakai jadwal cadangan.",
      locationOverride
    );
  }
}

function canCompletePrayerWithSchedule(prayer, schedule, date = new Date()) {
  return getCurrentMinutes(date) >= timeToMinutes(schedule.times[prayer]);
}

function isPrayerOnTimeWithSchedule(prayer, schedule, date = new Date()) {
  const currentMinutes = getCurrentMinutes(date);
  const prayerMinutes = timeToMinutes(schedule.times[prayer]);
  return currentMinutes >= prayerMinutes && currentMinutes <= prayerMinutes + ON_TIME_GRACE_MINUTES;
}

function buildRestoreChallengeTasks(state, today) {
  const todayLogs = state.logsByDate.get(today) || {};
  const onTimeLogs = state.onTimeByDate.get(today) || {};
  const completedCount = countCompletedByKeys(todayLogs, FARDHU_PRAYER_KEYS);
  const onTimeCount = countCompletedByKeys(onTimeLogs, FARDHU_PRAYER_KEYS);
  const reflectionDone = state.restoreReflectionDone;

  return {
    completedCount,
    onTimeCount,
    reflectionDone,
    fullDayDone: completedCount >= FARDHU_PRAYER_KEYS.length,
    onTimeDone: onTimeCount >= 3,
    progress: [completedCount >= FARDHU_PRAYER_KEYS.length, onTimeCount >= 3, reflectionDone].filter(Boolean).length,
    target: RESTORE_CHALLENGE_TARGET,
  };
}

async function tryCompleteRestoreChallengeToday(userId) {
  const id = Number(userId);
  const state = await getUserState(id);

  if (!state.restoreChallengeActive) {
    return state;
  }

  const today = startOfTodayKey();
  const tasks = buildRestoreChallengeTasks(state, today);

  if (!tasks.fullDayDone || !tasks.onTimeDone || !tasks.reflectionDone) {
    await prisma.user.update({
      where: { id },
      data: {
        restoreChallengeProgress: tasks.progress,
      },
    });
    return state;
  }

  await prisma.user.update({
    where: { id },
    data: {
      streakProtection: Math.min(MAX_STREAK_PROTECTION, state.streakProtection + 1),
      restoreChallengeActive: false,
      restoreChallengeProgress: 0,
      restoreReflectionDone: false,
      restoreReflectionDate: null,
    },
  });

  return getUserState(id);
}

async function getNextPrayer(date = new Date(), todaySchedule = null, locationOverride = null) {
  const activeSchedule = todaySchedule || (await getPrayerScheduleForDate(date, locationOverride));
  const totalMinutes = getCurrentMinutes(date);
  const nextPrayerKey = FARDHU_PRAYER_KEYS.find(
    (key) => totalMinutes < timeToMinutes(activeSchedule.times[key])
  );

  if (nextPrayerKey) {
    return {
      name: PRAYER_LABELS[nextPrayerKey],
      time: activeSchedule.times[nextPrayerKey],
      isTomorrow: false,
      locationLabel: activeSchedule.locationLabel,
      locationSourceType: activeSchedule.locationSourceType,
      sourceName: activeSchedule.sourceName,
      sourceUrl: activeSchedule.sourceUrl,
    };
  }

  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);
  const tomorrowSchedule = await getPrayerScheduleForDate(tomorrow, locationOverride);

  return {
    name: PRAYER_LABELS.shubuh,
    time: tomorrowSchedule.times.shubuh,
    isTomorrow: true,
    locationLabel: tomorrowSchedule.locationLabel,
    locationSourceType: tomorrowSchedule.locationSourceType,
    sourceName: tomorrowSchedule.sourceName,
    sourceUrl: tomorrowSchedule.sourceUrl,
  };
}

function buildPrayerTimelineEntries(schedule, isTomorrow = false) {
  return FARDHU_PRAYER_KEYS.map((key) => ({
    key,
    label: PRAYER_LABELS[key],
    time: schedule.times[key],
    dateKey: schedule.dateKey,
    isTomorrow,
  }));
}

function buildImsakReminderEntries(schedule) {
  if (!schedule?.dateKey || !schedule?.times?.imsak) {
    return [];
  }

  const [imsakHour, imsakMinute] = String(schedule.times.imsak).split(":").map(Number);
  if (!Number.isInteger(imsakHour) || !Number.isInteger(imsakMinute)) {
    return [];
  }

  return [10, 5]
    .map((minutesBefore) => {
      const totalMinutes = imsakHour * 60 + imsakMinute - minutesBefore;
      if (totalMinutes < 0) return null;
      const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
      const minutes = String(totalMinutes % 60).padStart(2, "0");
      return {
        key: `imsak-minus-${minutesBefore}`,
        label: "Imsak",
        time: `${hours}:${minutes}`,
        dateKey: schedule.dateKey,
        minutesBefore,
      };
    })
    .filter(Boolean);
}

function computeLevel(xp) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

function totalCompletedSalatInState(state, keys = FARDHU_PRAYER_KEYS) {
  let total = 0;
  for (const dayLogs of state.logsByDate.values()) {
    total += countCompletedByKeys(dayLogs, keys);
  }
  return total;
}

function fullCompletedDays(state) {
  let count = 0;
  for (const dayLogs of state.logsByDate.values()) {
    if (countCompletedByKeys(dayLogs, FARDHU_PRAYER_KEYS) >= FARDHU_PRAYER_KEYS.length) count += 1;
  }
  return count;
}

function countThisWeek(state) {
  const now = new Date();
  let total = 0;

  for (let i = 0; i < 7; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayKey = toDateString(day);
    const logs = state.logsByDate.get(dayKey) || {};
    total += countCompletedByKeys(logs, FARDHU_PRAYER_KEYS);
  }

  return total;
}

function countSunnahThisWeek(state) {
  const now = new Date();
  let total = 0;

  for (let i = 0; i < 7; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayKey = toDateString(day);
    const logs = state.logsByDate.get(dayKey) || {};
    total += countCompletedByKeys(logs, SUNNAH_PRAYER_KEYS);
  }

  return total;
}

function countSunnahCurrentMonth(state) {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let total = 0;

  state.logsByDate.forEach((logs, dateKey) => {
    if (dateKey.startsWith(monthPrefix)) {
      total += countCompletedByKeys(logs, SUNNAH_PRAYER_KEYS);
    }
  });

  return total;
}

function sumXpForLastDays(state, days = 7, type = "total") {
  const now = new Date();
  let total = 0;

  for (let i = 0; i < days; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayXp = state.xpByDate.get(toDateString(day));
    total += dayXp?.[type] || 0;
  }

  return total;
}

function buildWeeklyBreakdown(state) {
  const days = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);

    const dayKey = toDateString(day);
    const logs = state.logsByDate.get(dayKey) || {};
    const completed = countCompletedByKeys(logs, FARDHU_PRAYER_KEYS);

    days.push({
      date: day.toISOString(),
      label: day.toLocaleDateString("id-ID", { weekday: "short" }),
      completed,
      total: FARDHU_PRAYER_KEYS.length,
      percent: Math.round((completed / FARDHU_PRAYER_KEYS.length) * 100),
      isFull: completed >= FARDHU_PRAYER_KEYS.length,
    });
  }

  return days;
}

function buildSunnahWeeklyBreakdown(state) {
  const days = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);

    const dayKey = toDateString(day);
    const logs = state.logsByDate.get(dayKey) || {};
    const completed = countCompletedByKeys(logs, SUNNAH_PRAYER_KEYS);

    days.push({
      date: day.toISOString(),
      label: day.toLocaleDateString("id-ID", { weekday: "short" }),
      completed,
      total: SUNNAH_PRAYER_KEYS.length,
      percent: Math.round((completed / SUNNAH_PRAYER_KEYS.length) * 100),
      isFull: completed >= SUNNAH_PRAYER_KEYS.length,
    });
  }

  return days;
}

function buildThirtyDayHeatmap(state) {
  const days = [];
  const today = new Date();

  for (let offset = 29; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);

    const dayKey = toDateString(day);
    const logs = state.logsByDate.get(dayKey) || {};
    const completed = countCompletedByKeys(logs, FARDHU_PRAYER_KEYS);

    days.push({
      date: day.toISOString(),
      label: day.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      completed,
      total: FARDHU_PRAYER_KEYS.length,
      level: completed >= 5 ? "great" : completed >= 3 ? "good" : completed >= 1 ? "low" : "empty",
    });
  }

  return days;
}

function buildPrayerPerformance(state) {
  const today = new Date();

  return FARDHU_PRAYER_KEYS.map((key) => {
    let completed = 0;

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      const logs = state.logsByDate.get(toDateString(day)) || {};
      if (logs[key]) {
        completed += 1;
      }
    }

    return {
      key,
      label: PRAYER_LABELS[key],
      completed,
      total: 7,
      percent: Math.round((completed / 7) * 100),
    };
  });
}

function buildSunnahPerformance(state) {
  const today = new Date();

  return SUNNAH_PRAYER_KEYS.map((key) => {
    let completed = 0;

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      const logs = state.logsByDate.get(toDateString(day)) || {};
      if (logs[key]) {
        completed += 1;
      }
    }

    return {
      key,
      label: PRAYER_LABELS[key],
      completed,
      total: 7,
      percent: Math.round((completed / 7) * 100),
    };
  });
}

function countCurrentMonth(state) {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let total = 0;

  state.logsByDate.forEach((logs, dateKey) => {
    if (dateKey.startsWith(monthPrefix)) {
      total += countCompletedByKeys(logs, FARDHU_PRAYER_KEYS);
    }
  });

  return total;
}

function buildWeeklyAchievements(state) {
  const weeklyBreakdown = buildWeeklyBreakdown(state);
  const prayerPerformance = buildPrayerPerformance(state);
  const bestPrayer = prayerPerformance.reduce(
    (best, item) => (item.completed > best.completed ? item : best),
    { label: "Isya", completed: 0 }
  );
  const hasFullDay = weeklyBreakdown.some((day) => day.isFull);

  return [
    {
      name: "Early Bird",
      description: `${PRAYER_LABELS.shubuh} tercatat ${prayerPerformance.find((item) => item.key === "shubuh")?.completed || 0} hari`,
      meta: "Minggu ini",
      icon: "sun",
      unlocked: (prayerPerformance.find((item) => item.key === "shubuh")?.completed || 0) > 0,
    },
    {
      name: "Full Day",
      description: hasFullDay ? "Selesaikan 5 waktu" : "Belum ada hari 5/5",
      meta: hasFullDay ? "Terbuka" : "Terkunci",
      icon: "star",
      unlocked: hasFullDay,
    },
    {
      name: `Streak ${state.streak} Hari`,
      description: `${state.streak} hari berturut-turut`,
      meta: "Aktif",
      icon: "flame",
      unlocked: state.streak > 0,
    },
  ];
}

function buildWeeklyInsights(state, weeklyBreakdown, prayerPerformance) {
  const bestPrayer = prayerPerformance.reduce(
    (best, item) => (item.completed > best.completed ? item : best),
    prayerPerformance[0]
  );
  const weakestPrayer = prayerPerformance.reduce(
    (weakest, item) => (item.completed < weakest.completed ? item : weakest),
    prayerPerformance[0]
  );
  const bestDay = weeklyBreakdown.reduce(
    (best, day) => (day.completed > best.completed ? day : best),
    { label: "Belum ada", completed: 0, total: FARDHU_PRAYER_KEYS.length }
  );
  const remainingToRecord = Math.max(state.longestStreak + 1 - state.streak, 1);

  return [
    {
      type: "success",
      title: `Kamu paling konsisten di waktu ${bestPrayer.label}.`,
      description: `${bestPrayer.completed}/7 hari tercatat minggu ini.`,
    },
    {
      type: "warning",
      title: `${weakestPrayer.label} masih sering terlewat.`,
      description: "Coba pasang niat dan reminder lebih awal.",
    },
    {
      type: "info",
      title: bestDay.completed > 0 ? `${bestDay.label} jadi hari terbaikmu.` : "Mulai dari satu checklist.",
      description: bestDay.completed > 0
        ? `${bestDay.completed}/${bestDay.total} salat tercatat di hari itu.`
        : "Catat salat berikutnya dulu, nanti progress akan terbentuk.",
    },
    {
      type: "spark",
      title: `${remainingToRecord} hari lagi untuk mengejar rekor streak baru.`,
      description: "Jaga ritme harianmu pelan-pelan.",
    },
  ];
}

function updateAchievements(state) {
  const today = toDateString(new Date());
  const todayLogs = state.logsByDate.get(today) || {};
  const fullDayReached = Array.from(state.logsByDate.values()).some(
    (dayLog) => countCompletedByKeys(dayLog, FARDHU_PRAYER_KEYS) >= FARDHU_PRAYER_KEYS.length
  );

  const totalCompleted = totalCompletedSalatInState(state, ALL_PRAYER_KEYS);
  const unlockedNow = [];

  const checkAchievement = (slug, condition, name) => {
    if (condition && !state.achievements.has(slug)) {
      state.achievements.add(slug);
      state.unlockedAt.set(slug, new Date().toISOString());
      state.latestAchievement = name;
      unlockedNow.push(name);
    }
  };

  checkAchievement("first-step", totalCompleted > 0, "First Step");
  checkAchievement("full-day", fullDayReached, "Full Day");
  checkAchievement("streak-3", state.streak >= 3, "3 Days Streak");
  checkAchievement("streak-7", state.streak >= 7, "7 Days Consistent");
  checkAchievement("streak-30", state.streak >= 30, "30 Days Journey");
  checkAchievement("level-5", state.level >= 5, "Level 5 Reached");

  return unlockedNow;
}

async function getDashboardData(userId, prayerLocation = null) {
  const state = await getUserState(userId);
  const now = new Date();
  const today = toDateString(now);
  const todayLogs = state.logsByDate.get(today) || {};
  const prayerSchedule = await getPrayerScheduleForDate(now, prayerLocation);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowPrayerSchedule = await getPrayerScheduleForDate(tomorrowDate, prayerLocation);

  const todayState = pickPrayerState(todayLogs, ALL_PRAYER_KEYS);
  const todayXp = state.xpByDate.get(today) || { total: 0, fardhu: 0, sunnah: 0 };
  const restoreChallengeTasks = buildRestoreChallengeTasks(state, today);

  const todayCompleted = countCompletedByKeys(todayState, FARDHU_PRAYER_KEYS);
  const todaySunnahCompleted = countCompletedByKeys(todayState, SUNNAH_PRAYER_KEYS);
  const totalToday = FARDHU_PRAYER_KEYS.length;
  const checklist = FARDHU_PRAYER_KEYS.map((key) => ({
    key,
    label: PRAYER_LABELS[key],
    time: prayerSchedule.times[key],
    isAvailable: canCompletePrayerWithSchedule(key, prayerSchedule, now),
  }));
  const sunnahChecklist = SUNNAH_PRAYER_KEYS.map((key) => ({
    key,
    label: PRAYER_LABELS[key],
    time: SUNNAH_PRAYER_META[key]?.time || "--:--",
    note: SUNNAH_PRAYER_META[key]?.note || "Opsional",
    isAvailable: true,
    isSunnah: true,
  }));
  const prayerTimeline = [
    ...buildPrayerTimelineEntries(prayerSchedule, false),
    ...buildPrayerTimelineEntries(tomorrowPrayerSchedule, true),
  ];
  const imsakReminderTimeline = [
    ...buildImsakReminderEntries(prayerSchedule),
    ...buildImsakReminderEntries(tomorrowPrayerSchedule),
  ];

  updateAchievements(state);

  return {
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    longestStreak: state.longestStreak,
    todayCompleted,
    totalToday,
    nextPrayer: await getNextPrayer(now, prayerSchedule, prayerLocation),
    prayerTimeline,
    imsakReminderTimeline,
    checklist,
    sunnahChecklist,
    todaySunnahCompleted,
    totalSunnahToday: SUNNAH_PRAYER_KEYS.length,
    todayXp: todayXp.total,
    todayFardhuXp: todayXp.fardhu,
    todaySunnahXp: todayXp.sunnah,
    sunnahXpPerPrayer: XP_PER_SUNNAH_PRAYER,
    maxSunnahXpPerDay: MAX_SUNNAH_XP_PER_DAY,
    todayState,
    consistencyPercent: Math.round((countThisWeek(state) / (FARDHU_PRAYER_KEYS.length * 7)) * 100),
    weekCompleted: countThisWeek(state),
    fullDays: fullCompletedDays(state),
    streakActive: state.streak > 0,
    latestAchievement: state.latestAchievement,
    prayerLocationLabel: prayerSchedule.locationLabel,
    prayerLocationSourceType: prayerSchedule.locationSourceType,
    prayerTimeWarning: prayerSchedule.warning,
    prayerTimeSource: prayerSchedule.sourceName,
    prayerTimeSourceUrl: prayerSchedule.sourceUrl,
    dailyBonusXp: DAILY_BONUS_XP,
    currentLevelBase: (state.level - 1) * 100,
    nextLevelTarget: state.level * 100,
    totalCompletedSalat: totalCompletedSalatInState(state, ALL_PRAYER_KEYS),
    weeklyBreakdown: buildWeeklyBreakdown(state),
    streakProtection: state.streakProtection,
    maxStreakProtection: MAX_STREAK_PROTECTION,
    restoreChallengeActive: state.restoreChallengeActive,
    restoreChallengeProgress: state.restoreChallengeActive
      ? restoreChallengeTasks.progress
      : state.restoreChallengeProgress,
    restoreChallengeTarget: state.restoreChallengeTarget,
    restoreChallengeTasks,
  };
}

async function completePrayer(userId, prayer, prayerLocation = null) {
  if (!ALL_PRAYER_KEYS.includes(prayer)) {
    return {
      changed: false,
      message: "Jenis salat tidak valid.",
      leveledUp: false,
      latestAchievement: null,
    };
  }

  const state = await getUserState(userId);
  const isFardhuPrayer = FARDHU_PRAYER_KEYS.includes(prayer);
  const now = new Date();
  const today = toDateString(now);
  const prayerSchedule = isFardhuPrayer
    ? await getPrayerScheduleForDate(now, prayerLocation)
    : null;
  const todayLogs = state.logsByDate.get(today) || {};

  if (todayLogs[prayer]) {
    return {
      changed: false,
      message: "Salat ini sudah dicatat hari ini.",
      leveledUp: false,
      latestAchievement: state.latestAchievement,
    };
  }

  if (isFardhuPrayer && !canCompletePrayerWithSchedule(prayer, prayerSchedule, now)) {
    return {
      changed: false,
      message: `${PRAYER_LABELS[prayer]} belum bisa dicatat sebelum jam ${prayerSchedule.times[prayer]}.`,
      leveledUp: false,
      latestAchievement: state.latestAchievement,
    };
  }

  const beforeLevel = state.level;
  const completedTodayBefore = countCompletedByKeys(todayLogs, FARDHU_PRAYER_KEYS);
  const completedSunnahBefore = countCompletedByKeys(todayLogs, SUNNAH_PRAYER_KEYS);
  const sunnahXpBefore = Math.min(completedSunnahBefore * XP_PER_SUNNAH_PRAYER, MAX_SUNNAH_XP_PER_DAY);
  const sunnahXpRemaining = Math.max(MAX_SUNNAH_XP_PER_DAY - sunnahXpBefore, 0);
  const xpEarned = isFardhuPrayer
    ? XP_PER_PRAYER + (completedTodayBefore + 1 === FARDHU_PRAYER_KEYS.length ? DAILY_BONUS_XP : 0)
    : Math.min(XP_PER_SUNNAH_PRAYER, sunnahXpRemaining);
  const isOnTime = isFardhuPrayer
    ? isPrayerOnTimeWithSchedule(prayer, prayerSchedule, now)
    : false;

  try {
    const transactionSteps = [
      prisma.prayerLog.create({
        data: {
          userId: Number(userId),
          prayerType: prayer,
          date: dateKeyToDbDate(today),
          status: true,
          prayedAt: now,
          isOnTime,
          xpEarned,
        },
      }),
    ];

    if (xpEarned > 0) {
      transactionSteps.push(prisma.xPHistory.create({
        data: {
          userId: Number(userId),
          pointChange: xpEarned,
          reason:
            isFardhuPrayer && xpEarned > XP_PER_PRAYER
              ? `${PRAYER_LABELS[prayer]} selesai + bonus full day`
              : `${PRAYER_LABELS[prayer]} selesai${isFardhuPrayer ? "" : xpEarned > 0 ? " (Sunnah bonus)" : " (Sunnah tanpa XP)"}`,
          relatedDate: dateKeyToDbDate(today),
        },
      }));
    }

    await prisma.$transaction(transactionSteps);
  } catch (error) {
    if (error?.code === "P2002") {
      return {
        changed: false,
        message: "Salat ini sudah dicatat hari ini.",
        leveledUp: false,
        latestAchievement: state.latestAchievement,
      };
    }

    throw error;
  }

  const updatedState = await tryCompleteRestoreChallengeToday(userId);
  const leveledUp = updatedState.level > beforeLevel;

  return {
    changed: true,
    message: isFardhuPrayer ? "Salat berhasil dicatat." : "Salat sunnah berhasil dicatat.",
    leveledUp,
    latestAchievement: updatedState.latestAchievement,
  };
}

async function markRestoreReflection(userId) {
  const id = Number(userId);
  const state = await getUserState(id);

  if (!state.restoreChallengeActive) {
    return {
      changed: false,
      message: "Restore challenge belum aktif.",
    };
  }

  await prisma.user.update({
    where: { id },
    data: {
      restoreReflectionDone: true,
      restoreReflectionDate: dateKeyToDbDate(startOfTodayKey()),
    },
  });

  const updatedState = await tryCompleteRestoreChallengeToday(id);

  return {
    changed: true,
    message: updatedState.restoreChallengeActive
      ? "Refleksi tercatat. Lengkapi salat 5/5 dan 3 salat tepat waktu untuk restore protection."
      : "Restore challenge berhasil. Protection bertambah 1.",
  };
}

async function getStatsData(userId) {
  const state = await getUserState(userId);
  const weeklyBreakdown = buildWeeklyBreakdown(state);
  const totalThisWeek = countThisWeek(state);
  const weeklyTarget = FARDHU_PRAYER_KEYS.length * 7;
  const monthlyTotal = countCurrentMonth(state);
  const sunnahThisWeek = countSunnahThisWeek(state);
  const sunnahThisMonth = countSunnahCurrentMonth(state);
  const sunnahXpThisWeek = sumXpForLastDays(state, 7, "sunnah");
  const sunnahWeeklyBreakdown = buildSunnahWeeklyBreakdown(state);
  const sunnahPerformance = buildSunnahPerformance(state);
  const bestSunnah = sunnahPerformance.reduce(
    (best, item) => (item.completed > best.completed ? item : best),
    { label: "", completed: 0, total: 7, percent: 0 }
  );
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthlyTarget = daysInMonth * FARDHU_PRAYER_KEYS.length;
  const monthlyPercent = Math.round((monthlyTotal / monthlyTarget) * 100);
  const dailyAverage = Number((totalThisWeek / 7).toFixed(1));
  const prayerPerformance = buildPrayerPerformance(state);
  const bestDay = weeklyBreakdown.reduce(
    (best, day) => (day.completed > best.completed ? day : best),
    { label: "", completed: 0, total: FARDHU_PRAYER_KEYS.length }
  );

  return {
    totalThisWeek,
    weeklyTarget,
    remainingThisWeek: Math.max(weeklyTarget - totalThisWeek, 0),
    consistencyPercent: Math.round((totalThisWeek / weeklyTarget) * 100),
    fullDays: fullCompletedDays(state),
    activeStreak: state.streak,
    longestStreak: state.longestStreak,
    weeklyBreakdown,
    bestDay,
    heatmapDays: buildThirtyDayHeatmap(state),
    prayerPerformance,
    weeklyAchievements: buildWeeklyAchievements(state),
    weeklyInsights: buildWeeklyInsights(state, weeklyBreakdown, prayerPerformance),
    monthlyTotal,
    monthlyTarget,
    monthlyPercent,
    dailyAverage,
    dailyAverageDelta: totalThisWeek > 0 ? 12 : 0,
    sunnahThisWeek,
    sunnahThisMonth,
    sunnahXpThisWeek,
    sunnahWeeklyTarget: SUNNAH_PRAYER_KEYS.length * 7,
    sunnahWeeklyBreakdown,
    sunnahPerformance,
    bestSunnah,
    sunnahDailyAverage: Number((sunnahThisWeek / 7).toFixed(1)),
    sunnahXpPerPrayer: XP_PER_SUNNAH_PRAYER,
    maxSunnahXpPerDay: MAX_SUNNAH_XP_PER_DAY,
    currentMonthLabel: now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    streakProtection: state.streakProtection,
    maxStreakProtection: MAX_STREAK_PROTECTION,
    restoreChallengeActive: state.restoreChallengeActive,
    restoreChallengeProgress: state.restoreChallengeProgress,
    restoreChallengeTarget: state.restoreChallengeTarget,
  };
}

async function getAdminStatsData() {
  const today = new Date();
  const todayKey = startOfTodayKey();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const weekStartKey = toDateString(weekStart);
  const monthStartKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const thirtyDaysStart = new Date(today);
  thirtyDaysStart.setDate(today.getDate() - 29);
  const thirtyDaysStartKey = toDateString(thirtyDaysStart);

  const [totalUsers, users, weekLogs, monthLogs, thirtyDayLogs, totalAdmins, favorites, achievementsUnlocked, weekXp] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
      },
    }),
    prisma.prayerLog.findMany({
      where: {
        status: true,
        date: {
          gte: dateKeyToDbDate(weekStartKey),
          lte: dateKeyToDbDate(todayKey),
        },
        user: {
          role: "USER",
        },
      },
      select: {
        userId: true,
        prayerType: true,
        date: true,
        isOnTime: true,
        xpEarned: true,
      },
    }),
    prisma.prayerLog.findMany({
      where: {
        status: true,
        date: {
          gte: dateKeyToDbDate(monthStartKey),
          lte: dateKeyToDbDate(todayKey),
        },
        user: {
          role: "USER",
        },
      },
      select: {
        userId: true,
        prayerType: true,
        date: true,
        xpEarned: true,
      },
    }),
    prisma.prayerLog.findMany({
      where: {
        status: true,
        date: {
          gte: dateKeyToDbDate(thirtyDaysStartKey),
          lte: dateKeyToDbDate(todayKey),
        },
        user: {
          role: "USER",
        },
      },
      select: {
        userId: true,
        prayerType: true,
        date: true,
      },
    }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.favoriteContent.findMany({
      where: {
        user: {
          role: "USER",
        },
      },
      select: {
        type: true,
        createdAt: true,
      },
    }),
    prisma.userAchievement.count({
      where: {
        user: {
          role: "USER",
        },
      },
    }),
    prisma.xPHistory.aggregate({
      where: {
        relatedDate: {
          gte: dateKeyToDbDate(weekStartKey),
          lte: dateKeyToDbDate(todayKey),
        },
        user: {
          role: "USER",
        },
      },
      _sum: {
        pointChange: true,
      },
    }),
  ]);

  const userCount = Math.max(totalUsers, 0);
  const weeklyTarget = userCount * FARDHU_PRAYER_KEYS.length * 7;
  const monthlyTarget =
    userCount * FARDHU_PRAYER_KEYS.length * new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const fardhuWeekLogs = weekLogs.filter((log) => FARDHU_PRAYER_KEYS.includes(log.prayerType));
  const sunnahWeekLogs = weekLogs.filter((log) => SUNNAH_PRAYER_KEYS.includes(log.prayerType));
  const fardhuMonthLogs = monthLogs.filter((log) => FARDHU_PRAYER_KEYS.includes(log.prayerType));
  const sunnahMonthLogs = monthLogs.filter((log) => SUNNAH_PRAYER_KEYS.includes(log.prayerType));
  const totalThisWeek = fardhuWeekLogs.length;
  const totalSunnahThisWeek = sunnahWeekLogs.length;
  const totalThisMonth = fardhuMonthLogs.length;
  const totalSunnahThisMonth = sunnahMonthLogs.length;
  const consistencyPercent = weeklyTarget ? Math.round((totalThisWeek / weeklyTarget) * 100) : 0;
  const monthlyPercent = monthlyTarget ? Math.round((totalThisMonth / monthlyTarget) * 100) : 0;
  const activeUsersThisWeek = new Set(weekLogs.map((log) => log.userId)).size;
  const activeUsersToday = new Set(weekLogs.filter((log) => toDateString(log.date) === todayKey).map((log) => log.userId)).size;

  const dayUserFardhuCounts = fardhuWeekLogs.reduce((result, log) => {
    const key = `${log.userId}:${toDateString(log.date)}`;
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  const fullCompletedDays = Object.values(dayUserFardhuCounts).filter((count) => count >= FARDHU_PRAYER_KEYS.length).length;
  const usersFullToday = Object.entries(dayUserFardhuCounts)
    .filter(([key, count]) => key.endsWith(`:${todayKey}`) && count >= FARDHU_PRAYER_KEYS.length)
    .length;

  const weeklyBreakdown = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const dateKey = toDateString(day);
    const fardhu = fardhuWeekLogs.filter((log) => toDateString(log.date) === dateKey).length;
    const sunnah = sunnahWeekLogs.filter((log) => toDateString(log.date) === dateKey).length;
    const target = userCount * FARDHU_PRAYER_KEYS.length;

    weeklyBreakdown.push({
      date: day.toISOString(),
      label: day.toLocaleDateString("id-ID", { weekday: "short" }),
      fardhu,
      sunnah,
      target,
      percent: target ? Math.min(100, Math.round((fardhu / target) * 100)) : 0,
      isToday: dateKey === todayKey,
    });
  }

  const heatmapDays = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const dateKey = toDateString(day);
    const fardhu = thirtyDayLogs.filter(
      (log) => toDateString(log.date) === dateKey && FARDHU_PRAYER_KEYS.includes(log.prayerType)
    ).length;
    const target = userCount * FARDHU_PRAYER_KEYS.length;
    const percent = target ? Math.round((fardhu / target) * 100) : 0;

    heatmapDays.push({
      date: day.toISOString(),
      label: day.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      completed: fardhu,
      target,
      level: percent >= 75 ? "great" : percent >= 45 ? "good" : percent > 0 ? "low" : "empty",
    });
  }

  const prayerPerformance = FARDHU_PRAYER_KEYS.map((key) => {
    const completed = fardhuWeekLogs.filter((log) => log.prayerType === key).length;
    const target = userCount * 7;

    return {
      key,
      label: PRAYER_LABELS[key],
      completed,
      target,
      percent: target ? Math.round((completed / target) * 100) : 0,
    };
  });
  const sunnahPerformance = SUNNAH_PRAYER_KEYS.map((key) => {
    const completed = sunnahWeekLogs.filter((log) => log.prayerType === key).length;
    const target = userCount * 7;

    return {
      key,
      label: PRAYER_LABELS[key],
      completed,
      target,
      percent: target ? Math.round((completed / target) * 100) : 0,
    };
  });

  const userWeeklyStats = users.map((user) => {
    const fardhu = fardhuWeekLogs.filter((log) => log.userId === user.id).length;
    const sunnah = sunnahWeekLogs.filter((log) => log.userId === user.id).length;
    const onTime = fardhuWeekLogs.filter((log) => log.userId === user.id && log.isOnTime).length;
    const xp = weekLogs
      .filter((log) => log.userId === user.id)
      .reduce((sum, log) => sum + (log.xpEarned || 0), 0);

    return {
      ...user,
      fardhu,
      sunnah,
      onTime,
      xp,
      percent: Math.round((fardhu / (FARDHU_PRAYER_KEYS.length * 7)) * 100),
    };
  });
  const topConsistencyUsers = userWeeklyStats
    .slice()
    .sort((a, b) => b.fardhu - a.fardhu || b.onTime - a.onTime || b.sunnah - a.sunnah)
    .slice(0, 6);

  const streakUsers = await Promise.all(users.map(async (user) => {
    const state = await getUserState(user.id);
    return {
      ...user,
      streak: state.streak,
      longestStreak: state.longestStreak,
      level: state.level,
      xp: state.xp,
    };
  }));
  const topStreakUsers = streakUsers
    .sort((a, b) => b.longestStreak - a.longestStreak || b.streak - a.streak || b.xp - a.xp)
    .slice(0, 6);
  const activeStreakUsers = streakUsers.filter((user) => user.streak > 0).length;

  const favoritesByType = favorites.reduce((result, favorite) => {
    result[favorite.type] = (result[favorite.type] || 0) + 1;
    return result;
  }, {});
  const todayFavorites = favorites.filter((favorite) => toDateString(favorite.createdAt) === todayKey).length;
  const bestPrayer = prayerPerformance.reduce(
    (best, item) => (item.completed > best.completed ? item : best),
    { label: "Belum ada", completed: 0, percent: 0 }
  );
  const weakestPrayer = prayerPerformance.reduce(
    (weakest, item) => (item.completed < weakest.completed ? item : weakest),
    prayerPerformance[0] || { label: "Belum ada", completed: 0, percent: 0 }
  );
  const bestDay = weeklyBreakdown.reduce(
    (best, day) => (day.fardhu > best.fardhu ? day : best),
    { label: "Belum ada", fardhu: 0, target: 0 }
  );
  const adminInsights = [
    {
      type: "success",
      title: `${activeUsersThisWeek} user aktif minggu ini`,
      description: `${userCount ? Math.round((activeUsersThisWeek / userCount) * 100) : 0}% dari total user memiliki aktivitas ibadah minggu ini.`,
    },
    {
      type: "info",
      title: `${bestPrayer.label} paling konsisten`,
      description: `${bestPrayer.completed}/${bestPrayer.target} checklist tercatat untuk waktu ini.`,
    },
    {
      type: "warning",
      title: `${weakestPrayer.label} perlu perhatian`,
      description: `Persentase terendah minggu ini: ${weakestPrayer.percent}%.`,
    },
    {
      type: "spark",
      title: `${bestDay.label} hari aktivitas tertinggi`,
      description: `${bestDay.fardhu}/${bestDay.target} salat wajib tercatat pada hari tersebut.`,
    },
  ];

  return {
    adminStatsSummary: {
      totalUsers: userCount,
      totalAdmins,
      activeUsersToday,
      activeUsersThisWeek,
      totalThisWeek,
      totalSunnahThisWeek,
      totalThisMonth,
      totalSunnahThisMonth,
      weeklyTarget,
      monthlyTarget,
      remainingThisWeek: Math.max(weeklyTarget - totalThisWeek, 0),
      consistencyPercent,
      monthlyPercent,
      fullCompletedDays,
      usersFullToday,
      totalXpThisWeek: weekXp._sum.pointChange || 0,
      achievementsUnlocked,
      activeStreakUsers,
      totalBookmarks: favorites.length,
      quranBookmarks: favoritesByType.quran || 0,
      hadisBookmarks: favoritesByType.hadis || 0,
      doaBookmarks: favoritesByType.doa || 0,
      todayFavorites,
    },
    weeklyBreakdown,
    heatmapDays,
    prayerPerformance,
    sunnahPerformance,
    topConsistencyUsers,
    topStreakUsers,
    adminInsights,
    currentMonthLabel: today.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
  };
}

async function getAchievementsData(userId) {
  const state = await getUserState(userId);
  updateAchievements(state);

  const totalCompleted = totalCompletedSalatInState(state, ALL_PRAYER_KEYS);
  const fullDays = fullCompletedDays(state);
  const weeklyBreakdown = buildWeeklyBreakdown(state);
  const weekCompleted = countThisWeek(state);
  const achievementItems = [
    {
      slug: "first-step",
      name: "First Step",
      description: "Checklist salat pertama",
      category: "shalat",
      type: "Basic",
      color: "green",
      icon: "check",
      current: Math.min(totalCompleted, 1),
      target: 1,
      progressLabel: `${Math.min(totalCompleted, 1)} / 1 salat`,
      unlocked: totalCompleted >= 1,
    },
    {
      slug: "full-day",
      name: "Full Day",
      description: "Menyelesaikan 5 salat dalam sehari",
      category: "shalat",
      type: "Shalat",
      color: "teal",
      icon: "bar",
      current: Math.min(fullDays, 1),
      target: 1,
      progressLabel: `${Math.min(fullDays, 1)} / 1 hari`,
      unlocked: fullDays >= 1,
    },
    {
      slug: "streak-3",
      name: "3 Days Streak",
      description: "Mendapat streak selama 3 hari",
      category: "streak",
      type: "Streak",
      color: "gold",
      icon: "flame",
      current: Math.min(state.streak, 3),
      target: 3,
      progressLabel: `${Math.min(state.streak, 3)} / 3 hari`,
      unlocked: state.streak >= 3,
    },
    {
      slug: "streak-7",
      name: "7 Days Consistent",
      description: "Mendapat streak selama 7 hari",
      category: "konsistensi",
      type: "Konsistensi",
      color: "blue",
      icon: "medal",
      current: Math.min(state.streak, 7),
      target: 7,
      progressLabel: `${Math.min(state.streak, 7)} / 7 hari`,
      unlocked: state.streak >= 7,
    },
    {
      slug: "streak-30",
      name: "30 Days Journey",
      description: "Mendapat streak selama 30 hari",
      category: "streak",
      type: "Long Term",
      color: "purple",
      icon: "calendar",
      current: Math.min(state.streak, 30),
      target: 30,
      progressLabel: `${Math.min(state.streak, 30)} / 30 hari`,
      unlocked: state.streak >= 30,
    },
    {
      slug: "level-5",
      name: "Level 5 Reached",
      description: "Mencapai level 5",
      category: "level",
      type: "Level",
      color: "red",
      icon: "level",
      current: Math.min(state.level, 5),
      target: 5,
      progressLabel: `Level ${Math.min(state.level, 5)} / 5`,
      unlocked: state.level >= 5,
    },
    {
      slug: "weekly-target",
      name: "Weekly Focus",
      description: "Mencapai 25 salat dalam satu minggu",
      category: "konsistensi",
      type: "Mingguan",
      color: "green",
      icon: "spark",
      current: Math.min(weekCompleted, 25),
      target: 25,
      progressLabel: `${Math.min(weekCompleted, 25)} / 25 salat`,
      unlocked: weekCompleted >= 25,
    },
    {
      slug: "level-10",
      name: "Level 10 Journey",
      description: "Mencapai level 10",
      category: "level",
      type: "Level",
      color: "purple",
      icon: "star",
      current: Math.min(state.level, 10),
      target: 10,
      progressLabel: `Level ${Math.min(state.level, 10)} / 10`,
      unlocked: state.level >= 10,
    },
  ].map((item) => ({
    ...item,
    percent: Math.min(Math.round((item.current / item.target) * 100), 100),
  }));

  const unlockedCount = achievementItems.filter((item) => item.unlocked).length;

  return {
    achievements: achievementItems,
    achievementSummary: {
      unlockedCount,
      totalCount: achievementItems.length,
      streak: state.streak,
      longestStreak: state.longestStreak,
      weekCompleted,
      level: state.level,
    },
    weeklyTracker: weeklyBreakdown.map((day) => ({
      ...day,
      shortLabel: day.label.charAt(0).toUpperCase(),
    })),
  };
}

async function getProfileData(userId) {
  const state = await getUserState(userId);
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { createdAt: true },
  });
  const weeklyBreakdown = buildWeeklyBreakdown(state);
  const currentLevelBase = (state.level - 1) * 100;
  const nextLevelTarget = state.level * 100;

  return {
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    longestStreak: state.longestStreak,
    memberSince: user?.createdAt || null,
    currentLevelBase,
    nextLevelTarget,
    levelProgress: Math.min(
      100,
      Math.max(0, Math.round(((state.xp - currentLevelBase) / Math.max(nextLevelTarget - currentLevelBase, 1)) * 100))
    ),
    weeklyBreakdown: weeklyBreakdown.map((day) => ({
      ...day,
      shortLabel: day.label.charAt(0).toUpperCase(),
    })),
    streakProtection: state.streakProtection,
    maxStreakProtection: MAX_STREAK_PROTECTION,
    restoreChallengeActive: state.restoreChallengeActive,
    restoreChallengeProgress: state.restoreChallengeProgress,
    restoreChallengeTarget: state.restoreChallengeTarget,
  };
}

async function getAdminAchievementsData() {
  const [totalUsers, catalog, unlockedRows, recentUnlocks, topUsers] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.achievement.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: {
          select: { userAchievements: true },
        },
      },
    }),
    prisma.userAchievement.findMany({
      select: {
        achievementId: true,
      },
    }),
    prisma.userAchievement.findMany({
      orderBy: { unlockedAt: "desc" },
      take: 8,
      select: {
        unlockedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        achievement: {
          select: {
            name: true,
            description: true,
            slug: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "USER" },
      orderBy: {
        achievements: {
          _count: "desc",
        },
      },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        achievements: {
          orderBy: { unlockedAt: "desc" },
          take: 1,
          select: {
            achievement: {
              select: { name: true },
            },
            unlockedAt: true,
          },
        },
        _count: {
          select: { achievements: true },
        },
      },
    }),
  ]);

  const unlockCountByAchievement = unlockedRows.reduce((result, row) => {
    result[row.achievementId] = (result[row.achievementId] || 0) + 1;
    return result;
  }, {});
  const totalUnlocked = unlockedRows.length;
  const usersWithAchievements = await prisma.user.count({
    where: {
      role: "USER",
      achievements: {
        some: {},
      },
    },
  });
  const mostUnlocked = catalog.reduce(
    (best, item) => (item._count.userAchievements > best.count ? { name: item.name, count: item._count.userAchievements } : best),
    { name: "Belum ada", count: 0 }
  );
  const neverUnlocked = catalog.filter((item) => item._count.userAchievements === 0).length;
  const achievementCatalog = catalog.map((item) => {
    const unlockedCount = unlockCountByAchievement[item.id] || 0;
    const percent = totalUsers ? Math.round((unlockedCount / totalUsers) * 100) : 0;

    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      targetType: item.targetType,
      targetValue: item.targetValue,
      unlockedCount,
      percent,
      status: unlockedCount === 0 ? "Belum terbuka" : percent >= 50 ? "Populer" : "Jarang",
    };
  });

  return {
    adminAchievementSummary: {
      totalUnlocked,
      usersWithAchievements,
      totalUsers,
      mostUnlocked,
      neverUnlocked,
      catalogCount: catalog.length,
    },
    achievementCatalog,
    topUsers,
    recentUnlocks,
  };
}

module.exports = {
  completePrayer,
  getDashboardData,
  getAchievementsData,
  getAdminAchievementsData,
  getAdminStatsData,
  getStatsData,
  getProfileData,
  markRestoreReflection,
  getPrayerScheduleForDate,
};

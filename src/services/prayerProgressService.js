const axios = require("axios");

const PRAYER_KEYS = ["shubuh", "dzuhur", "ashar", "maghrib", "isya"];
const PRAYER_LABELS = {
  shubuh: "Shubuh",
  dzuhur: "Dzuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya",
};
const DEFAULT_PRAYER_TIMES = {
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
const DAILY_BONUS_XP = 25;

const achievementsSeed = [
  { slug: "first-step", name: "First Step", description: "Checklist salat pertama" },
  { slug: "full-day", name: "Full Day", description: "Menyelesaikan 5 salat dalam sehari" },
  { slug: "streak-3", name: "3 Days Streak", description: "Mendapat streak selama 3 hari" },
  { slug: "streak-7", name: "7 Days Consistent", description: "Mendapat streak selama 7 hari" },
  { slug: "streak-30", name: "30 Days Journey", description: "Mendapat streak selama 30 hari" },
  { slug: "level-5", name: "Level 5 Reached", description: "Mencapai level 5" },
];

const users = new Map();
const prayerScheduleCache = new Map();

function toDateString(date) {
  return date.toISOString().split("T")[0];
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

function getInitialState() {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    logsByDate: new Map(),
    achievements: new Set(),
    unlockedAt: new Map(),
    lastFullDayDate: null,
    latestAchievement: null,
  };
}

function getUserState(userId) {
  const id = Number(userId);
  if (!users.has(id)) {
    users.set(id, getInitialState());
  }

  return users.get(id);
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

function normalizePrayerScheduleEntry(entry, date = new Date(), metadata = {}) {
  return {
    dateKey: entry.tanggal_lengkap || formatLocalDateKey(date),
    locationLabel: [metadata.kabkota, metadata.provinsi].filter(Boolean).join(", "),
    sourceName: "EQuran Shalat API",
    sourceUrl: PRAYER_API_DOCS_URL,
    warning: null,
    times: {
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

async function getNextPrayer(date = new Date(), todaySchedule = null, locationOverride = null) {
  const activeSchedule = todaySchedule || (await getPrayerScheduleForDate(date, locationOverride));
  const totalMinutes = getCurrentMinutes(date);
  const nextPrayerKey = PRAYER_KEYS.find(
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
  return PRAYER_KEYS.map((key) => ({
    key,
    label: PRAYER_LABELS[key],
    time: schedule.times[key],
    dateKey: schedule.dateKey,
    isTomorrow,
  }));
}

function computeLevel(xp) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

function totalCompletedSalatInState(state) {
  let total = 0;
  for (const dayLogs of state.logsByDate.values()) {
    total += Object.values(dayLogs).filter(Boolean).length;
  }
  return total;
}

function fullCompletedDays(state) {
  let count = 0;
  for (const dayLogs of state.logsByDate.values()) {
    if (Object.values(dayLogs).filter(Boolean).length >= PRAYER_KEYS.length) count += 1;
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
    total += Object.values(logs).filter(Boolean).length;
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
    const completed = Object.values(logs).filter(Boolean).length;

    days.push({
      date: day.toISOString(),
      label: day.toLocaleDateString("id-ID", { weekday: "short" }),
      completed,
      total: PRAYER_KEYS.length,
      percent: Math.round((completed / PRAYER_KEYS.length) * 100),
      isFull: completed >= PRAYER_KEYS.length,
    });
  }

  return days;
}

function updateAchievements(state) {
  const today = toDateString(new Date());
  const todayLogs = state.logsByDate.get(today) || {};
  const fullDayReached = Array.from(state.logsByDate.values()).some(
    (dayLog) => Object.values(dayLog).filter(Boolean).length >= PRAYER_KEYS.length
  );

  const totalCompleted = totalCompletedSalatInState(state);
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
  const state = getUserState(userId);
  const now = new Date();
  const today = toDateString(now);
  const todayLogs = state.logsByDate.get(today) || {};
  const prayerSchedule = await getPrayerScheduleForDate(now, prayerLocation);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowPrayerSchedule = await getPrayerScheduleForDate(tomorrowDate, prayerLocation);

  const todayState = {
    shubuh: todayLogs.shubuh || null,
    dzuhur: todayLogs.dzuhur || null,
    ashar: todayLogs.ashar || null,
    maghrib: todayLogs.maghrib || null,
    isya: todayLogs.isya || null,
  };

  const todayCompleted = Object.values(todayState).filter(Boolean).length;
  const totalToday = PRAYER_KEYS.length;
  const checklist = PRAYER_KEYS.map((key) => ({
    key,
    label: PRAYER_LABELS[key],
    time: prayerSchedule.times[key],
    isAvailable: canCompletePrayerWithSchedule(key, prayerSchedule, now),
  }));
  const prayerTimeline = [
    ...buildPrayerTimelineEntries(prayerSchedule, false),
    ...buildPrayerTimelineEntries(tomorrowPrayerSchedule, true),
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
    checklist,
    todayState,
    consistencyPercent: Math.round((countThisWeek(state) / (PRAYER_KEYS.length * 7)) * 100),
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
    totalCompletedSalat: totalCompletedSalatInState(state),
    weeklyBreakdown: buildWeeklyBreakdown(state),
  };
}

async function completePrayer(userId, prayer, prayerLocation = null) {
  if (!PRAYER_KEYS.includes(prayer)) {
    return {
      changed: false,
      message: "Jenis salat tidak valid.",
      leveledUp: false,
      latestAchievement: null,
    };
  }

  const state = getUserState(userId);
  const now = new Date();
  const today = toDateString(now);
  const prayerSchedule = await getPrayerScheduleForDate(now, prayerLocation);
  const todayLogs = state.logsByDate.get(today) || {};

  if (todayLogs[prayer]) {
    return {
      changed: false,
      message: "Salat ini sudah dicatat hari ini.",
      leveledUp: false,
      latestAchievement: state.latestAchievement,
    };
  }

  if (!canCompletePrayerWithSchedule(prayer, prayerSchedule, now)) {
    return {
      changed: false,
      message: `${PRAYER_LABELS[prayer]} belum bisa dicatat sebelum jam ${prayerSchedule.times[prayer]}.`,
      leveledUp: false,
      latestAchievement: state.latestAchievement,
    };
  }

  todayLogs[prayer] = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  state.logsByDate.set(today, todayLogs);

  state.xp += XP_PER_PRAYER;

  const completedToday = Object.values(todayLogs).filter(Boolean).length;
  if (completedToday === PRAYER_KEYS.length && state.lastFullDayDate !== today) {
    state.xp += DAILY_BONUS_XP;

    const yesterday = prevDateString(today);
    if (state.lastFullDayDate === yesterday) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }

    state.lastFullDayDate = today;
    state.longestStreak = Math.max(state.longestStreak, state.streak);
  }

  const afterLevel = computeLevel(state.xp);
  const leveledUp = afterLevel > state.level;
  state.level = afterLevel;

  const unlocked = updateAchievements(state);
  const latestAchievement = unlocked.at(-1) || state.latestAchievement;
  state.latestAchievement = latestAchievement || null;

  return {
    changed: true,
    message: "Salat berhasil dicatat.",
    leveledUp,
    latestAchievement,
  };
}

async function getStatsData(userId) {
  const state = getUserState(userId);
  const weeklyBreakdown = buildWeeklyBreakdown(state);
  const totalThisWeek = countThisWeek(state);
  const weeklyTarget = PRAYER_KEYS.length * 7;
  const bestDay = weeklyBreakdown.reduce(
    (best, day) => (day.completed > best.completed ? day : best),
    { label: "", completed: 0, total: PRAYER_KEYS.length }
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
  };
}

async function getAchievementsData(userId) {
  const state = getUserState(userId);
  updateAchievements(state);

  return achievementsSeed.map((item) => ({
    ...item,
    unlocked: state.achievements.has(item.slug),
  }));
}

async function getProfileData(userId) {
  const state = getUserState(userId);

  return {
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    longestStreak: state.longestStreak,
  };
}

module.exports = {
  completePrayer,
  getDashboardData,
  getAchievementsData,
  getStatsData,
  getProfileData,
};

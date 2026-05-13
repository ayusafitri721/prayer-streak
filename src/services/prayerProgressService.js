const axios = require("axios");
const prisma = require("../utils/prisma");

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
    state.xp += log.xpEarned || XP_PER_PRAYER;
  });

  const fullDates = Array.from(state.logsByDate.entries())
    .filter(([, dayLogs]) => Object.values(dayLogs).filter(Boolean).length >= PRAYER_KEYS.length)
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
      },
    });
    const onTimeCount = await prisma.prayerLog.count({
      where: {
        userId: id,
        status: true,
        isOnTime: true,
        date: dateKeyToDbDate(dateKey),
      },
    });
    const reflectionDoneForDay = restoreReflectionDone && restoreReflectionDate === dateKey;

    let status = "BROKEN";
    let protectionUsed = false;

    if (
      restoreActive &&
      completedCount >= PRAYER_KEYS.length &&
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
    } else if (completedCount >= PRAYER_KEYS.length) {
      status = "FULL";
    } else if (completedCount === PRAYER_KEYS.length - 1 && protection > 0 && !restoreActive) {
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

function isPrayerOnTimeWithSchedule(prayer, schedule, date = new Date()) {
  const currentMinutes = getCurrentMinutes(date);
  const prayerMinutes = timeToMinutes(schedule.times[prayer]);
  return currentMinutes >= prayerMinutes && currentMinutes <= prayerMinutes + ON_TIME_GRACE_MINUTES;
}

function buildRestoreChallengeTasks(state, today) {
  const todayLogs = state.logsByDate.get(today) || {};
  const onTimeLogs = state.onTimeByDate.get(today) || {};
  const completedCount = Object.values(todayLogs).filter(Boolean).length;
  const onTimeCount = Object.values(onTimeLogs).filter(Boolean).length;
  const reflectionDone = state.restoreReflectionDone;

  return {
    completedCount,
    onTimeCount,
    reflectionDone,
    fullDayDone: completedCount >= PRAYER_KEYS.length,
    onTimeDone: onTimeCount >= 3,
    progress: [completedCount >= PRAYER_KEYS.length, onTimeCount >= 3, reflectionDone].filter(Boolean).length,
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

function buildThirtyDayHeatmap(state) {
  const days = [];
  const today = new Date();

  for (let offset = 29; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);

    const dayKey = toDateString(day);
    const logs = state.logsByDate.get(dayKey) || {};
    const completed = Object.values(logs).filter(Boolean).length;

    days.push({
      date: day.toISOString(),
      label: day.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      completed,
      total: PRAYER_KEYS.length,
      level: completed >= 5 ? "great" : completed >= 3 ? "good" : completed >= 1 ? "low" : "empty",
    });
  }

  return days;
}

function buildPrayerPerformance(state) {
  const today = new Date();

  return PRAYER_KEYS.map((key) => {
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
      total += Object.values(logs).filter(Boolean).length;
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
    { label: "Belum ada", completed: 0, total: PRAYER_KEYS.length }
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
  const state = await getUserState(userId);
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
  const restoreChallengeTasks = buildRestoreChallengeTasks(state, today);

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
  if (!PRAYER_KEYS.includes(prayer)) {
    return {
      changed: false,
      message: "Jenis salat tidak valid.",
      leveledUp: false,
      latestAchievement: null,
    };
  }

  const state = await getUserState(userId);
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

  const beforeLevel = state.level;
  const completedTodayBefore = Object.values(todayLogs).filter(Boolean).length;
  const xpEarned =
    XP_PER_PRAYER +
    (completedTodayBefore + 1 === PRAYER_KEYS.length ? DAILY_BONUS_XP : 0);
  const isOnTime = isPrayerOnTimeWithSchedule(prayer, prayerSchedule, now);

  try {
    await prisma.$transaction([
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
      prisma.xPHistory.create({
        data: {
          userId: Number(userId),
          pointChange: xpEarned,
          reason:
            xpEarned > XP_PER_PRAYER
              ? `${PRAYER_LABELS[prayer]} selesai + bonus full day`
              : `${PRAYER_LABELS[prayer]} selesai`,
          relatedDate: dateKeyToDbDate(today),
        },
      }),
    ]);
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
    message: "Salat berhasil dicatat.",
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
  const weeklyTarget = PRAYER_KEYS.length * 7;
  const monthlyTotal = countCurrentMonth(state);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthlyTarget = daysInMonth * PRAYER_KEYS.length;
  const monthlyPercent = Math.round((monthlyTotal / monthlyTarget) * 100);
  const dailyAverage = Number((totalThisWeek / 7).toFixed(1));
  const prayerPerformance = buildPrayerPerformance(state);
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
    heatmapDays: buildThirtyDayHeatmap(state),
    prayerPerformance,
    weeklyAchievements: buildWeeklyAchievements(state),
    weeklyInsights: buildWeeklyInsights(state, weeklyBreakdown, prayerPerformance),
    monthlyTotal,
    monthlyTarget,
    monthlyPercent,
    dailyAverage,
    dailyAverageDelta: totalThisWeek > 0 ? 12 : 0,
    currentMonthLabel: now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    streakProtection: state.streakProtection,
    maxStreakProtection: MAX_STREAK_PROTECTION,
    restoreChallengeActive: state.restoreChallengeActive,
    restoreChallengeProgress: state.restoreChallengeProgress,
    restoreChallengeTarget: state.restoreChallengeTarget,
  };
}

async function getAchievementsData(userId) {
  const state = await getUserState(userId);
  updateAchievements(state);

  return achievementsSeed.map((item) => ({
    ...item,
    unlocked: state.achievements.has(item.slug),
  }));
}

async function getProfileData(userId) {
  const state = await getUserState(userId);

  return {
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    longestStreak: state.longestStreak,
    streakProtection: state.streakProtection,
    maxStreakProtection: MAX_STREAK_PROTECTION,
    restoreChallengeActive: state.restoreChallengeActive,
    restoreChallengeProgress: state.restoreChallengeProgress,
    restoreChallengeTarget: state.restoreChallengeTarget,
  };
}

module.exports = {
  completePrayer,
  getDashboardData,
  getAchievementsData,
  getStatsData,
  getProfileData,
  markRestoreReflection,
  getPrayerScheduleForDate,
};

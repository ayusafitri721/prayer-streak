const PRAYER_KEYS = ["shubuh", "dzuhur", "ashar", "maghrib", "isya"];
const PRAYER_LABELS = {
  shubuh: "Shubuh",
  dzuhur: "Dzuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya",
};
const PRAYER_TIMES = {
  shubuh: "04:45",
  dzuhur: "11:55",
  ashar: "15:20",
  maghrib: "18:05",
  isya: "19:55",
};

const XP_PER_PRAYER = 10;
const DAILY_BONUS_XP = 50;

const achievementsSeed = [
  { slug: "first-step", name: "First Step", description: "Checklist salat pertama" },
  { slug: "full-day", name: "Full Day", description: "Menyelesaikan 5 salat dalam sehari" },
  { slug: "streak-3", name: "3 Days Streak", description: "Mendapat streak selama 3 hari" },
  { slug: "streak-7", name: "7 Days Consistent", description: "Mendapat streak selama 7 hari" },
  { slug: "streak-30", name: "30 Days Journey", description: "Mendapat streak selama 30 hari" },
  { slug: "level-5", name: "Level 5 Reached", description: "Mencapai level 5" },
];

const users = new Map();

function toDateString(date) {
  return date.toISOString().split("T")[0];
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
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getCurrentMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

function canCompletePrayer(prayer, date = new Date()) {
  return getCurrentMinutes(date) >= timeToMinutes(PRAYER_TIMES[prayer]);
}

function getNextPrayer() {
  const totalMinutes = getCurrentMinutes();

  const nextPrayer = PRAYER_KEYS.find((key) => totalMinutes < timeToMinutes(PRAYER_TIMES[key]));
  if (!nextPrayer) return { name: "Shubuh", time: PRAYER_TIMES.shubuh, isTomorrow: true };

  return {
    name: PRAYER_LABELS[nextPrayer],
    time: PRAYER_TIMES[nextPrayer],
    isTomorrow: false,
  };
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

function getWeeklyBreakdown(state) {
  const today = new Date();
  const labels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const dayKey = toDateString(day);
    const logs = state.logsByDate.get(dayKey) || {};
    const completed = Object.values(logs).filter(Boolean).length;

    days.push({
      date: dayKey,
      label: labels[day.getDay()],
      completed,
      total: PRAYER_KEYS.length,
      percent: Math.round((completed / PRAYER_KEYS.length) * 100),
      isFull: completed === PRAYER_KEYS.length,
    });
  }

  return days;
}

function getBestDay(weeklyBreakdown) {
  return weeklyBreakdown.reduce((best, day) => {
    if (!best || day.completed > best.completed) return day;
    return best;
  }, null);
}

function updateAchievements(state) {
  const today = toDateString(new Date());
  const todayLogs = state.logsByDate.get(today) || {};
  const todayCompleted = Object.values(todayLogs).filter(Boolean).length;
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

async function getDashboardData(userId) {
  const state = getUserState(userId);
  const today = toDateString(new Date());
  const todayLogs = state.logsByDate.get(today) || {};

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
    time: PRAYER_TIMES[key],
    isAvailable: canCompletePrayer(key),
  }));

  updateAchievements(state);

  return {
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    longestStreak: state.longestStreak,
    totalCompletedSalat: totalCompletedSalatInState(state),
    weeklyBreakdown: getWeeklyBreakdown(state),
    nextLevelTarget: state.level * 100,
    currentLevelBase: (state.level - 1) * 100,
    dailyBonusXp: DAILY_BONUS_XP,
    todayCompleted,
    totalToday,
    nextPrayer: getNextPrayer(),
    checklist,
    todayState,
    consistencyPercent: Math.round((countThisWeek(state) / (PRAYER_KEYS.length * 7)) * 100),
    weekCompleted: countThisWeek(state),
    fullDays: fullCompletedDays(state),
    streakActive: state.streak > 0,
    latestAchievement: state.latestAchievement,
  };
}

async function completePrayer(userId, prayer) {
  if (!PRAYER_KEYS.includes(prayer)) {
    return {
      changed: false,
      message: "Jenis salat tidak valid.",
      leveledUp: false,
      latestAchievement: null,
    };
  }

  const state = getUserState(userId);
  const today = toDateString(new Date());
  const todayLogs = state.logsByDate.get(today) || {};

  if (todayLogs[prayer]) {
    return {
      changed: false,
      message: "Salat ini sudah dicatat hari ini.",
      leveledUp: false,
      latestAchievement: state.latestAchievement,
    };
  }

  if (!canCompletePrayer(prayer)) {
    return {
      changed: false,
      message: `${PRAYER_LABELS[prayer]} belum bisa dicatat sebelum jam ${PRAYER_TIMES[prayer]}.`,
      leveledUp: false,
      latestAchievement: state.latestAchievement,
    };
  }

  const prevXp = state.xp;
  todayLogs[prayer] = new Date().toLocaleTimeString("id-ID", {
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
  const weeklyBreakdown = getWeeklyBreakdown(state);
  const totalThisWeek = countThisWeek(state);
  const weeklyTarget = PRAYER_KEYS.length * 7;
  const consistencyPercent = Math.round((totalThisWeek / weeklyTarget) * 100);
  const bestDay = getBestDay(weeklyBreakdown);

  return {
    totalThisWeek,
    weeklyTarget,
    remainingThisWeek: Math.max(weeklyTarget - totalThisWeek, 0),
    consistencyPercent,
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

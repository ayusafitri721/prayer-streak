const {
  completePrayer,
  getDashboardData,
  getAchievementsData,
  getStatsData,
  getProfileData,
} = require("../services/prayerProgressService");
const { getDailyReflection } = require("../services/reflectionService");
const { getHijriCalendarData } = require("../services/hijriService");

async function renderDashboard(req, res) {
  const user = req.session.user;
  try {
    const [data, dailyReflection] = await Promise.all([
      getDashboardData(user.id, req.session.prayerLocation || null),
      Promise.resolve(getDailyReflection()),
    ]);
    const hijriData = await getHijriCalendarData(new Date());

    return res.render("pages/dashboard", {
      title: "Dashboard - Prayer Streak",
      ...data,
      userName: user.name,
      dailyReflection,
      hijriData,
    });
  } catch (error) {
    req.flash("error", "Gagal memuat dashboard. Coba lagi beberapa saat.");
    return res.render("pages/dashboard", {
      title: "Dashboard - Prayer Streak",
      userName: user.name,
      xp: 0,
      level: 1,
      streak: 0,
      todayCompleted: 0,
      totalToday: 5,
      nextPrayer: { name: "Shubuh", time: "04:45" },
      prayerTimeline: [],
      checklist: [
        { key: "shubuh", label: "Shubuh" },
        { key: "dzuhur", label: "Dzuhur" },
        { key: "ashar", label: "Ashar" },
        { key: "maghrib", label: "Maghrib" },
        { key: "isya", label: "Isya" },
      ],
      todayState: {
        shubuh: null,
        dzuhur: null,
        ashar: null,
        maghrib: null,
        isya: null,
      },
      consistencyPercent: 0,
      weekCompleted: 0,
      fullDays: 0,
      streakActive: false,
      latestAchievement: null,
      prayerLocationLabel: null,
      prayerLocationSourceType: "fallback",
      prayerTimeWarning: "Jadwal salat dinamis belum berhasil dimuat. Aplikasi memakai jadwal cadangan.",
      prayerTimeSource: "Jadwal default aplikasi",
      prayerTimeSourceUrl: "https://equran.id/apidev/shalat",
      hijriData: {
        today: {
          weekdayLabel: "",
          day: null,
          monthLabel: "",
          year: "",
          fullLabel: "",
        },
        calendar: {
          monthLabel: "Kalender Hijriyah",
          entries: [],
        },
        warning: "Kalender Hijriyah belum berhasil dimuat.",
        sourceName: "Fallback Lokal",
        sourceUrl: null,
      },
      dailyReflection: null,
    });
  }
}

async function completePrayerAction(req, res) {
  const { prayer } = req.params;
  const user = req.session.user;
  const wantsJson =
    req.xhr ||
    req.get("x-requested-with") === "XMLHttpRequest" ||
    req.accepts(["html", "json"]) === "json";
  const result = await completePrayer(user.id, prayer, req.session.prayerLocation || null);

  if (!result.changed) {
    if (wantsJson) {
      return res.status(400).json({
        ok: false,
        message: result.message,
      });
    }
    req.flash("error", result.message);
  } else {
    if (wantsJson) {
      const dashboard = await getDashboardData(user.id, req.session.prayerLocation || null);
      return res.json({
        ok: true,
        message: result.leveledUp
          ? "Salat berhasil dicatat. Kamu juga naik level baru."
          : "Salat berhasil dicatat.",
        dashboard,
      });
    }
    req.flash("message", "Salat berhasil dicatat.");
    if (result.leveledUp) {
      req.flash("message", "Great! Kamu naik level baru.");
    }
  }

  return res.redirect("/dashboard");
}

async function renderStatistics(req, res) {
  const user = req.session.user;
  const stats = await getStatsData(user.id);
  res.render("pages/statistics", {
    title: "Statistics - Prayer Streak",
    ...stats,
  });
}

async function renderAchievements(req, res) {
  const user = req.session.user;
  const achievements = await getAchievementsData(user.id);

  res.render("pages/achievements", {
    title: "Achievements - Prayer Streak",
    achievements,
  });
}

async function renderProfile(req, res) {
  const user = req.session.user;
  const profile = await getProfileData(user.id);
  res.render("pages/profile", {
    title: "Profile - Prayer Streak",
    user,
    profile,
  });
}

module.exports = {
  renderDashboard,
  completePrayerAction,
  renderStatistics,
  renderAchievements,
  renderProfile,
};

const {
  completePrayer,
  getDashboardData,
  getAchievementsData,
  getStatsData,
  getProfileData,
} = require("../services/prayerProgressService");
const { getDailyHadis } = require("../services/hadisService");

async function renderDashboard(req, res) {
  const user = req.session.user;
  try {
    const [data, dailyHadis] = await Promise.all([
      getDashboardData(user.id, user.name),
      getDailyHadis().catch(() => null),
    ]);

    return res.render("pages/dashboard", {
      title: "Dashboard - Prayer Streak",
      ...data,
      userName: user.name,
      dailyHadis,
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
      dailyHadis: null,
    });
  }
}

async function completePrayerAction(req, res) {
  const { prayer } = req.params;
  const user = req.session.user;
  const result = await completePrayer(user.id, prayer);

  if (!result.changed) {
    req.flash("error", result.message);
  } else {
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

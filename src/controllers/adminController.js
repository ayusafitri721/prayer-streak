const prisma = require("../utils/prisma");

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function getGrowthPercent(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

async function renderAdminDashboard(req, res) {
  const last7Days = daysAgo(7);
  const last30Days = daysAgo(30);
  const previous60Days = daysAgo(60);

  const [
    totalUsers,
    totalAdmins,
    totalPrayerLogs,
    totalFavorites,
    totalAchievements,
    usersLast30Days,
    usersPrevious30Days,
    logsLast30Days,
    logsPrevious30Days,
    favoritesLast30Days,
    favoritesPrevious30Days,
    achievementsLast30Days,
    achievementsPrevious30Days,
    logsLast7Days,
    activeUsersLast7Days,
    favoritesLast7Days,
    achievementsLast7Days,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.prayerLog.count(),
    prisma.favoriteContent.count(),
    prisma.userAchievement.count(),
    prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
    prisma.user.count({ where: { createdAt: { gte: previous60Days, lt: last30Days } } }),
    prisma.prayerLog.count({ where: { prayedAt: { gte: last30Days } } }),
    prisma.prayerLog.count({ where: { prayedAt: { gte: previous60Days, lt: last30Days } } }),
    prisma.favoriteContent.count({ where: { createdAt: { gte: last30Days } } }),
    prisma.favoriteContent.count({ where: { createdAt: { gte: previous60Days, lt: last30Days } } }),
    prisma.userAchievement.count({ where: { unlockedAt: { gte: last30Days } } }),
    prisma.userAchievement.count({ where: { unlockedAt: { gte: previous60Days, lt: last30Days } } }),
    prisma.prayerLog.count({ where: { prayedAt: { gte: last7Days } } }),
    prisma.prayerLog.findMany({
      where: { prayedAt: { gte: last7Days } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.favoriteContent.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.userAchievement.count({ where: { unlockedAt: { gte: last7Days } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profileImage: true,
      },
    }),
  ]);

  const statCards = [
    {
      label: "Total User",
      value: totalUsers,
      description: "akun pengguna",
      growth: getGrowthPercent(usersLast30Days, usersPrevious30Days),
      icon: "users",
      tone: "green",
    },
    {
      label: "Admin Aktif",
      value: totalAdmins,
      description: "akun pengelola",
      growth: 0,
      icon: "shield",
      tone: "gold",
    },
    {
      label: "Checklist",
      value: totalPrayerLogs,
      description: "log salat tersimpan",
      growth: getGrowthPercent(logsLast30Days, logsPrevious30Days),
      icon: "check",
      tone: "sage",
    },
    {
      label: "Bookmark",
      value: totalFavorites,
      description: "konten spiritual",
      growth: getGrowthPercent(favoritesLast30Days, favoritesPrevious30Days),
      icon: "bookmark",
      tone: "cream",
    },
    {
      label: "Achievement",
      value: totalAchievements,
      description: "badge terbuka",
      growth: getGrowthPercent(achievementsLast30Days, achievementsPrevious30Days),
      icon: "award",
      tone: "green",
    },
  ];

  const activitySummary = [
    {
      label: "Prayer Log Activity",
      value: logsLast7Days,
      description: "checklist salat dalam 7 hari terakhir",
      icon: "check",
    },
    {
      label: "Active Users",
      value: activeUsersLast7Days.length,
      description: "user aktif mencatat salat",
      icon: "users",
    },
    {
      label: "Bookmark Activity",
      value: favoritesLast7Days,
      description: "bookmark baru disimpan",
      icon: "bookmark",
    },
    {
      label: "Achievement Activity",
      value: achievementsLast7Days,
      description: "achievement baru terbuka",
      icon: "award",
    },
  ];

  return res.render("pages/admin/dashboard", {
    title: "Admin - Prayer Streak",
    totalUsers,
    totalAdmins,
    totalPrayerLogs,
    totalFavorites,
    totalAchievements,
    statCards,
    activitySummary,
    recentUsers,
  });
}

async function renderAdminUsers(req, res) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      profileImage: true,
      prayerLogs: {
        orderBy: { prayedAt: "desc" },
        take: 1,
        select: { prayedAt: true },
      },
      _count: {
        select: {
          prayerLogs: true,
          favoriteContents: true,
          achievements: true,
        },
      },
    },
  });

  const summary = {
    total: users.length,
    users: users.filter((item) => item.role === "USER").length,
    admins: users.filter((item) => item.role === "ADMIN").length,
    active: users.filter((item) => item.prayerLogs[0]?.prayedAt).length,
  };

  return res.render("pages/admin/users", {
    title: "Semua User - Prayer Streak",
    users,
    summary,
  });
}

async function getAdminUserOrRedirect(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    req.flash("error", "User tidak valid.");
    res.redirect("/admin/users");
    return null;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      profileImage: true,
      streakProtection: true,
      restoreChallengeActive: true,
      restoreChallengeProgress: true,
      createdAt: true,
      prayerLogs: {
        orderBy: [{ date: "desc" }, { prayedAt: "desc" }],
        take: 10,
        select: {
          id: true,
          prayerType: true,
          date: true,
          prayedAt: true,
          xpEarned: true,
          isOnTime: true,
        },
      },
      favoriteContents: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          title: true,
          reference: true,
          createdAt: true,
        },
      },
      achievements: {
        orderBy: { unlockedAt: "desc" },
        take: 5,
        select: {
          unlockedAt: true,
          achievement: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      },
      xpHistories: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          pointChange: true,
          reason: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          prayerLogs: true,
          favoriteContents: true,
          achievements: true,
          xpHistories: true,
        },
      },
    },
  });

  if (!targetUser) {
    req.flash("error", "User tidak ditemukan.");
    res.redirect("/admin/users");
    return null;
  }

  return targetUser;
}

async function renderAdminUserDetail(req, res) {
  const targetUser = await getAdminUserOrRedirect(req, res);
  if (!targetUser) return null;

  const totalXp = await prisma.xPHistory.aggregate({
    where: { userId: targetUser.id },
    _sum: { pointChange: true },
  });

  return res.render("pages/admin/user-detail", {
    title: `${targetUser.name} - Admin Prayer Streak`,
    targetUser,
    totalXp: totalXp._sum.pointChange || 0,
  });
}

async function updateUserRoleAction(req, res) {
  const userId = Number(req.params.id);
  const nextRole = req.body.role === "ADMIN" ? "ADMIN" : "USER";

  if (!Number.isInteger(userId)) {
    req.flash("error", "User tidak valid.");
    return res.redirect("/admin/users");
  }

  if (userId === req.session.user.id && nextRole !== "ADMIN") {
    req.flash("error", "Kamu tidak bisa menurunkan role akun admin yang sedang dipakai.");
    return res.redirect(`/admin/users/${userId}`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: nextRole },
  });

  req.flash("message", `Role user berhasil diubah menjadi ${nextRole}.`);
  return res.redirect(`/admin/users/${userId}`);
}

async function resetUserProgressAction(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    req.flash("error", "User tidak valid.");
    return res.redirect("/admin/users");
  }

  await prisma.$transaction([
    prisma.prayerLog.deleteMany({ where: { userId } }),
    prisma.streakDay.deleteMany({ where: { userId } }),
    prisma.userAchievement.deleteMany({ where: { userId } }),
    prisma.xPHistory.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        streakProtection: 3,
        restoreChallengeActive: false,
        restoreChallengeProgress: 0,
        restoreReflectionDone: false,
        restoreReflectionDate: null,
        lastStreakEvaluatedDate: null,
      },
    }),
  ]);

  req.flash("message", "Progress user berhasil direset. Bookmark dan data akun tetap aman.");
  return res.redirect(`/admin/users/${userId}`);
}

module.exports = {
  renderAdminDashboard,
  renderAdminUsers,
  renderAdminUserDetail,
  updateUserRoleAction,
  resetUserProgressAction,
};

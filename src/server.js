const app = require("./app");
const { seedAdmin, listUserIds } = require("./services/userService");
const { getPrayerScheduleForDate } = require("./services/prayerProgressService");
const { startNotificationScheduler } = require("./services/notificationService");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`Prayer Streak running on http://localhost:${PORT}`);
  startNotificationScheduler({
    getActiveUserIds: listUserIds,
    getPrayerSchedule: getPrayerScheduleForDate,
  });

  try {
    await seedAdmin();
  } catch (err) {
    console.error("Failed to seed admin:", err.message);
  }
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

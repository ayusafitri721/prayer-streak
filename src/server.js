const app = require("./app");
const os = require("os");
const { seedAdmin, listUserIds } = require("./services/userService");
const { getPrayerScheduleForDate } = require("./services/prayerProgressService");
const { startNotificationScheduler } = require("./services/notificationService");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

function getLanIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const entries of Object.values(interfaces)) {
    for (const net of entries || []) {
      if (net.family === "IPv4" && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  return [...new Set(ips)];
}

const server = app.listen(PORT, HOST, async () => {
  const lanIps = getLanIps();

  console.log(`Prayer Streak running on http://localhost:${PORT}`);
  if (lanIps.length) {
    console.log("Open from phone:");
    for (const ip of lanIps) {
      console.log(`- http://${ip}:${PORT}`);
    }
  }

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

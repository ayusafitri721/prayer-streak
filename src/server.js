const app = require("./app");
const { seedAdmin } = require("./services/userService");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`Prayer Streak running on http://localhost:${PORT}`);
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

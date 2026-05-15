require("dotenv").config();

const path = require("path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("connect-flash");
const { attachGlobals } = require("./middlewares/flash");
const { renderNotFound, renderServerError } = require("./controllers/errorController");
const mainRoutes = require("./routes/main");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const statisticsRoutes = require("./routes/statistics");
const achievementsRoutes = require("./routes/achievements");
const profileRoutes = require("./routes/profile");
const quranRoutes = require("./routes/quran");
const hadisRoutes = require("./routes/hadis");
const doaRoutes = require("./routes/doa");
const learningRoutes = require("./routes/learning");
const notificationRoutes = require("./routes/notifications");
const favoriteRoutes = require("./routes/favorites");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.set("layout", "layouts/main");

app.use(expressLayouts);
app.use(express.urlencoded({ extended: true, limit: "6mb" }));
app.use(express.json({ limit: "6mb" }));
app.use(express.static(path.join(__dirname, "../public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

app.use(attachGlobals);

app.use("/", mainRoutes);
app.use("/", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/statistics", statisticsRoutes);
app.use("/achievements", achievementsRoutes);
app.use("/profile", profileRoutes);
app.use("/quran", quranRoutes);
app.use("/hadis", hadisRoutes);
app.use("/doa", doaRoutes);
app.use("/belajar", learningRoutes);
app.use("/notifications", notificationRoutes);
app.use("/favorites", favoriteRoutes);

app.use(renderNotFound);
app.use(renderServerError);

module.exports = app;

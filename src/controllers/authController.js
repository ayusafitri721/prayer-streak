const { createUser, validateUser, findById } = require("../services/userService");

async function showLogin(req, res) {
  res.render("pages/auth/login", {
    title: "Login - Prayer Streak",
    hideTopbar: true,
    pageTransition: req.query.logout === "1" ? { type: "logout" } : res.locals.pageTransition,
  });
}

async function showRegister(req, res) {
  res.render("pages/auth/register", {
    title: "Register - Prayer Streak",
    hideTopbar: true,
  });
}

async function doRegister(req, res) {
  const { name, email, phone, password, confirmPassword } = req.body;

  if (!name || !email || !phone || !password || !confirmPassword) {
    req.flash("error", "Semua field wajib diisi.");
    return res.redirect("/register");
  }

  if (password !== confirmPassword) {
    req.flash("error", "Konfirmasi password tidak sesuai.");
    return res.redirect("/register");
  }

  const user = await createUser({ name, email, phone, password });
  if (!user) {
    req.flash("error", "Email sudah digunakan.");
    return res.redirect("/register");
  }

  req.flash("message", "Registrasi berhasil. Silakan login untuk melanjutkan.");
  return res.redirect("/login");
}

async function doLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash("error", "Email dan password wajib diisi.");
    return res.redirect("/login");
  }

  const user = await validateUser(email, password);
  if (!user) {
    req.flash("error", "Email atau password salah.");
    return res.redirect("/login");
  }

  req.session.user = user;
  req.session.pageTransition = {
    type: "login",
    name: user.name || "",
  };
  req.flash("message", "Login berhasil.");
  return res.redirect("/dashboard");
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      req.flash("error", "Gagal logout, coba lagi.");
      return res.redirect("/dashboard");
    }

    res.redirect("/login?logout=1");
  });
}

function showProfileFallback(req, res) {
  const user = findById(req.session.user.id);
  res.render("pages/profile", {
    title: "Profile - Prayer Streak",
    user: req.session.user,
    accountStatus: user ? "Aktif" : "Guest",
  });
}

module.exports = {
  showLogin,
  showRegister,
  doRegister,
  doLogin,
  logout,
  showProfileFallback,
};

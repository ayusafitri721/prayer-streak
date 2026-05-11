const { createUser, validateUser, findById } = require("../services/userService");

async function showLogin(req, res) {
  res.render("pages/auth/login", {
    title: "Login - Prayer Streak",
  });
}

async function showRegister(req, res) {
  res.render("pages/auth/register", {
    title: "Register - Prayer Streak",
  });
}

async function doRegister(req, res) {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    req.flash("error", "Semua field wajib diisi.");
    return res.redirect("/register");
  }

  if (password !== confirmPassword) {
    req.flash("error", "Konfirmasi password tidak sesuai.");
    return res.redirect("/register");
  }

  const user = await createUser({ name, email, password });
  if (!user) {
    req.flash("error", "Email sudah digunakan.");
    return res.redirect("/register");
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  req.flash("message", "Registrasi berhasil. Selamat datang di Prayer Streak.");
  return res.redirect("/dashboard");
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
  req.flash("message", "Login berhasil.");
  return res.redirect("/dashboard");
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      req.flash("error", "Gagal logout, coba lagi.");
      return res.redirect("/dashboard");
    }

    res.redirect("/login");
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


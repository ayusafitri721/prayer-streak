function attachGlobals(req, res, next) {
  const message = req.flash("message");
  const error = req.flash("error");
  if (req.session.user && !req.session.user.role) {
    req.session.user.role = "USER";
  }

  res.locals.user = req.session.user || null;
  res.locals.isAdmin = req.session.user?.role === "ADMIN";
  res.locals.flashMessage = message.length ? message[0] : null;
  res.locals.flashError = error.length ? error[0] : null;
  res.locals.pageTitle = req.path === "/" ? "Prayer Streak" : null;
  res.locals.metaDescription = null;
  res.locals.robots = null;
  res.locals.canonicalUrl = null;
  res.locals.openGraph = null;
  res.locals.pageTransition = req.session.pageTransition || null;
  res.locals.hideTopbar = false;
  res.locals.currentPath = req.path;
  res.locals.prayerSessionLocation = req.session.prayerLocation || null;

  if (req.session.pageTransition) {
    delete req.session.pageTransition;
  }

  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "Silakan login untuk melanjutkan.");
    return res.redirect("/login");
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "Silakan login untuk melanjutkan.");
    return res.redirect("/login");
  }

  if (req.session.user.role !== "ADMIN") {
    req.flash("error", "Halaman admin hanya bisa diakses oleh admin.");
    return res.redirect("/dashboard");
  }

  return next();
}

function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect(req.session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return next();
}

module.exports = {
  attachGlobals,
  requireAuth,
  requireAdmin,
  requireGuest,
};


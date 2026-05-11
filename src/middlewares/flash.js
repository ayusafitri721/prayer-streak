function attachGlobals(req, res, next) {
  const message = req.flash("message");
  const error = req.flash("error");

  res.locals.user = req.session.user || null;
  res.locals.flashMessage = message.length ? message[0] : null;
  res.locals.flashError = error.length ? error[0] : null;
  res.locals.pageTitle = req.path === "/" ? "Prayer Streak" : null;
  res.locals.currentPath = req.path;

  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "Silakan login untuk melanjutkan.");
    return res.redirect("/login");
  }

  return next();
}

function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  return next();
}

module.exports = {
  attachGlobals,
  requireAuth,
  requireGuest,
};


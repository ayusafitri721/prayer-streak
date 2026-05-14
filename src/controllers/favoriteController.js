const { addFavorite, removeFavorite } = require("../services/favoriteService");

function redirectBack(req, res) {
  return res.redirect(req.get("referer") || "/profile");
}

async function storeFavorite(req, res) {
  const user = req.session.user;
  const result = await addFavorite({
    userId: user.id,
    type: req.body.type,
    title: req.body.title,
    reference: req.body.reference,
    content: req.body.content,
    sourceUrl: req.body.sourceUrl,
  });

  req.flash(result.ok ? "message" : "error", result.message);
  return redirectBack(req, res);
}

async function deleteFavorite(req, res) {
  const user = req.session.user;
  await removeFavorite(user.id, req.params.id);
  req.flash("message", "Favorit berhasil dihapus.");
  return redirectBack(req, res);
}

module.exports = {
  deleteFavorite,
  storeFavorite,
};

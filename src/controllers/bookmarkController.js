const { addQuranBookmark, removeQuranBookmark } = require("../services/bookmarkService");

function redirectBack(req, res) {
  return res.redirect(req.get("referer") || "/quran");
}

async function storeQuranBookmark(req, res) {
  const user = req.session.user;
  const result = await addQuranBookmark({
    userId: user.id,
    surahNumber: req.body.surahNumber,
    verseNumber: req.body.verseNumber,
  });

  req.flash(result.ok ? "message" : "error", result.message);
  return redirectBack(req, res);
}

async function deleteQuranBookmark(req, res) {
  const user = req.session.user;
  await removeQuranBookmark({
    userId: user.id,
    surahNumber: req.params.surahNumber,
    verseNumber: req.params.verseNumber,
  });
  req.flash("message", "Bookmark ayat dihapus.");
  return redirectBack(req, res);
}

module.exports = {
  deleteQuranBookmark,
  storeQuranBookmark,
};

const { getSurahList, getSurahDetail } = require("../services/quranService");

async function renderQuranIndex(req, res) {
  try {
    const surahs = await getSurahList();

    return res.render("pages/quran/index", {
      title: "Baca Al-Qur'an - Prayer Streak",
      surahs,
      pageError: null,
    });
  } catch (error) {
    return res.render("pages/quran/index", {
      title: "Baca Al-Qur'an - Prayer Streak",
      surahs: [],
      pageError: error.message || "Gagal memuat daftar surat.",
    });
  }
}

async function renderQuranDetail(req, res) {
  try {
    const detail = await getSurahDetail(req.params.nomor);

    return res.render("pages/quran/detail", {
      title: `${detail.surah.nameLatin} - Prayer Streak`,
      ...detail,
    });
  } catch (error) {
    req.flash("error", error.message || "Gagal memuat detail surat.");
    return res.redirect("/quran");
  }
}

module.exports = {
  renderQuranIndex,
  renderQuranDetail,
};

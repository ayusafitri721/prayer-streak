const { getSurahList, getSurahDetail } = require("../services/quranService");

function getBaseUrl(req) {
  return process.env.SITE_URL || `${req.protocol}://${req.get("host")}`;
}

function buildAbsoluteUrl(req, path = "/") {
  return new URL(path, `${getBaseUrl(req).replace(/\/$/, "")}/`).toString();
}

async function renderQuranIndex(req, res) {
  const canonicalUrl = buildAbsoluteUrl(req, "/quran");
  const seoTitle = "Baca Al-Qur'an Online - Prayer Streak";
  const seoDescription =
    "Baca Al-Qur'an online lengkap 114 surat dengan teks Arab, transliterasi, terjemahan bahasa Indonesia, dan audio murottal.";

  try {
    const surahs = await getSurahList();

    return res.render("pages/quran/index", {
      title: seoTitle,
      metaDescription: seoDescription,
      canonicalUrl,
      robots: "index,follow",
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        type: "website",
        url: canonicalUrl,
      },
      surahs,
      pageError: null,
    });
  } catch (error) {
    return res.render("pages/quran/index", {
      title: seoTitle,
      metaDescription: seoDescription,
      canonicalUrl,
      robots: "index,follow",
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        type: "website",
        url: canonicalUrl,
      },
      surahs: [],
      pageError: error.message || "Gagal memuat daftar surat.",
    });
  }
}

async function renderQuranDetail(req, res) {
  try {
    const detail = await getSurahDetail(req.params.nomor);
    const canonicalUrl = buildAbsoluteUrl(req, `/quran/${detail.surah.number}`);
    const seoTitle = `Surat ${detail.surah.nameLatin} - Baca Al-Qur'an Online`;
    const seoDescription = `Baca Surat ${detail.surah.nameLatin} (${detail.surah.nameArabic}) lengkap dengan ${detail.surah.versesCount} ayat, transliterasi, terjemahan Indonesia, dan audio murottal.`;

    return res.render("pages/quran/detail", {
      title: seoTitle,
      metaDescription: seoDescription,
      canonicalUrl,
      robots: "index,follow",
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        type: "article",
        url: canonicalUrl,
      },
      ...detail,
    });
  } catch (error) {
    if (req.session.user) {
      req.flash("error", error.message || "Gagal memuat detail surat.");
      return res.redirect("/quran");
    }

    return res.status(302).redirect("/quran");
  }
}

module.exports = {
  renderQuranIndex,
  renderQuranDetail,
};

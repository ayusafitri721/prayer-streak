const { getSurahList, getSurahDetail } = require("../services/quranService");
const { listFavoriteReferences, listFavorites } = require("../services/favoriteService");
const {
  listQuranBookmarkReferences,
  listQuranBookmarks,
} = require("../services/bookmarkService");

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
    const [surahs, savedFavoriteReferences, quranFavorites, quranVerseBookmarksRaw] = await Promise.all([
      getSurahList(),
      req.session.user ? listFavoriteReferences(req.session.user.id, "quran") : Promise.resolve([]),
      req.session.user ? listFavorites(req.session.user.id, 6, "quran") : Promise.resolve([]),
      req.session.user ? listQuranBookmarks(req.session.user.id, 20) : Promise.resolve([]),
    ]);
    const surahByNumber = new Map(surahs.map((item) => [item.number, item]));
    const quranVerseBookmarks = quranVerseBookmarksRaw.map((item) => {
      const surah = surahByNumber.get(item.surahNumber);
      return {
        id: item.id,
        surahNumber: item.surahNumber,
        verseNumber: item.verseNumber,
        surahNameLatin: surah?.nameLatin || `Surat ${item.surahNumber}`,
        surahNameArabic: surah?.nameArabic || "",
        surahMeaning: surah?.meaning || "",
        versesCount: surah?.versesCount || null,
        sourceUrl: `/quran/${item.surahNumber}#verse-${item.verseNumber}`,
      };
    });

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
      savedFavoriteReferences,
      quranFavorites,
      quranVerseBookmarks,
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
      savedFavoriteReferences: [],
      quranFavorites: [],
      quranVerseBookmarks: [],
      pageError: error.message || "Gagal memuat daftar surat.",
    });
  }
}

async function renderQuranDetail(req, res) {
  try {
    const [detail, savedFavoriteReferences, savedVerseBookmarkReferences] = await Promise.all([
      getSurahDetail(req.params.nomor),
      req.session.user ? listFavoriteReferences(req.session.user.id, "quran") : Promise.resolve([]),
      req.session.user ? listQuranBookmarkReferences(req.session.user.id) : Promise.resolve([]),
    ]);
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
      savedFavoriteReferences,
      savedVerseBookmarkReferences,
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

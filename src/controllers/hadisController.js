const {
  getPerawiList,
  getHadisByPerawi,
  getHadisDetail,
} = require("../services/hadisService");
const { listFavoriteReferences } = require("../services/favoriteService");

async function renderHadisIndex(req, res) {
  try {
    const perawiList = await getPerawiList();

    return res.render("pages/hadis/index", {
      title: "Koleksi Hadis - Prayer Streak",
      perawiList,
      pageError: null,
    });
  } catch (error) {
    return res.render("pages/hadis/index", {
      title: "Koleksi Hadis - Prayer Streak",
      perawiList: [],
      pageError: error.message || "Gagal memuat daftar perawi.",
    });
  }
}

async function renderHadisCollection(req, res) {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const [data, savedFavoriteReferences] = await Promise.all([
      getHadisByPerawi(slug, page, limit),
      listFavoriteReferences(req.session.user.id, "hadis"),
    ]);

    return res.render("pages/hadis/collection", {
      title: `${data.name} - Prayer Streak`,
      savedFavoriteReferences,
      ...data,
    });
  } catch (error) {
    req.flash("error", error.message || "Gagal memuat koleksi hadis.");
    return res.redirect("/hadis");
  }
}

async function renderHadisDetail(req, res) {
  try {
    const { slug, number } = req.params;
    const [hadis, savedFavoriteReferences] = await Promise.all([
      getHadisDetail(slug, number),
      listFavoriteReferences(req.session.user.id, "hadis"),
    ]);

    return res.render("pages/hadis/detail", {
      title: `${hadis.name} No. ${hadis.number} - Prayer Streak`,
      hadis,
      isFavorite: savedFavoriteReferences.includes(`hadis:${hadis.slug}:${hadis.number}`),
    });
  } catch (error) {
    req.flash("error", error.message || "Gagal memuat detail hadis.");
    return res.redirect(`/hadis/${req.params.slug}`);
  }
}

module.exports = {
  renderHadisIndex,
  renderHadisCollection,
  renderHadisDetail,
};

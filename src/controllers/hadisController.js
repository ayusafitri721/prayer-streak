const {
  getPerawiList,
  getHadisByPerawi,
  getHadisDetail,
} = require("../services/hadisService");

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
    const data = await getHadisByPerawi(slug, page, limit);

    return res.render("pages/hadis/collection", {
      title: `${data.name} - Prayer Streak`,
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
    const hadis = await getHadisDetail(slug, number);

    return res.render("pages/hadis/detail", {
      title: `${hadis.name} No. ${hadis.number} - Prayer Streak`,
      hadis,
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

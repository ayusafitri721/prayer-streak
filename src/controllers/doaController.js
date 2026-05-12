const {
  getDoaCategoryList,
  getDoaByCategory,
  getDoaDetail,
  searchDoa,
} = require("../services/doaService");

async function renderDoaIndex(req, res) {
  const data = await getDoaCategoryList();
  const searchQuery = String(req.query.q || "").trim();
  const page = parseInt(req.query.page, 10) || 1;
  let searchResult = null;

  if (searchQuery) {
    searchResult = await searchDoa(searchQuery, page, 12);
  }

  return res.render("pages/doa/index", {
    title: "Doa Harian - Prayer Streak",
    ...data,
    searchQuery,
    searchResult,
  });
}

async function renderDoaCollection(req, res) {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const data = await getDoaByCategory(slug, page, limit);

    return res.render("pages/doa/collection", {
      title: `${data.title} - Prayer Streak`,
      ...data,
    });
  } catch (error) {
    req.flash("error", error.message || "Gagal memuat koleksi doa.");
    return res.redirect("/doa");
  }
}

async function renderDoaDetail(req, res) {
  try {
    const { slug, id } = req.params;
    const data = await getDoaDetail(slug, id);

    return res.render("pages/doa/detail", {
      title: `${data.doa.title} - Prayer Streak`,
      ...data,
    });
  } catch (error) {
    req.flash("error", error.message || "Gagal memuat detail doa.");
    return res.redirect(`/doa/${req.params.slug}`);
  }
}

module.exports = {
  renderDoaIndex,
  renderDoaCollection,
  renderDoaDetail,
};

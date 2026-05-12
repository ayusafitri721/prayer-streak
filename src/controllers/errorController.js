function buildPrimaryAction(req) {
  if (req.session && req.session.user) {
    return {
      href: "/dashboard",
      label: "Kembali ke Dashboard",
    };
  }

  return {
    href: "/",
    label: "Kembali ke Beranda",
  };
}

function renderNotFound(req, res) {
  return res.status(404).render("pages/errors/404", {
    title: "Halaman Tidak Ditemukan - Prayer Streak",
    errorCode: "404",
    heading: "Halaman yang kamu cari tidak ditemukan",
    description:
      "Link yang dibuka mungkin sudah berubah, salah ketik, atau memang belum tersedia di Prayer Streak.",
    primaryAction: buildPrimaryAction(req),
  });
}

function renderServerError(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error("Unhandled application error:", error);

  return res.status(500).render("pages/errors/500", {
    title: "Terjadi Kesalahan - Prayer Streak",
    errorCode: "500",
    heading: "Terjadi gangguan saat memproses halaman ini",
    description:
      "Sistem sedang mengalami kendala. Coba muat ulang halaman atau kembali beberapa saat lagi.",
    primaryAction: buildPrimaryAction(req),
  });
}

module.exports = {
  renderNotFound,
  renderServerError,
};

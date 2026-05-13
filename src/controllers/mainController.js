function getBaseUrl(req) {
  return process.env.SITE_URL || `${req.protocol}://${req.get("host")}`;
}

function buildAbsoluteUrl(req, path = "/") {
  return new URL(path, `${getBaseUrl(req).replace(/\/$/, "")}/`).toString();
}

function renderHome(req, res) {
  res.render("pages/home", {
    title: "Prayer Streak",
    metaDescription:
      "Prayer Streak membantu membangun konsistensi salat harian. Jelajahi fitur publik Al-Qur'an online, audio murottal, dan terjemahan bahasa Indonesia.",
    canonicalUrl: buildAbsoluteUrl(req, "/"),
    openGraph: {
      title: "Prayer Streak",
      description:
        "Bangun konsistensi salat harian dan baca Al-Qur'an online lengkap dengan audio serta terjemahan Indonesia.",
      type: "website",
      url: buildAbsoluteUrl(req, "/"),
    },
    hideTopbar: true,
  });
}

function renderRobots(req, res) {
  const baseUrl = getBaseUrl(req).replace(/\/$/, "");
  res.type("text/plain");
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
}

function renderSitemap(req, res) {
  const baseUrl = getBaseUrl(req).replace(/\/$/, "");
  const urls = ["/", "/quran", ...Array.from({ length: 114 }, (_, index) => `/quran/${index + 1}`)];
  const now = new Date().toISOString();
  const entries = urls
    .map((path) => {
      const priority = path === "/" ? "1.0" : path === "/quran" ? "0.9" : "0.8";
      const changefreq = path === "/" ? "weekly" : path === "/quran" ? "daily" : "monthly";
      return [
        "  <url>",
        `    <loc>${new URL(path, `${baseUrl}/`).toString()}</loc>`,
        `    <lastmod>${now}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  res.type("application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
}

module.exports = {
  renderHome,
  renderRobots,
  renderSitemap,
};

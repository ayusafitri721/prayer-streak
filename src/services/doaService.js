const axios = require("axios");

const doaApi = axios.create({
  baseURL: "https://gist.githubusercontent.com",
  timeout: 12000,
});

const DOA_JSON_PATH =
  "/andes2912/af9412236fd906d5a2241f37f994567e/raw/e2ca6e631c6c29693800dba069750883aa3aba8b/doa.json";

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const fallbackSections = [
  {
    slug: "disiplin-dan-istiqamah",
    title: "Disiplin dan Istiqamah",
    description: "Fallback lokal saat API tidak tersedia.",
    tags: ["disiplin", "sabar", "istiqamah"],
    items: [
      {
        id: "fallback-1",
        title: "Doa memohon perlindungan dari rasa lemah dan malas",
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ",
        latin: "Allahumma inni a'udzu bika minal 'ajzi wal kasal.",
        translation: "Ya Allah, aku berlindung kepada-Mu dari kelemahan dan kemalasan.",
        translationLabel: "Terjemahan",
        source: "HR. Bukhari dan Muslim",
        group: "Disiplin dan Istiqamah",
        tags: ["malas", "semangat", "disiplin"],
        notes: null,
        fawaid: null,
      },
      {
        id: "fallback-2",
        title: "Doa memohon kesabaran",
        arabic: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا",
        latin: "Rabbana afrigh 'alaina sabran wa tsabbit aqdamana.",
        translation: "Ya Tuhan kami, limpahkanlah kesabaran kepada kami dan teguhkan langkah kami.",
        translationLabel: "Terjemahan",
        source: "QS. Al-Baqarah: 250",
        group: "Disiplin dan Istiqamah",
        tags: ["sabar", "langkah", "istiqamah"],
        notes: null,
        fawaid: null,
      },
    ],
  },
];

let doaCache = {
  fetchedAt: 0,
  data: null,
};

class DoaApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "DoaApiError";
  }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanWhitespace(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function looksArabicText(value) {
  return /[\u0600-\u06FF]/.test(String(value || ""));
}

function inferGroupFromTitle(title) {
  const value = String(title || "").toLowerCase();

  if (value.includes("tidur")) return "Tidur";
  if (value.includes("bangun tidur")) return "Bangun Tidur";
  if (value.includes("kamar mandi")) return "Kamar Mandi";
  if (value.includes("wudhu")) return "Wudhu";
  if (value.includes("pakaian")) return "Pakaian";
  if (value.includes("masjid")) return "Masjid";
  if (value.includes("rumah")) return "Rumah";
  if (value.includes("makan") || value.includes("minum")) return "Makan dan Minum";
  if (value.includes("shalat") || value.includes("salat")) return "Salat";
  if (value.includes("perjalanan") || value.includes("safar") || value.includes("kendaraan")) {
    return "Perjalanan";
  }
  if (value.includes("pagi")) return "Pagi Hari";
  if (value.includes("petang") || value.includes("sore")) return "Petang Hari";
  if (value.includes("angin") || value.includes("hujan") || value.includes("halilintar")) {
    return "Cuaca";
  }
  if (
    value.includes("takut") ||
    value.includes("cemas") ||
    value.includes("sedih") ||
    value.includes("berlindung")
  ) {
    return "Perlindungan dan Ketenangan";
  }
  if (value.includes("ampun") || value.includes("istighfar") || value.includes("taubat")) {
    return "Ampunan";
  }

  return "Doa Harian";
}

function inferTags(title, group) {
  const value = `${title} ${group}`.toLowerCase();
  const tags = [];

  if (value.includes("tidur")) tags.push("tidur", "malam");
  if (value.includes("bangun")) tags.push("pagi", "bangun tidur");
  if (value.includes("rumah")) tags.push("rumah");
  if (value.includes("kamar mandi")) tags.push("kamar mandi");
  if (value.includes("wudhu")) tags.push("wudhu");
  if (value.includes("shalat") || value.includes("salat")) tags.push("salat");
  if (value.includes("masjid")) tags.push("masjid");
  if (value.includes("makan")) tags.push("makan");
  if (value.includes("minum")) tags.push("minum");
  if (value.includes("perjalanan") || value.includes("safar")) tags.push("perjalanan");
  if (value.includes("takut") || value.includes("cemas")) tags.push("cemas");
  if (value.includes("berlindung")) tags.push("perlindungan");

  return uniqueStrings(tags);
}

function splitNotesAndFawaid(source) {
  const text = cleanWhitespace(source);
  if (!text) {
    return { source: "Sumber belum tersedia", notes: null, fawaid: null };
  }

  const sourceMatch = text.match(/Sumber\s*:\s*([\s\S]*)$/i);
  const mainSource = sourceMatch ? cleanWhitespace(sourceMatch[1]) : text.split("\n")[0];
  const withoutSource = sourceMatch
    ? cleanWhitespace(text.slice(0, sourceMatch.index))
    : cleanWhitespace(text.replace(mainSource, ""));

  const noteMatch = withoutSource.match(/Keterangan\s*:?\s*([\s\S]*)$/i);
  const notes = noteMatch ? cleanWhitespace(noteMatch[1]) : withoutSource || null;

  return {
    source: mainSource || "Sumber belum tersedia",
    notes: notes || null,
    fawaid: null,
  };
}

function normalizeDoaItem(raw, index) {
  const title = cleanWhitespace(raw.title || raw.judul || `Doa ${index + 1}`);
  const group = inferGroupFromTitle(title);
  const parsedSource = splitNotesAndFawaid(raw.tentang || raw.source || raw.sumber || "");

  return {
    id: String(raw.id || index + 1),
    title,
    arabic: looksArabicText(raw.arabic) ? cleanWhitespace(raw.arabic) : "-",
    latin: cleanWhitespace(raw.latin || raw.transliteration || "") || null,
    translation: cleanWhitespace(raw.translation || raw.terjemahan || raw.arti || "") || "-",
    translationLabel: "Terjemahan",
    source: parsedSource.source,
    group,
    tags: inferTags(title, group),
    notes: parsedSource.notes,
    fawaid: null,
  };
}

function describeSection(groupName, tags) {
  if (tags.length) {
    return `Doa dengan fokus ${tags.slice(0, 3).join(", ")}.`;
  }

  return `Kumpulan doa dalam kategori ${groupName.toLowerCase()}.`;
}

function buildSections(items) {
  const groups = new Map();

  items.forEach((item) => {
    if (!groups.has(item.group)) {
      groups.set(item.group, []);
    }
    groups.get(item.group).push(item);
  });

  return Array.from(groups.entries())
    .map(([groupName, groupItems]) => {
      const tags = uniqueStrings(groupItems.flatMap((item) => item.tags)).slice(0, 6);

      return {
        slug: slugify(groupName),
        title: groupName,
        description: describeSection(groupName, tags),
        tags,
        items: groupItems,
      };
    })
    .sort((a, b) => b.items.length - a.items.length || a.title.localeCompare(b.title));
}

function getFeaturedTags(sections) {
  const frequency = new Map();

  sections.forEach((section) => {
    (section.tags || []).forEach((tag) => {
      frequency.set(tag, (frequency.get(tag) || 0) + 1);
    });
  });

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([tag]) => tag);
}

function getFallbackData() {
  const items = fallbackSections.flatMap((section) => section.items);

  return {
    sections: fallbackSections,
    totalItems: items.length,
    featuredTags: getFeaturedTags(fallbackSections),
    sourceName: "Fallback Lokal",
    sourceUrl: null,
    warning: "API doa sedang tidak tersedia. Halaman menampilkan koleksi lokal terbatas.",
  };
}

async function fetchSections() {
  const now = Date.now();
  if (doaCache.data && now - doaCache.fetchedAt < CACHE_TTL_MS) {
    return doaCache.data;
  }

  try {
    const response = await doaApi.get(DOA_JSON_PATH);
    const payload = Array.isArray(response.data) ? response.data : [];
    const items = payload.map(normalizeDoaItem);
    const sections = buildSections(items);

    doaCache = {
      fetchedAt: now,
      data: sections,
    };

    return sections;
  } catch (error) {
    if (doaCache.data) {
      return doaCache.data;
    }

    throw new DoaApiError("Gagal mengambil data doa.");
  }
}

async function getDoaPageData() {
  try {
    const sections = await fetchSections();
    const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);

    return {
      sections,
      totalItems,
      featuredTags: getFeaturedTags(sections),
      sourceName: "Doa JSON Dataset",
      sourceUrl: "https://gist.github.com/andes2912/af9412236fd906d5a2241f37f994567e",
      warning: null,
    };
  } catch (error) {
    return getFallbackData();
  }
}

function normalizeQuery(value) {
  return String(value || "").trim().toLowerCase();
}

module.exports = {
  async getDoaCategoryList() {
    const data = await getDoaPageData();
    return {
      categories: data.sections.map((section) => ({
        slug: section.slug,
        title: section.title,
        description: section.description,
        tags: section.tags || [],
        total: section.items.length,
      })),
      pageError: data.warning,
      sourceName: data.sourceName,
      sourceUrl: data.sourceUrl,
    };
  },
  async searchDoa(query, page = 1, limit = 12) {
    const data = await getDoaPageData();
    const keyword = normalizeQuery(query);
    const allItems = data.sections.flatMap((section) =>
      section.items
        .filter((item) =>
          normalizeQuery(
            `${item.title} ${item.arabic || ""} ${item.latin || ""} ${item.translation} ${item.source} ${item.group} ${(item.tags || []).join(" ")}`
          ).includes(keyword)
        )
        .map((item) => ({
          ...item,
          sectionSlug: section.slug,
          sectionTitle: section.title,
        }))
    );

    const totalItems = allItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (currentPage - 1) * limit;

    return {
      query,
      items: allItems.slice(startIndex, startIndex + limit),
      pagination: {
        currentPage,
        totalPages,
        limit,
        totalItems,
      },
    };
  },
  async getDoaByCategory(slug, page = 1, limit = 12) {
    const data = await getDoaPageData();
    const section = data.sections.find((item) => item.slug === slug);

    if (!section) {
      throw new DoaApiError("Kategori doa tidak ditemukan.");
    }

    const totalItems = section.items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (currentPage - 1) * limit;

    return {
      slug: section.slug,
      title: section.title,
      description: section.description,
      total: totalItems,
      tags: section.tags || [],
      items: section.items.slice(startIndex, startIndex + limit),
      pagination: {
        currentPage,
        totalPages,
        limit,
      },
    };
  },
  async getDoaDetail(slug, id) {
    const data = await getDoaPageData();
    const section = data.sections.find((item) => item.slug === slug);

    if (!section) {
      throw new DoaApiError("Kategori doa tidak ditemukan.");
    }

    const currentIndex = section.items.findIndex((item) => String(item.id) === String(id));
    if (currentIndex === -1) {
      throw new DoaApiError("Doa tidak ditemukan.");
    }

    const doa = section.items[currentIndex];
    const previous = currentIndex > 0 ? section.items[currentIndex - 1] : null;
    const next = currentIndex < section.items.length - 1 ? section.items[currentIndex + 1] : null;

    return {
      doa: {
        ...doa,
        slug: section.slug,
        categoryTitle: section.title,
      },
      previous,
      next,
    };
  },
};

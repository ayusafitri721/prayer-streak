const axios = require("axios");

const hadisApi = axios.create({
  baseURL: "https://api.hadith.gading.dev",
  timeout: 10000,
});

class HadisApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "HadisApiError";
    this.statusCode = statusCode;
  }
}

function normalizeError(error) {
  if (error instanceof HadisApiError) {
    return error;
  }

  if (error.response?.status === 404) {
    return new HadisApiError("Hadis yang diminta tidak ditemukan.", 404);
  }

  if (error.code === "ECONNABORTED") {
    return new HadisApiError("Koneksi ke API Hadis timeout. Coba lagi.");
  }

  return new HadisApiError("Gagal mengambil data hadis.");
}

async function getPerawiList() {
  try {
    const response = await hadisApi.get("/books");
    const payload = response.data;

    if (!payload || !Array.isArray(payload.data)) {
      throw new HadisApiError("Format daftar perawi tidak sesuai.");
    }

    return payload.data.map((item) => ({
      name: item.name,
      slug: item.id,
      total: item.available,
    }));
  } catch (error) {
    throw normalizeError(error);
  }
}

async function getHadisByPerawi(slug, page = 1, limit = 20) {
  try {
    const rangeStart = (page - 1) * limit + 1;
    const rangeEnd = page * limit;

    const response = await hadisApi.get(
      `/books/${encodeURIComponent(slug)}?range=${rangeStart}-${rangeEnd}`
    );
    const payload = response.data;
    const bookData = payload.data;

    const totalItems = bookData.available;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      name: bookData.name,
      slug: bookData.id,
      total: totalItems,
      pagination: {
        currentPage: page,
        totalPages,
        limit,
      },
      items: Array.isArray(bookData.hadiths) ? bookData.hadiths : [],
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

async function getHadisDetail(slug, number) {
  const hadisNumber = Number(number);

  if (!Number.isInteger(hadisNumber) || hadisNumber < 1) {
    throw new HadisApiError("Nomor hadis tidak valid.", 400);
  }

  try {
    const response = await hadisApi.get(
      `/books/${encodeURIComponent(slug)}/${hadisNumber}`
    );
    const payload = response.data;
    const bookData = payload.data;

    return {
      name: bookData.name,
      slug: bookData.id,
      total: bookData.available,
      number: bookData.contents.number,
      arab: bookData.contents.arab,
      id: bookData.contents.id,
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

// Curated short & motivational hadis from various perawi
const DAILY_HADIS_POOL = [
  { book: "bukhari", number: 1 },
  { book: "bukhari", number: 52 },
  { book: "bukhari", number: 13 },
  { book: "bukhari", number: 10 },
  { book: "bukhari", number: 11 },
  { book: "bukhari", number: 15 },
  { book: "bukhari", number: 39 },
  { book: "bukhari", number: 6094 },
  { book: "bukhari", number: 6137 },
  { book: "bukhari", number: 6474 },
  { book: "muslim", number: 1 },
  { book: "muslim", number: 45 },
  { book: "muslim", number: 46 },
  { book: "muslim", number: 47 },
  { book: "muslim", number: 49 },
  { book: "muslim", number: 2588 },
  { book: "tirmidzi", number: 1987 },
  { book: "tirmidzi", number: 2318 },
  { book: "tirmidzi", number: 2516 },
  { book: "ibnu-majah", number: 224 },
  { book: "ibnu-majah", number: 4102 },
  { book: "abu-daud", number: 4800 },
  { book: "abu-daud", number: 4941 },
];

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function extractMatan(text) {
  const markers = [
    /bersabda[:;]?\s*"?/i,
    /bersabda[:;]?\s*/i,
    /Rasulullah.*?bersabda[:;]?\s*"?/i,
  ];

  for (const marker of markers) {
    const match = text.search(marker);
    if (match !== -1) {
      const afterMarker = text.substring(match);
      const colonIdx = afterMarker.search(/bersabda[:;]?\s*"?/i);
      if (colonIdx !== -1) {
        const sabdaMatch = afterMarker.match(/bersabda[:;]?\s*"?/i);
        if (sabdaMatch) {
          return afterMarker.substring(sabdaMatch.index + sabdaMatch[0].length).replace(/^["']/, "").trim();
        }
      }
    }
  }

  return text;
}

async function getDailyHadis() {
  try {
    const dayOfYear = getDayOfYear();
    const pick = DAILY_HADIS_POOL[dayOfYear % DAILY_HADIS_POOL.length];

    const detail = await hadisApi.get(`/books/${pick.book}/${pick.number}`);
    const bookData = detail.data.data;

    const fullTranslation = bookData.contents.id;
    const matan = extractMatan(fullTranslation);

    return {
      name: bookData.name,
      slug: bookData.id,
      number: bookData.contents.number,
      arab: bookData.contents.arab,
      id: matan,
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  HadisApiError,
  getPerawiList,
  getHadisByPerawi,
  getHadisDetail,
  getDailyHadis,
};

const axios = require("axios");

const quranApi = axios.create({
  baseURL: "https://equran.id/api/v2",
  timeout: 10000,
});

class QuranApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "QuranApiError";
    this.statusCode = statusCode;
  }
}

function pickFirstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function sanitizeText(value) {
  if (!value) return "";
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const QORI_MAP = {
  "01": "Abdullah Al-Juhany",
  "02": "Abdul Muhsin Al-Qasim",
  "03": "Abdurrahman As-Sudais",
  "04": "Ibrahim Al-Dossari",
  "05": "Misyari Rasyid Al-Afasy",
  "06": "Yasser Al-Dosari",
};

function extractAudioUrl(audioSource) {
  if (!audioSource) return null;
  if (typeof audioSource === "string") return audioSource;
  if (Array.isArray(audioSource)) {
    return audioSource.find((item) => typeof item === "string") || null;
  }

  for (const value of Object.values(audioSource)) {
    if (typeof value === "string" && value) {
      return value;
    }
  }

  return null;
}

function extractAllAudioUrls(audioSource) {
  if (!audioSource || typeof audioSource !== "object" || Array.isArray(audioSource)) return {};
  const result = {};
  for (const [key, value] of Object.entries(audioSource)) {
    if (typeof value === "string" && value) {
      result[key] = value;
    }
  }
  return result;
}

function unwrapResponse(payload) {
  if (!payload || typeof payload !== "object") {
    throw new QuranApiError("Respons API Al-Qur'an tidak valid.");
  }

  if (!Object.prototype.hasOwnProperty.call(payload, "data")) {
    throw new QuranApiError("Data Al-Qur'an tidak tersedia.");
  }

  return payload.data;
}

function normalizeSurah(item) {
  return {
    number: Number(pickFirstValue(item.nomor, item.number, 0)),
    nameArabic: pickFirstValue(item.nama, item.namaArab, "-"),
    nameLatin: pickFirstValue(item.namaLatin, item.latin, "-"),
    translation: pickFirstValue(item.arti, item.translation, "-"),
    revelation: pickFirstValue(item.tempatTurun, item.revelation, "-"),
    versesCount: Number(pickFirstValue(item.jumlahAyat, item.verses, 0)),
    description: sanitizeText(pickFirstValue(item.deskripsi, item.description, "")),
    audioUrl: extractAudioUrl(pickFirstValue(item.audioFull, item.audio, null)),
  };
}

function normalizeRelatedSurah(item) {
  if (!item || typeof item !== "object") return null;

  return {
    number: Number(pickFirstValue(item.nomor, item.number, 0)),
    nameLatin: pickFirstValue(item.namaLatin, item.latin, "-"),
    translation: pickFirstValue(item.arti, item.translation, "-"),
  };
}

function normalizeVerse(item) {
  const audioSource = pickFirstValue(item.audio, item.audioFull, null);
  return {
    number: Number(pickFirstValue(item.nomorAyat, item.nomor, item.number, 0)),
    arabic: pickFirstValue(item.teksArab, item.textArab, item.arab, "-"),
    latin: pickFirstValue(item.teksLatin, item.teksArabLatin, item.textLatin, item.latin, ""),
    translation: pickFirstValue(item.teksIndonesia, item.translation, item.idn, "-"),
    audioUrl: extractAudioUrl(audioSource),
    audioUrls: extractAllAudioUrls(audioSource),
  };
}

function normalizeError(error) {
  if (error instanceof QuranApiError) {
    return error;
  }

  if (error.response?.status === 404) {
    return new QuranApiError("Surat yang diminta tidak ditemukan.", 404);
  }

  if (error.code === "ECONNABORTED") {
    return new QuranApiError("Koneksi ke API Al-Qur'an timeout. Coba lagi.");
  }

  return new QuranApiError("Gagal mengambil data Al-Qur'an dari EQuran.id.");
}

async function getSurahList() {
  try {
    const response = await quranApi.get("/surat");
    const data = unwrapResponse(response.data);

    if (!Array.isArray(data)) {
      throw new QuranApiError("Format daftar surat tidak sesuai.");
    }

    return data.map(normalizeSurah);
  } catch (error) {
    throw normalizeError(error);
  }
}

async function getSurahDetail(nomor) {
  const surahNumber = Number(nomor);

  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    throw new QuranApiError("Nomor surat harus berada di antara 1 sampai 114.", 400);
  }

  try {
    const response = await quranApi.get(`/surat/${surahNumber}`);
    const data = unwrapResponse(response.data);

    return {
      surah: normalizeSurah(data),
      previousSurah: normalizeRelatedSurah(data.suratSebelumnya),
      nextSurah: normalizeRelatedSurah(data.suratSelanjutnya),
      verses: Array.isArray(data.ayat) ? data.ayat.map(normalizeVerse) : [],
      qoriList: QORI_MAP,
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

module.exports = {
  QuranApiError,
  getSurahList,
  getSurahDetail,
};

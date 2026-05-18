const prisma = require("../utils/prisma");

function hasBookmarkDelegate() {
  return Boolean(prisma.quranBookmark);
}

function toInt(value) {
  return Number.parseInt(String(value), 10);
}

function isValidPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

async function listQuranBookmarks(userId, limit = 50) {
  if (!hasBookmarkDelegate() || !userId) return [];

  return prisma.quranBookmark.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function listQuranBookmarkReferences(userId) {
  if (!hasBookmarkDelegate() || !userId) return [];

  const rows = await prisma.quranBookmark.findMany({
    where: { userId: Number(userId) },
    select: { surahNumber: true, verseNumber: true },
  });

  return rows.map((row) => `quran:${row.surahNumber}:${row.verseNumber}`);
}

async function addQuranBookmark({ userId, surahNumber, verseNumber }) {
  if (!hasBookmarkDelegate()) {
    return {
      ok: false,
      message: "Tabel bookmark belum siap. Jalankan migrasi Prisma terlebih dahulu.",
    };
  }

  const numericSurah = toInt(surahNumber);
  const numericVerse = toInt(verseNumber);
  if (!isValidPositiveInt(numericSurah) || !isValidPositiveInt(numericVerse)) {
    return { ok: false, message: "Data bookmark ayat tidak valid." };
  }

  await prisma.quranBookmark.upsert({
    where: {
      userId_surahNumber_verseNumber: {
        userId: Number(userId),
        surahNumber: numericSurah,
        verseNumber: numericVerse,
      },
    },
    update: {},
    create: {
      userId: Number(userId),
      surahNumber: numericSurah,
      verseNumber: numericVerse,
    },
  });

  return { ok: true, message: "Bookmark ayat berhasil disimpan." };
}

async function removeQuranBookmark({ userId, surahNumber, verseNumber }) {
  if (!hasBookmarkDelegate()) return false;

  const numericSurah = toInt(surahNumber);
  const numericVerse = toInt(verseNumber);
  if (!isValidPositiveInt(numericSurah) || !isValidPositiveInt(numericVerse)) {
    return false;
  }

  await prisma.quranBookmark.deleteMany({
    where: {
      userId: Number(userId),
      surahNumber: numericSurah,
      verseNumber: numericVerse,
    },
  });

  return true;
}

module.exports = {
  addQuranBookmark,
  listQuranBookmarkReferences,
  listQuranBookmarks,
  removeQuranBookmark,
};

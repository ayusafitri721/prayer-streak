const prisma = require("../utils/prisma");

function hasFavoriteDelegate() {
  return Boolean(prisma.favoriteContent);
}

function normalizeText(value, fallback = "") {
  return String(value || fallback).trim();
}

async function listFavorites(userId, limit = 12, type = null) {
  if (!hasFavoriteDelegate()) {
    return [];
  }

  return prisma.favoriteContent.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function listFavoriteReferences(userId, type = null) {
  if (!hasFavoriteDelegate() || !userId) {
    return [];
  }

  const rows = await prisma.favoriteContent.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
    },
    select: {
      reference: true,
    },
  });

  return rows.map((row) => row.reference);
}

async function getRandomFavorite(userId) {
  if (!hasFavoriteDelegate()) {
    return null;
  }

  const favorites = await prisma.favoriteContent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (!favorites.length) {
    return null;
  }

  return favorites[Math.floor(Math.random() * favorites.length)];
}

async function addFavorite({ userId, type, title, reference, content, sourceUrl }) {
  if (!hasFavoriteDelegate()) {
    return {
      ok: false,
      message: "Tabel favorit belum siap. Jalankan migrasi Prisma terlebih dahulu.",
    };
  }

  const payload = {
    userId,
    type: normalizeText(type).toLowerCase(),
    title: normalizeText(title, "Favorit"),
    reference: normalizeText(reference),
    content: normalizeText(content),
    sourceUrl: normalizeText(sourceUrl) || null,
  };

  if (!payload.type || !payload.reference || !payload.content) {
    return {
      ok: false,
      message: "Data favorit belum lengkap.",
    };
  }

  await prisma.favoriteContent.upsert({
    where: {
      userId_type_reference: {
        userId: payload.userId,
        type: payload.type,
        reference: payload.reference,
      },
    },
    update: {
      title: payload.title,
      content: payload.content,
      sourceUrl: payload.sourceUrl,
    },
    create: payload,
  });

  return {
    ok: true,
    message: "Berhasil disimpan ke favorit.",
  };
}

async function removeFavorite(userId, favoriteId) {
  if (!hasFavoriteDelegate()) {
    return false;
  }

  await prisma.favoriteContent.deleteMany({
    where: {
      id: Number(favoriteId),
      userId,
    },
  });

  return true;
}

module.exports = {
  addFavorite,
  getRandomFavorite,
  listFavoriteReferences,
  listFavorites,
  removeFavorite,
};

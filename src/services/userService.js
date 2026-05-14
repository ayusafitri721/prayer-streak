const bcrypt = require("bcrypt");

const memoryUsers = [];
let prisma = null;
let prismaUnavailable = false;

const SALT_ROUNDS = 10;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getPrisma() {
  if (prismaUnavailable) return null;
  if (prisma) return prisma;

  try {
    prisma = require("../utils/prisma");
    return prisma;
  } catch (error) {
    prismaUnavailable = true;
    return null;
  }
}

async function findByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const db = getPrisma();

  if (!db?.user) {
    const user = memoryUsers.find((item) => item.email === normalizedEmail);
    if (!user) return null;

    return { id: user.id, name: user.name, email: user.email, profileImage: user.profileImage || null };
  }

  return db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true, phone: true, profileImage: true },
  });
}

async function findById(id) {
  const db = getPrisma();

  if (!db?.user) {
    const user = memoryUsers.find((item) => item.id === id);
    return user ? { id: user.id, name: user.name, email: user.email, phone: user.phone, profileImage: user.profileImage || null } : null;
  }

  return db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, profileImage: true },
  });
}

async function createUser({ name, email, phone, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = phone.trim();
  const db = getPrisma();

  if (!db?.user) {
    const exists = memoryUsers.some((item) => item.email === normalizedEmail);
    if (exists) {
      return null;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = {
      id: memoryUsers.length + 1,
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      profileImage: null,
      password: passwordHash,
    };
    memoryUsers.push(user);

    return { id: user.id, name: user.name, email: user.email, phone: user.phone, profileImage: user.profileImage };
  }

  const exists = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (exists) {
    return null;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: passwordHash,
    },
    select: { id: true, name: true, email: true, phone: true, profileImage: true },
  });

  return user;
}

async function validateUser(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const db = getPrisma();

  if (!db?.user) {
    const user = memoryUsers.find((item) => item.email === normalizedEmail);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage || null,
    };
  }

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true, phone: true, profileImage: true, password: true },
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage || null,
  };
}

async function updateProfileImage(userId, profileImage) {
  const id = Number(userId);
  const db = getPrisma();

  if (!db?.user) {
    const user = memoryUsers.find((item) => item.id === id);
    if (!user) return null;
    user.profileImage = profileImage;
    return { id: user.id, name: user.name, email: user.email, phone: user.phone, profileImage: user.profileImage };
  }

  return db.user.update({
    where: { id },
    data: { profileImage },
    select: { id: true, name: true, email: true, phone: true, profileImage: true },
  });
}

const ADMIN_EMAIL = "admin@prayerstreak.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Admin";

async function seedAdmin() {
  const normalizedEmail = normalizeEmail(ADMIN_EMAIL);
  const db = getPrisma();

  if (!db?.user) {
    const exists = memoryUsers.some((item) => item.email === normalizedEmail);
    if (exists) return;

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    memoryUsers.push({
      id: memoryUsers.length + 1,
      name: ADMIN_NAME,
      email: normalizedEmail,
      phone: "",
      password: passwordHash,
    });
    console.log(`Admin account ready: ${ADMIN_EMAIL}`);
    return;
  }

  const exists = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (exists) return;

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  await db.user.create({
    data: {
      name: ADMIN_NAME,
      email: normalizedEmail,
      phone: "",
      password: passwordHash,
    },
  });
  console.log(`Admin account created: ${ADMIN_EMAIL}`);
}

async function listUserIds() {
  const db = getPrisma();

  if (!db?.user) {
    return memoryUsers.map((item) => item.id);
  }

  const users = await db.user.findMany({
    select: { id: true },
  });

  return users.map((item) => item.id);
}

module.exports = {
  findById,
  findByEmail,
  createUser,
  validateUser,
  updateProfileImage,
  seedAdmin,
  listUserIds,
};

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

    return { id: user.id, name: user.name, email: user.email };
  }

  return db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true, phone: true },
  });
}

async function findById(id) {
  const db = getPrisma();

  if (!db?.user) {
    const user = memoryUsers.find((item) => item.id === id);
    return user ? { id: user.id, name: user.name, email: user.email, phone: user.phone } : null;
  }

  return db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true },
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
      password: passwordHash,
    };
    memoryUsers.push(user);

    return { id: user.id, name: user.name, email: user.email, phone: user.phone };
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
    select: { id: true, name: true, email: true, phone: true },
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
    };
  }

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true, phone: true, password: true },
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
  };
}

module.exports = {
  findById,
  findByEmail,
  createUser,
  validateUser,
};

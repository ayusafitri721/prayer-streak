const { PrismaClient } = require("@prisma/client");

const prismaClient = global.__prismaClient || new PrismaClient();

if (!global.__prismaClient) {
  global.__prismaClient = prismaClient;
}

module.exports = prismaClient;

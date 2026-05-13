function pickFields(record, select) {
  if (!select || !record) return record;
  const next = {};
  Object.entries(select).forEach(([key, enabled]) => {
    if (enabled) next[key] = record[key];
  });
  return next;
}

function toDateOnlyKey(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function createMemoryPrismaClient() {
  const store = {
    users: [],
    prayerLogs: [],
    streakDays: [],
    xpHistories: [],
    ids: {
      user: 1,
      prayerLog: 1,
      streakDay: 1,
      xpHistory: 1,
    },
  };

  const api = {
    __fallback: true,
    user: {
      async findUnique({ where = {}, select } = {}) {
        const byId = where.id != null ? Number(where.id) : null;
        const byEmail = where.email ? String(where.email).toLowerCase() : null;
        const user = store.users.find((item) => {
          if (byId != null) return item.id === byId;
          if (byEmail) return String(item.email).toLowerCase() === byEmail;
          return false;
        });
        return user ? pickFields({ ...user }, select) : null;
      },

      async create({ data = {}, select } = {}) {
        const record = {
          id: store.ids.user++,
          name: data.name || "",
          email: String(data.email || "").toLowerCase(),
          phone: data.phone || "",
          password: data.password || "",
          streakProtection: data.streakProtection ?? 3,
          restoreChallengeActive: Boolean(data.restoreChallengeActive),
          restoreChallengeProgress: data.restoreChallengeProgress ?? 0,
          restoreReflectionDone: Boolean(data.restoreReflectionDone),
          restoreReflectionDate: data.restoreReflectionDate ?? null,
          lastStreakEvaluatedDate: data.lastStreakEvaluatedDate ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        store.users.push(record);
        return pickFields({ ...record }, select);
      },

      async findMany({ select } = {}) {
        return store.users.map((item) => pickFields({ ...item }, select));
      },

      async update({ where = {}, data = {} } = {}) {
        const id = Number(where.id);
        const index = store.users.findIndex((item) => item.id === id);
        if (index < 0) throw new Error(`User ${id} not found`);

        const next = {
          ...store.users[index],
          ...data,
          updatedAt: new Date(),
        };

        store.users[index] = next;
        return { ...next };
      },
    },

    prayerLog: {
      async findFirst({ where = {}, orderBy, select } = {}) {
        let rows = store.prayerLogs.filter((item) => {
          if (where.userId != null && item.userId !== Number(where.userId)) return false;
          if (where.status != null && item.status !== Boolean(where.status)) return false;
          return true;
        });

        if (orderBy?.date) {
          rows = rows.sort((a, b) =>
            orderBy.date === "asc" ? a.date - b.date : b.date - a.date
          );
        }

        const first = rows[0] || null;
        return first ? pickFields({ ...first }, select) : null;
      },

      async findMany({ where = {}, orderBy = [] } = {}) {
        let rows = store.prayerLogs.filter((item) => {
          if (where.userId != null && item.userId !== Number(where.userId)) return false;
          if (where.status != null && item.status !== Boolean(where.status)) return false;
          return true;
        });

        const sorters = Array.isArray(orderBy) ? orderBy : [orderBy];
        rows = rows.sort((left, right) => {
          for (const rule of sorters) {
            if (!rule) continue;
            if (rule.date) {
              const delta = left.date - right.date;
              if (delta !== 0) return rule.date === "asc" ? delta : -delta;
            }
            if (rule.prayedAt) {
              const leftAt = left.prayedAt ? left.prayedAt.getTime() : 0;
              const rightAt = right.prayedAt ? right.prayedAt.getTime() : 0;
              const delta = leftAt - rightAt;
              if (delta !== 0) return rule.prayedAt === "asc" ? delta : -delta;
            }
          }
          return 0;
        });

        return rows.map((item) => ({ ...item }));
      },

      async count({ where = {} } = {}) {
        return store.prayerLogs.filter((item) => {
          if (where.userId != null && item.userId !== Number(where.userId)) return false;
          if (where.status != null && item.status !== Boolean(where.status)) return false;
          if (where.isOnTime != null && item.isOnTime !== Boolean(where.isOnTime)) return false;
          if (where.date != null && toDateOnlyKey(item.date) !== toDateOnlyKey(where.date)) return false;
          return true;
        }).length;
      },

      async create({ data = {} } = {}) {
        const duplicate = store.prayerLogs.some(
          (item) =>
            item.userId === Number(data.userId) &&
            item.prayerType === data.prayerType &&
            toDateOnlyKey(item.date) === toDateOnlyKey(data.date)
        );

        if (duplicate) {
          const error = new Error("Unique constraint failed on prayer log");
          error.code = "P2002";
          throw error;
        }

        const record = {
          id: store.ids.prayerLog++,
          userId: Number(data.userId),
          prayerType: data.prayerType,
          date: data.date instanceof Date ? data.date : new Date(data.date),
          status: data.status ?? true,
          prayedAt: data.prayedAt ? new Date(data.prayedAt) : null,
          isOnTime: Boolean(data.isOnTime),
          xpEarned: Number(data.xpEarned || 0),
        };

        store.prayerLogs.push(record);
        return { ...record };
      },
    },

    streakDay: {
      async findUnique({ where = {} } = {}) {
        const composite = where.userId_date || {};
        const userId = Number(composite.userId);
        const dateKey = toDateOnlyKey(composite.date);
        const row = store.streakDays.find(
          (item) => item.userId === userId && toDateOnlyKey(item.date) === dateKey
        );
        return row ? { ...row } : null;
      },

      async findMany({ where = {}, orderBy } = {}) {
        let rows = store.streakDays.filter((item) => {
          if (where.userId != null && item.userId !== Number(where.userId)) return false;
          return true;
        });

        if (orderBy?.date) {
          rows = rows.sort((a, b) =>
            orderBy.date === "asc" ? a.date - b.date : b.date - a.date
          );
        }

        return rows.map((item) => ({ ...item }));
      },

      async create({ data = {} } = {}) {
        const record = {
          id: store.ids.streakDay++,
          userId: Number(data.userId),
          date: data.date instanceof Date ? data.date : new Date(data.date),
          completedCount: Number(data.completedCount || 0),
          status: data.status || "BROKEN",
          protectionUsed: Boolean(data.protectionUsed),
          restoreProgressAfter: Number(data.restoreProgressAfter || 0),
        };
        store.streakDays.push(record);
        return { ...record };
      },
    },

    xPHistory: {
      async create({ data = {} } = {}) {
        const record = {
          id: store.ids.xpHistory++,
          userId: Number(data.userId),
          pointChange: Number(data.pointChange || 0),
          reason: data.reason || "",
          relatedDate: data.relatedDate ? new Date(data.relatedDate) : null,
          createdAt: new Date(),
        };
        store.xpHistories.push(record);
        return { ...record };
      },
    },

    async $transaction(operations = []) {
      return Promise.all(operations);
    },
  };

  return api;
}

let prismaClient = global.__prismaClient || null;

if (!prismaClient) {
  try {
    const { PrismaClient } = require("@prisma/client");
    prismaClient = new PrismaClient();
  } catch (error) {
    prismaClient = createMemoryPrismaClient();
    const message = String(error?.message || error);
    console.warn(
      `[prisma] Falling back to in-memory client: ${message.split("\n")[0]}`
    );
  }
  global.__prismaClient = prismaClient;
}

module.exports = prismaClient;

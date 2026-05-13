const axios = require("axios");

const ALADHAN_BASE_URL = "https://api.aladhan.com/v1";
const ALADHAN_DOCS_URL = "https://api.aladhan.com/v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const HIJRI_DAY_OFFSET = -1;

const hijriApi = axios.create({
  baseURL: ALADHAN_BASE_URL,
  timeout: 10000,
});

const cache = {
  gregorianMonths: new Map(),
  hijriMonths: new Map(),
};

const HIJRI_MONTH_LABELS = {
  Muharram: "Muharram",
  Safar: "Safar",
  "Rabīʿ al-Awwal": "Rabiulawal",
  "Rabīʿ ath-Thānī": "Rabiulakhir",
  "Jumādá al-Ūlá": "Jumadilawal",
  "Jumādá al-Ākhirah": "Jumadilakhir",
  Rajab: "Rajab",
  Shaʿbān: "Syaban",
  Ramaḍān: "Ramadan",
  Shawwāl: "Syawal",
  "Dhū al-Qaʿdah": "Zulkaidah",
  "Dhū al-Ḥijjah": "Zulhijah",
};

function getMonthKey(prefix, month, year) {
  return `${prefix}:${year}-${month}`;
}

function getCachedValue(store, key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt >= CACHE_TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedValue(store, key, data) {
  store.set(key, {
    fetchedAt: Date.now(),
    data,
  });
}

function getHijriMonthLabel(monthName) {
  return HIJRI_MONTH_LABELS[monthName] || monthName;
}

function toLocalIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseGregorianDate(value) {
  const [day, month, year] = String(value || "").split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function getWeekdayColumn(date) {
  return (date.getDay() + 6) % 7;
}

function formatApiDateToIso(value) {
  const [day, month, year] = String(value || "").split("-");
  return `${year}-${month}-${day}`;
}

function shiftDate(date, dayOffset) {
  const shifted = new Date(date);
  shifted.setDate(date.getDate() + dayOffset);
  return shifted;
}

async function getGregorianToHijriMonth(gregorianMonth, gregorianYear) {
  const cacheKey = getMonthKey("gtoh", gregorianMonth, gregorianYear);
  const cached = getCachedValue(cache.gregorianMonths, cacheKey);
  if (cached) return cached;

  const response = await hijriApi.get(`/gToHCalendar/${gregorianMonth}/${gregorianYear}`);
  const data = Array.isArray(response.data?.data) ? response.data.data : [];

  if (!data.length) {
    throw new Error("Kalender Hijriyah bulanan tidak tersedia.");
  }

  setCachedValue(cache.gregorianMonths, cacheKey, data);
  return data;
}

async function getHijriToGregorianMonth(hijriMonth, hijriYear) {
  const cacheKey = getMonthKey("htog", hijriMonth, hijriYear);
  const cached = getCachedValue(cache.hijriMonths, cacheKey);
  if (cached) return cached;

  const response = await hijriApi.get(`/hToGCalendar/${hijriMonth}/${hijriYear}`);
  const data = Array.isArray(response.data?.data) ? response.data.data : [];

  if (!data.length) {
    throw new Error("Kalender Hijriyah bulan aktif tidak tersedia.");
  }

  setCachedValue(cache.hijriMonths, cacheKey, data);
  return data;
}

function buildFallbackHijriData(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("id-ID-u-ca-islamic", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const adjustedDate = shiftDate(date, HIJRI_DAY_OFFSET);
  const label = formatter.format(adjustedDate);
  const parts = formatter.formatToParts(adjustedDate).reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    today: {
      weekdayLabel: date.toLocaleDateString("id-ID", { weekday: "long" }),
      day: Number.parseInt(parts.day || "1", 10),
      monthLabel: parts.month || "",
      year: parts.year || "",
      fullLabel: `${date.toLocaleDateString("id-ID", { weekday: "long" })}, ${parts.day || ""} ${parts.month || ""} ${parts.year || ""} H`.trim(),
    },
    calendar: {
      monthLabel: `${parts.month || ""} ${parts.year || ""} H`.trim(),
      entries: [],
    },
    warning: "Tanggal Hijriyah memakai fallback lokal dan disesuaikan -1 hari.",
    sourceName: "Intl Islamic Calendar (offset -1 hari)",
    sourceUrl: "https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat",
  };
}

async function getAdjustedTodayEntry(date = new Date()) {
  const adjustedReferenceDate = shiftDate(date, HIJRI_DAY_OFFSET);
  const gregorianEntries = await getGregorianToHijriMonth(
    adjustedReferenceDate.getMonth() + 1,
    adjustedReferenceDate.getFullYear()
  );
  const adjustedIso = toLocalIsoDate(adjustedReferenceDate);

  return gregorianEntries.find(
    (entry) => formatApiDateToIso(entry.gregorian?.date) === adjustedIso
  );
}

async function buildHijriCalendarMonth({
  hijriMonthNumber,
  hijriYear,
  todayReference = null,
  warning = "Tanggal Hijriyah disesuaikan -1 hari sesuai preferensi aplikasi.",
  sourceName = "Aladhan Hijri Calendar API (offset -1 hari)",
  sourceUrl = ALADHAN_DOCS_URL,
}) {
  const currentMonthEntries = await getHijriToGregorianMonth(hijriMonthNumber, hijriYear);
  const previousHijriMonthNumber = hijriMonthNumber === 1 ? 12 : hijriMonthNumber - 1;
  const previousHijriYear = hijriMonthNumber === 1 ? hijriYear - 1 : hijriYear;
  const nextHijriMonthNumber = hijriMonthNumber === 12 ? 1 : hijriMonthNumber + 1;
  const nextHijriYear = hijriMonthNumber === 12 ? hijriYear + 1 : hijriYear;
  const previousMonthEntries = await getHijriToGregorianMonth(previousHijriMonthNumber, previousHijriYear);
  const nextMonthEntries = await getHijriToGregorianMonth(nextHijriMonthNumber, nextHijriYear);

  const firstGregorianDate = parseGregorianDate(currentMonthEntries[0]?.gregorian?.date);
  const leadingCount = getWeekdayColumn(firstGregorianDate);
  const totalCurrentEntries = currentMonthEntries.length;
  const trailingCount = (7 - ((leadingCount + totalCurrentEntries) % 7)) % 7;
  const currentMonthLabel = getHijriMonthLabel(currentMonthEntries[0]?.hijri?.month?.en || "");
  const isCurrentViewedMonth =
    todayReference &&
    Number(todayReference.hijri?.month?.number) === hijriMonthNumber &&
    Number(todayReference.hijri?.year) === hijriYear;
  const todayDayNumber = isCurrentViewedMonth ? Number(todayReference.hijri?.day) : null;

  const leadingEntries = previousMonthEntries
    .slice(Math.max(previousMonthEntries.length - leadingCount, 0))
    .map((entry) => ({
      day: Number(entry.hijri?.day),
      gregorianLabel: parseGregorianDate(entry.gregorian?.date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      isToday: false,
      isCurrentMonth: false,
      holidays: Array.isArray(entry.hijri?.holidays) ? entry.hijri.holidays : [],
    }));

  const currentEntries = currentMonthEntries.map((entry) => {
    const gregorianDate = parseGregorianDate(entry.gregorian?.date);
    const day = Number(entry.hijri?.day);

    return {
      day,
      gregorianLabel: gregorianDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      isToday: todayDayNumber === day,
      isCurrentMonth: true,
      holidays: Array.isArray(entry.hijri?.holidays) ? entry.hijri.holidays : [],
    };
  });

  const trailingEntries = nextMonthEntries.slice(0, trailingCount).map((entry) => ({
    day: Number(entry.hijri?.day),
    gregorianLabel: parseGregorianDate(entry.gregorian?.date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    }),
    isToday: false,
    isCurrentMonth: false,
    holidays: Array.isArray(entry.hijri?.holidays) ? entry.hijri.holidays : [],
  }));

  return {
    monthLabel: `${currentMonthLabel} ${hijriYear} H`.trim(),
    monthNumber: hijriMonthNumber,
    year: hijriYear,
    prev: {
      monthNumber: previousHijriMonthNumber,
      year: previousHijriYear,
    },
    next: {
      monthNumber: nextHijriMonthNumber,
      year: nextHijriYear,
    },
    entries: [...leadingEntries, ...currentEntries, ...trailingEntries],
    warning,
    sourceName,
    sourceUrl,
  };
}

async function getHijriCalendarData(date = new Date()) {
  try {
    const todayEntry = await getAdjustedTodayEntry(date);

    if (!todayEntry?.hijri) {
      throw new Error("Tanggal Hijriyah hari ini tidak ditemukan.");
    }

    const hijriMonthNumber = Number(todayEntry.hijri.month.number);
    const hijriYear = Number(todayEntry.hijri.year);
    const hijriMonthLabel = getHijriMonthLabel(todayEntry.hijri.month.en);
    const warning = "Tanggal Hijriyah disesuaikan -1 hari sesuai preferensi aplikasi.";
    const sourceName = "Aladhan Hijri Calendar API (offset -1 hari)";
    const sourceUrl = ALADHAN_DOCS_URL;

    return {
      today: {
        weekdayLabel: date.toLocaleDateString("id-ID", { weekday: "long" }),
        day: Number(todayEntry.hijri.day),
        monthLabel: hijriMonthLabel,
        year: todayEntry.hijri.year,
        fullLabel: `${date.toLocaleDateString("id-ID", { weekday: "long" })}, ${todayEntry.hijri.day} ${hijriMonthLabel} ${todayEntry.hijri.year} H`,
      },
      calendar: await buildHijriCalendarMonth({
        hijriMonthNumber,
        hijriYear,
        todayReference: todayEntry,
        warning,
        sourceName,
        sourceUrl,
      }),
      warning,
      sourceName,
      sourceUrl,
    };
  } catch (error) {
    return buildFallbackHijriData(date);
  }
}

async function getHijriCalendarMonthData({ month, year, date = new Date() } = {}) {
  try {
    const todayEntry = await getAdjustedTodayEntry(date);

    if (!todayEntry?.hijri) {
      throw new Error("Tanggal Hijriyah hari ini tidak ditemukan.");
    }

    const hijriMonthNumber = Number(month || todayEntry.hijri.month.number);
    const hijriYear = Number(year || todayEntry.hijri.year);
    const warning = "Tanggal Hijriyah disesuaikan -1 hari sesuai preferensi aplikasi.";
    const sourceName = "Aladhan Hijri Calendar API (offset -1 hari)";
    const sourceUrl = ALADHAN_DOCS_URL;
    const todayMonthLabel = getHijriMonthLabel(todayEntry.hijri.month.en);

    return {
      today: {
        weekdayLabel: date.toLocaleDateString("id-ID", { weekday: "long" }),
        day: Number(todayEntry.hijri.day),
        monthLabel: todayMonthLabel,
        year: todayEntry.hijri.year,
        fullLabel: `${date.toLocaleDateString("id-ID", { weekday: "long" })}, ${todayEntry.hijri.day} ${todayMonthLabel} ${todayEntry.hijri.year} H`,
      },
      calendar: await buildHijriCalendarMonth({
        hijriMonthNumber,
        hijriYear,
        todayReference: todayEntry,
        warning,
        sourceName,
        sourceUrl,
      }),
      warning,
      sourceName,
      sourceUrl,
    };
  } catch (error) {
    return buildFallbackHijriData(date);
  }
}

module.exports = {
  getHijriCalendarData,
  getHijriCalendarMonthData,
};

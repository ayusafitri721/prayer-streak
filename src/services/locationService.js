const axios = require("axios");

const PRAYER_API_BASE_URL = process.env.PRAYER_API_BASE_URL || "https://equran.id/api/v2";
const EQURAN_DOCS_URL = "https://equran.id/apidev/shalat";
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const equranApi = axios.create({
  baseURL: PRAYER_API_BASE_URL,
  timeout: 10000,
});

const nominatimApi = axios.create({
  baseURL: NOMINATIM_BASE_URL,
  timeout: 10000,
  headers: {
    "User-Agent": "PrayerStreak/1.0 (reverse geocoding for prayer schedule)",
  },
});

const cache = {
  provinces: null,
  provincesFetchedAt: 0,
  kabkota: new Map(),
};

function normalizeRegionName(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bprovinsi\b/g, "")
    .replace(/\bdaerah khusus ibukota\b/g, "dki")
    .replace(/\bdaerah istimewa\b/g, "di")
    .replace(/\bkota administrasi\b/g, "kota")
    .replace(/\bkabupaten\b/g, "kab")
    .replace(/\bkab\.\b/g, "kab")
    .replace(/\bkotamadya\b/g, "kota")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeRegionName(value)
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
}

function scoreRegionMatch(candidate, target) {
  const normalizedCandidate = normalizeRegionName(candidate);
  const normalizedTarget = normalizeRegionName(target);

  if (!normalizedCandidate || !normalizedTarget) return 0;
  if (normalizedCandidate === normalizedTarget) return 100;
  if (normalizedCandidate.includes(normalizedTarget) || normalizedTarget.includes(normalizedCandidate)) {
    return 80;
  }

  const candidateTokens = tokenize(candidate);
  const targetTokens = tokenize(target);
  const overlap = targetTokens.filter((token) => candidateTokens.includes(token)).length;

  if (!targetTokens.length) return 0;
  return Math.round((overlap / targetTokens.length) * 60);
}

function findBestMatch(target, choices) {
  let best = null;

  choices.forEach((choice) => {
    const score = scoreRegionMatch(choice, target);
    if (!best || score > best.score) {
      best = { value: choice, score };
    }
  });

  return best && best.score >= 40 ? best.value : null;
}

function buildCityCandidateVariants(value) {
  const variants = new Set();
  const raw = String(value || "").trim();

  if (!raw) return [];

  variants.add(raw);

  const withoutDirection = raw
    .replace(/\b(selatan|utara|timur|barat|pusat)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (withoutDirection) {
    variants.add(withoutDirection);
  }

  const withoutAdministrative = raw
    .replace(/\b(kecamatan|kota administrasi|administrasi|kabupaten|kota)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (withoutAdministrative) {
    variants.add(withoutAdministrative);
  }

  const compactJakarta = raw
    .replace(/\bjakarta (selatan|utara|timur|barat|pusat)\b/gi, "jakarta")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (compactJakarta) {
    variants.add(compactJakarta);
  }

  return Array.from(variants);
}

function buildProvinceCandidateVariants(geo) {
  const variants = new Set();
  const pushValue = (value) => {
    const normalized = String(value || "").trim();
    if (normalized) {
      variants.add(normalized);
    }
  };

  pushValue(geo.address?.state);
  pushValue(geo.address?.province);
  pushValue(geo.address?.state_district);

  const displayParts = String(geo.displayName || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  displayParts.forEach(pushValue);

  const isoLevel4 = String(geo.address?.["ISO3166-2-lvl4"] || "").trim().toUpperCase();
  const isoMap = {
    "ID-JK": "DKI Jakarta",
    "ID-YO": "DI Yogyakarta",
  };

  if (isoMap[isoLevel4]) {
    pushValue(isoMap[isoLevel4]);
  }

  return Array.from(variants);
}

async function getEquranProvinces() {
  const now = Date.now();
  if (cache.provinces && now - cache.provincesFetchedAt < CACHE_TTL_MS) {
    return cache.provinces;
  }

  const response = await equranApi.get("/shalat/provinsi");
  const provinces = Array.isArray(response.data?.data) ? response.data.data : [];

  if (!provinces.length) {
    throw new Error("Daftar provinsi EQuran tidak tersedia.");
  }

  cache.provinces = provinces;
  cache.provincesFetchedAt = now;
  return provinces;
}

async function getEquranKabKota(provinsi) {
  const cacheKey = normalizeRegionName(provinsi);
  const cached = cache.kabkota.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await equranApi.post("/shalat/kabkota", { provinsi });
  const kabkota = Array.isArray(response.data?.data) ? response.data.data : [];

  if (!kabkota.length) {
    throw new Error(`Daftar kabupaten/kota untuk ${provinsi} tidak tersedia.`);
  }

  cache.kabkota.set(cacheKey, {
    fetchedAt: now,
    data: kabkota,
  });

  return kabkota;
}

async function reverseGeocodeCoordinates(latitude, longitude) {
  const response = await nominatimApi.get("/reverse", {
    params: {
      format: "jsonv2",
      lat: latitude,
      lon: longitude,
      addressdetails: 1,
      zoom: 10,
    },
    headers: {
      "Accept-Language": "id",
    },
  });

  const address = response.data?.address || {};
  const province =
    address.state ||
    address.province ||
    address.state_district ||
    null;
  const city =
    address.city ||
    address.county ||
    address.regency ||
    address.city_district ||
    address.municipality ||
    address.town ||
    address.village ||
    null;

  if (!city && !response.data?.display_name) {
    throw new Error("Lokasi tidak berhasil dipetakan ke provinsi dan kabupaten/kota.");
  }

  return {
    province,
    city,
    displayName: response.data?.display_name || `${city}, ${province}`,
    address,
  };
}

async function resolvePrayerLocationFromCoordinates(latitude, longitude) {
  const geo = await reverseGeocodeCoordinates(latitude, longitude);
  const provinces = await getEquranProvinces();
  const provinceCandidates = buildProvinceCandidateVariants(geo);
  let matchedProvince = null;

  for (const candidate of provinceCandidates) {
    matchedProvince = findBestMatch(candidate, provinces);
    if (matchedProvince) break;
  }

  if (!matchedProvince) {
    throw new Error(`Provinsi lokasi perangkat tidak cocok dengan data EQuran.`);
  }

  const kabkotaList = await getEquranKabKota(matchedProvince);
  const cityCandidates = [
    geo.city,
    geo.address?.county,
    geo.address?.city_district,
    geo.address?.municipality,
    geo.address?.town,
  ]
    .filter(Boolean)
    .flatMap((candidate) => buildCityCandidateVariants(candidate));

  let matchedKabKota = null;
  for (const candidate of cityCandidates) {
    matchedKabKota = findBestMatch(candidate, kabkotaList);
    if (matchedKabKota) break;
  }

  if (
    !matchedKabKota &&
    kabkotaList.some((item) => normalizeRegionName(item) === "kota jakarta") &&
    cityCandidates.some((candidate) => normalizeRegionName(candidate).includes("jakarta"))
  ) {
    matchedKabKota = kabkotaList.find((item) => normalizeRegionName(item) === "kota jakarta") || null;
  }

  if (!matchedKabKota) {
    throw new Error(`Kabupaten/kota "${geo.city}" tidak cocok dengan data EQuran.`);
  }

  return {
    provinsi: matchedProvince,
    kabkota: matchedKabKota,
    latitude,
    longitude,
    displayName: `${matchedKabKota}, ${matchedProvince}`,
    sourceName: "Lokasi perangkat",
    sourceUrl: EQURAN_DOCS_URL,
  };
}

function validateCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Koordinat lokasi tidak valid.");
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error("Koordinat lokasi berada di luar rentang yang diizinkan.");
  }

  return {
    latitude: lat,
    longitude: lon,
  };
}

module.exports = {
  resolvePrayerLocationFromCoordinates,
  validateCoordinates,
};

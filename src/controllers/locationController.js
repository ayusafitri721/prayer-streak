const {
  resolvePrayerLocationFromCoordinates,
  validateCoordinates,
} = require("../services/locationService");

async function syncPrayerLocation(req, res) {
  try {
    const { latitude, longitude } = validateCoordinates(req.body.latitude, req.body.longitude);
    const resolved = await resolvePrayerLocationFromCoordinates(latitude, longitude);

    const currentLocation = req.session.prayerLocation;
    const changed =
      !currentLocation ||
      currentLocation.provinsi !== resolved.provinsi ||
      currentLocation.kabkota !== resolved.kabkota;

    req.session.prayerLocation = {
      ...resolved,
      resolvedAt: new Date().toISOString(),
    };

    return res.json({
      ok: true,
      changed,
      location: req.session.prayerLocation,
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message || "Gagal menyinkronkan lokasi perangkat.",
    });
  }
}

module.exports = {
  syncPrayerLocation,
};

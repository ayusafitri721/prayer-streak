const ADHAN_SOUND_OPTIONS = Object.freeze([
  {
    key: "beautiful-adhan",
    label: "Adzan Merdu",
    description: "Audio online dari Wikimedia Commons dengan lantunan penuh.",
    type: "audio",
    audioUrl:
      "https://upload.wikimedia.org/wikipedia/commons/transcoded/4/45/Beautiful_adhan.ogg/Beautiful_adhan.ogg.mp3",
    sourceLabel: "Wikimedia Commons",
  },
  {
    key: "azan-classic",
    label: "Adzan Klasik",
    description: "Audio online bernuansa klasik untuk pengingat waktu salat.",
    type: "audio",
    audioUrl:
      "https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e8/Azan.ogg/Azan.ogg.mp3",
    sourceLabel: "Wikimedia Commons",
  },
  {
    key: "browser-voice",
    label: "Suara Browser",
    description: "Pengingat suara singkat memakai speech synthesis perangkat.",
    type: "speech",
    audioUrl: "",
    sourceLabel: "Browser",
  },
  {
    key: "popup-only",
    label: "Popup Saja",
    description: "Tetap tampilkan popup tanpa memutar suara apa pun.",
    type: "silent",
    audioUrl: "",
    sourceLabel: "Aplikasi",
  },
]);

const DEFAULT_ADHAN_SETTINGS = Object.freeze({
  enabled: true,
  soundKey: "beautiful-adhan",
  volume: 80,
});

function clampVolume(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_ADHAN_SETTINGS.volume;
  }
  return Math.min(100, Math.max(0, parsed));
}

function getAdhanSoundOptions() {
  return ADHAN_SOUND_OPTIONS.map((option) => ({ ...option }));
}

function findAdhanSound(soundKey) {
  return ADHAN_SOUND_OPTIONS.find((option) => option.key === soundKey) || ADHAN_SOUND_OPTIONS[0];
}

function getAdhanSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const selectedSound = findAdhanSound(settings.soundKey || DEFAULT_ADHAN_SETTINGS.soundKey);

  return {
    enabled:
      typeof settings.enabled === "boolean"
        ? settings.enabled
        : DEFAULT_ADHAN_SETTINGS.enabled,
    soundKey: selectedSound.key,
    volume: clampVolume(settings.volume),
  };
}

function parseAdhanSettings(input = {}) {
  return getAdhanSettings({
    enabled: input.enabled === "on" || input.enabled === "true",
    soundKey: input.soundKey,
    volume: input.volume,
  });
}

function resolveAdhanSound(settings) {
  const normalizedSettings = getAdhanSettings(settings);
  const selectedSound = findAdhanSound(normalizedSettings.soundKey);

  return {
    ...selectedSound,
    volume: normalizedSettings.volume,
    enabled: normalizedSettings.enabled,
  };
}

module.exports = {
  DEFAULT_ADHAN_SETTINGS,
  getAdhanSettings,
  getAdhanSoundOptions,
  parseAdhanSettings,
  resolveAdhanSound,
};

const splashScreen = document.querySelector("[data-splash-screen]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const passwordToggleButtons = Array.from(document.querySelectorAll("[data-password-toggle]"));

if (passwordToggleButtons.length) {
  passwordToggleButtons.forEach((button) => {
    const targetKey = button.dataset.passwordToggle;
    const input = document.querySelector(`[data-password-input="${targetKey}"]`);
    const showIcon = button.querySelector('[data-password-icon="show"]');
    const hideIcon = button.querySelector('[data-password-icon="hide"]');

    if (!input) return;

    const syncPasswordState = () => {
      const isVisible = input.type === "text";
      if (showIcon) showIcon.classList.toggle("hidden", isVisible);
      if (hideIcon) hideIcon.classList.toggle("hidden", !isVisible);
      button.setAttribute(
        "aria-label",
        isVisible ? "Sembunyikan password" : "Tampilkan password"
      );
      button.setAttribute("aria-pressed", isVisible ? "true" : "false");
    };

    button.addEventListener("click", () => {
      const cursorStart = input.selectionStart;
      const cursorEnd = input.selectionEnd;
      input.type = input.type === "password" ? "text" : "password";
      input.focus({ preventScroll: true });
      if (cursorStart !== null && cursorEnd !== null) {
        input.setSelectionRange(cursorStart, cursorEnd);
      }
      syncPasswordState();
    });

    syncPasswordState();
  });
}

if (splashScreen) {
  const splashKey = "prayer-streak-splash-seen";
  const hasSeenSplash = window.sessionStorage.getItem(splashKey) === "true";
  let splashDone = false;

  const hideSplash = () => {
    if (splashDone) return;
    splashDone = true;
    splashScreen.classList.add("splash-hide");
    document.body.classList.remove("overflow-hidden");
    window.setTimeout(() => {
      splashScreen.remove();
    }, prefersReducedMotion ? 0 : 450);
  };

  if (hasSeenSplash) {
    hideSplash();
  } else {
    document.body.classList.add("overflow-hidden");
    const minimumDuration = prefersReducedMotion ? 0 : 1450;
    const startTime = Date.now();

    const completeSplash = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minimumDuration - elapsed);
      window.setTimeout(() => {
        window.sessionStorage.setItem(splashKey, "true");
        hideSplash();
      }, remaining);
    };

    if (document.readyState === "complete") {
      completeSplash();
    } else {
      window.addEventListener("load", completeSplash, { once: true });
      window.setTimeout(completeSplash, minimumDuration + 600);
    }
  }
}

const authTransitionType = document.body?.dataset.pageTransitionType || "";
const authTransitionName = document.body?.dataset.pageTransitionName || "";
const authTransitionMessages = {
  login: {
    submitTitle: "Masuk ke Prayer Streak",
    submitSubtitle: "Menyiapkan dashboard dan progres ibadahmu...",
    arrivalTitle: authTransitionName ? `Assalamu'alaikum, ${authTransitionName}` : "Login berhasil",
    arrivalSubtitle: "Semoga konsistensi ibadahmu dimudahkan hari ini.",
  },
  logout: {
    submitTitle: "Keluar dari akun",
    submitSubtitle: "Menyimpan sesi dan menutup akses akunmu...",
    arrivalTitle: "Logout berhasil",
    arrivalSubtitle: "Sampai jumpa lagi di Prayer Streak.",
  },
};

const showAuthTransitionOverlay = (type, options = {}) => {
  const message = authTransitionMessages[type];
  if (!message) return null;

  const overlay = document.createElement("div");
  const card = document.createElement("div");
  const glow = document.createElement("div");
  const iconWrap = document.createElement("div");
  const title = document.createElement("p");
  const subtitle = document.createElement("p");

  overlay.className = "fixed inset-0 z-[130] flex items-center justify-center bg-[#344E41]/40 px-5 backdrop-blur-sm";
  Object.assign(overlay.style, {
    opacity: "0",
    transition: prefersReducedMotion ? "none" : "opacity 0.3s ease",
  });

  card.className = "relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(160deg,rgba(36,67,56,0.97)_0%,rgba(88,129,87,0.96)_100%)] px-6 py-7 text-center text-white shadow-[0_24px_80px_rgba(17,24,39,0.26)]";
  Object.assign(card.style, {
    transform: prefersReducedMotion ? "none" : "translateY(18px) scale(0.96)",
    opacity: "0",
    transition: prefersReducedMotion ? "none" : "transform 0.34s ease, opacity 0.34s ease",
  });

  glow.className = "pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-white/10 blur-3xl";
  iconWrap.className = "relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10";
  iconWrap.innerHTML =
    type === "login"
      ? '<svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path stroke-linecap="round" stroke-linejoin="round" d="M10 17l5-5-5-5"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12H3"/></svg>'
      : '<svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path stroke-linecap="round" stroke-linejoin="round" d="M14 7l5 5-5 5"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12H9"/></svg>';

  title.className = "mt-5 text-2xl font-bold tracking-tight";
  title.textContent = options.arrival ? message.arrivalTitle : message.submitTitle;
  subtitle.className = "mt-2 text-sm leading-6 text-white/75";
  subtitle.textContent = options.arrival ? message.arrivalSubtitle : message.submitSubtitle;

  card.append(glow, iconWrap, title, subtitle);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    card.style.opacity = "1";
    card.style.transform = "translateY(0) scale(1)";
  });

  const close = () => {
    overlay.style.opacity = "0";
    card.style.opacity = "0";
    card.style.transform = prefersReducedMotion ? "none" : "translateY(10px) scale(0.98)";
    window.setTimeout(() => overlay.remove(), prefersReducedMotion ? 0 : 260);
  };

  if (options.autoHide) {
    window.setTimeout(close, prefersReducedMotion ? 0 : options.duration || 1100);
  }

  return { overlay, close };
};

const authSubmitForms = Array.from(document.querySelectorAll("form[data-auth-submit]"));

if (authSubmitForms.length) {
  authSubmitForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (form.dataset.authSubmitting === "true") return;

      event.preventDefault();
      form.dataset.authSubmitting = "true";
      form.setAttribute("aria-busy", "true");
      form.querySelectorAll("button").forEach((element) => {
        if (element.type === "hidden") return;
        element.disabled = true;
      });

      showAuthTransitionOverlay(form.dataset.authSubmit, { autoHide: false });
      window.setTimeout(() => {
        form.submit();
      }, prefersReducedMotion ? 0 : 260);
    });
  });
}

if (authTransitionType) {
  const splashVisible =
    splashScreen &&
    splashScreen.style.display !== "none" &&
    !splashScreen.classList.contains("splash-hide");

  window.setTimeout(() => {
    showAuthTransitionOverlay(authTransitionType, {
      arrival: true,
      autoHide: true,
      duration: 1200,
    });
  }, splashVisible && !prefersReducedMotion ? 1550 : 120);
}

const surahSearchInput = document.querySelector("[data-surah-search]");

if (surahSearchInput) {
  const surahCards = Array.from(document.querySelectorAll("[data-surah-card]"));
  const emptyState = document.querySelector("[data-surah-empty]");

  const applyFilter = () => {
    const keyword = surahSearchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    surahCards.forEach((card) => {
      const value = card.dataset.surahSearchValue || "";
      const isVisible = !keyword || value.includes(keyword);
      card.classList.toggle("hidden", !isVisible);
      if (isVisible) visibleCount += 1;
    });

    if (emptyState) {
      emptyState.classList.toggle("hidden", visibleCount > 0);
    }
  };

  surahSearchInput.addEventListener("input", applyFilter);
  applyFilter();
}

const versePlayer = document.querySelector("[data-verse-player]");

if (versePlayer) {
  const audio = versePlayer.querySelector("[data-surah-audio]");
  const title = versePlayer.querySelector("[data-verse-player-title]");
  const status = versePlayer.querySelector("[data-verse-player-status]");
  const qoriSelect = versePlayer.querySelector("[data-qori-select]");
  const buttons = Array.from(document.querySelectorAll("[data-verse-play]"));
  const cards = Array.from(document.querySelectorAll("[data-verse-card]"));
  const timingCache = new Map();
  const surahNumber = Number(versePlayer.dataset.surahNumber || 0);
  let activeVerseNumber = null;
  let selectedQori = qoriSelect?.value || "02";

  const parseAudioUrls = (value) => {
    try {
      return JSON.parse(value || "{}");
    } catch {
      return {};
    }
  };

  const getSurahAudioUrl = () => {
    const urls = parseAudioUrls(versePlayer.dataset.surahAudioUrls);
    return urls[selectedQori] || versePlayer.dataset.surahAudioUrl || "";
  };

  const getVerseAudioUrl = (button, qori = selectedQori) => {
    const urls = parseAudioUrls(button.dataset.verseAudioUrls);
    return urls[qori] || button.dataset.verseAudioUrl || "";
  };

  const hasImplicitOpening = () => surahNumber > 1 && surahNumber !== 9;

  const scrollToVerse = (verseNumber) => {
    const card = cards.find((item) => item.dataset.verseNumber === String(verseNumber));
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const setCardState = (verseNumber, isActive) => {
    const card = cards.find((item) => item.dataset.verseNumber === String(verseNumber));
    if (!card) return;

    card.classList.toggle("border-[#588157]/40", isActive);
    card.classList.toggle("bg-[#588157]/10", isActive);
    card.classList.toggle("shadow-md", isActive);
    card.classList.toggle("border-[#A3B18A]/30", !isActive);
    card.classList.toggle("bg-[#F6F1E9]/60", !isActive);
  };

  const syncButtons = () => {
    buttons.forEach((button) => {
      const isCurrent = button.dataset.verseNumber === String(activeVerseNumber);
      const label = button.querySelector("[data-verse-play-label]");
      const icon = button.querySelector("[data-verse-play-icon]");

      if (label) {
        label.textContent = isCurrent && !audio.paused && !audio.ended
          ? "Sedang dibaca"
          : isCurrent
            ? "Lanjutkan dari sini"
            : "Lompat ke ayat";
      }

      if (icon) {
        icon.innerHTML = isCurrent && !audio.paused && !audio.ended
          ? '<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>'
          : '<path d="M8 5v14l11-7z"/>';
      }

      button.classList.toggle("border-[#588157]/40", isCurrent);
      button.classList.toggle("bg-[#588157]/15", isCurrent);
      button.classList.toggle("text-[#588157]", isCurrent);
      button.classList.toggle("border-[#A3B18A]/30", !isCurrent);
      button.classList.toggle("bg-white/70", !isCurrent);
      button.classList.toggle("text-[#344E41]/80", !isCurrent);
    });

    cards.forEach((card) => {
      setCardState(card.dataset.verseNumber, card.dataset.verseNumber === String(activeVerseNumber));
    });
  };

  const updatePlayerText = (message) => {
    if (!title || !status) return;

    if (message) {
      status.textContent = message;
      return;
    }

    if (!getSurahAudioUrl()) {
      title.textContent = "Audio surat tidak tersedia";
      status.textContent = "Audio surat penuh belum tersedia untuk qori ini.";
      return;
    }

    const currentTiming = timingCache.get(selectedQori);
    if (!activeVerseNumber) {
      if (currentTiming?.timings?.length && (audio.currentTime || 0) + 0.15 < currentTiming.timings[0].start) {
        title.textContent = "Pembuka surat sedang diputar";
        status.textContent = "Penanda ayat akan mulai saat ayat 1 masuk.";
        return;
      }

      title.textContent = "Dengarkan surat tanpa jeda";
      status.textContent = "Audio berjalan kontinu. Tombol ayat dipakai untuk lompat ke posisi ayat.";
      return;
    }

    title.textContent = `Sekarang sekitar ayat ${activeVerseNumber}`;

    if (currentTiming?.state === "loading") {
      status.textContent = "Audio tetap kontinu. Penanda posisi ayat sedang disiapkan.";
      return;
    }

    if (currentTiming?.timings?.length && (audio.currentTime || 0) + 0.15 < currentTiming.timings[0].start) {
      status.textContent = "Pembuka surat sedang diputar. Penanda ayat akan mulai saat ayat 1 masuk.";
      return;
    }

    if (audio.ended) {
      status.textContent = `Audio surat selesai diputar di sekitar ayat ${activeVerseNumber}.`;
      return;
    }

    status.textContent = audio.paused
      ? `Audio dijeda di sekitar ayat ${activeVerseNumber}.`
      : `Sedang memutar surat penuh, penanda aktif di sekitar ayat ${activeVerseNumber}.`;
  };

  const swapAudioSource = async (nextUrl, options = {}) => {
    if (!audio || !nextUrl) return;

    const { preserveCurrentTime = false, resumePlayback = false } = options;
    const previousTime =
      preserveCurrentTime && Number.isFinite(audio.currentTime) ? audio.currentTime : 0;

    if (audio.dataset.activeSrc === nextUrl) {
      if (resumePlayback) {
        try {
          await audio.play();
        } catch {}
      }
      return;
    }

    await new Promise((resolve) => {
      let settled = false;
      const finalize = async () => {
        if (settled) return;
        settled = true;

        if (preserveCurrentTime && previousTime > 0) {
          try {
            audio.currentTime = previousTime;
          } catch {}
        }

        if (resumePlayback) {
          try {
            await audio.play();
          } catch {}
        }

        resolve();
      };

      audio.dataset.activeSrc = nextUrl;
      audio.src = nextUrl;
      audio.load();
      audio.addEventListener("loadedmetadata", finalize, { once: true });
      window.setTimeout(finalize, 900);
    });
  };

  const loadAudioDuration = (url) =>
    new Promise((resolve) => {
      if (!url) {
        resolve(0);
        return;
      }

      const probe = document.createElement("audio");
      let settled = false;
      const cleanup = () => {
        probe.removeAttribute("src");
        probe.load();
      };
      const finalize = (duration = 0) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(Number.isFinite(duration) ? duration : 0);
      };

      probe.preload = "metadata";
      probe.addEventListener("loadedmetadata", () => finalize(probe.duration), { once: true });
      probe.addEventListener("error", () => finalize(0), { once: true });
      window.setTimeout(() => finalize(0), 8000);
      probe.src = url;
      probe.load();
    });

  const normalizeTimings = (entry) => {
    if (!entry?.rawTimings?.length) return entry?.timings || [];

    const totalRawDuration = entry.rawTimings.reduce((sum, item) => sum + item.duration, 0);
    const fullDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const extraDuration = fullDuration > totalRawDuration ? fullDuration - totalRawDuration : 0;
    const firstDurations = entry.rawTimings
      .slice(0, 3)
      .map((item) => item.duration)
      .filter((duration) => duration > 0);
    const averageOpeningDuration = firstDurations.length
      ? firstDurations.reduce((sum, duration) => sum + duration, 0) / firstDurations.length
      : 0;
    const leadInLimit = Math.min(12, Math.max(4, averageOpeningDuration * 1.35));
    const leadInDuration =
      hasImplicitOpening() && extraDuration > 0.35 ? Math.min(extraDuration, leadInLimit) : 0;
    const playableDuration = fullDuration > leadInDuration ? fullDuration - leadInDuration : 0;
    const scale = playableDuration > 0 && totalRawDuration > 0 ? playableDuration / totalRawDuration : 1;

    entry.leadInDuration = leadInDuration;
    entry.timings = entry.rawTimings.map((item) => ({
      verseNumber: item.verseNumber,
      start: leadInDuration + item.start * scale,
      duration: item.duration * scale,
    }));

    return entry.timings;
  };

  const ensureVerseTimings = async (qori = selectedQori) => {
    const existing = timingCache.get(qori);
    if (existing?.state === "ready") return existing;
    if (existing?.state === "loading") return existing.promise;

    const entry = { state: "loading", rawTimings: [], timings: [] };
    entry.promise = (async () => {
      const durations = new Array(buttons.length).fill(0);
      let cursor = 0;
      let nextIndex = 0;
      const workerCount = Math.min(4, Math.max(1, buttons.length));

      updatePlayerText("Menyiapkan posisi lompat ayat untuk qori ini...");

      const worker = async () => {
        while (nextIndex < buttons.length) {
          const currentIndex = nextIndex;
          nextIndex += 1;
          durations[currentIndex] = await loadAudioDuration(getVerseAudioUrl(buttons[currentIndex], qori));
        }
      };

      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      entry.rawTimings = buttons.map((button, index) => {
        const item = {
          verseNumber: Number(button.dataset.verseNumber),
          start: cursor,
          duration: durations[index] || 0,
        };
        cursor += item.duration;
        return item;
      });

      if (!entry.rawTimings.some((item) => item.duration > 0)) {
        throw new Error("Verse timing unavailable");
      }

      entry.state = "ready";
      normalizeTimings(entry);
      updatePlayerText();
      return entry;
    })().catch((error) => {
      timingCache.delete(qori);
      updatePlayerText("Penanda ayat gagal disiapkan. Coba lagi beberapa saat.");
      throw error;
    });

    timingCache.set(qori, entry);
    return entry.promise;
  };

  const getCurrentTimingEntry = () => timingCache.get(selectedQori);

  const getVerseActivationStart = (timing, index) => {
    if (!timing) return 0;
    if (index === 0) return timing.start;

    const duration = Number.isFinite(timing.duration) && timing.duration > 0 ? timing.duration : 0;
    const activationDelay = Math.min(0.75, Math.max(0.18, duration * 0.13));
    return timing.start + activationDelay;
  };

  const getVerseForCurrentTime = () => {
    const currentTiming = getCurrentTimingEntry();
    const timings = currentTiming?.timings || [];
    if (!timings.length) return null;

    const currentTime = Math.max(0, audio.currentTime || 0);
    if (currentTime < getVerseActivationStart(timings[0], 0)) {
      return null;
    }

    for (let index = timings.length - 1; index >= 0; index -= 1) {
      if (currentTime >= getVerseActivationStart(timings[index], index)) {
        return timings[index];
      }
    }

    return timings[0];
  };

  const setActiveVerse = (verseNumber, options = {}) => {
    if (!verseNumber) return;
    activeVerseNumber = verseNumber;
    syncButtons();
    updatePlayerText();
    if (options.scroll) {
      scrollToVerse(verseNumber);
    }
  };

  const jumpToVerse = async (verseNumber, options = {}) => {
    const shouldPlay = options.play !== false;
    const surahAudioUrl = getSurahAudioUrl();
    if (!surahAudioUrl) {
      updatePlayerText("Audio surat penuh tidak tersedia untuk qori ini.");
      return;
    }

    await swapAudioSource(surahAudioUrl, {
      preserveCurrentTime: audio.currentTime > 0,
      resumePlayback: false,
    });

    let timingEntry = getCurrentTimingEntry();
    if (!timingEntry || timingEntry.state !== "ready") {
      try {
        timingEntry = await ensureVerseTimings(selectedQori);
      } catch {
        updatePlayerText("Penanda ayat gagal disiapkan. Coba lagi beberapa saat.");
        return;
      }
    }

    normalizeTimings(timingEntry);
    const target = timingEntry.timings.find((item) => item.verseNumber === Number(verseNumber));
    if (!target) {
      updatePlayerText("Posisi ayat belum bisa dipetakan untuk audio ini.");
      return;
    }

    setActiveVerse(Number(verseNumber), { scroll: true });

    try {
      audio.currentTime = Math.max(0, target.start);
    } catch {}

    if (shouldPlay) {
      try {
        await audio.play();
      } catch {
        updatePlayerText(`Posisi ayat ${verseNumber} sudah siap. Tekan play untuk lanjut.`);
        return;
      }
    }

    updatePlayerText();
  };

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const verseNumber = Number(button.dataset.verseNumber);

      if (verseNumber === activeVerseNumber) {
        if (!audio.paused && !audio.ended) {
          audio.pause();
          return;
        }

        if (audio.ended) {
          await jumpToVerse(verseNumber);
          return;
        }

        try {
          await audio.play();
          return;
        } catch {
          updatePlayerText(`Posisi ayat ${verseNumber} sudah siap. Tekan lagi untuk lanjut.`);
          return;
        }
      }

      await jumpToVerse(verseNumber);
    });
  });

  if (qoriSelect) {
    qoriSelect.addEventListener("change", async (event) => {
      selectedQori = event.currentTarget.value;
      const nextSurahAudioUrl = getSurahAudioUrl();

      if (!nextSurahAudioUrl) {
        activeVerseNumber = null;
        syncButtons();
        updatePlayerText();
        return;
      }

      await swapAudioSource(nextSurahAudioUrl, {
        preserveCurrentTime: audio.currentTime > 0,
        resumePlayback: !audio.paused && !audio.ended,
      });

      const currentTiming = timingCache.get(selectedQori);
      if (currentTiming?.state === "ready") {
        normalizeTimings(currentTiming);
      } else {
        ensureVerseTimings(selectedQori).catch(() => {});
      }

      const currentVerse = getVerseForCurrentTime();
      if (currentVerse) {
        setActiveVerse(currentVerse.verseNumber);
      } else {
        activeVerseNumber = null;
        syncButtons();
        updatePlayerText();
      }
    });
  }

  audio.addEventListener("play", () => {
    if (!activeVerseNumber) {
      const currentVerse = getVerseForCurrentTime();
      if (currentVerse) {
        activeVerseNumber = currentVerse.verseNumber;
      }
    }
    syncButtons();
    updatePlayerText();
  });

  audio.addEventListener("pause", () => {
    syncButtons();
    updatePlayerText();
  });

  audio.addEventListener("ended", () => {
    syncButtons();
    updatePlayerText();
  });

  audio.addEventListener("loadedmetadata", () => {
    const currentTiming = getCurrentTimingEntry();
    if (currentTiming?.state === "ready") {
      normalizeTimings(currentTiming);
    }
  });

  audio.addEventListener("timeupdate", () => {
    const currentVerse = getVerseForCurrentTime();
    if (!currentVerse) {
      if (activeVerseNumber !== null) {
        activeVerseNumber = null;
        syncButtons();
      }
      updatePlayerText();
      return;
    }

    if (currentVerse.verseNumber === activeVerseNumber) return;
    setActiveVerse(currentVerse.verseNumber);
  });

  const initialSurahAudioUrl = getSurahAudioUrl();
  if (initialSurahAudioUrl) {
    swapAudioSource(initialSurahAudioUrl).catch(() => {});
    ensureVerseTimings(selectedQori).catch(() => {});
  } else {
    updatePlayerText();
  }

  syncButtons();
  updatePlayerText();
}

const streakDashboard = document.querySelector("[data-streak-complete='true']");

if (streakDashboard) {
  const streakCount = streakDashboard.dataset.streakCount || "1";
  const overlay = document.createElement("div");
  overlay.className = "streak-celebration fixed inset-0 z-50 flex items-center justify-center bg-[#344E41]/35 px-4 backdrop-blur-sm";
  overlay.innerHTML = `
    <div class="streak-pop rounded-[2rem] border border-[#D4A373]/60 bg-[#F6F1E9] px-8 py-7 text-center shadow-2xl shadow-[#344E41]/25">
      <div class="flame-badge relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#D4A373]/20">
        <div class="flame-glow absolute inset-0 rounded-full bg-[#D4A373]/30"></div>
        <div class="flame-core relative text-7xl">🔥</div>
      </div>
      <p class="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#588157]">Streak menyala</p>
      <h2 class="mt-2 text-3xl font-bold text-[#344E41]">${streakCount} hari</h2>
      <p class="mt-2 max-w-xs text-sm leading-6 text-[#344E41]/70">Target salat hari ini selesai.</p>
    </div>
  `;

  document.body.appendChild(overlay);

  window.setTimeout(() => {
    overlay.classList.add("streak-celebration-hide");
    window.setTimeout(() => overlay.remove(), 350);
  }, 1800);
}

// ── Share Ayat sebagai Gambar ──────────────────────────────────────
const verseSection = document.querySelector("[data-verse-section]");
const contextMenu = document.getElementById("verse-context-menu");
const shareCard = document.getElementById("share-image-card");

if (verseSection && contextMenu && shareCard) {
  let activeCard = null;

  const surahNameLatin = verseSection.dataset.surahNameLatin;
  const surahNameArabic = verseSection.dataset.surahNameArabic;
  const surahNumber = verseSection.dataset.surahNumber;

  // ── Toast notification ──
  const showToast = (message) => {
    const existing = document.getElementById("share-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "share-toast";
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%) translateY(20px)",
      background: "#344E41",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "10px",
      fontSize: "14px",
      zIndex: "10000",
      opacity: "0",
      transition: "opacity 0.3s, transform 0.3s",
      pointerEvents: "none",
    });
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  // ── Context menu positioning (anchored to button) ──
  const showContextMenu = (button, card) => {
    activeCard = card;
    contextMenu.style.display = "block";

    const rect = button.getBoundingClientRect();
    const menuW = contextMenu.offsetWidth;
    const menuH = contextMenu.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right - menuW;
    let top = rect.bottom + 6;
    if (left < 8) left = 8;
    if (left + menuW > vw - 8) left = vw - menuW - 8;
    if (top + menuH > vh - 8) top = rect.top - menuH - 6;

    contextMenu.style.left = left + "px";
    contextMenu.style.top = top + "px";
  };

  const hideContextMenu = () => {
    contextMenu.style.display = "none";
    activeCard = null;
  };

  // ── 3-dot button click ──
  verseSection.addEventListener("click", (e) => {
    const moreBtn = e.target.closest("[data-verse-more]");
    if (!moreBtn) return;

    e.stopPropagation();
    const card = moreBtn.closest("[data-verse-card]");
    if (!card) return;

    if (contextMenu.style.display === "block" && activeCard === card) {
      hideContextMenu();
    } else {
      showContextMenu(moreBtn, card);
    }
  });

  // ── Dismiss menu ──
  document.addEventListener("click", (e) => {
    if (contextMenu.style.display === "block" && !contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });
  document.addEventListener("scroll", () => hideContextMenu(), true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideContextMenu();
  });

  // ── Copy text ──
  contextMenu.querySelector('[data-action="copy-text"]').addEventListener("click", () => {
    if (!activeCard) return;

    const arabic = activeCard.dataset.verseArabic;
    const latin = activeCard.dataset.verseLatin;
    const translation = activeCard.dataset.verseTranslation;
    const verseNum = activeCard.dataset.verseNumber;
    const info = `QS. ${surahNameLatin} (${surahNameArabic}) : ${verseNum}`;

    let text = arabic + "\n\n";
    if (latin) text += latin + "\n\n";
    text += translation + "\n\n" + info;

    navigator.clipboard.writeText(text).then(() => {
      showToast("Teks ayat berhasil disalin");
    }).catch(() => {
      showToast("Gagal menyalin teks");
    });

    hideContextMenu();
  });

  // ── Generate image helper ──
  const generateImage = async (card) => {
    if (!card) return null;
    if (typeof html2canvas === "undefined") {
      showToast("Gagal memuat library gambar");
      return null;
    }

    const arabic = card.dataset.verseArabic;
    const latin = card.dataset.verseLatin;
    const translation = card.dataset.verseTranslation;
    const verseNum = card.dataset.verseNumber;

    shareCard.querySelector("#share-arabic").textContent = arabic;
    shareCard.querySelector("#share-latin").textContent = latin || "";
    shareCard.querySelector("#share-latin").style.display = latin ? "block" : "none";
    shareCard.querySelector("#share-translation").textContent = translation;
    shareCard.querySelector("#share-surah-info").textContent =
      `QS. ${surahNameLatin} (${surahNameArabic}) : ${verseNum}`;

    showToast("Membuat gambar...");

    const canvas = await html2canvas(shareCard, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const fileName = `QS${surahNumber}-Ayat${verseNum}.png`;
    return { blob, fileName };
  };

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ── Share image ──
  contextMenu.querySelector('[data-action="share-image"]').addEventListener("click", async () => {
    const card = activeCard;
    hideContextMenu();
    try {
      const result = await generateImage(card);
      if (!result) return;

      if (navigator.share && navigator.canShare) {
        const file = new File([result.blob], result.fileName, { type: "image/png" });
        const shareData = { files: [file] };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          showToast("Berhasil dibagikan");
          return;
        }
      }

      // Fallback: download
      downloadBlob(result.blob, result.fileName);
      showToast("Gambar berhasil diunduh");
    } catch (err) {
      console.error("Share image error:", err);
      showToast("Gagal membuat gambar");
    }
  });

  // ── Download image ──
  contextMenu.querySelector('[data-action="download-image"]').addEventListener("click", async () => {
    const card = activeCard;
    hideContextMenu();
    try {
      const result = await generateImage(card);
      if (!result) return;

      downloadBlob(result.blob, result.fileName);
      showToast("Gambar berhasil diunduh");
    } catch (err) {
      console.error("Download image error:", err);
      showToast("Gagal membuat gambar");
    }
  });
}

// ── Share Hadis sebagai Gambar ──────────────────────────────────────
const hadisDetail = document.querySelector("[data-hadis-detail]");
const hadisContextMenu = document.getElementById("hadis-context-menu");
const hadisShareCard = document.getElementById("hadis-share-image-card");

if (hadisDetail && hadisContextMenu && hadisShareCard) {
  const hadisName = hadisDetail.dataset.hadisName;
  const hadisSlug = hadisDetail.dataset.hadisSlug;
  const hadisNumber = hadisDetail.dataset.hadisNumber;
  const hadisArab = hadisDetail.dataset.hadisArab;
  const hadisTranslation = hadisDetail.dataset.hadisTranslation;

  // ── Toast notification ──
  const showHadisToast = (message) => {
    const existing = document.getElementById("share-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "share-toast";
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%) translateY(20px)",
      background: "#344E41",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "10px",
      fontSize: "14px",
      zIndex: "10000",
      opacity: "0",
      transition: "opacity 0.3s, transform 0.3s",
      pointerEvents: "none",
    });
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  // ── Context menu positioning ──
  const showHadisMenu = (button) => {
    hadisContextMenu.style.display = "block";

    const rect = button.getBoundingClientRect();
    const menuW = hadisContextMenu.offsetWidth;
    const menuH = hadisContextMenu.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right - menuW;
    let top = rect.bottom + 6;
    if (left < 8) left = 8;
    if (left + menuW > vw - 8) left = vw - menuW - 8;
    if (top + menuH > vh - 8) top = rect.top - menuH - 6;

    hadisContextMenu.style.left = left + "px";
    hadisContextMenu.style.top = top + "px";
  };

  const hideHadisMenu = () => {
    hadisContextMenu.style.display = "none";
  };

  // ── 3-dot button click ──
  const moreBtn = hadisDetail.querySelector("[data-hadis-more]");
  if (moreBtn) {
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (hadisContextMenu.style.display === "block") {
        hideHadisMenu();
      } else {
        showHadisMenu(moreBtn);
      }
    });
  }

  // ── Dismiss menu ──
  document.addEventListener("click", (e) => {
    if (hadisContextMenu.style.display === "block" && !hadisContextMenu.contains(e.target)) {
      hideHadisMenu();
    }
  });
  document.addEventListener("scroll", () => hideHadisMenu(), true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideHadisMenu();
  });

  // ── Copy text ──
  hadisContextMenu.querySelector('[data-hadis-action="copy-text"]').addEventListener("click", () => {
    const info = `${hadisName} No. ${hadisNumber}`;

    let text = hadisArab + "\n\n" + hadisTranslation + "\n\n" + info;

    navigator.clipboard.writeText(text).then(() => {
      showHadisToast("Teks hadis berhasil disalin");
    }).catch(() => {
      showHadisToast("Gagal menyalin teks");
    });

    hideHadisMenu();
  });

  // ── Generate image helper ──
  const generateHadisImage = async () => {
    if (typeof html2canvas === "undefined") {
      showHadisToast("Gagal memuat library gambar");
      return null;
    }

    const maxArab = 500;
    const maxTranslation = 400;
    const arabText = hadisArab.length > maxArab ? hadisArab.substring(0, maxArab) + "..." : hadisArab;
    const transText = hadisTranslation.length > maxTranslation ? hadisTranslation.substring(0, maxTranslation) + "..." : hadisTranslation;

    hadisShareCard.querySelector("#hadis-share-arabic").textContent = arabText;
    hadisShareCard.querySelector("#hadis-share-translation").textContent = transText;
    hadisShareCard.querySelector("#hadis-share-info").textContent =
      `${hadisName} No. ${hadisNumber}`;

    showHadisToast("Membuat gambar...");

    const canvas = await html2canvas(hadisShareCard, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const fileName = `Hadis-${hadisSlug}-No${hadisNumber}.png`;
    return { blob, fileName };
  };

  const downloadHadisBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ── Share image ──
  hadisContextMenu.querySelector('[data-hadis-action="share-image"]').addEventListener("click", async () => {
    hideHadisMenu();
    try {
      const result = await generateHadisImage();
      if (!result) return;

      if (navigator.share && navigator.canShare) {
        const file = new File([result.blob], result.fileName, { type: "image/png" });
        const shareData = { files: [file] };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          showHadisToast("Berhasil dibagikan");
          return;
        }
      }

      downloadHadisBlob(result.blob, result.fileName);
      showHadisToast("Gambar berhasil diunduh");
    } catch (err) {
      console.error("Share hadis image error:", err);
      showHadisToast("Gagal membuat gambar");
    }
  });

  // ── Download image ──
  hadisContextMenu.querySelector('[data-hadis-action="download-image"]').addEventListener("click", async () => {
    hideHadisMenu();
    try {
      const result = await generateHadisImage();
      if (!result) return;

      downloadHadisBlob(result.blob, result.fileName);
      showHadisToast("Gambar berhasil diunduh");
    } catch (err) {
      console.error("Download hadis image error:", err);
      showHadisToast("Gagal membuat gambar");
    }
  });
}

// ── Countdown Salat Berikutnya ───────────────────────────────────────
const countdownEl = document.querySelector("[data-prayer-countdown]");

if (countdownEl) {
  const prayerTime = countdownEl.dataset.prayerTime;
  const prayerName = countdownEl.dataset.prayerName || "Salat";
  const rawPrayerTimeline = countdownEl.dataset.prayerTimeline || "[]";
  const nextPrayerNameEl = countdownEl.querySelector("[data-next-prayer-name]");
  const nextPrayerTimeEl = countdownEl.querySelector("[data-next-prayer-time]");
  const nextPrayerStatusEl = countdownEl.querySelector("[data-next-prayer-status]");
  const dashboardRoot = document.querySelector("[data-dashboard-root]");
  const checklistForms = Array.from(document.querySelectorAll("[data-prayer-check-form]"));
  const display = countdownEl.querySelector("[data-countdown-display]");
  const label = countdownEl.querySelector("[data-countdown-label]");
  const alertModal = document.querySelector("[data-prayer-alert-modal]");
  const alertOverlay = document.querySelector("[data-prayer-alert-overlay]");
  const alertCloseButtons = Array.from(document.querySelectorAll("[data-prayer-alert-close]"));
  const alertStatus = document.querySelector("[data-prayer-alert-status]");
  const alertName = document.querySelector("[data-prayer-alert-name]");
  const alertTime = document.querySelector("[data-prayer-alert-time]");
  const alertTitle = document.querySelector("[data-prayer-alert-title]");
  const body = document.body;
  let currentEntryKey = prayerTime ? `${prayerName}:${prayerTime}` : "";

  const getLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parsePrayerTimeline = () => {
    try {
      const parsed = JSON.parse(rawPrayerTimeline);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((entry) => entry && entry.dateKey && entry.time)
        .map((entry) => {
          const [year, month, day] = String(entry.dateKey).split("-").map(Number);
          const [hours, minutes] = String(entry.time).split(":").map(Number);
          return {
            ...entry,
            target: new Date(year, month - 1, day, hours, minutes, 0, 0),
            alertKey: `prayer-alert:${entry.dateKey}:${entry.key}:${entry.time}`,
          };
        })
        .sort((a, b) => a.target.getTime() - b.target.getTime());
    } catch (error) {
      return [];
    }
  };

  let prayerTimeline = parsePrayerTimeline();
  let previousNow = new Date();
  const dashboardProgressPercentEl = dashboardRoot?.querySelector("[data-dashboard-progress-percent]");
  const dashboardProgressLabelEl = dashboardRoot?.querySelector("[data-dashboard-progress-label]");
  const dashboardProgressBarEl = dashboardRoot?.querySelector("[data-dashboard-progress-bar]");
  const dashboardXpTodayEl = dashboardRoot?.querySelector("[data-dashboard-xp-today]");
  const dashboardTotalXpEl = dashboardRoot?.querySelector("[data-dashboard-total-xp]");
  const dashboardLevelEl = dashboardRoot?.querySelector("[data-dashboard-level]");
  const dashboardLevelHeadingEl = dashboardRoot?.querySelector("[data-dashboard-level-heading]");
  const dashboardSalatDoneEl = dashboardRoot?.querySelector("[data-dashboard-salat-done]");
  const dashboardStreakEl = dashboardRoot?.querySelector("[data-dashboard-streak]");
  const dashboardLongestStreakEl = dashboardRoot?.querySelector("[data-dashboard-longest-streak]");
  const dashboardLevelProgressLabelEl = dashboardRoot?.querySelector("[data-dashboard-level-progress-label]");
  const dashboardLevelProgressBarEl = dashboardRoot?.querySelector("[data-dashboard-level-progress-bar]");

  const showDashboardToast = (message, tone = "success") => {
    const existing = document.getElementById("dashboard-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "dashboard-toast";
    toast.textContent = message;
    toast.className = `fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-2xl ${
      tone === "error" ? "bg-[#A65145]" : "bg-[#2F654D]"
    }`;
    document.body.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 2600);
  };

  const openPrayerAlert = async (entry) => {
    if (!alertModal || !entry) return;
    const activeAlertKey = entry.alertKey;
    if (window.sessionStorage.getItem(activeAlertKey) === "shown") {
      return;
    }
    window.sessionStorage.setItem(activeAlertKey, "shown");

    if (alertName) alertName.textContent = entry.label;
    if (alertTime) alertTime.textContent = entry.time || "--:--";
    if (alertTitle) alertTitle.textContent = `Sudah masuk waktu ${entry.label}`;
    currentEntryKey = `${entry.label}:${entry.time}`;
    if (alertStatus) {
      alertStatus.textContent = `Sudah masuk waktu ${entry.label}. Semoga dimudahkan untuk segera menunaikannya.`;
    }

    alertModal.classList.remove("hidden");
    alertModal.classList.add("flex");
    body.classList.add("overflow-hidden");
  };

  const closePrayerAlert = () => {
    if (!alertModal) return;
    alertModal.classList.add("hidden");
    alertModal.classList.remove("flex");
    body.classList.remove("overflow-hidden");
  };

  alertCloseButtons.forEach((button) => button.addEventListener("click", closePrayerAlert));
  if (alertOverlay) alertOverlay.addEventListener("click", closePrayerAlert);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && alertModal && !alertModal.classList.contains("hidden")) {
      closePrayerAlert();
    }
  });

  const computeProgressPercent = (todayCompleted, totalToday) =>
    totalToday > 0 ? Math.round((todayCompleted / totalToday) * 100) : 0;

  const computeProgressLabel = (todayCompleted, totalToday) => {
    const remainingToday = Math.max(totalToday - todayCompleted, 0);
    return todayCompleted === totalToday
      ? "Luar biasa! Semua target hari ini selesai."
      : `${remainingToday} salat lagi untuk menyelesaikan target hari ini.`;
  };

  const computeLevelProgress = (xpValue, levelValue) => {
    const levelBase = Math.max(0, (levelValue - 1) * 100);
    const levelTarget = Math.max(levelValue * 100, 100);
    const levelRange = Math.max(levelTarget - levelBase, 1);

    return {
      levelTarget,
      levelProgress: Math.min(
        100,
        Math.max(0, Math.round(((xpValue - levelBase) / levelRange) * 100))
      ),
    };
  };

  const getTodayPrayerEntry = (prayerKey, now = new Date()) =>
    prayerTimeline.find(
      (entry) => entry.key === prayerKey && entry.dateKey === getLocalDateKey(now)
    ) || null;

  const setRowMode = (form, mode) => {
    form.classList.remove(
      "border-[#BFD2B1]",
      "bg-[#F2F7EC]",
      "border-[#E2D8C8]",
      "bg-[#FFF9F0]",
      "border-[#C9D7B8]",
      "bg-[#F8FBF3]"
    );

    if (mode === "done") {
      form.classList.add("border-[#BFD2B1]", "bg-[#F2F7EC]");
    } else if (mode === "locked") {
      form.classList.add("border-[#E2D8C8]", "bg-[#FFF9F0]");
    } else {
      form.classList.add("border-[#C9D7B8]", "bg-[#F8FBF3]");
    }
  };

  const applyChecklistRowState = (form, state) => {
    const indexPill = form.querySelector("[data-prayer-index-pill]");
    const icon = form.querySelector("[data-prayer-icon]");
    const statusBadge = form.querySelector("[data-prayer-status-badge]");
    const note = form.querySelector("[data-prayer-note]");
    const submitButton = form.querySelector("[data-prayer-submit]");
    const checkIndicator = form.querySelector("[data-prayer-check-indicator]");
    const timeLabel = form.querySelector("[data-prayer-time-label]");
    const isDone = Boolean(state.completedAt);
    const isAvailable = Boolean(state.isAvailable);
    const isLocked = !isDone && !isAvailable;

    form.dataset.prayerCompleted = isDone ? "true" : "false";
    form.dataset.prayerAvailable = isAvailable ? "true" : "false";

    if (timeLabel && state.time) {
      timeLabel.textContent = state.time;
    }

    setRowMode(form, isDone ? "done" : isLocked ? "locked" : "ready");

    if (indexPill) {
      indexPill.classList.toggle("bg-[#4F7F53]", isDone);
      indexPill.classList.toggle("text-white", isDone);
      indexPill.classList.toggle("bg-white", !isDone);
      indexPill.classList.toggle("text-[#4F7F53]", !isDone);
    }

    if (icon) {
      icon.classList.toggle("text-[#4F7F53]", isDone);
      icon.classList.toggle("text-[#A3B18A]", !isDone);
    }

    if (statusBadge) {
      statusBadge.classList.remove(
        "bg-[#4F7F53]",
        "text-white",
        "bg-[#EDE5D8]",
        "text-[#244338]/58",
        "bg-[#D4A373]/16",
        "text-[#B7792D]",
        "bg-[#A3B18A]/24",
        "text-[#2F654D]"
      );

      if (isDone) {
        statusBadge.textContent = "Selesai";
        statusBadge.classList.add("bg-[#4F7F53]", "text-white");
      } else if (isLocked) {
        statusBadge.textContent = "Belum masuk waktu";
        statusBadge.classList.add("bg-[#EDE5D8]", "text-[#244338]/58");
      } else {
        statusBadge.textContent = "Siap dicatat";
        statusBadge.classList.add("bg-[#A3B18A]/24", "text-[#2F654D]");
      }
    }

    if (note) {
      note.textContent = isDone
        ? `Dicatat jam ${state.completedAt}`
        : isLocked
          ? `Tombol aktif setelah jam ${state.time}.`
          : "Sudah masuk waktu, catat setelah selesai salat.";
    }

    if (submitButton) {
      submitButton.disabled = isDone || isLocked;
      submitButton.classList.toggle("hidden", isDone || isLocked);
      if (!isDone && !isLocked) {
        submitButton.textContent = "Checklist";
      }
    }

    if (checkIndicator) {
      checkIndicator.classList.toggle("bg-[#4F7F53]", isDone);
      checkIndicator.classList.toggle("text-white", isDone);
      checkIndicator.classList.toggle("bg-white", !isDone);
      checkIndicator.classList.toggle("text-[#A3B18A]", !isDone);
    }
  };

  const updateChecklistAvailability = (now = new Date()) => {
    checklistForms.forEach((form) => {
      if (form.dataset.prayerCompleted === "true") {
        return;
      }

      const entry = getTodayPrayerEntry(form.dataset.prayerKey, now);
      const currentTime =
        entry?.time || form.querySelector("[data-prayer-time-label]")?.textContent || "--:--";
      const isAvailable = entry
        ? now.getTime() >= entry.target.getTime()
        : form.dataset.prayerAvailable === "true";

      applyChecklistRowState(form, {
        time: currentTime,
        isAvailable,
        completedAt: null,
      });
    });
  };

  const applyDashboardState = (dashboard) => {
    if (!dashboard || typeof dashboard !== "object") {
      return;
    }

    if (Array.isArray(dashboard.prayerTimeline) && dashboard.prayerTimeline.length) {
      prayerTimeline = dashboard.prayerTimeline
        .map((entry) => {
          const [year, month, day] = String(entry.dateKey).split("-").map(Number);
          const [hours, minutes] = String(entry.time).split(":").map(Number);
          return {
            ...entry,
            target: new Date(year, month - 1, day, hours, minutes, 0, 0),
            alertKey: `prayer-alert:${entry.dateKey}:${entry.key}:${entry.time}`,
          };
        })
        .sort((a, b) => a.target.getTime() - b.target.getTime());
      countdownEl.dataset.prayerTimeline = JSON.stringify(dashboard.prayerTimeline);
    }

    const progressPercent = computeProgressPercent(dashboard.todayCompleted, dashboard.totalToday);
    const progressLabel = computeProgressLabel(dashboard.todayCompleted, dashboard.totalToday);
    const levelProgressData = computeLevelProgress(dashboard.xp, dashboard.level);

    if (dashboardProgressPercentEl) dashboardProgressPercentEl.textContent = `${progressPercent}%`;
    if (dashboardProgressLabelEl) dashboardProgressLabelEl.textContent = progressLabel;
    if (dashboardProgressBarEl) {
      dashboardProgressBarEl.style.width = `${progressPercent}%`;
      dashboardProgressBarEl.style.setProperty("--progress-width", `${progressPercent}%`);
    }
    if (dashboardXpTodayEl) dashboardXpTodayEl.textContent = `${dashboard.todayCompleted * 10} XP`;
    if (dashboardTotalXpEl) dashboardTotalXpEl.textContent = `${dashboard.xp} XP`;
    if (dashboardLevelEl) dashboardLevelEl.textContent = String(dashboard.level);
    if (dashboardLevelHeadingEl) dashboardLevelHeadingEl.textContent = `Level ${dashboard.level}`;
    if (dashboardSalatDoneEl) {
      dashboardSalatDoneEl.textContent = `${dashboard.todayCompleted} / ${dashboard.totalToday}`;
    }
    if (dashboardStreakEl) dashboardStreakEl.textContent = String(dashboard.streak);
    if (dashboardLongestStreakEl) {
      dashboardLongestStreakEl.textContent = `Terbaik: ${dashboard.longestStreak || dashboard.streak} hari`;
    }
    if (dashboardLevelProgressLabelEl) {
      dashboardLevelProgressLabelEl.textContent = `${dashboard.xp} / ${levelProgressData.levelTarget} XP`;
    }
    if (dashboardLevelProgressBarEl) {
      dashboardLevelProgressBarEl.style.width = `${levelProgressData.levelProgress}%`;
      dashboardLevelProgressBarEl.style.setProperty(
        "--progress-width",
        `${levelProgressData.levelProgress}%`
      );
    }

    checklistForms.forEach((form) => {
      const prayerKey = form.dataset.prayerKey;
      const checklistItem = Array.isArray(dashboard.checklist)
        ? dashboard.checklist.find((item) => item.key === prayerKey)
        : null;

      applyChecklistRowState(form, {
        time:
          checklistItem?.time ||
          form.querySelector("[data-prayer-time-label]")?.textContent ||
          "--:--",
        isAvailable: Boolean(checklistItem?.isAvailable),
        completedAt: dashboard.todayState?.[prayerKey] || null,
      });
    });
  };

  checklistForms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector("[data-prayer-submit]");
      if (!submitButton || submitButton.disabled) {
        return;
      }

      const originalLabel = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = "Menyimpan...";

      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.message || "Gagal mencatat salat.");
        }

        applyDashboardState(payload.dashboard);
        updateChecklistAvailability(new Date());
        showDashboardToast(payload.message || "Salat berhasil dicatat.");
      } catch (error) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
        showDashboardToast(error.message || "Gagal mencatat salat.", "error");
      }
    });
  });

  if (display && label && prayerTimeline.length) {
    const pad = (n) => String(n).padStart(2, "0");

    const findNextEntry = (now) =>
      prayerTimeline.find((entry) => entry.target.getTime() > now.getTime()) || null;

    const updateNextPrayerCard = (entry, now) => {
      if (!entry) {
        if (nextPrayerNameEl) nextPrayerNameEl.textContent = "Jadwal selesai";
        if (nextPrayerTimeEl) nextPrayerTimeEl.textContent = "-";
        if (nextPrayerStatusEl) nextPrayerStatusEl.textContent = "Perlu refresh";
        display.textContent = "--:--:--";
        label.textContent = "Tidak ada jadwal berikutnya";
        return;
      }

      currentEntryKey = `${entry.label}:${entry.time}`;
      if (nextPrayerNameEl) nextPrayerNameEl.textContent = entry.label;
      if (nextPrayerTimeEl) nextPrayerTimeEl.textContent = entry.time;
      if (nextPrayerStatusEl) {
        nextPrayerStatusEl.textContent = entry.dateKey === getLocalDateKey(now) ? "Berjalan" : "Besok";
      }
    };

    const tick = async () => {
      const now = new Date();
      const crossedEntry = prayerTimeline.find(
        (entry) =>
          previousNow.getTime() < entry.target.getTime() &&
          now.getTime() >= entry.target.getTime()
      );

      if (crossedEntry) {
        await openPrayerAlert(crossedEntry);
      }

      const nextEntry = findNextEntry(now);
      updateNextPrayerCard(nextEntry, now);
      updateChecklistAvailability(now);

      if (!nextEntry) {
        previousNow = now;
        return;
      }

      const diff = nextEntry.target.getTime() - now.getTime();
      const totalSec = Math.max(0, Math.floor(diff / 1000));
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      display.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
      label.textContent =
        h > 0
          ? `${h} jam ${m} menit lagi`
          : m > 0
            ? `${m} menit ${s} detik lagi`
            : `${s} detik lagi`;

      previousNow = now;
    };

    updateNextPrayerCard(findNextEntry(previousNow), previousNow);
    updateChecklistAvailability(previousNow);
    tick();
    setInterval(() => {
      tick().catch(() => {});
    }, 1000);
  } else if (display && label && prayerTime) {
    display.textContent = "--:--:--";
    label.textContent = `Menuju adzan ${prayerName}`;
  }
}

const hijriCalendarModal = document.querySelector("[data-hijri-calendar-modal]");

if (hijriCalendarModal) {
  const openButtons = Array.from(document.querySelectorAll("[data-open-hijri-calendar]"));
  const closeButtons = Array.from(hijriCalendarModal.querySelectorAll("[data-close-hijri-calendar]"));
  const overlay = hijriCalendarModal.querySelector("[data-hijri-calendar-overlay]");
  const monthTitle = hijriCalendarModal.querySelector("[data-hijri-calendar-month]");
  const todayLabel = hijriCalendarModal.querySelector("[data-hijri-calendar-today]");
  const grid = hijriCalendarModal.querySelector("[data-hijri-calendar-grid]");
  const prevButton = hijriCalendarModal.querySelector("[data-hijri-calendar-prev]");
  const nextButton = hijriCalendarModal.querySelector("[data-hijri-calendar-next]");
  const endpoint = hijriCalendarModal.dataset.hijriCalendarEndpoint || "";
  const body = document.body;
  let activeMonth = Number(hijriCalendarModal.dataset.hijriCalendarMonth || 0);
  let activeYear = Number(hijriCalendarModal.dataset.hijriCalendarYear || 0);
  let isLoading = false;

  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const renderCalendarEntries = (entries = []) => {
    if (!grid) return;

    if (!entries.length) {
      grid.innerHTML = `
        <div class="col-span-7 rounded-[1.25rem] border border-dashed border-[#D8CDBB] bg-[#F8F3EB] px-4 py-8 text-center text-sm text-[#244338]/58">
          Kalender Hijriyah belum tersedia untuk ditampilkan.
        </div>
      `;
      return;
    }

    grid.innerHTML = entries
      .map((entry) => {
        const baseClasses = entry.isCurrentMonth
          ? "border-[#D8CDBB] bg-white"
          : "border-[#E7DED1] bg-[#F8F3EB]";
        const highlightClasses = entry.isToday ? "border-[#4F7F53] bg-[#EEF6EA] shadow-sm" : "";
        const dayClasses = entry.isToday
          ? "text-[#4F7F53]"
          : entry.isCurrentMonth
            ? "text-[#244338]"
            : "text-[#244338]/35";
        const gregorianClasses = entry.isToday
          ? "text-[#588157]"
          : entry.isCurrentMonth
            ? "text-[#B7792D]"
            : "text-[#B7792D]/45";

        return `
          <div class="${baseClasses} ${highlightClasses} min-h-[60px] rounded-[0.95rem] border p-2 transition sm:min-h-[64px]">
            <div class="flex items-start justify-between gap-2">
              <span class="${dayClasses} text-sm font-black sm:text-base">${escapeHtml(entry.day)}</span>
              ${entry.isToday ? '<span class="rounded-full bg-[#4F7F53] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white">Hari ini</span>' : ""}
            </div>
            <p class="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] sm:text-[10px] ${gregorianClasses}">${escapeHtml(entry.gregorianLabel)}</p>
            ${entry.holidays?.length ? `<p class="mt-0.5 line-clamp-1 text-[9px] leading-3 text-[#244338]/48 sm:text-[10px]">${escapeHtml(entry.holidays[0])}</p>` : ""}
          </div>
        `;
      })
      .join("");
  };

  const syncCalendarState = (payload) => {
    if (!payload?.calendar) return;

    activeMonth = Number(payload.calendar.monthNumber || activeMonth || 0);
    activeYear = Number(payload.calendar.year || activeYear || 0);
    hijriCalendarModal.dataset.hijriCalendarMonth = activeMonth ? String(activeMonth) : "";
    hijriCalendarModal.dataset.hijriCalendarYear = activeYear ? String(activeYear) : "";

    if (monthTitle) monthTitle.textContent = payload.calendar.monthLabel || "Kalender Hijriyah";
    if (todayLabel) todayLabel.textContent = payload.today?.fullLabel || "";

    renderCalendarEntries(payload.calendar.entries || []);
  };

  const setLoadingState = (value) => {
    isLoading = value;
    if (prevButton) prevButton.disabled = value;
    if (nextButton) nextButton.disabled = value;
  };

  const loadHijriMonth = async (month, year) => {
    if (!endpoint || !month || !year || isLoading) return;

    setLoadingState(true);

    try {
      const response = await fetch(`${endpoint}?month=${month}&year=${year}`, {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Kalender Hijriyah belum bisa dimuat.");
      }

      syncCalendarState(payload);
    } catch (error) {
      if (monthTitle) {
        monthTitle.textContent = error.message || "Kalender Hijriyah belum bisa dimuat.";
      }
    } finally {
      setLoadingState(false);
    }
  };

  const openModal = () => {
    hijriCalendarModal.classList.remove("hidden");
    hijriCalendarModal.classList.add("flex");
    body.classList.add("overflow-hidden");
  };

  const closeModal = () => {
    hijriCalendarModal.classList.add("hidden");
    hijriCalendarModal.classList.remove("flex");
    body.classList.remove("overflow-hidden");
  };

  openButtons.forEach((button) => button.addEventListener("click", openModal));
  closeButtons.forEach((button) => button.addEventListener("click", closeModal));
  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (!activeMonth || !activeYear) return;
      const nextMonth = activeMonth === 1 ? 12 : activeMonth - 1;
      const nextYear = activeMonth === 1 ? activeYear - 1 : activeYear;
      loadHijriMonth(nextMonth, nextYear).catch(() => {});
    });
  }
  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (!activeMonth || !activeYear) return;
      const nextMonth = activeMonth === 12 ? 1 : activeMonth + 1;
      const nextYear = activeMonth === 12 ? activeYear + 1 : activeYear;
      loadHijriMonth(nextMonth, nextYear).catch(() => {});
    });
  }
  if (overlay) overlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !hijriCalendarModal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

// ── Kompas Arah Kiblat ──────────────────────────────────────────────
const qiblaCompass = document.querySelector("[data-qibla-compass]");

if (qiblaCompass) {
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;
  const prayerLocationNeedsSync = qiblaCompass.dataset.prayerLocationSync !== "ready";
  let locationSyncInFlight = false;

  const needle = qiblaCompass.querySelector("[data-qibla-needle]");
  const bearingText = qiblaCompass.querySelector("[data-qibla-bearing]");
  const permissionBtn = qiblaCompass.querySelector("[data-qibla-permission-btn]");

  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const calcQiblaBearing = (lat, lng) => {
    const lat1 = toRad(lat);
    const lat2 = toRad(KAABA_LAT);
    const dLng = toRad(KAABA_LNG - lng);
    const x = Math.sin(dLng) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (toDeg(Math.atan2(x, y)) + 360) % 360;
  };

  const bearingToLabel = (deg) => {
    const labels = ["Utara", "Timur Laut", "Timur", "Tenggara", "Selatan", "Barat Daya", "Barat", "Barat Laut"];
    return labels[Math.round(deg / 45) % 8];
  };

  const rotateNeedle = (deg) => {
    needle.setAttribute("style", `transform-origin:100px 100px;transform:rotate(${deg}deg);transition:transform 0.3s ease-out`);
  };

  const syncPrayerLocation = async (latitude, longitude) => {
    if (!prayerLocationNeedsSync || locationSyncInFlight) return;
    locationSyncInFlight = true;

    try {
      const response = await fetch("/location/prayer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      const payload = await response.json().catch(() => null);
      if (response.ok && payload && payload.ok && payload.changed) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Prayer location sync failed:", error);
    } finally {
      locationSyncInFlight = false;
    }
  };

  const startOrientation = (qiblaBearing) => {
    const handleOrientation = (e) => {
      if (e.alpha == null) return;
      rotateNeedle(qiblaBearing - e.alpha);
    };

    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      // iOS 13+ — perlu permission request via user gesture
      permissionBtn.classList.remove("hidden");
      permissionBtn.addEventListener("click", () => {
        DeviceOrientationEvent.requestPermission().then((state) => {
          if (state === "granted") {
            permissionBtn.classList.add("hidden");
            window.addEventListener("deviceorientation", handleOrientation);
          } else {
            bearingText.textContent = "Izin kompas ditolak";
          }
        }).catch(() => {
          bearingText.textContent = "Izin kompas gagal";
        });
      });
    } else {
      // Android / desktop — langsung pasang listener
      // Prefer deviceorientationabsolute, fallback ke deviceorientation
      let useAbsolute = false;

      window.addEventListener("deviceorientationabsolute", (e) => {
        useAbsolute = true;
        handleOrientation(e);
      });

      window.addEventListener("deviceorientation", (e) => {
        if (!useAbsolute) handleOrientation(e);
      });
    }
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const bearing = calcQiblaBearing(latitude, longitude);
        const rounded = Math.round(bearing);
        bearingText.textContent = `${rounded}° ${bearingToLabel(bearing)}`;
        rotateNeedle(bearing);
        startOrientation(bearing);
        syncPrayerLocation(latitude, longitude);
      },
      () => {
        bearingText.textContent = "Izinkan akses lokasi untuk melihat arah kiblat";
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    bearingText.textContent = "Geolocation tidak tersedia";
  }
}

// Home hero carousel
const homeCarousel = document.querySelector("[data-home-carousel]");
if (homeCarousel) {
  const slides = Array.from(homeCarousel.querySelectorAll("[data-home-slide]"));
  const dots = Array.from(homeCarousel.querySelectorAll("[data-home-dot]"));
  let activeIndex = 0;

  const setActiveSlide = (nextIndex) => {
    activeIndex = nextIndex;
    slides.forEach((slide, index) => {
      slide.style.opacity = index === activeIndex ? "1" : "0";
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle("w-7", index === activeIndex);
      dot.classList.toggle("w-2", index !== activeIndex);
      dot.classList.toggle("bg-[#D4A373]", index === activeIndex);
      dot.classList.toggle("bg-white/45", index !== activeIndex);
    });
  };

  if (slides.length > 1) {
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => setActiveSlide(index));
    });
    setInterval(() => {
      setActiveSlide((activeIndex + 1) % slides.length);
    }, 4500);
  }
}


const splashScreen = document.querySelector("[data-splash-screen]");

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
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const audio = versePlayer.querySelector("[data-verse-audio]");
  const title = versePlayer.querySelector("[data-verse-player-title]");
  const status = versePlayer.querySelector("[data-verse-player-status]");
  const autoPlayBtn = versePlayer.querySelector("[data-verse-autoplay]");
  const qoriSelect = versePlayer.querySelector("[data-qori-select]");
  const buttons = Array.from(document.querySelectorAll("[data-verse-play]"));
  const cards = Array.from(document.querySelectorAll("[data-verse-card]"));
  let activeVerseNumber = null;
  let autoPlay = true;
  let selectedQori = qoriSelect ? qoriSelect.value : "02";

  if (autoPlayBtn) {
    autoPlayBtn.addEventListener("click", () => {
      autoPlay = !autoPlay;
      autoPlayBtn.querySelector("[data-autoplay-label]").textContent = autoPlay ? "ON" : "OFF";
      autoPlayBtn.classList.toggle("bg-[#588157]", autoPlay);
      autoPlayBtn.classList.toggle("text-white", autoPlay);
      autoPlayBtn.classList.toggle("bg-white/70", !autoPlay);
      autoPlayBtn.classList.toggle("text-[#344E41]/80", !autoPlay);
    });
  }

  const getAudioUrl = (button) => {
    try {
      const urls = JSON.parse(button.dataset.verseAudioUrls || "{}");
      return urls[selectedQori] || button.dataset.verseAudioUrl;
    } catch {
      return button.dataset.verseAudioUrl;
    }
  };

  if (qoriSelect) {
    qoriSelect.addEventListener("change", async () => {
      selectedQori = qoriSelect.value;
      if (activeVerseNumber && !audio.paused) {
        const btn = buttons.find((b) => b.dataset.verseNumber === String(activeVerseNumber));
        if (btn) {
          const newUrl = getAudioUrl(btn);
          const currentTime = audio.currentTime;
          audio.src = newUrl;
          audio.load();
          audio.currentTime = currentTime;
          try { await audio.play(); } catch {}
        }
      }
    });
  }

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

  const getNextButton = () => {
    const currentIndex = buttons.findIndex((btn) => btn.dataset.verseNumber === String(activeVerseNumber));
    if (currentIndex === -1 || currentIndex >= buttons.length - 1) return null;
    return buttons[currentIndex + 1];
  };

  const playVerse = async (verseNumber, audioUrl) => {
    activeVerseNumber = verseNumber;
    audio.src = audioUrl;
    audio.load();
    scrollToVerse(verseNumber);
    updatePlayerText();
    syncButtons();
    try {
      await audio.play();
    } catch (error) {
      status.textContent = "Audio gagal diputar. Coba lagi beberapa saat.";
    }
  };

  const syncButtons = () => {
    buttons.forEach((button) => {
      const isCurrent = button.dataset.verseNumber === String(activeVerseNumber);
      const isPlayingCurrent = isCurrent && !audio.paused && !audio.ended;
      const isEndedCurrent = isCurrent && audio.ended;

      const label = button.querySelector("[data-verse-play-label]");
      const icon = button.querySelector("[data-verse-play-icon]");
      const labelText = isPlayingCurrent
        ? "Pause"
        : isEndedCurrent
          ? "Putar ulang"
          : isCurrent
            ? "Lanjutkan"
            : "Putar ayat";
      if (label) label.textContent = labelText;
      if (icon) icon.innerHTML = isPlayingCurrent
        ? '<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>'
        : '<path d="M8 5v14l11-7z"/>';
      button.classList.toggle("border-[#588157]/40", isCurrent);
      button.classList.toggle("bg-[#588157]/15", isCurrent);
      button.classList.toggle("text-[#588157]", isCurrent);
      button.classList.toggle("border-[#A3B18A]/30", !isCurrent);
      button.classList.toggle("bg-white/70", !isCurrent);
      button.classList.toggle("text-[#344E41]/80", !isCurrent);
    });

    cards.forEach((card) => setCardState(card.dataset.verseNumber, card.dataset.verseNumber === String(activeVerseNumber)));
  };

  const updatePlayerText = () => {
    if (!activeVerseNumber) {
      title.textContent = "Pilih ayat untuk mulai mendengarkan";
      status.textContent = "Audio ayat akan diputar langsung di halaman ini.";
      return;
    }

    title.textContent = `Ayat ${activeVerseNumber}`;
    status.textContent = audio.paused ? "Audio dijeda. Tekan play untuk melanjutkan." : "Sedang memutar audio ayat...";
  };

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const verseNumber = button.dataset.verseNumber;
      const audioUrl = getAudioUrl(button);
      const isSameVerse = verseNumber === String(activeVerseNumber);

      if (!audioUrl) return;

      try {
        if (!isSameVerse) {
          await playVerse(verseNumber, audioUrl);
          return;
        }

        if (isSameVerse && !audio.paused) {
          audio.pause();
        } else {
          await audio.play();
        }
      } catch (error) {
        status.textContent = "Audio gagal diputar. Coba lagi beberapa saat.";
      }

      updatePlayerText();
      syncButtons();
    });
  });

  audio.addEventListener("play", () => {
    updatePlayerText();
    syncButtons();
  });

  audio.addEventListener("pause", () => {
    updatePlayerText();
    syncButtons();
  });

  audio.addEventListener("ended", async () => {
    if (autoPlay) {
      const nextBtn = getNextButton();
      if (nextBtn && getAudioUrl(nextBtn)) {
        status.textContent = `Melanjutkan ke ayat berikutnya...`;
        await playVerse(nextBtn.dataset.verseNumber, getAudioUrl(nextBtn));
        return;
      }
    }
    status.textContent = autoPlay
      ? `Semua ayat selesai diputar.`
      : `Audio ayat ${activeVerseNumber} selesai.`;
    syncButtons();
  });

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
        "text-[#B7792D]"
      );

      if (isDone) {
        statusBadge.textContent = "Selesai";
        statusBadge.classList.add("bg-[#4F7F53]", "text-white");
      } else if (isLocked) {
        statusBadge.textContent = "Belum masuk waktu";
        statusBadge.classList.add("bg-[#EDE5D8]", "text-[#244338]/58");
      } else {
        statusBadge.textContent = "Siap dicatat";
        statusBadge.classList.add("bg-[#D4A373]/16", "text-[#B7792D]");
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
  const body = document.body;

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


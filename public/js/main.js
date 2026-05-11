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


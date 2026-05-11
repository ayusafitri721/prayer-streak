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


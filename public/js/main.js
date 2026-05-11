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
  const buttons = Array.from(document.querySelectorAll("[data-verse-play]"));
  const cards = Array.from(document.querySelectorAll("[data-verse-card]"));
  let activeVerseNumber = null;

  const setCardState = (verseNumber, isActive) => {
    const card = cards.find((item) => item.dataset.verseNumber === String(verseNumber));
    if (!card) return;

    card.classList.toggle("border-emerald-300/40", isActive);
    card.classList.toggle("bg-emerald-300/10", isActive);
    card.classList.toggle("shadow-lg", isActive);
    card.classList.toggle("shadow-emerald-900/20", isActive);
    card.classList.toggle("border-slate-700/70", !isActive);
    card.classList.toggle("bg-slate-900/75", !isActive);
  };

  const syncButtons = () => {
    buttons.forEach((button) => {
      const isCurrent = button.dataset.verseNumber === String(activeVerseNumber);
      const isPlayingCurrent = isCurrent && !audio.paused && !audio.ended;
      const isEndedCurrent = isCurrent && audio.ended;

      button.textContent = isPlayingCurrent
        ? "Pause ayat"
        : isEndedCurrent
          ? "Putar ulang ayat"
          : isCurrent
            ? "Lanjutkan ayat"
            : "Putar ayat";
      button.classList.toggle("border-emerald-300/30", isCurrent);
      button.classList.toggle("bg-emerald-300/10", isCurrent);
      button.classList.toggle("text-emerald-100", isCurrent);
      button.classList.toggle("border-white/10", !isCurrent);
      button.classList.toggle("bg-white/5", !isCurrent);
      button.classList.toggle("text-slate-200", !isCurrent);
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
    status.textContent = audio.paused ? "Audio dijeda. Tekan play untuk melanjutkan." : "Sedang memutar audio ayat terpilih.";
  };

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const verseNumber = button.dataset.verseNumber;
      const audioUrl = button.dataset.verseAudioUrl;
      const isSameVerse = verseNumber === String(activeVerseNumber);

      if (!audioUrl) return;

      try {
        if (!isSameVerse) {
          activeVerseNumber = verseNumber;
          audio.src = audioUrl;
          audio.load();
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

  audio.addEventListener("ended", () => {
    status.textContent = `Audio ayat ${activeVerseNumber} selesai diputar.`;
    syncButtons();
  });

  syncButtons();
  updatePlayerText();
}


let deferredInstallPrompt = null;

const installTriggerButtons = Array.from(document.querySelectorAll("[data-app-install-btn]"));

const setInstallButtonVisibility = (visible) => {
  installTriggerButtons.forEach((button) => {
    button.classList.toggle("hidden", !visible);
    button.setAttribute("aria-hidden", visible ? "false" : "true");
  });
};

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  setInstallButtonVisibility(true);
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  setInstallButtonVisibility(false);
});

installTriggerButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } catch {}
    deferredInstallPrompt = null;
    setInstallButtonVisibility(false);
  });
});

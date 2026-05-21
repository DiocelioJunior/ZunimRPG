function renderPlayer() {
  document.body.className = "player-body";
  app.innerHTML = `
    <div class="player-outer" id="playerOuter">
      <div class="screen player-screen" id="playerScreen"></div>
    </div>

    <div class="player-controls">
      <button id="fullscreenBtn">Tela cheia</button>
      <button id="blackoutBtn">Tela preta</button>
    </div>
  `;

  const playerOuter = document.getElementById("playerOuter");
  const playerScreen = document.getElementById("playerScreen");

  let playerRatio = "16:9";
  let playerHasVisibleItem = false;
  let playerTokens = [];
  let playerMeasurements = [];

  let playerGridSettings = {
    enabled: false,
    columns: 16,
    rows: 9,
    metersPerSquare: 1.5,
    snapToGrid: true,
    showOnPlayers: true,
    color: "#ffffff",
    thickness: 1,
    opacity: 0.34
  };

  let currentPointer = { visible: false, x: 0.5, y: 0.5 };

  function getEffectivePlayerGridSettings() {
    return { ...playerGridSettings, enabled: Boolean(playerGridSettings.enabled && playerGridSettings.showOnPlayers) };
  }

  function updatePlayerScreenSize() {
    fitVirtualScreen(playerScreen, playerOuter, playerRatio);
    renderPlayerOverlays();
  }

  function renderPlayerOverlays() {
    renderGrid(playerScreen, getEffectivePlayerGridSettings(), !playerHasVisibleItem);
    renderTokens(playerScreen, playerTokens, { forceHidden: !playerHasVisibleItem });
    renderMeasurements(playerScreen, playerMeasurements, playerGridSettings, !playerHasVisibleItem);
    renderPointer(playerScreen, currentPointer);
  }

  function applyMessage(message) {
    if (!message || message.app !== CHANNEL_NAME) return;

    if (message.screenRatio) {
      playerRatio = message.screenRatio;
      updatePlayerScreenSize();
    }

    if (message.gridSettings) {
      playerGridSettings = message.gridSettings;
      renderPlayerOverlays();
    }

    if (message.action === "screenSettings") {
      playerRatio = message.screenRatio || "16:9";
      updatePlayerScreenSize();
    }

    if (message.action === "gridSettings") {
      playerGridSettings = message.gridSettings || playerGridSettings;
      renderPlayerOverlays();
    }

    if (message.action === "tokens") {
      playerTokens = message.tokens || [];
      renderPlayerOverlays();
    }

    if (message.action === "measurements") {
      playerMeasurements = message.measurements || [];
      renderPlayerOverlays();
    }

    if (message.action === "show") {
      playerHasVisibleItem = true;
      currentPointer.visible = false;
      clearPointerTrail(playerScreen);
      renderItem(playerScreen, message.item, { player: true });
      updatePlayerScreenSize();
      renderPlayerOverlays();
    }

    if (message.action === "blackout") {
      playerHasVisibleItem = false;
      currentPointer.visible = false;
      clearPointerTrail(playerScreen);
      renderItem(playerScreen, null, { player: true });
      updatePlayerScreenSize();
      renderPlayerOverlays();
    }

    if (message.action === "pointer") {
      currentPointer = message.pointer || currentPointer;
      currentPointer.visible = true;
      if (message.trail) addPointerTrail(playerScreen, currentPointer.x, currentPointer.y);
      renderPointer(playerScreen, currentPointer);
    }

    if (message.action === "hidePointer") {
      currentPointer.visible = false;
      clearPointerTrail(playerScreen);
      renderPointer(playerScreen, currentPointer);
    }

    if (message.action === "youtubeControl") {
      executeYoutubeControl(message.command, message.value);
    }
  }

  window.addEventListener("message", event => applyMessage(event.data));

  if (channel) {
    channel.onmessage = event => applyMessage(event.data);
  }

  window.addEventListener("storage", event => {
    if (event.key !== CHANNEL_NAME + "-last") return;
    try { applyMessage(JSON.parse(event.newValue)); } catch (error) {}
  });

  window.addEventListener("resize", () => updatePlayerScreenSize());

  document.getElementById("fullscreenBtn").addEventListener("click", async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      alert("Não foi possível entrar em tela cheia. Você também pode usar F11.");
    }
  });

  document.getElementById("blackoutBtn").addEventListener("click", () => {
    playerHasVisibleItem = false;
    currentPointer.visible = false;
    clearPointerTrail(playerScreen);
    renderItem(playerScreen, null, { player: true });
    updatePlayerScreenSize();
    renderPlayerOverlays();
  });

  try {
    const last = localStorage.getItem(CHANNEL_NAME + "-last");
    if (last) {
      applyMessage(JSON.parse(last));
    } else {
      renderItem(playerScreen, null, { player: true });
      updatePlayerScreenSize();
      renderPlayerOverlays();
    }
  } catch (error) {
    renderItem(playerScreen, null, { player: true });
    updatePlayerScreenSize();
    renderPlayerOverlays();
  }

  updatePlayerScreenSize();
}
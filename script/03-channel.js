function createId() {
  return "item-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}


function createMessage(action, payload = {}) {
  return { app: CHANNEL_NAME, action, ...payload, createdAt: Date.now() };
}


function sendToPlayers(message) {
  if (playerWindow && !playerWindow.closed) {
    playerWindow.postMessage(message, "*");
  }

  if (channel) {
    channel.postMessage(message);
  }

  try {
    const smallMessage = JSON.stringify(message);
    if (smallMessage.length < 3500000) {
      localStorage.setItem(CHANNEL_NAME + "-last", smallMessage);
    }
  } catch (error) {
    console.warn("Não foi possível salvar no localStorage:", error);
  }
}


function sendScreenSettings() {
  sendToPlayers(createMessage("screenSettings", { screenRatio }));
}


function sendGridSettings() {
  sendToPlayers(createMessage("gridSettings", { gridSettings }));
}


function getVisibleMeasurements() {
  return [...measurements, ...(measureDraft && measureDraft.visible ? [measureDraft] : [])];
}


function sendMeasurementsState() {
  sendToPlayers(createMessage("measurements", { measurements: getVisibleMeasurements(), gridSettings }));
}


function sendTokenState() {
  sendToPlayers(createMessage("tokens", { tokens: mapTokens }));
}
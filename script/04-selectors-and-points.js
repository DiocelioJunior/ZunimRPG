function getSelectedItem() {
  return library.find(item => item.id === selectedId) || null;
}


function getSelectedTokenSource() {
  return tokenLibrary.find(token => token.id === selectedTokenSourceId) || null;
}


function getSelectedMapToken() {
  return mapTokens.find(token => token.id === selectedMapTokenId) || null;
}


function extractYoutubeVideoId(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw);

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "").split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (url.searchParams.get("v")) {
      const id = url.searchParams.get("v");
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.indexOf("embed");
    const shortsIndex = parts.indexOf("shorts");

    if (embedIndex >= 0 && parts[embedIndex + 1]) {
      const id = parts[embedIndex + 1];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (shortsIndex >= 0 && parts[shortsIndex + 1]) {
      const id = parts[shortsIndex + 1];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
  } catch (error) {}

  return null;
}


function getPointFromEvent(event, screenElement, settings) {
  const rect = screenElement.getBoundingClientRect();

  let x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  let y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

  if (settings && settings.enabled && settings.snapToGrid) {
    const columns = Math.max(1, Number(settings.columns || 16));
    const rows = Math.max(1, Number(settings.rows || 9));

    const col = Math.max(0, Math.min(columns - 1, Math.floor(x * columns)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor(y * rows)));

    return { x: (col + 0.5) / columns, y: (row + 0.5) / rows, col, row };
  }

  return { x, y };
}


function snapPointToGridIfNeeded(point) {
  if (!gridSettings.enabled || !gridSettings.snapToGrid) return { x: point.x, y: point.y };

  const columns = Math.max(1, Number(gridSettings.columns || 16));
  const rows = Math.max(1, Number(gridSettings.rows || 9));
  const col = Math.max(0, Math.min(columns - 1, Math.floor(point.x * columns)));
  const row = Math.max(0, Math.min(rows - 1, Math.floor(point.y * rows)));

  return { x: (col + 0.5) / columns, y: (row + 0.5) / rows, col, row };
}
(() => {
  const params = new URLSearchParams(window.location.search);
  const isPlayer = params.get("view") === "player";

  const CHANNEL_NAME = "mesa-rpg-espelho-ytplayer-v11-hover-notes-upload-fix";
  const NOTES_KEY = CHANNEL_NAME + "-master-notes";
  const app = document.getElementById("app");

  let channel = null;
  try { channel = new BroadcastChannel(CHANNEL_NAME); } catch (error) { channel = null; }

  let library = [];
  let selectedId = null;
  let stagedItem = null;
  let publishedItem = null;
  let playerWindow = null;

  let tokenLibrary = [];
  let selectedTokenSourceId = null;
  let mapTokens = [];
  let selectedMapTokenId = null;
  let tokenDrag = null;

  let pointerEnabled = false;
  let rulerEnabled = false;
  let isDrawingMeasure = false;
  let toolbarCollapsed = false;

  let screenRatio = "16:9";
  let lastPointerSentAt = 0;

  let gridSettings = {
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

  let rulerSettings = {
    mode: "line",
    useFixedSize: false,
    fixedMeters: 3,
    color: "#22d3ee"
  };

  let masterPointer = { visible: false, x: 0.5, y: 0.5 };
  let measurements = [];
  let measureDraft = null;
  let measureDrag = null;

  let currentControlVideoId = null;
  let youtubeApiReady = Boolean(window.YT && window.YT.Player);
  let youtubeApiLoading = false;
  const youtubePlayers = new Map();

  window.onYouTubeIframeAPIReady = function () {
    youtubeApiReady = true;
    registerYoutubePlayers();
  };

  const trailStateByContainer = new WeakMap();
  const TRAIL_DURATION = 220;

  const defaultSettings = { fit: "contain", zoom: 1, rotation: 0 };

  const SCENE_MAX_BYTES = 60 * 1024 * 1024;
  const TOKEN_MAX_BYTES = 15 * 1024 * 1024;
  const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"]);
  const TEXT_EXTENSIONS = new Set(["txt", "md", "json", "csv", "log"]);

  let lastMasterRenderKey = null;

  function getExtension(name) {
    const parts = String(name || "").toLowerCase().split(".");
    return parts.length > 1 ? parts.pop() : "";
  }

  function isImageFile(file) {
    return Boolean(file && (String(file.type || "").startsWith("image/") || IMAGE_EXTENSIONS.has(getExtension(file.name))));
  }

  function describeBytes(bytes) {
    return formatFileSize(bytes);
  }

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

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }
    return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
  }

  function formatMeters(value) {
    const number = Number(value || 0);
    if (Number.isInteger(number)) return String(number);
    return number.toFixed(1).replace(".", ",");
  }

  function hexToRgba(hex, opacity) {
    let clean = String(hex || "#ffffff").replace("#", "");
    if (clean.length === 3) clean = clean.split("").map(char => char + char).join("");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${Number.isNaN(r) ? 255 : r}, ${Number.isNaN(g) ? 255 : g}, ${Number.isNaN(b) ? 255 : b}, ${opacity})`;
  }

  function getFileKind(file) {
    const ext = getExtension(file?.name || "");
    const type = String(file?.type || "").toLowerCase();

    if (isImageFile(file)) return "image";
    if (type === "application/pdf" || ext === "pdf") return "pdf";
    if (type.startsWith("text/") || TEXT_EXTENSIONS.has(ext)) return "text";

    return "unknown";
  }

  function getKindLabel(kind) {
    if (kind === "image") return "Imagem";
    if (kind === "pdf") return "PDF";
    if (kind === "text") return "Texto";
    if (kind === "youtube") return "YouTube";
    return "Arquivo";
  }

  function getRatioLabel(value) {
    if (value === "fill") return "Preencher janela";
    return value;
  }

  function parseRatio(value) {
    if (value === "fill") return null;
    const parts = String(value).split(":").map(Number);
    if (parts.length !== 2 || !parts[0] || !parts[1]) return 16 / 9;
    return parts[0] / parts[1];
  }

  function fitVirtualScreen(screenElement, parentElement, ratioValue, reservedHeight = 0) {
    if (!screenElement || !parentElement) return;

    const parentWidth = parentElement.clientWidth;
    const parentHeight = Math.max(80, parentElement.clientHeight - reservedHeight);
    if (!parentWidth || !parentHeight) return;

    if (ratioValue === "fill") {
      screenElement.style.width = parentWidth + "px";
      screenElement.style.height = parentHeight + "px";
      return;
    }

    const ratio = parseRatio(ratioValue);
    let width = parentWidth;
    let height = width / ratio;

    if (height > parentHeight) {
      height = parentHeight;
      width = height * ratio;
    }

    screenElement.style.width = Math.floor(width) + "px";
    screenElement.style.height = Math.floor(height) + "px";
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

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

  function getTrailState(container) {
    let state = trailStateByContainer.get(container);

    if (!state) {
      state = { points: [], raf: null, svg: null, polyline: null };
      trailStateByContainer.set(container, state);
    }

    return state;
  }

  function ensureTrailSvg(container) {
    const state = getTrailState(container);
    if (state.svg && state.svg.isConnected) return state;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("pointer-trail-svg");
    svg.setAttribute("viewBox", "0 0 1000 1000");
    svg.setAttribute("preserveAspectRatio", "none");

    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.classList.add("pointer-trail-polyline");

    svg.appendChild(polyline);
    container.appendChild(svg);

    state.svg = svg;
    state.polyline = polyline;

    return state;
  }

  function renderPointerTrail(container) {
    const state = ensureTrailSvg(container);
    const now = performance.now();

    state.points = state.points.filter(point => now - point.t <= TRAIL_DURATION);

    if (state.points.length < 2) {
      state.polyline.setAttribute("points", "");
      return false;
    }

    const points = state.points.map(point => `${point.x * 1000},${point.y * 1000}`).join(" ");
    state.polyline.setAttribute("points", points);
    state.polyline.style.opacity = "1";

    return state.points.length > 0;
  }

  function animatePointerTrail(container) {
    const state = getTrailState(container);
    const stillHasTrail = renderPointerTrail(container);

    if (stillHasTrail) {
      state.raf = requestAnimationFrame(() => animatePointerTrail(container));
    } else {
      state.raf = null;
    }
  }

  function addPointerTrail(container, x, y) {
    const state = ensureTrailSvg(container);
    const now = performance.now();
    const last = state.points[state.points.length - 1];

    if (last) {
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.004) return;
    }

    state.points.push({ x, y, t: now });
    if (state.points.length > 40) state.points.shift();

    renderPointerTrail(container);

    if (!state.raf) {
      state.raf = requestAnimationFrame(() => animatePointerTrail(container));
    }
  }

  function clearPointerTrail(container) {
    const state = getTrailState(container);
    state.points = [];

    if (state.polyline) state.polyline.setAttribute("points", "");
    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }
  }

  function renderPointer(container, pointerState) {
    let pointer = container.querySelector(".pointer-dot");

    if (!pointer) {
      pointer = document.createElement("div");
      pointer.className = "pointer-dot";
      container.appendChild(pointer);
    }

    if (!pointerState || !pointerState.visible) {
      pointer.classList.remove("visible");
      return;
    }

    pointer.style.left = `${pointerState.x * 100}%`;
    pointer.style.top = `${pointerState.y * 100}%`;
    pointer.classList.add("visible");
  }

  function renderGrid(container, settings, forceHidden = false) {
    let overlay = container.querySelector(".grid-overlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "grid-overlay";
      container.appendChild(overlay);
    }

    overlay.innerHTML = "";

    if (forceHidden || !settings || !settings.enabled) {
      overlay.style.display = "none";
      return;
    }

    overlay.style.display = "block";

    const columns = Math.max(1, Number(settings.columns || 16));
    const rows = Math.max(1, Number(settings.rows || 9));
    const thickness = Math.max(1, Number(settings.thickness || 1));
    const opacity = Math.max(0.05, Math.min(1, Number(settings.opacity || 0.34)));
    const color = hexToRgba(settings.color || "#ffffff", opacity);

    for (let col = 1; col < columns; col++) {
      const line = document.createElement("div");
      line.className = "grid-line";
      line.style.left = `calc(${(col / columns) * 100}% - ${thickness / 2}px)`;
      line.style.top = "0";
      line.style.width = `${thickness}px`;
      line.style.height = "100%";
      line.style.background = color;
      overlay.appendChild(line);
    }

    for (let row = 1; row < rows; row++) {
      const line = document.createElement("div");
      line.className = "grid-line";
      line.style.left = "0";
      line.style.top = `calc(${(row / rows) * 100}% - ${thickness / 2}px)`;
      line.style.width = "100%";
      line.style.height = `${thickness}px`;
      line.style.background = color;
      overlay.appendChild(line);
    }
  }

  function renderTokens(container, tokens, options = {}) {
    let layer = container.querySelector(".token-layer");

    if (!layer) {
      layer = document.createElement("div");
      layer.className = "token-layer";
      container.appendChild(layer);
    }

    layer.innerHTML = "";

    if (options.forceHidden || !tokens || tokens.length === 0) return;

    tokens.forEach(token => {
      const element = document.createElement("div");
      element.className = "map-token";
      element.style.left = `${token.x * 100}%`;
      element.style.top = `${token.y * 100}%`;
      element.style.width = `${token.size || 7}%`;
      element.title = token.name || "Token";

      if (options.master && options.tokensInteractive) {
        element.classList.add("master-token");
        if (token.id === options.selectedId) element.classList.add("selected");
        element.addEventListener("pointerdown", event => options.onTokenPointerDown?.(event, token.id));
      } else if (options.master && token.id === options.selectedId) {
        element.classList.add("selected");
      }

      const img = document.createElement("img");
      img.src = token.data;
      img.alt = token.name || "Token";
      img.draggable = false;

      element.appendChild(img);
      layer.appendChild(element);
    });
  }

  function getGridMetrics(container, settings) {
    const columns = Math.max(1, Number(settings.columns || 16));
    const rows = Math.max(1, Number(settings.rows || 9));
    return {
      columns,
      rows,
      cellW: container.clientWidth / columns,
      cellH: container.clientHeight / rows,
      cell: Math.min(container.clientWidth / columns, container.clientHeight / rows)
    };
  }

  function metersToSquares(meters, settings) {
    const metersPerSquare = Number(settings.metersPerSquare || 1.5);
    return Math.max(0.1, Number(meters || 0) / metersPerSquare);
  }

  function getMeasureColor(measure) {
    return measure?.color || "#22d3ee";
  }

  function getMeasureColorSoft(measure, opacity = 0.18) {
    return hexToRgba(getMeasureColor(measure), opacity);
  }

  function withMeasurementNote(measure, text) {
    const note = String(measure?.note || "").trim();
    return note ? `${note} • ${text}` : text;
  }

  function applyMeasurementLabelStyle(label, measure) {
    const color = getMeasureColor(measure);
    label.style.color = "#ffffff";
    label.style.borderColor = hexToRgba(color, 0.85);
    label.style.boxShadow = `0 0 14px ${hexToRgba(color, 0.55)}, 0 0 18px rgba(0, 0, 0, 0.65)`;
  }

  function applyEffectShapeStyle(element, measure) {
    const color = getMeasureColor(measure);
    element.style.borderColor = color;
    element.style.background = getMeasureColorSoft(measure, 0.18);
    element.style.boxShadow = `0 0 12px ${hexToRgba(color, 0.9)}, inset 0 0 18px ${hexToRgba(color, 0.24)}`;
  }

  function applyLineStyle(element, measure) {
    const color = getMeasureColor(measure);
    element.style.background = color;
    element.style.boxShadow = `0 0 8px ${hexToRgba(color, 0.95)}, 0 0 22px ${hexToRgba(color, 0.65)}`;
  }

  function getMeasurementLabel(measure, settings) {
    if (!measure || !measure.start || !measure.end) return "0 quadrados | 0 m";

    const mode = measure.mode || "line";
    const metersPerSquare = Number(settings.metersPerSquare || 1.5);
    const fixedSquares = metersToSquares(measure.fixedMeters || 3, settings);

    let dxSquares = 0;
    let dySquares = 0;

    if (
      typeof measure.start.col === "number" &&
      typeof measure.end.col === "number" &&
      typeof measure.start.row === "number" &&
      typeof measure.end.row === "number"
    ) {
      dxSquares = Math.abs(measure.end.col - measure.start.col);
      dySquares = Math.abs(measure.end.row - measure.start.row);
    } else {
      const columns = Math.max(1, Number(settings.columns || 16));
      const rows = Math.max(1, Number(settings.rows || 9));
      dxSquares = Math.abs(measure.end.x - measure.start.x) * columns;
      dySquares = Math.abs(measure.end.y - measure.start.y) * rows;
    }

    if (mode === "line") {
      const squares = Math.round(Math.max(dxSquares, dySquares));
      const meters = squares * metersPerSquare;
      const squareLabel = squares === 1 ? "quadrado" : "quadrados";
      return withMeasurementNote(measure, `${squares} ${squareLabel} | ${formatMeters(meters)} m`);
    }

    if (mode === "circle") {
      const radiusSquares = measure.useFixedSize ? fixedSquares : Math.max(dxSquares, dySquares);
      const meters = radiusSquares * metersPerSquare;
      return withMeasurementNote(measure, `Círculo | raio ${formatMeters(meters)} m`);
    }

    if (mode === "square") {
      if (measure.useFixedSize) {
        const meters = fixedSquares * metersPerSquare;
        return withMeasurementNote(measure, `Quadrado | ${formatMeters(meters)} m`);
      }
      const w = Math.max(1, Math.round(dxSquares) + 1);
      const h = Math.max(1, Math.round(dySquares) + 1);
      return withMeasurementNote(measure, `Quadrado | ${w}x${h} q | ${formatMeters(w * metersPerSquare)}x${formatMeters(h * metersPerSquare)} m`);
    }

    if (mode === "cone") {
      const lengthSquares = measure.useFixedSize ? fixedSquares : Math.max(dxSquares, dySquares);
      const meters = lengthSquares * metersPerSquare;
      return withMeasurementNote(measure, `Cone | ${formatMeters(meters)} m`);
    }

    return withMeasurementNote(measure, "Área");
  }

  function appendMeasurementControls(layer, x, y, measure, options) {
    if (!options.master || measure.draft || !measure.id) return null;

    const controls = document.createElement("div");
    controls.className = "measure-controls measurement-hover-ui";
    controls.style.left = `${x}px`;
    controls.style.top = `${y}px`;

    const moveBtn = document.createElement("button");
    moveBtn.className = "measure-mini-btn move";
    moveBtn.title = "Mover esta medição";
    moveBtn.textContent = "↕";
    moveBtn.addEventListener("pointerdown", event => options.onMoveMeasurementPointerDown?.(event, measure.id));

    const noteBtn = document.createElement("button");
    noteBtn.className = "measure-mini-btn note";
    noteBtn.title = "Adicionar/editar nota desta medição";
    noteBtn.textContent = "✎";
    noteBtn.addEventListener("pointerdown", event => {
      event.preventDefault();
      event.stopPropagation();
    });
    noteBtn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      options.onEditMeasurementNote?.(measure.id);
    });

    const colorPicker = document.createElement("input");
    colorPicker.className = "measure-color-picker";
    colorPicker.type = "color";
    colorPicker.title = "Alterar cor desta medição";
    colorPicker.value = getMeasureColor(measure);
    colorPicker.addEventListener("pointerdown", event => {
      event.stopPropagation();
    });
    colorPicker.addEventListener("input", event => {
      event.preventDefault();
      event.stopPropagation();
      options.onUpdateMeasurementColor?.(measure.id, colorPicker.value);
    });
    colorPicker.addEventListener("change", event => {
      event.preventDefault();
      event.stopPropagation();
      options.onUpdateMeasurementColor?.(measure.id, colorPicker.value);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "measure-mini-btn delete";
    deleteBtn.title = "Apagar esta medição";
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("pointerdown", event => {
      event.preventDefault();
      event.stopPropagation();
    });
    deleteBtn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      options.onDeleteMeasurement?.(measure.id);
    });

    controls.appendChild(moveBtn);
    controls.appendChild(noteBtn);
    controls.appendChild(colorPicker);
    controls.appendChild(deleteBtn);
    layer.appendChild(controls);
    return controls;
  }

  function setupMeasurementHoverReveal(zones, label, controls) {
    const usableZones = [label, controls, ...(zones || [])].filter(Boolean);
    let hideTimer = null;

    const show = () => {
      clearTimeout(hideTimer);
      label?.classList.add("visible");
      controls?.classList.add("visible");
    };

    const hide = () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        label?.classList.remove("visible");
        controls?.classList.remove("visible");
      }, 120);
    };

    usableZones.forEach(element => {
      element.classList.add("measure-hover-zone");
      element.addEventListener("mouseenter", show);
      element.addEventListener("mouseleave", hide);
      element.addEventListener("focusin", show);
      element.addEventListener("focusout", hide);
    });
  }

  function appendMeasurement(layer, container, measure, settings, options = {}) {
    if (!measure || !measure.visible || !measure.start || !measure.end) return;

    const mode = measure.mode || "line";
    const width = container.clientWidth;
    const height = container.clientHeight;
    const metrics = getGridMetrics(container, settings);

    const startX = measure.start.x * width;
    const startY = measure.start.y * height;
    const endX = measure.end.x * width;
    const endY = measure.end.y * height;

    const dx = endX - startX;
    const dy = endY - startY;
    const rawLength = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const labelText = getMeasurementLabel(measure, settings);

    if (mode === "line") {
      const line = document.createElement("div");
      line.className = "measure-line";
      line.style.left = `${startX}px`;
      line.style.top = `${startY}px`;
      line.style.width = `${Math.max(1, rawLength)}px`;
      line.style.transform = `rotate(${angle}deg)`;
      applyLineStyle(line, measure);

      const startDot = document.createElement("div");
      startDot.className = "measure-dot";
      startDot.style.left = `${startX}px`;
      startDot.style.top = `${startY}px`;
      applyLineStyle(startDot, measure);
      startDot.style.borderColor = hexToRgba(getMeasureColor(measure), 0.95);

      const endDot = document.createElement("div");
      endDot.className = "measure-dot";
      endDot.style.left = `${endX}px`;
      endDot.style.top = `${endY}px`;
      applyLineStyle(endDot, measure);
      endDot.style.borderColor = hexToRgba(getMeasureColor(measure), 0.95);

      const labelX = (startX + endX) / 2;
      const labelY = (startY + endY) / 2;

      const label = document.createElement("div");
      label.className = "measure-label";
      label.style.left = `${labelX}px`;
      label.style.top = `${labelY}px`;
      label.textContent = labelText;
      applyMeasurementLabelStyle(label, measure);

      layer.appendChild(line);
      layer.appendChild(startDot);
      layer.appendChild(endDot);
      layer.appendChild(label);
      const controls = appendMeasurementControls(layer, labelX, labelY + 10, measure, options);
      setupMeasurementHoverReveal([line, startDot, endDot], label, controls);
      return;
    }

    if (mode === "circle") {
      const fixedSquares = metersToSquares(measure.fixedMeters || 3, settings);
      let radiusPx = measure.useFixedSize ? fixedSquares * metrics.cell : rawLength;

      if (!measure.useFixedSize && settings.snapToGrid) {
        const dxSquares = Math.abs((measure.end.col ?? 0) - (measure.start.col ?? 0));
        const dySquares = Math.abs((measure.end.row ?? 0) - (measure.start.row ?? 0));
        radiusPx = Math.max(dxSquares, dySquares) * metrics.cell;
      }

      const circle = document.createElement("div");
      circle.className = "effect-shape effect-circle";
      applyEffectShapeStyle(circle, measure);
      circle.style.left = `${startX}px`;
      circle.style.top = `${startY}px`;
      circle.style.width = `${radiusPx * 2}px`;
      circle.style.height = `${radiusPx * 2}px`;

      const labelX = startX;
      const labelY = startY - radiusPx;

      const label = document.createElement("div");
      label.className = "measure-label";
      label.style.left = `${labelX}px`;
      label.style.top = `${labelY}px`;
      label.textContent = labelText;
      applyMeasurementLabelStyle(label, measure);

      layer.appendChild(circle);
      layer.appendChild(label);
      const controls = appendMeasurementControls(layer, labelX, labelY + 10, measure, options);
      setupMeasurementHoverReveal([circle], label, controls);
      return;
    }

    if (mode === "square") {
      const square = document.createElement("div");
      square.className = "effect-shape effect-square";
      applyEffectShapeStyle(square, measure);

      let labelX = (startX + endX) / 2;
      let labelY = Math.min(startY, endY);

      if (measure.useFixedSize) {
        const sidePx = metersToSquares(measure.fixedMeters || 3, settings) * metrics.cell;
        square.style.left = `${startX - sidePx / 2}px`;
        square.style.top = `${startY - sidePx / 2}px`;
        square.style.width = `${sidePx}px`;
        square.style.height = `${sidePx}px`;
        labelX = startX;
        labelY = startY - sidePx / 2;
      } else if (settings.snapToGrid && typeof measure.start.col === "number" && typeof measure.end.col === "number") {
        const c1 = Math.min(measure.start.col, measure.end.col);
        const c2 = Math.max(measure.start.col, measure.end.col);
        const r1 = Math.min(measure.start.row, measure.end.row);
        const r2 = Math.max(measure.start.row, measure.end.row);
        const left = (c1 / metrics.columns) * width;
        const top = (r1 / metrics.rows) * height;
        const w = ((c2 - c1 + 1) / metrics.columns) * width;
        const h = ((r2 - r1 + 1) / metrics.rows) * height;

        square.style.left = `${left}px`;
        square.style.top = `${top}px`;
        square.style.width = `${w}px`;
        square.style.height = `${h}px`;

        labelX = left + w / 2;
        labelY = top;
      } else {
        square.style.left = `${Math.min(startX, endX)}px`;
        square.style.top = `${Math.min(startY, endY)}px`;
        square.style.width = `${Math.abs(dx)}px`;
        square.style.height = `${Math.abs(dy)}px`;
      }

      const label = document.createElement("div");
      label.className = "measure-label";
      label.style.left = `${labelX}px`;
      label.style.top = `${labelY}px`;
      label.textContent = labelText;
      applyMeasurementLabelStyle(label, measure);

      layer.appendChild(square);
      layer.appendChild(label);
      const controls = appendMeasurementControls(layer, labelX, labelY + 10, measure, options);
      setupMeasurementHoverReveal([square], label, controls);
      return;
    }

    if (mode === "cone") {
      const ux = rawLength ? dx / rawLength : 1;
      const uy = rawLength ? dy / rawLength : 0;

      const fixedSquares = metersToSquares(measure.fixedMeters || 3, settings);
      let coneLength = measure.useFixedSize ? fixedSquares * metrics.cell : rawLength;

      if (!measure.useFixedSize && settings.snapToGrid) {
        const dxSquares = Math.abs((measure.end.col ?? 0) - (measure.start.col ?? 0));
        const dySquares = Math.abs((measure.end.row ?? 0) - (measure.start.row ?? 0));
        coneLength = Math.max(dxSquares, dySquares) * metrics.cell;
      }

      const baseCenterX = startX + ux * coneLength;
      const baseCenterY = startY + uy * coneLength;
      const halfBase = coneLength / 2;

      const px = -uy;
      const py = ux;

      const p1 = `${startX},${startY}`;
      const p2 = `${baseCenterX + px * halfBase},${baseCenterY + py * halfBase}`;
      const p3 = `${baseCenterX - px * halfBase},${baseCenterY - py * halfBase}`;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("effect-cone-svg");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("preserveAspectRatio", "none");

      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.classList.add("effect-cone-polygon");
      polygon.setAttribute("points", `${p1} ${p2} ${p3}`);
      polygon.style.fill = getMeasureColorSoft(measure, 0.18);
      polygon.style.stroke = getMeasureColor(measure);
      polygon.style.filter = `drop-shadow(0 0 10px ${hexToRgba(getMeasureColor(measure), 0.85)})`;

      svg.appendChild(polygon);

      const label = document.createElement("div");
      label.className = "measure-label";
      label.style.left = `${baseCenterX}px`;
      label.style.top = `${baseCenterY}px`;
      label.textContent = labelText;
      applyMeasurementLabelStyle(label, measure);

      layer.appendChild(svg);
      layer.appendChild(label);
      const controls = appendMeasurementControls(layer, baseCenterX, baseCenterY + 10, measure, options);
      setupMeasurementHoverReveal([polygon], label, controls);
    }
  }

  function renderMeasurements(container, items, settings, forceHidden = false, options = {}) {
    let layer = container.querySelector(".measure-layer");

    if (!layer) {
      layer = document.createElement("div");
      layer.className = "measure-layer";
      container.appendChild(layer);
    }

    layer.innerHTML = "";

    if (forceHidden || !items || items.length === 0) return;

    items.forEach(item => appendMeasurement(layer, container, item, settings, options));
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

  function buildYoutubeEmbedUrl(videoId, autoplay = 0) {
    const id = encodeURIComponent(videoId || "");
    const origin = encodeURIComponent(window.location.origin || "http://127.0.0.1:8787");
    return `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&controls=1&fs=1&iv_load_policy=3&origin=${origin}`;
  }


  function loadYoutubeIframeApi() {
    if (window.YT && window.YT.Player) {
      youtubeApiReady = true;
      return;
    }

    if (youtubeApiLoading) return;
    youtubeApiLoading = true;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode.insertBefore(tag, firstScript);
  }

  function registerYoutubePlayers() {
    if (!(window.YT && window.YT.Player)) {
      loadYoutubeIframeApi();
      return;
    }

    youtubeApiReady = true;

    document.querySelectorAll("iframe.youtube-full-frame, iframe.youtube-control-frame").forEach((iframe) => {
      if (!iframe.id) iframe.id = "yt-iframe-" + createId();
      if (youtubePlayers.has(iframe.id)) return;

      try {
        const player = new YT.Player(iframe.id, {
          events: {
            onReady: () => {
              iframe.dataset.ytReady = "1";
            }
          }
        });
        youtubePlayers.set(iframe.id, player);
      } catch (error) {
        console.warn("Não foi possível registrar player do YouTube:", error);
      }
    });
  }

  function forEachReadyYoutubePlayer(callback) {
    registerYoutubePlayers();

    youtubePlayers.forEach((player, id) => {
      const iframe = document.getElementById(id);
      if (!iframe || !iframe.isConnected) {
        youtubePlayers.delete(id);
        return;
      }

      try {
        callback(player, iframe);
      } catch (error) {
        console.warn("Comando do YouTube falhou:", error);
      }
    });
  }

  function executeYoutubeControl(command, value) {
    const run = () => {
      forEachReadyYoutubePlayer((player) => {
        if (command === "play" && typeof player.playVideo === "function") player.playVideo();
        if (command === "pause" && typeof player.pauseVideo === "function") player.pauseVideo();
        if (command === "stop" && typeof player.stopVideo === "function") player.stopVideo();
        if (command === "mute" && typeof player.mute === "function") player.mute();
        if (command === "unmute" && typeof player.unMute === "function") player.unMute();

        if (command === "volume" && typeof player.setVolume === "function") {
          player.setVolume(Math.max(0, Math.min(100, Number(value || 0))));
        }

        if (command === "seekRelative" && typeof player.seekTo === "function" && typeof player.getCurrentTime === "function") {
          const current = Number(player.getCurrentTime() || 0);
          player.seekTo(Math.max(0, current + Number(value || 0)), true);
        }
      });
    };

    run();
    setTimeout(run, 250);
    setTimeout(run, 1000);
  }

  function broadcastYoutubeControl(command, value = null) {
    executeYoutubeControl(command, value);
    sendToPlayers(createMessage("youtubeControl", { command, value }));
  }

  function updateYoutubeControlPanel(item, force = false) {
    const box = document.getElementById("youtubeControlBox");
    const status = document.getElementById("youtubeStatus");

    if (!box) return;

    if (!item || item.kind !== "youtube" || !item.videoId) {
      if (force) {
        currentControlVideoId = null;
        box.innerHTML = `<div class="library-empty">Selecione um vídeo da biblioteca para carregar o player de controle.</div>`;
      }
      return;
    }

    if (!force && currentControlVideoId === item.videoId && box.querySelector("iframe")) {
      return;
    }

    currentControlVideoId = item.videoId;
    box.innerHTML = `
      <iframe
        id="yt-control-${item.id}"
        class="youtube-control-frame"
        src="${buildYoutubeEmbedUrl(item.videoId, 0)}"
        title="${escapeHtml(item.name || item.title || "Controle YouTube")}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    `;

    if (status) {
      status.textContent = "Player de controle carregado. Use os botões abaixo para sincronizar com a TV.";
    }

    setTimeout(registerYoutubePlayers, 120);
  }

  function renderItem(container, item, options = {}) {
    container.innerHTML = "";

    if (!item || item.action === "blackout") {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.innerHTML = `<h2>${options.player ? "" : "Tela oculta"}</h2><p>${options.player ? "" : "Nada está sendo exibido para os jogadores."}</p>`;
      container.appendChild(empty);
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "media-wrap " + (item.fit || "contain");

    const zoom = Number(item.zoom || 1);
    const rotation = Number(item.rotation || 0);
    const transform = `scale(${zoom}) rotate(${rotation}deg)`;

    if (item.kind === "image") {
      const img = document.createElement("img");
      img.src = item.data;
      img.alt = item.name || "Imagem";
      img.draggable = false;
      img.style.transform = transform;
      img.style.transformOrigin = "center center";
      wrap.appendChild(img);
    } else if (item.kind === "pdf") {
      const iframe = document.createElement("iframe");
      iframe.className = "pdf-frame";
      iframe.src = item.data;
      iframe.style.transform = transform;
      iframe.style.transformOrigin = "center center";
      wrap.appendChild(iframe);
    } else if (item.kind === "youtube") {
      wrap.className = "media-wrap youtube-full-wrap";

      const iframe = document.createElement("iframe");
      iframe.className = "youtube-full-frame";
      iframe.id = "yt-full-" + createId();
      iframe.dataset.youtubeManaged = "1";
      iframe.src = buildYoutubeEmbedUrl(item.videoId, options.player ? 1 : 0);
      iframe.title = item.title || item.name || "YouTube";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      iframe.style.transform = transform;
      iframe.style.transformOrigin = "center center";

      wrap.appendChild(iframe);
      setTimeout(registerYoutubePlayers, 120);
    } else if (item.kind === "text") {
      const textCard = document.createElement("div");
      textCard.className = "text-card";
      textCard.style.transform = transform;
      textCard.style.transformOrigin = "center center";
      textCard.innerHTML = escapeHtml(item.text || "");
      wrap.appendChild(textCard);
    } else {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.innerHTML = `<h2>Arquivo não suportado</h2><p>Use imagem, PDF, YouTube ou texto nesta versão.</p>`;
      wrap.appendChild(empty);
    }

    container.appendChild(wrap);
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function guessMimeType(file) {
    const type = String(file?.type || "").trim();
    if (type) return type;

    const ext = getExtension(file?.name || "");
    const map = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      bmp: "image/bmp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      txt: "text/plain;charset=utf-8",
      md: "text/markdown;charset=utf-8",
      json: "application/json;charset=utf-8",
      csv: "text/csv;charset=utf-8",
      log: "text/plain;charset=utf-8"
    };

    return map[ext] || "application/octet-stream";
  }

  function readBlobWithFileReader(file, method = "dataUrl") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Falha no FileReader"));
      reader.onabort = () => reject(new Error("Leitura cancelada"));

      if (method === "text") reader.readAsText(file);
      else reader.readAsDataURL(file);
    });
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
  }

  async function readDataUrlStable(file) {
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await readBlobWithFileReader(file, "dataUrl");
        if (result) return result;
      } catch (error) {
        lastError = error;
        await wait(80 * attempt);
      }
    }

    try {
      const buffer = await file.arrayBuffer();
      return `data:${guessMimeType(file)};base64,${arrayBufferToBase64(buffer)}`;
    } catch (error) {
      throw lastError || error;
    }
  }

  async function readTextStable(file) {
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        if (typeof file.text === "function") return await file.text();
        const result = await readBlobWithFileReader(file, "text");
        return String(result || "");
      } catch (error) {
        lastError = error;
        await wait(80 * attempt);
      }
    }

    try {
      const buffer = await file.arrayBuffer();
      return new TextDecoder("utf-8").decode(buffer);
    } catch (error) {
      throw lastError || error;
    }
  }

  async function readFileAsItem(file) {
    const kind = getFileKind(file);
    if (kind === "unknown") return null;

    if (kind === "text") {
      const text = await readTextStable(file);
      return { id: createId(), kind, name: file.name, text: String(text || ""), size: file.size, ...defaultSettings };
    }

    const data = await readDataUrlStable(file);
    return { id: createId(), kind, name: file.name, type: guessMimeType(file), data, size: file.size, ...defaultSettings };
  }

  async function readTokenFile(file) {
    if (!isImageFile(file)) return null;

    const data = await readDataUrlStable(file);
    return { id: createId(), name: file.name, data, size: file.size };
  }

  function loadNotes() {
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      if (!raw) return { initiatives: "", hp: "", important: "", story: "" };
      return JSON.parse(raw);
    } catch (error) {
      return { initiatives: "", hp: "", important: "", story: "" };
    }
  }

  function saveNotes(notes) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function getMasterRenderKey(item) {
    if (!item || item.action === "blackout") return "empty";

    return [
      item.id || "no-id",
      item.kind || "unknown",
      item.videoId || "",
      item.fit || "contain",
      Number(item.zoom || 1),
      Number(item.rotation || 0)
    ].join("|");
  }

  function renderMasterItemIfNeeded(container, force = false) {
    const key = getMasterRenderKey(stagedItem);

    if (!force && key === lastMasterRenderKey) {
      return false;
    }

    renderItem(container, stagedItem, { player: false });
    lastMasterRenderKey = key;
    return true;
  }

  function renderMaster() {
    app.className = "app";
    app.innerHTML = `
      <header class="topbar">
        <div>
          <h1>Mesa RPG - Espelho do Mestre</h1>
          <span>Controles rápidos, player protegido, upload estável, tokens, grid e áreas.</span>
        </div>
        <span class="pill">Versão 11 - notas por hover + upload estável</span>
      </header>

      <main class="layout">
        <aside class="sidebar">
          <section class="panel">
            <h2>1. Tela dos jogadores</h2>
            <div class="buttons two">
              <button class="primary" id="openPlayerBtn">Abrir TV</button>
              <button class="success" id="showBtnTop">Mostrar cena</button>
            </div>
            <div class="status" id="playerStatus">Tela dos jogadores ainda não aberta.</div>
          </section>

          <section class="panel">
            <h2>2. Controles rápidos</h2>

            <div class="quick-grid">
              <div class="field">
                <label for="screenRatioSelect">Tela virtual</label>
                <select id="screenRatioSelect">
                  <option value="16:9">16:9</option>
                  <option value="4:3">4:3</option>
                  <option value="1:1">1:1</option>
                  <option value="21:9">21:9</option>
                  <option value="fill">Preencher</option>
                </select>
              </div>

              <div class="field">
                <label for="rulerModeSelect">Ferramenta</label>
                <select id="rulerModeSelect">
                  <option value="line">Linha / Régua</option>
                  <option value="circle">Círculo</option>
                  <option value="square">Quadrado</option>
                  <option value="cone">Cone</option>
                </select>
              </div>
            </div>

            <div class="compact-tools">
              <button id="quickLineBtn">Linha</button>
              <button id="quickCircleBtn">Círculo</button>
              <button id="quickSquareBtn">Quad.</button>
              <button id="quickConeBtn">Cone</button>
            </div>

            <div class="compact-row" style="margin-top: 8px;">
              <div class="field">
                <label for="gridColumnsInput">Col.</label>
                <input id="gridColumnsInput" type="number" min="1" max="100" value="16" />
              </div>

              <div class="field">
                <label for="gridRowsInput">Lin.</label>
                <input id="gridRowsInput" type="number" min="1" max="100" value="9" />
              </div>

              <div class="field">
                <label for="gridMetersInput">m/q.</label>
                <input id="gridMetersInput" type="number" min="0.1" step="0.1" value="1.5" />
              </div>
            </div>

            <div class="quick-grid">
              <div class="field">
                <label for="effectFixedMetersInput">Tamanho fixo</label>
                <input id="effectFixedMetersInput" type="number" min="0.1" step="0.5" value="3" />
              </div>

              <div class="field">
                <label for="effectColorInput">Cor do efeito</label>
                <input id="effectColorInput" type="color" value="#22d3ee" />
              </div>

              <div class="field">
                <label for="gridColorInput">Cor do grid</label>
                <input id="gridColorInput" type="color" value="#ffffff" />
              </div>

              <div class="field">
                <label for="gridThicknessInput">Esp. <span id="gridThicknessValue" class="range-value">1px</span></label>
                <input id="gridThicknessInput" type="range" min="1" max="5" step="1" value="1" />
              </div>

              <div class="field">
                <label for="gridOpacityInput">Int. <span id="gridOpacityValue" class="range-value">34%</span></label>
                <input id="gridOpacityInput" type="range" min="0.05" max="1" step="0.05" value="0.34" />
              </div>
            </div>

            <label class="checkline"><input type="checkbox" id="gridEnabledCheck" /> Exibir grid</label>
            <label class="checkline"><input type="checkbox" id="gridShowPlayersCheck" checked /> Mostrar grid na TV</label>
            <label class="checkline"><input type="checkbox" id="gridSnapCheck" checked /> Prender no centro dos quadrados</label>
            <label class="checkline"><input type="checkbox" id="effectFixedCheck" /> Usar tamanho fixo nas áreas</label>

            <div class="buttons two">
              <button id="applyGridBtn" class="primary">Aplicar</button>
              <button id="clearMeasurementsBtn" class="warning">Limpar medições</button>
            </div>

            <div class="status" id="screenRatioStatus">Tela virtual: 16:9</div>
            <div class="status" id="gridStatus">Grid: desligado | 16 x 9 | 1,5 m por quadrado</div>
          </section>

          <section class="panel">
            <h2>3. Biblioteca de vídeos do YouTube</h2>
            <p>Cole o link ou ID. O vídeo abre em tela cheia na tela virtual/TV, enquanto o player pequeno abaixo serve para controlar com mais precisão.</p>

            <div class="field">
              <label for="youtubeLinkInput">Link ou ID do vídeo</label>
              <input id="youtubeLinkInput" type="text" placeholder="Ex: https://www.youtube.com/watch?v=..." />
            </div>

            <div class="field">
              <label for="youtubeTitleInput">Nome opcional</label>
              <input id="youtubeTitleInput" type="text" placeholder="Ex: Mapa interativo / Música de batalha" />
            </div>

            <div class="buttons two">
              <button id="addYoutubeBtn" class="success">Preparar vídeo</button>
              <button id="showYoutubeBtn" class="primary">Mostrar agora</button>
            </div>

            <div class="youtube-control-panel">
              <div class="youtube-control-title">Player de controle do mestre</div>
              <div id="youtubeControlBox" class="youtube-control-box">
                <div class="library-empty">Selecione ou prepare um vídeo para carregar o player.</div>
              </div>

              <div class="buttons four" style="margin-top: 7px;">
                <button id="youtubePlayBtn" class="success">Play</button>
                <button id="youtubePauseBtn" class="warning">Pause</button>
                <button id="youtubeBackBtn">-10s</button>
                <button id="youtubeForwardBtn">+10s</button>
              </div>

              <div class="buttons three" style="margin-top: 7px;">
                <button id="youtubeStopBtn">Stop</button>
                <button id="youtubeMuteBtn">Mudo</button>
                <button id="youtubeUnmuteBtn">Som</button>
              </div>

              <div class="field" style="margin-top: 8px;">
                <label for="youtubeVolumeRange">Volume sincronizado <span id="youtubeVolumeValue" class="range-value">70%</span></label>
                <input id="youtubeVolumeRange" type="range" min="0" max="100" step="1" value="70" />
              </div>
            </div>

            <div id="videoLibraryList" class="video-library-list" style="margin-top: 8px;">
              <div class="library-empty">Nenhum vídeo preparado.</div>
            </div>

            <div class="buttons two" style="margin-top: 8px;">
              <button id="removeYoutubeBtn" class="warning">Remover vídeo</button>
              <button id="clearYoutubeBtn" class="danger">Limpar vídeos</button>
            </div>

            <div class="status" id="youtubeStatus">Servidor JavaScript local. Sem Python e sem chave da API de dados do YouTube.</div>
          </section>

          <section class="panel">
            <h2>4. Biblioteca de imagens, mapas e cenas</h2>
            <input class="file-input" id="fileInput" type="file" multiple accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.pdf,.txt,.md,.json,.csv,text/plain" />
            <div class="status" id="fileInfo">Nenhum arquivo carregado.</div>
            <div class="mini-note">Aceita imagens JPG, PNG, WebP, GIF, BMP, SVG, PDF e TXT/MD. Limite prático: até 60 MB por arquivo.</div>

            <div id="libraryList" class="library-grid" style="margin-top: 8px;"></div>

            <div class="buttons two" style="margin-top: 8px;">
              <button id="showSelectedSmallBtn" class="success">Mostrar</button>
              <button id="removeSelectedBtn" class="danger">Excluir</button>
            </div>

            <div class="buttons two" style="margin-top: 7px;">
              <button id="clearLibraryBtn" class="danger">Limpar cenas</button>
              <button class="warning" id="hideBtn">Tela preta</button>
            </div>
          </section>

          <section class="panel">
            <h2>5. Biblioteca de tokens</h2>
            <input class="file-input" id="tokenInput" type="file" multiple accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg" />
            <div class="mini-note">Tokens aceitos: JPG, PNG, WebP, GIF, BMP ou SVG. Limite prático: até 15 MB por token.</div>

            <div id="tokenLibraryList" class="token-library-grid" style="margin-top: 8px;"></div>

            <div class="buttons two" style="margin-top: 8px;">
              <button id="addTokenToMapBtn" class="success">Adicionar</button>
              <button id="removeTokenSourceBtn" class="danger">Excluir</button>
            </div>

            <div class="buttons four" style="margin-top: 7px;">
              <button id="tokenSizeDownBtn">-</button>
              <button id="tokenSizeUpBtn">+</button>
              <button id="removeMapTokenBtn" class="warning">Rem.</button>
              <button id="clearMapTokensBtn" class="danger">Limpar</button>
            </div>

            <div class="status" id="tokenStatus">Nenhum token carregado.</div>
          </section>

          <section class="panel">
            <h2>6. Ajuste da cena</h2>

            <div class="quick-grid">
              <div class="field">
                <label for="fitSelect">Ajuste</label>
                <select id="fitSelect">
                  <option value="contain">Mostrar inteiro</option>
                  <option value="cover">Preencher</option>
                  <option value="stretch">Esticar</option>
                </select>
              </div>

              <div class="field">
                <label>&nbsp;</label>
                <button id="resetViewBtn">Resetar</button>
              </div>
            </div>

            <div class="buttons four">
              <button id="zoomOutBtn">Zoom -</button>
              <button id="zoomInBtn">Zoom +</button>
              <button id="rotateLeftBtn">-90°</button>
              <button id="rotateRightBtn">+90°</button>
            </div>

            <div class="status" id="viewStatus">Zoom: 100% | Rotação: 0°</div>
          </section>

          <section class="panel">
            <h2>7. Texto rápido</h2>
            <div class="field">
              <label for="quickTextTitle">Nome</label>
              <input id="quickTextTitle" type="text" placeholder="Ex: Carta da Clínica Aurora" />
            </div>

            <div class="field">
              <label for="quickText">Texto</label>
              <textarea id="quickText" placeholder="Ex: Ao abrir o envelope..."></textarea>
            </div>

            <button id="prepareTextBtn">Adicionar texto</button>
          </section>
        </aside>

        <section class="stage">
          <div class="stage-header">
            <div>
              <strong>Prévia privada do Mestre</strong><br />
              <small id="previewTitle">Nada preparado ainda.</small>
            </div>
            <small id="previewHelp">A prévia respeita a proporção escolhida.</small>
          </div>

          <div class="preview-area" id="previewArea">
            <div class="preview-stack" id="previewStack">
              <div class="screen master-screen" id="masterPreview"></div>

              <div class="toolbar-dock" id="toolbarDock">
                <div class="floating-toolbar" id="floatingToolbar">
                  <button class="tool-btn toolbar-toggle" id="toolbarToggleBtn" title="Recolher/expandir barra">
                    <span class="tool-icon" id="toolbarToggleIcon">⇤</span>
                    <span id="toolbarToggleText">Recolher</span>
                  </button>

                  <button class="tool-btn" id="toggleGridBtn" title="Ativar/desativar grid">
                    <span class="tool-icon">▦</span><span>Grid</span>
                  </button>

                  <button class="tool-btn" id="togglePointerBtn" title="Pointer">
                    <span class="tool-icon">➤</span><span>Pointer</span>
                  </button>

                  <button class="tool-btn" id="toolLineBtn" title="Linha / Régua">
                    <span class="tool-icon">─</span><span>Linha</span>
                  </button>

                  <button class="tool-btn" id="toolCircleBtn" title="Círculo">
                    <span class="tool-icon">○</span><span>Círculo</span>
                  </button>

                  <button class="tool-btn" id="toolSquareBtn" title="Quadrado">
                    <span class="tool-icon">□</span><span>Quad.</span>
                  </button>

                  <button class="tool-btn" id="toolConeBtn" title="Cone">
                    <span class="tool-icon">◢</span><span>Cone</span>
                  </button>

                  <button class="tool-btn" id="clearMeasurementsToolBtn" title="Limpar todas as medições">
                    <span class="tool-icon">⌫</span><span>Med.</span>
                  </button>

                  <button class="tool-btn" id="clearToolsBtn" title="Desativar ferramentas">
                    <span class="tool-icon">✕</span><span>Tool</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside class="notesbar">
          <section class="panel">
            <h2>Anotações do Mestre</h2>
            <p>Iniciativa, PV, consequências e pontos importantes.</p>

            <div class="field">
              <label for="notesInitiatives">Iniciativas</label>
              <textarea class="notes-area" id="notesInitiatives" placeholder="18 - Lukan&#10;15 - Goblin&#10;13 - Wilhelm"></textarea>
            </div>

            <div class="field">
              <label for="notesHp">Vida / recursos</label>
              <textarea class="notes-area" id="notesHp" placeholder="Wilhelm: 32/40 PV&#10;Vargan: 58/80 PV"></textarea>
            </div>

            <div class="field">
              <label for="notesImportant">Eventos importantes</label>
              <textarea class="notes-area large" id="notesImportant" placeholder="- O grupo poupou o guarda.&#10;- Callahan pegou o documento."></textarea>
            </div>

            <div class="field">
              <label for="notesStory">Lembrar depois</label>
              <textarea class="notes-area large" id="notesStory" placeholder="- Criar consequência para a próxima sessão."></textarea>
            </div>

            <div class="buttons two">
              <button id="saveNotesBtn" class="success">Salvar</button>
              <button id="clearNotesBtn" class="danger">Limpar</button>
            </div>

            <div class="notes-save-status" id="notesSaveStatus">Notas salvas automaticamente neste navegador.</div>
          </section>
        </aside>
      </main>
    `;

    const previewArea = document.getElementById("previewArea");
    const previewStack = document.getElementById("previewStack");
    const masterPreview = document.getElementById("masterPreview");
    const toolbarDock = document.getElementById("toolbarDock");
    const previewTitle = document.getElementById("previewTitle");
    const previewHelp = document.getElementById("previewHelp");
    const fileInput = document.getElementById("fileInput");
    const fileInfo = document.getElementById("fileInfo");
    const playerStatus = document.getElementById("playerStatus");
    const fitSelect = document.getElementById("fitSelect");
    const viewStatus = document.getElementById("viewStatus");
    const libraryList = document.getElementById("libraryList");

    const tokenInput = document.getElementById("tokenInput");
    const tokenLibraryList = document.getElementById("tokenLibraryList");
    const tokenStatus = document.getElementById("tokenStatus");

    const floatingToolbar = document.getElementById("floatingToolbar");
    const toolbarToggleBtn = document.getElementById("toolbarToggleBtn");
    const toolbarToggleIcon = document.getElementById("toolbarToggleIcon");
    const toolbarToggleText = document.getElementById("toolbarToggleText");

    const toggleGridBtn = document.getElementById("toggleGridBtn");
    const togglePointerBtn = document.getElementById("togglePointerBtn");
    const toolLineBtn = document.getElementById("toolLineBtn");
    const toolCircleBtn = document.getElementById("toolCircleBtn");
    const toolSquareBtn = document.getElementById("toolSquareBtn");
    const toolConeBtn = document.getElementById("toolConeBtn");
    const clearMeasurementsToolBtn = document.getElementById("clearMeasurementsToolBtn");
    const clearToolsBtn = document.getElementById("clearToolsBtn");

    const quickLineBtn = document.getElementById("quickLineBtn");
    const quickCircleBtn = document.getElementById("quickCircleBtn");
    const quickSquareBtn = document.getElementById("quickSquareBtn");
    const quickConeBtn = document.getElementById("quickConeBtn");

    const screenRatioSelect = document.getElementById("screenRatioSelect");
    const screenRatioStatus = document.getElementById("screenRatioStatus");

    const gridEnabledCheck = document.getElementById("gridEnabledCheck");
    const gridShowPlayersCheck = document.getElementById("gridShowPlayersCheck");
    const gridSnapCheck = document.getElementById("gridSnapCheck");
    const gridColumnsInput = document.getElementById("gridColumnsInput");
    const gridRowsInput = document.getElementById("gridRowsInput");
    const gridMetersInput = document.getElementById("gridMetersInput");
    const gridColorInput = document.getElementById("gridColorInput");
    const gridThicknessInput = document.getElementById("gridThicknessInput");
    const gridOpacityInput = document.getElementById("gridOpacityInput");
    const gridThicknessValue = document.getElementById("gridThicknessValue");
    const gridOpacityValue = document.getElementById("gridOpacityValue");
    const gridStatus = document.getElementById("gridStatus");

    const rulerModeSelect = document.getElementById("rulerModeSelect");
    const effectFixedCheck = document.getElementById("effectFixedCheck");
    const effectFixedMetersInput = document.getElementById("effectFixedMetersInput");
    const effectColorInput = document.getElementById("effectColorInput");

    const notesInitiatives = document.getElementById("notesInitiatives");
    const notesHp = document.getElementById("notesHp");
    const notesImportant = document.getElementById("notesImportant");
    const notesStory = document.getElementById("notesStory");
    const notesSaveStatus = document.getElementById("notesSaveStatus");

    let notesSaveTimer = null;

    function updateToolbarState() {
      floatingToolbar.classList.toggle("collapsed", toolbarCollapsed);
      toolbarToggleIcon.textContent = toolbarCollapsed ? "☰" : "⇤";
      toolbarToggleText.textContent = toolbarCollapsed ? "Abrir" : "Recolher";
    }

    function updateScreenSize() {
      const reservedHeight = toolbarDock.offsetHeight || 68;
      fitVirtualScreen(masterPreview, previewArea, screenRatio, reservedHeight);
      previewStack.style.width = masterPreview.style.width;
      renderMasterOverlays();
    }

    function updateSelectedFromId() {
      stagedItem = getSelectedItem();
    }

    function renderMasterOverlays() {
      const tokensInteractive = !pointerEnabled && !rulerEnabled && !isDrawingMeasure && !measureDrag;

      renderGrid(masterPreview, gridSettings, !stagedItem);
      renderTokens(masterPreview, mapTokens, {
        master: true,
        selectedId: selectedMapTokenId,
        tokensInteractive,
        forceHidden: !stagedItem,
        onTokenPointerDown: startTokenDrag
      });
      renderMeasurements(masterPreview, getVisibleMeasurements(), gridSettings, !stagedItem, {
        master: true,
        onDeleteMeasurement: deleteMeasurement,
        onMoveMeasurementPointerDown: startMeasurementDrag,
        onEditMeasurementNote: editMeasurementNote,
        onUpdateMeasurementColor: updateMeasurementColor
      });
      renderPointer(masterPreview, masterPointer);
    }

    function updateToolButtons() {
      toggleGridBtn.classList.toggle("active-tool", gridSettings.enabled);
      togglePointerBtn.classList.toggle("active-tool", pointerEnabled);

      toolLineBtn.classList.toggle("active-tool", rulerEnabled && rulerSettings.mode === "line");
      toolCircleBtn.classList.toggle("active-tool", rulerEnabled && rulerSettings.mode === "circle");
      toolSquareBtn.classList.toggle("active-tool", rulerEnabled && rulerSettings.mode === "square");
      toolConeBtn.classList.toggle("active-tool", rulerEnabled && rulerSettings.mode === "cone");

      quickLineBtn.classList.toggle("active-quick", rulerEnabled && rulerSettings.mode === "line");
      quickCircleBtn.classList.toggle("active-quick", rulerEnabled && rulerSettings.mode === "circle");
      quickSquareBtn.classList.toggle("active-quick", rulerEnabled && rulerSettings.mode === "square");
      quickConeBtn.classList.toggle("active-quick", rulerEnabled && rulerSettings.mode === "cone");

      masterPreview.classList.toggle("pointer-mode", pointerEnabled);
      masterPreview.classList.toggle("ruler-mode", rulerEnabled);
      masterPreview.classList.toggle("measure-move-mode", Boolean(measureDrag));
    }

    function updateGridFields() {
      gridEnabledCheck.checked = Boolean(gridSettings.enabled);
      gridShowPlayersCheck.checked = Boolean(gridSettings.showOnPlayers);
      gridSnapCheck.checked = Boolean(gridSettings.snapToGrid);
      gridColumnsInput.value = gridSettings.columns;
      gridRowsInput.value = gridSettings.rows;
      gridMetersInput.value = gridSettings.metersPerSquare;
      gridColorInput.value = gridSettings.color || "#ffffff";
      gridThicknessInput.value = gridSettings.thickness || 1;
      gridOpacityInput.value = gridSettings.opacity || 0.34;

      rulerModeSelect.value = rulerSettings.mode;
      effectFixedCheck.checked = Boolean(rulerSettings.useFixedSize);
      effectFixedMetersInput.value = rulerSettings.fixedMeters;
      effectColorInput.value = rulerSettings.color || "#22d3ee";

      gridThicknessValue.textContent = `${gridSettings.thickness || 1}px`;
      gridOpacityValue.textContent = `${Math.round((gridSettings.opacity || 0.34) * 100)}%`;
      gridStatus.textContent = `Grid: ${gridSettings.enabled ? "ligado" : "desligado"} | ${gridSettings.columns} x ${gridSettings.rows} | ${formatMeters(gridSettings.metersPerSquare)} m por quadrado`;
    }

    function updatePreview() {
      updateSelectedFromId();

      renderMasterItemIfNeeded(masterPreview);
      updateScreenSize();
      updateToolButtons();
      updateToolbarState();

      if (stagedItem) {
        previewTitle.textContent = stagedItem.name || "Conteúdo preparado";
        fitSelect.value = stagedItem.fit || "contain";
        viewStatus.textContent = `Zoom: ${Math.round((stagedItem.zoom || 1) * 100)}% | Rotação: ${stagedItem.rotation || 0}°`;
      } else {
        previewTitle.textContent = "Nada preparado ainda.";
        viewStatus.textContent = "Zoom: 100% | Rotação: 0°";
      }

      screenRatioSelect.value = screenRatio;
      screenRatioStatus.textContent = `Tela virtual: ${getRatioLabel(screenRatio)}`;
      updateGridFields();
      updateYoutubeControlPanel(stagedItem);

      if (measureDrag) previewHelp.textContent = "Movendo medição selecionada.";
      else if (rulerEnabled) previewHelp.textContent = "Ferramenta de área ativa. Ela funciona por cima dos tokens.";
      else if (pointerEnabled) previewHelp.textContent = "Pointer ativo.";
      else previewHelp.textContent = "Arraste tokens ou use as ferramentas.";
    }

    function renderLibrary() {
      libraryList.innerHTML = "";

      const sceneItems = library.filter(item => item.kind !== "youtube");

      if (sceneItems.length === 0) {
        const empty = document.createElement("div");
        empty.className = "library-empty";
        empty.textContent = "Nenhuma imagem, mapa ou cena preparada.";
        libraryList.appendChild(empty);
        return;
      }

      sceneItems.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "library-card" + (item.id === selectedId ? " active" : "");
        card.title = item.name || "Sem nome";

        const thumb = document.createElement("div");
        thumb.className = "library-thumb";

        if (item.kind === "image") {
          const img = document.createElement("img");
          img.src = item.data;
          thumb.appendChild(img);
        } else if (item.kind === "pdf") {
          thumb.textContent = "PDF";
        } else if (item.kind === "text") {
          thumb.textContent = "TXT";
        } else if (item.kind === "youtube") {
          if (item.thumb) {
            const img = document.createElement("img");
            img.src = item.thumb;
            thumb.appendChild(img);
          } else {
            thumb.textContent = "YT";
          }
        } else {
          thumb.textContent = "ARQ";
        }

        const number = document.createElement("div");
        number.className = "library-number";
        number.textContent = index + 1;

        const caption = document.createElement("div");
        caption.className = "library-caption";

        const title = document.createElement("div");
        title.className = "library-title";
        title.textContent = item.name || "Sem nome";

        const meta = document.createElement("div");
        meta.className = "library-meta";
        meta.textContent = `${getKindLabel(item.kind)}${item.size ? " | " + formatFileSize(item.size) : ""}`;

        caption.appendChild(title);
        caption.appendChild(meta);
        card.appendChild(thumb);
        card.appendChild(number);
        card.appendChild(caption);

        card.addEventListener("click", () => selectItem(item.id));
        card.addEventListener("dblclick", () => {
          selectItem(item.id);
          showSelectedOnTv();
        });

        libraryList.appendChild(card);
      });
    }

    function renderTokenLibrary() {
      tokenLibraryList.innerHTML = "";

      if (tokenLibrary.length === 0) {
        const empty = document.createElement("div");
        empty.className = "library-empty";
        empty.textContent = "Nenhum token.";
        tokenLibraryList.appendChild(empty);
        return;
      }

      tokenLibrary.forEach((token, index) => {
        const card = document.createElement("div");
        card.className = "library-card" + (token.id === selectedTokenSourceId ? " active" : "");
        card.title = token.name || "Token";

        const thumb = document.createElement("div");
        thumb.className = "library-thumb";
        const img = document.createElement("img");
        img.src = token.data;
        img.alt = token.name || "Token";
        thumb.appendChild(img);

        const number = document.createElement("div");
        number.className = "library-number";
        number.textContent = index + 1;

        const caption = document.createElement("div");
        caption.className = "library-caption";

        const title = document.createElement("div");
        title.className = "library-title";
        title.textContent = token.name || "Token";

        caption.appendChild(title);
        card.appendChild(thumb);
        card.appendChild(number);
        card.appendChild(caption);

        card.addEventListener("click", () => {
          selectedTokenSourceId = token.id;
          renderTokenLibrary();
        });

        card.addEventListener("dblclick", () => {
          selectedTokenSourceId = token.id;
          addSelectedTokenToMap();
        });

        tokenLibraryList.appendChild(card);
      });
    }

    function selectItem(id) {
      selectedId = id;
      masterPointer.visible = false;
      measurements = [];
      measureDraft = null;
      measureDrag = null;
      clearPointerTrail(masterPreview);
      sendToPlayers(createMessage("hidePointer"));
      sendMeasurementsState();
      renderLibrary();
      renderVideoLibrary();
      updatePreview();
    }

    function ensureSelected() {
      if (!selectedId || !getSelectedItem()) {
        alert("Selecione um item da biblioteca primeiro.");
        return false;
      }
      return true;
    }

    function showSelectedOnTv() {
      if (!ensureSelected()) return;

      updateSelectedFromId();
      publishedItem = deepClone(stagedItem);

      masterPointer.visible = false;
      clearPointerTrail(masterPreview);
      renderMasterOverlays();

      sendScreenSettings();
      sendGridSettings();
      sendToPlayers(createMessage("show", { item: publishedItem, screenRatio, gridSettings }));
      sendTokenState();
      sendMeasurementsState();
      sendToPlayers(createMessage("hidePointer"));
    }

    function removeItem(id) {
      const item = library.find(entry => entry.id === id);
      if (!item) return;

      const confirmDelete = confirm(`Excluir "${item.name}" da biblioteca?`);
      if (!confirmDelete) return;

      library = library.filter(entry => entry.id !== id);

      if (selectedId === id) {
        selectedId = library[0]?.id || null;
        stagedItem = getSelectedItem();
        measurements = [];
        measureDraft = null;
        measureDrag = null;
      }

      renderLibrary();
      renderVideoLibrary();
      updatePreview();
    }

    function updateItemView(partial) {
      if (!ensureSelected()) return;
      const item = getSelectedItem();
      Object.assign(item, partial);
      updatePreview();
      renderLibrary();
      renderVideoLibrary();
    }

    async function addFilesToLibrary(files) {
      const fileArray = Array.from(files || []);
      if (fileArray.length === 0) return;

      fileInfo.textContent = `Carregando ${fileArray.length} arquivo(s)...`;

      const items = [];
      const rejected = [];

      for (const file of fileArray) {
        const kind = getFileKind(file);

        if (kind === "unknown") {
          rejected.push(`${file.name}: formato não suportado`);
          continue;
        }

        if (file.size > SCENE_MAX_BYTES) {
          rejected.push(`${file.name}: ${describeBytes(file.size)} acima do limite de ${describeBytes(SCENE_MAX_BYTES)}`);
          continue;
        }

        try {
          const item = await readFileAsItem(file);
          if (item) items.push(item);
        } catch (error) {
          console.warn("Erro ao carregar arquivo:", file.name, error);
          rejected.push(`${file.name}: erro de leitura após tentativas. Verifique se o arquivo não está aberto/corrompido.`);
        }
      }

      if (items.length === 0) {
        fileInfo.textContent = rejected.length
          ? `Nenhum arquivo carregado. ${rejected.slice(0, 2).join(" | ")}${rejected.length > 2 ? "..." : ""}`
          : "Nenhum arquivo compatível foi carregado.";
        return;
      }

      library.push(...items);
      selectedId = items[0].id;

      fileInfo.textContent = `${items.length} item(ns) adicionados.${rejected.length ? ` ${rejected.length} ignorado(s): ${rejected.slice(0, 2).join(" | ")}${rejected.length > 2 ? "..." : ""}` : ""}`;
      renderLibrary();
      renderVideoLibrary();
      updatePreview();
    }

    async function addFilesToTokenLibrary(files) {
      const fileArray = Array.from(files || []);
      if (fileArray.length === 0) return;

      tokenStatus.textContent = `Carregando ${fileArray.length} token(s)...`;

      const items = [];
      const rejected = [];

      for (const file of fileArray) {
        if (!isImageFile(file)) {
          rejected.push(`${file.name}: token precisa ser imagem`);
          continue;
        }

        if (file.size > TOKEN_MAX_BYTES) {
          rejected.push(`${file.name}: ${describeBytes(file.size)} acima do limite de ${describeBytes(TOKEN_MAX_BYTES)}`);
          continue;
        }

        try {
          const item = await readTokenFile(file);
          if (item) items.push(item);
        } catch (error) {
          console.warn("Erro ao carregar token:", file.name, error);
          rejected.push(`${file.name}: erro de leitura após tentativas. Verifique se o arquivo não está aberto/corrompido.`);
        }
      }

      if (items.length === 0) {
        tokenStatus.textContent = rejected.length
          ? `Nenhum token carregado. ${rejected.slice(0, 2).join(" | ")}${rejected.length > 2 ? "..." : ""}`
          : "Nenhum token compatível foi carregado.";
        return;
      }

      tokenLibrary.push(...items);
      selectedTokenSourceId = items[0].id;
      tokenStatus.textContent = `${items.length} token(s) adicionados.${rejected.length ? ` ${rejected.length} ignorado(s): ${rejected.slice(0, 2).join(" | ")}${rejected.length > 2 ? "..." : ""}` : ""}`;
      renderTokenLibrary();
    }

    function addSelectedTokenToMap() {
      const source = getSelectedTokenSource();

      if (!source) {
        alert("Selecione um token da biblioteca primeiro.");
        return;
      }

      const token = { id: createId(), sourceId: source.id, name: source.name, data: source.data, x: 0.5, y: 0.5, size: 7 };
      mapTokens.push(token);
      selectedMapTokenId = token.id;
      renderMasterOverlays();
      sendTokenState();
      tokenStatus.textContent = "Token adicionado ao mapa.";
    }

    function removeSelectedTokenSource() {
      if (!selectedTokenSourceId) {
        alert("Selecione um token da biblioteca primeiro.");
        return;
      }

      const source = getSelectedTokenSource();
      const confirmDelete = confirm(`Excluir "${source?.name || "token"}" da biblioteca?`);
      if (!confirmDelete) return;

      tokenLibrary = tokenLibrary.filter(token => token.id !== selectedTokenSourceId);
      selectedTokenSourceId = tokenLibrary[0]?.id || null;
      renderTokenLibrary();
    }

    function removeSelectedMapToken() {
      if (!selectedMapTokenId) {
        alert("Selecione um token no mapa primeiro.");
        return;
      }

      mapTokens = mapTokens.filter(token => token.id !== selectedMapTokenId);
      selectedMapTokenId = null;
      renderMasterOverlays();
      sendTokenState();
    }

    function clearMapTokens() {
      if (mapTokens.length === 0) return;
      const confirmClear = confirm("Remover todos os tokens do mapa?");
      if (!confirmClear) return;

      mapTokens = [];
      selectedMapTokenId = null;
      renderMasterOverlays();
      sendTokenState();
    }

    function resizeSelectedMapToken(delta) {
      const token = getSelectedMapToken();
      if (!token) {
        alert("Selecione um token no mapa primeiro.");
        return;
      }
      token.size = Math.max(2, Math.min(20, Number(token.size || 7) + delta));
      renderMasterOverlays();
      sendTokenState();
    }

    function getYoutubeThumb(item) {
      if (item.thumb) return item.thumb;
      if (!item.videoId) return null;
      return `https://img.youtube.com/vi/${encodeURIComponent(item.videoId)}/hqdefault.jpg`;
    }

    function getVideoItems() {
      return library.filter(item => item.kind === "youtube");
    }

    function addYoutubeLinkAsScene(showAfterAdd = false) {
      const input = document.getElementById("youtubeLinkInput");
      const titleInput = document.getElementById("youtubeTitleInput");
      const status = document.getElementById("youtubeStatus");

      const videoId = extractYoutubeVideoId(input?.value || "");

      if (!videoId) {
        alert("Cole um link válido do YouTube, YouTube, YouTube Music, youtu.be ou um ID de vídeo.");
        return null;
      }

      const title = titleInput?.value.trim() || `YouTube - ${videoId}`;
      const existing = library.find(item => item.kind === "youtube" && item.videoId === videoId);

      let scene;
      if (existing) {
        scene = existing;
        scene.name = title;
        scene.title = title;
      } else {
        scene = {
          id: createId(),
          kind: "youtube",
          name: title,
          title,
          artist: "",
          duration: "",
          resultType: "video",
          videoId,
          thumb: `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`,
          size: 0,
          fit: "stretch",
          zoom: 1,
          rotation: 0
        };
        library.push(scene);
      }

      selectedId = scene.id;
      if (input) input.value = "";
      if (titleInput) titleInput.value = "";

      renderLibrary();
      renderVideoLibrary();
      updatePreview();
      updateYoutubeControlPanel(scene, true);

      if (status) status.textContent = "Vídeo preparado. Use o player pequeno ou clique em Mostrar cena.";

      if (showAfterAdd) showSelectedOnTv();
      return scene;
    }

    function renderVideoLibrary() {
      const box = document.getElementById("videoLibraryList");
      if (!box) return;

      const videos = getVideoItems();
      if (!videos.length) {
        box.innerHTML = `<div class="library-empty">Nenhum vídeo preparado.</div>`;
        return;
      }

      box.innerHTML = "";
      videos.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "video-card" + (item.id === selectedId ? " active" : "");
        card.title = item.name || item.title || "Vídeo";

        const thumb = document.createElement("div");
        thumb.className = "video-card-thumb";
        const thumbUrl = getYoutubeThumb(item);
        if (thumbUrl) {
          const img = document.createElement("img");
          img.src = thumbUrl;
          img.alt = item.name || "Vídeo";
          thumb.appendChild(img);
        } else {
          thumb.textContent = "YT";
        }

        const info = document.createElement("div");
        info.className = "video-card-info";
        info.innerHTML = `
          <div class="video-card-title">${escapeHtml(item.name || item.title || "Vídeo")}</div>
          <div class="video-card-meta">${escapeHtml(item.videoId || "")}</div>
        `;

        const actions = document.createElement("div");
        actions.className = "video-card-actions";

        const showBtn = document.createElement("button");
        showBtn.className = "success";
        showBtn.textContent = "Mostrar";
        showBtn.addEventListener("click", event => {
          event.stopPropagation();
          selectedId = item.id;
          renderLibrary();
          renderVideoLibrary();
          updatePreview();
          updateYoutubeControlPanel(item, true);
          showSelectedOnTv();
        });

        const selectBtn = document.createElement("button");
        selectBtn.textContent = "Prévia";
        selectBtn.addEventListener("click", event => {
          event.stopPropagation();
          selectItem(item.id);
          updateYoutubeControlPanel(item, true);
        });

        actions.appendChild(showBtn);
        actions.appendChild(selectBtn);

        card.appendChild(thumb);
        card.appendChild(info);
        card.appendChild(actions);

        card.addEventListener("click", () => selectItem(item.id));
        card.addEventListener("dblclick", () => {
          selectItem(item.id);
          showSelectedOnTv();
        });

        box.appendChild(card);
      });
    }

    function removeSelectedYoutubeScene() {
      const item = getSelectedItem();
      if (!item || item.kind !== "youtube") {
        alert("Selecione um vídeo da biblioteca primeiro.");
        return;
      }

      const confirmDelete = confirm(`Remover "${item.name || item.title || "vídeo"}" da biblioteca de vídeos?`);
      if (!confirmDelete) return;

      library = library.filter(entry => entry.id !== item.id);
      selectedId = library[0]?.id || null;
      stagedItem = getSelectedItem();
      measurements = [];
      measureDraft = null;
      measureDrag = null;

      renderLibrary();
      renderVideoLibrary();
      updatePreview();
    }

    function clearYoutubeScenes() {
      const videos = getVideoItems();
      if (!videos.length) return;

      const confirmClear = confirm("Remover todos os vídeos preparados?");
      if (!confirmClear) return;

      const ids = new Set(videos.map(item => item.id));
      library = library.filter(item => !ids.has(item.id));
      if (selectedId && ids.has(selectedId)) selectedId = library[0]?.id || null;
      stagedItem = getSelectedItem();
      measurements = [];
      measureDraft = null;
      measureDrag = null;

      renderLibrary();
      renderVideoLibrary();
      updatePreview();
    }

    function startTokenDrag(event, tokenId) {
      if (pointerEnabled || rulerEnabled || measureDrag) return;

      event.preventDefault();
      event.stopPropagation();

      selectedMapTokenId = tokenId;
      tokenDrag = { tokenId, pointerId: event.pointerId };
      masterPreview.setPointerCapture?.(event.pointerId);
      renderMasterOverlays();
    }

    function updateTokenDrag(event) {
      if (!tokenDrag) return;

      event.preventDefault();
      event.stopPropagation();

      const token = mapTokens.find(entry => entry.id === tokenDrag.tokenId);
      if (!token) return;

      const snapSettings = gridSettings.enabled && gridSettings.snapToGrid ? gridSettings : null;
      const point = getPointFromEvent(event, masterPreview, snapSettings);

      token.x = point.x;
      token.y = point.y;

      renderMasterOverlays();
      sendTokenState();
    }

    function finishTokenDrag(event) {
      if (!tokenDrag) return;
      event.preventDefault();
      event.stopPropagation();
      updateTokenDrag(event);
      tokenDrag = null;
    }

    function startMeasurementDrag(event, measurementId) {
      event.preventDefault();
      event.stopPropagation();

      const measurement = measurements.find(item => item.id === measurementId);
      if (!measurement) return;

      const origin = getPointFromEvent(event, masterPreview, null);

      measureDrag = {
        id: measurementId,
        pointerId: event.pointerId,
        origin,
        originalStart: deepClone(measurement.start),
        originalEnd: deepClone(measurement.end)
      };

      masterPreview.setPointerCapture?.(event.pointerId);

      pointerEnabled = false;
      isDrawingMeasure = false;
      measureDraft = null;

      renderMasterOverlays();
      updateToolButtons();
    }

    function updateMeasurementDrag(event) {
      if (!measureDrag) return;

      event.preventDefault();
      event.stopPropagation();

      const measurement = measurements.find(item => item.id === measureDrag.id);
      if (!measurement) return;

      const current = getPointFromEvent(event, masterPreview, null);

      let dx = current.x - measureDrag.origin.x;
      let dy = current.y - measureDrag.origin.y;

      const sx = measureDrag.originalStart.x + dx;
      const sy = measureDrag.originalStart.y + dy;
      const ex = measureDrag.originalEnd.x + dx;
      const ey = measureDrag.originalEnd.y + dy;

      const minX = Math.min(sx, ex);
      const maxX = Math.max(sx, ex);
      const minY = Math.min(sy, ey);
      const maxY = Math.max(sy, ey);

      if (minX < 0) dx -= minX;
      if (maxX > 1) dx -= (maxX - 1);
      if (minY < 0) dy -= minY;
      if (maxY > 1) dy -= (maxY - 1);

      const newStart = { x: measureDrag.originalStart.x + dx, y: measureDrag.originalStart.y + dy };
      const newEnd = { x: measureDrag.originalEnd.x + dx, y: measureDrag.originalEnd.y + dy };

      measurement.start = snapPointToGridIfNeeded(newStart);
      measurement.end = snapPointToGridIfNeeded(newEnd);

      renderMasterOverlays();
      sendMeasurementsState();
    }

    function finishMeasurementDrag(event) {
      if (!measureDrag) return;
      event.preventDefault();
      event.stopPropagation();
      updateMeasurementDrag(event);
      measureDrag = null;
      renderMasterOverlays();
      updateToolButtons();
      updatePreview();
      sendMeasurementsState();
    }

    function editMeasurementNote(id) {
      const measurement = measurements.find(item => item.id === id);
      if (!measurement) return;

      const current = measurement.note || "";
      const next = prompt("Nota do efeito/medição\nEx: Fogo 2 turnos, Área 1, Silêncio, Lentidão 3T", current);

      if (next === null) return;

      measurement.note = String(next || "").trim();
      renderMasterOverlays();
      sendMeasurementsState();
    }

    function updateMeasurementColor(id, color) {
      const measurement = measurements.find(item => item.id === id);
      if (!measurement) return;

      measurement.color = color || "#22d3ee";
      renderMasterOverlays();
      sendMeasurementsState();
    }

    function deleteMeasurement(id) {
      measurements = measurements.filter(item => item.id !== id);
      if (measureDrag && measureDrag.id === id) measureDrag = null;
      renderMasterOverlays();
      updateToolButtons();
      sendMeasurementsState();
    }

    function setPointerMode(enabled) {
      pointerEnabled = enabled;

      if (pointerEnabled) {
        rulerEnabled = false;
        isDrawingMeasure = false;
        measureDraft = null;
        measureDrag = null;
      }

      if (!pointerEnabled) {
        masterPointer.visible = false;
        clearPointerTrail(masterPreview);
        sendToPlayers(createMessage("hidePointer"));
      }

      renderMasterOverlays();
      updateToolButtons();
      updatePreview();
    }

    function setAreaTool(mode) {
      rulerSettings.mode = mode;
      rulerModeSelect.value = mode;
      rulerEnabled = true;
      pointerEnabled = false;
      measureDrag = null;
      masterPointer.visible = false;
      clearPointerTrail(masterPreview);
      sendToPlayers(createMessage("hidePointer"));

      if (!gridSettings.enabled) {
        gridSettings.enabled = true;
        sendGridSettings();
      }

      updateGridFields();
      renderMasterOverlays();
      updateToolButtons();
      updatePreview();
    }

    function toggleGridQuick() {
      gridSettings.enabled = !gridSettings.enabled;

      if (!gridSettings.enabled) clearMeasurements();

      updateGridFields();
      renderMasterOverlays();
      updateToolButtons();
      sendGridSettings();
    }

    function clearAllTools() {
      pointerEnabled = false;
      rulerEnabled = false;
      isDrawingMeasure = false;
      measureDraft = null;
      measureDrag = null;
      masterPointer.visible = false;

      clearPointerTrail(masterPreview);
      renderMasterOverlays();
      updateToolButtons();

      sendToPlayers(createMessage("hidePointer"));
      sendMeasurementsState();

      updatePreview();
    }

    function sendPointerFromEvent(event) {
      if (!pointerEnabled) return;

      event.preventDefault();
      event.stopPropagation();

      if (!stagedItem) {
        alert("Selecione um mapa, imagem, PDF ou texto antes de usar o pointer.");
        setPointerMode(false);
        return;
      }

      const now = performance.now();
      if (event.type === "pointermove" && now - lastPointerSentAt < 16) return;
      lastPointerSentAt = now;

      const point = getPointFromEvent(event, masterPreview, null);

      masterPointer = { visible: true, x: point.x, y: point.y };

      addPointerTrail(masterPreview, point.x, point.y);
      renderPointer(masterPreview, masterPointer);

      sendToPlayers(createMessage("pointer", { pointer: masterPointer, trail: true }));
    }

    function startMeasure(event) {
      if (!rulerEnabled || measureDrag) return;

      event.preventDefault();
      event.stopPropagation();

      if (!stagedItem) {
        alert("Selecione um mapa ou imagem antes de usar a ferramenta de área.");
        rulerEnabled = false;
        updateToolButtons();
        return;
      }

      if (!gridSettings.enabled) {
        alert("Ative o grid antes de usar a ferramenta de área.");
        return;
      }

      isDrawingMeasure = true;
      const point = getPointFromEvent(event, masterPreview, gridSettings);

      measureDraft = {
        id: createId(),
        visible: true,
        draft: true,
        mode: rulerSettings.mode,
        start: point,
        end: point,
        useFixedSize: rulerSettings.useFixedSize,
        fixedMeters: rulerSettings.fixedMeters,
        color: rulerSettings.color || "#22d3ee",
        note: ""
      };

      masterPreview.setPointerCapture?.(event.pointerId);
      renderMasterOverlays();
      sendMeasurementsState();
    }

    function updateMeasure(event) {
      if (!rulerEnabled || !isDrawingMeasure || !measureDraft || measureDrag) return;
      event.preventDefault();
      event.stopPropagation();
      measureDraft.end = getPointFromEvent(event, masterPreview, gridSettings);
      renderMasterOverlays();
      sendMeasurementsState();
    }

    function finishMeasure(event) {
      if (!rulerEnabled || !isDrawingMeasure || !measureDraft || measureDrag) return;

      event.preventDefault();
      event.stopPropagation();

      isDrawingMeasure = false;
      measureDraft.end = getPointFromEvent(event, masterPreview, gridSettings);

      const finalMeasure = deepClone(measureDraft);
      delete finalMeasure.draft;

      measurements.push(finalMeasure);
      measureDraft = null;

      renderMasterOverlays();
      sendMeasurementsState();
    }

    function clearMeasurements() {
      measurements = [];
      measureDraft = null;
      measureDrag = null;
      isDrawingMeasure = false;

      renderMasterOverlays();
      sendMeasurementsState();
      updateToolButtons();
    }

    function applyGridSettingsFromFields() {
      gridSettings = {
        enabled: gridEnabledCheck.checked,
        columns: Math.max(1, Number(gridColumnsInput.value || 16)),
        rows: Math.max(1, Number(gridRowsInput.value || 9)),
        metersPerSquare: Math.max(0.1, Number(gridMetersInput.value || 1.5)),
        snapToGrid: gridSnapCheck.checked,
        showOnPlayers: gridShowPlayersCheck.checked,
        color: gridColorInput.value || "#ffffff",
        thickness: Math.max(1, Number(gridThicknessInput.value || 1)),
        opacity: Math.max(0.05, Math.min(1, Number(gridOpacityInput.value || 0.34)))
      };

      rulerSettings = {
        mode: rulerModeSelect.value || "line",
        useFixedSize: effectFixedCheck.checked,
        fixedMeters: Math.max(0.1, Number(effectFixedMetersInput.value || 3)),
        color: effectColorInput.value || "#22d3ee"
      };

      if (!gridSettings.enabled) clearMeasurements();

      updateGridFields();
      renderMasterOverlays();
      updateToolButtons();
      sendGridSettings();
      sendMeasurementsState();
    }

    function getCurrentNotes() {
      return {
        initiatives: notesInitiatives.value,
        hp: notesHp.value,
        important: notesImportant.value,
        story: notesStory.value
      };
    }

    function applyNotes(notes) {
      notesInitiatives.value = notes.initiatives || "";
      notesHp.value = notes.hp || "";
      notesImportant.value = notes.important || "";
      notesStory.value = notes.story || "";
    }

    function scheduleNotesSave() {
      clearTimeout(notesSaveTimer);
      notesSaveStatus.textContent = "Salvando...";

      notesSaveTimer = setTimeout(() => {
        saveNotes(getCurrentNotes());
        notesSaveStatus.textContent = "Notas salvas automaticamente.";
      }, 350);
    }

    function setupNotes() {
      applyNotes(loadNotes());

      [notesInitiatives, notesHp, notesImportant, notesStory].forEach(textarea => {
        textarea.addEventListener("input", scheduleNotesSave);
      });

      document.getElementById("saveNotesBtn").addEventListener("click", () => {
        saveNotes(getCurrentNotes());
        notesSaveStatus.textContent = "Notas salvas agora.";
      });

      document.getElementById("clearNotesBtn").addEventListener("click", () => {
        const confirmClear = confirm("Limpar todas as anotações do mestre?");
        if (!confirmClear) return;

        applyNotes({ initiatives: "", hp: "", important: "", story: "" });
        saveNotes(getCurrentNotes());
        notesSaveStatus.textContent = "Notas limpas.";
      });
    }

    document.getElementById("openPlayerBtn").addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("view", "player");

      playerWindow = window.open(url.toString(), "mesa-rpg-player", "popup=yes,width=1280,height=720");

      if (playerWindow) {
        playerStatus.textContent = "Tela dos jogadores aberta. Arraste essa janela para a TV.";

        setTimeout(() => {
          sendScreenSettings();
          sendGridSettings();

          if (publishedItem) {
            sendToPlayers(createMessage("show", { item: publishedItem, screenRatio, gridSettings }));
            sendTokenState();
            sendMeasurementsState();
          } else {
            sendToPlayers(createMessage("blackout", { screenRatio }));
          }
        }, 500);
      } else {
        playerStatus.textContent = "O navegador bloqueou a janela. Permita pop-ups para este arquivo.";
      }
    });

    fileInput.addEventListener("click", () => { fileInput.value = ""; });
    tokenInput.addEventListener("click", () => { tokenInput.value = ""; });

    fileInput.addEventListener("change", async (event) => {
      const selectedFiles = Array.from(event.target.files || []);
      await addFilesToLibrary(selectedFiles);
      fileInput.value = "";
    });

    tokenInput.addEventListener("change", async (event) => {
      const selectedFiles = Array.from(event.target.files || []);
      await addFilesToTokenLibrary(selectedFiles);
      tokenInput.value = "";
    });

    document.getElementById("prepareTextBtn").addEventListener("click", () => {
      const titleInput = document.getElementById("quickTextTitle");
      const textInput = document.getElementById("quickText");
      const text = textInput.value.trim();

      if (!text) {
        alert("Digite algum texto primeiro.");
        return;
      }

      const title = titleInput.value.trim() || "Texto rápido";
      const item = { id: createId(), kind: "text", name: title, text, ...defaultSettings };

      library.push(item);
      selectedId = item.id;

      titleInput.value = "";
      textInput.value = "";

      fileInfo.textContent = "Texto adicionado à biblioteca.";
      renderLibrary();
      renderVideoLibrary();
      updatePreview();
    });

    document.getElementById("addYoutubeBtn").addEventListener("click", () => addYoutubeLinkAsScene(false));
    document.getElementById("showYoutubeBtn").addEventListener("click", () => {
      const added = addYoutubeLinkAsScene(false);
      if (added) showSelectedOnTv();
    });
    document.getElementById("youtubeLinkInput").addEventListener("keydown", event => {
      if (event.key === "Enter") addYoutubeLinkAsScene(false);
    });
    document.getElementById("removeYoutubeBtn").addEventListener("click", removeSelectedYoutubeScene);
    document.getElementById("clearYoutubeBtn").addEventListener("click", clearYoutubeScenes);

    document.getElementById("youtubePlayBtn").addEventListener("click", () => broadcastYoutubeControl("play"));
    document.getElementById("youtubePauseBtn").addEventListener("click", () => broadcastYoutubeControl("pause"));
    document.getElementById("youtubeStopBtn").addEventListener("click", () => broadcastYoutubeControl("stop"));
    document.getElementById("youtubeBackBtn").addEventListener("click", () => broadcastYoutubeControl("seekRelative", -10));
    document.getElementById("youtubeForwardBtn").addEventListener("click", () => broadcastYoutubeControl("seekRelative", 10));
    document.getElementById("youtubeMuteBtn").addEventListener("click", () => broadcastYoutubeControl("mute"));
    document.getElementById("youtubeUnmuteBtn").addEventListener("click", () => broadcastYoutubeControl("unmute"));
    document.getElementById("youtubeVolumeRange").addEventListener("input", (event) => {
      const value = Number(event.target.value || 0);
      document.getElementById("youtubeVolumeValue").textContent = value + "%";
      broadcastYoutubeControl("volume", value);
    });

    document.getElementById("showSelectedSmallBtn").addEventListener("click", showSelectedOnTv);
    document.getElementById("showBtnTop").addEventListener("click", showSelectedOnTv);

    document.getElementById("removeSelectedBtn").addEventListener("click", () => {
      if (!ensureSelected()) return;
      const item = getSelectedItem();
      if (!item || item.kind === "youtube") {
        alert("Selecione uma imagem, mapa ou cena nesta biblioteca. Para vídeos, use a biblioteca de vídeos.");
        return;
      }
      removeItem(selectedId);
    });

    document.getElementById("clearLibraryBtn").addEventListener("click", () => {
      const sceneItems = library.filter(item => item.kind !== "youtube");
      if (sceneItems.length === 0) return;
      const confirmClear = confirm("Limpar todas as imagens, mapas e cenas? Os vídeos serão mantidos.");
      if (!confirmClear) return;

      const removedIds = new Set(sceneItems.map(item => item.id));
      library = library.filter(item => item.kind === "youtube");
      if (selectedId && removedIds.has(selectedId)) selectedId = library[0]?.id || null;
      stagedItem = getSelectedItem();
      masterPointer.visible = false;
      measurements = [];
      measureDraft = null;
      measureDrag = null;

      renderLibrary();
      renderVideoLibrary();
      updatePreview();
    });

    document.getElementById("addTokenToMapBtn").addEventListener("click", addSelectedTokenToMap);
    document.getElementById("removeTokenSourceBtn").addEventListener("click", removeSelectedTokenSource);
    document.getElementById("removeMapTokenBtn").addEventListener("click", removeSelectedMapToken);
    document.getElementById("clearMapTokensBtn").addEventListener("click", clearMapTokens);
    document.getElementById("tokenSizeDownBtn").addEventListener("click", () => resizeSelectedMapToken(-1));
    document.getElementById("tokenSizeUpBtn").addEventListener("click", () => resizeSelectedMapToken(1));

    screenRatioSelect.addEventListener("change", () => {
      screenRatio = screenRatioSelect.value;
      masterPointer.visible = false;
      clearPointerTrail(masterPreview);
      updatePreview();
      sendScreenSettings();
      sendToPlayers(createMessage("hidePointer"));
      sendMeasurementsState();
    });

    fitSelect.addEventListener("change", () => updateItemView({ fit: fitSelect.value }));

    document.getElementById("zoomInBtn").addEventListener("click", () => {
      if (!ensureSelected()) return;
      const item = getSelectedItem();
      updateItemView({ zoom: Math.min(3, Number(item.zoom || 1) + 0.1) });
    });

    document.getElementById("zoomOutBtn").addEventListener("click", () => {
      if (!ensureSelected()) return;
      const item = getSelectedItem();
      updateItemView({ zoom: Math.max(0.2, Number(item.zoom || 1) - 0.1) });
    });

    document.getElementById("rotateLeftBtn").addEventListener("click", () => {
      if (!ensureSelected()) return;
      const item = getSelectedItem();
      updateItemView({ rotation: Number(item.rotation || 0) - 90 });
    });

    document.getElementById("rotateRightBtn").addEventListener("click", () => {
      if (!ensureSelected()) return;
      const item = getSelectedItem();
      updateItemView({ rotation: Number(item.rotation || 0) + 90 });
    });

    document.getElementById("resetViewBtn").addEventListener("click", () => {
      updateItemView({ fit: "contain", zoom: 1, rotation: 0 });
    });

    toolbarToggleBtn.addEventListener("click", () => {
      toolbarCollapsed = !toolbarCollapsed;
      updateToolbarState();
      updateScreenSize();
    });

    toggleGridBtn.addEventListener("click", toggleGridQuick);
    togglePointerBtn.addEventListener("click", () => setPointerMode(!pointerEnabled));

    toolLineBtn.addEventListener("click", () => setAreaTool("line"));
    toolCircleBtn.addEventListener("click", () => setAreaTool("circle"));
    toolSquareBtn.addEventListener("click", () => setAreaTool("square"));
    toolConeBtn.addEventListener("click", () => setAreaTool("cone"));

    quickLineBtn.addEventListener("click", () => setAreaTool("line"));
    quickCircleBtn.addEventListener("click", () => setAreaTool("circle"));
    quickSquareBtn.addEventListener("click", () => setAreaTool("square"));
    quickConeBtn.addEventListener("click", () => setAreaTool("cone"));

    clearMeasurementsToolBtn.addEventListener("click", clearMeasurements);
    clearToolsBtn.addEventListener("click", clearAllTools);
    document.getElementById("clearMeasurementsBtn").addEventListener("click", clearMeasurements);
    document.getElementById("applyGridBtn").addEventListener("click", applyGridSettingsFromFields);

    [
      gridEnabledCheck,
      gridShowPlayersCheck,
      gridSnapCheck,
      gridColumnsInput,
      gridRowsInput,
      gridMetersInput,
      gridColorInput,
      effectColorInput,
      gridThicknessInput,
      gridOpacityInput,
      rulerModeSelect,
      effectFixedCheck,
      effectFixedMetersInput
    ].forEach(element => {
      element.addEventListener("change", applyGridSettingsFromFields);
      element.addEventListener("input", applyGridSettingsFromFields);
    });

    masterPreview.addEventListener("pointerdown", event => {
      if (tokenDrag || measureDrag) return;

      if (rulerEnabled) {
        startMeasure(event);
        return;
      }

      if (pointerEnabled) sendPointerFromEvent(event);
    });

    masterPreview.addEventListener("pointermove", event => {
      if (measureDrag) {
        updateMeasurementDrag(event);
        return;
      }

      if (tokenDrag) {
        updateTokenDrag(event);
        return;
      }

      if (rulerEnabled) {
        updateMeasure(event);
        return;
      }

      if (pointerEnabled) sendPointerFromEvent(event);
    });

    masterPreview.addEventListener("pointerup", event => {
      if (measureDrag) {
        finishMeasurementDrag(event);
        return;
      }

      if (tokenDrag) {
        finishTokenDrag(event);
        return;
      }

      if (rulerEnabled) finishMeasure(event);
    });

    masterPreview.addEventListener("pointerleave", event => {
      if (measureDrag) {
        finishMeasurementDrag(event);
        return;
      }

      if (tokenDrag) {
        finishTokenDrag(event);
        return;
      }

      if (rulerEnabled && isDrawingMeasure) finishMeasure(event);
    });

    masterPreview.addEventListener("pointercancel", () => {
      tokenDrag = null;
      measureDrag = null;
      isDrawingMeasure = false;
      measureDraft = null;
    });

    masterPreview.addEventListener("dragstart", event => event.preventDefault());

    document.getElementById("hideBtn").addEventListener("click", () => {
      masterPointer.visible = false;
      clearPointerTrail(masterPreview);
      renderMasterOverlays();
      sendToPlayers(createMessage("blackout", { screenRatio }));
    });

    window.addEventListener("resize", () => updateScreenSize());

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => updateScreenSize());
      resizeObserver.observe(previewArea);
      resizeObserver.observe(toolbarDock);
    }

    setupNotes();
    renderLibrary();
    renderVideoLibrary();
    renderTokenLibrary();
    updatePreview();
  }

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

  if (isPlayer) renderPlayer();
  else renderMaster();
})();

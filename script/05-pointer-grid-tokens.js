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
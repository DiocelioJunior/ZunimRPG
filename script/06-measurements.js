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

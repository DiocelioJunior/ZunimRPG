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
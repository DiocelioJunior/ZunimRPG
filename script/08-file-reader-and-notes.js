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
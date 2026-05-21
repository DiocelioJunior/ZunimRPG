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
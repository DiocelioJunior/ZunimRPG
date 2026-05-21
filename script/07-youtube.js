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
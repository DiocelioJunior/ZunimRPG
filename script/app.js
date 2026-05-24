(() => {
  const scripts = [
    "01-state.js",
    "02-utils.js",
    "03-channel.js",
    "04-selectors-and-points.js",
    "05-pointer-grid-tokens.js",
    "06-measurements.js",
    "07-youtube.js",
    "08-file-reader-and-notes.js",
    "09-render-media.js",
    "10-master.js",
    "11-player.js",
    "12-boot.js",
    "13-dice.js",
    "14-sounds.js"
  ];

  const currentScript = document.currentScript;
  const baseUrl = currentScript ? new URL(".", currentScript.src).href : "";

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = baseUrl + src;
      tag.async = false;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error("Falha ao carregar " + src));
      document.head.appendChild(tag);
    });
  }

  function showLoadError(error) {
    console.error(error);

    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = `<div style="padding:20px;color:#fff;background:#111;font-family:Arial">
        <h2>Erro ao carregar scripts</h2>
        <p>${String(error.message || error)}</p>
      </div>`;
    }
  }

  function start() {
    scripts
      .reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve())
      .catch(showLoadError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

///OCULTA OS ELEMENTOS DA TELA DOS JOGADORES - SEGUNDA TELA

window.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const isPlayer = params.get("view") === "player";

  if (isPlayer) {

    document.body.classList.add("player-view");

    // remove elementos do mestre
    document.querySelector(".nav-bar")?.remove();
    document.getElementById("mapas-controle")?.remove();
    document.getElementById("openPlayerScreen")?.remove();
    document.getElementById("masterPreview")?.remove();

  }

});

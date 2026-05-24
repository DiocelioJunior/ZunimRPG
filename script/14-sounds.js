const soundList = document.getElementById("soundList");

const ambientSounds = [
  {
    id: 1,
    title: "Chuva",
    meta: "Ambiente • Loop",
    icon: "🌧️",
    file: "./assets/audio/rain.mp3"
  },

  {
    id: 2,
    title: "Floresta",
    meta: "Natureza • Loop",
    icon: "🌲",
    file: "./assets/audio/forest.mp3"
  },

  {
    id: 3,
    title: "Taverna",
    meta: "RPG • Ambiente",
    icon: "🍺",
    file: "./assets/audio/tavern.mp3"
  },

    {
    id: 4,
    title: "Grilos",
    meta: "Natureza • Loop",
    icon: "🦗",
    file: "./assets/audio/cricket.mp3"
  },

      {
    id: 5,
    title: "Vozes",
    meta: "Vozes • Loop",
    icon: "👥",
    file: "./assets/audio/voices.mp3"
  }

];

const audioSystems = new Map();

/* =========================================
   CRIA ÁUDIO COM LOOP SUAVE
========================================= */
function createSmoothAudio(src) {

  const audio = new Audio(src);

  audio.loop = true;
  audio.preload = "auto";

  const context = new (window.AudioContext || window.webkitAudioContext)();

  const source = context.createMediaElementSource(audio);

  const gainNode = context.createGain();

  source.connect(gainNode);
  gainNode.connect(context.destination);

  gainNode.gain.value = 0.5;

  return {
    audio,
    context,
    gainNode
  };
}

/* =========================================
   PLAY SUAVE
========================================= */
async function smoothPlay(system, targetVolume = 0.5) {

  const { audio, context, gainNode } = system;

  await context.resume();

  gainNode.gain.cancelScheduledValues(context.currentTime);

  gainNode.gain.setValueAtTime(
    0,
    context.currentTime
  );

  gainNode.gain.linearRampToValueAtTime(
    targetVolume,
    context.currentTime + 1
  );

  audio.play();
}

/* =========================================
   PAUSE SUAVE
========================================= */
function smoothPause(system) {

  const { audio, context, gainNode } = system;

  gainNode.gain.cancelScheduledValues(context.currentTime);

  gainNode.gain.setValueAtTime(
    gainNode.gain.value,
    context.currentTime
  );

  gainNode.gain.linearRampToValueAtTime(
    0,
    context.currentTime + 0.6
  );

  setTimeout(() => {
    audio.pause();
  }, 650);
}

/* =========================================
   STOP SUAVE
========================================= */
function smoothStop(system) {

  const { audio, context, gainNode } = system;

  gainNode.gain.cancelScheduledValues(context.currentTime);

  gainNode.gain.setValueAtTime(
    gainNode.gain.value,
    context.currentTime
  );

  gainNode.gain.linearRampToValueAtTime(
    0,
    context.currentTime + 0.8
  );

  setTimeout(() => {

    audio.pause();
    audio.currentTime = 0;

  }, 850);
}

/* =========================================
   RENDERIZA CARDS
========================================= */
function renderSounds() {

  soundList.innerHTML = "";

  ambientSounds.forEach(sound => {

    const system = createSmoothAudio(sound.file);

    audioSystems.set(sound.id, system);

    const card = document.createElement("div");

    card.className = "sound-card";

    card.innerHTML = `
      <div class="sound-thumb">
        ${sound.icon}
      </div>

      <div class="sound-info">

        <div class="sound-title">
          ${sound.title}
        </div>

        <div class="sound-meta">
          ${sound.meta}
        </div>

        <input
          type="range"
          class="volume-slider"
          min="0"
          max="1"
          step="0.01"
          value="0.5"
        />

      </div>

      <div class="sound-actions">

        <button class="success play-btn">
          ▶ Tocar
        </button>

        <button class="warning pause-btn">
          ❚❚ Pausar
        </button>

        <button class="danger stop-btn">
          ■ Parar
        </button>

      </div>
    `;

    const playBtn = card.querySelector(".play-btn");
    const pauseBtn = card.querySelector(".pause-btn");
    const stopBtn = card.querySelector(".stop-btn");
    const volumeSlider = card.querySelector(".volume-slider");

    /* PLAY */
    playBtn.addEventListener("click", () => {

      smoothPlay(
        system,
        parseFloat(volumeSlider.value)
      );

    });

    /* PAUSE */
    pauseBtn.addEventListener("click", () => {

      smoothPause(system);

    });

    /* STOP */
    stopBtn.addEventListener("click", () => {

      smoothStop(system);

    });

    /* VOLUME SUAVE */
    volumeSlider.addEventListener("input", (event) => {

      const volume = parseFloat(event.target.value);

      system.gainNode.gain.cancelScheduledValues(
        system.context.currentTime
      );

      system.gainNode.gain.linearRampToValueAtTime(
        volume,
        system.context.currentTime + 0.15
      );

    });

    soundList.appendChild(card);

  });

}

renderSounds();
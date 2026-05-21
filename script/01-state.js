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
// Settings chosen on the games index page and used by every game.
// Stored in this browser (localStorage), so each device keeps its own choices.
//
// Load it in <head>, before the stylesheets apply, so text never flashes in the wrong case:
//   index page:  <script src="shared/settings.js"></script>
//   a game:      <script src="../shared/settings.js"></script>
//
// - Letter case: sets <html data-letter-case="upper|lower">; shared/base.css does the rest.
// - Voice and speed: read by Kit.speak() (shared/kit.js) every time it speaks, so a game
//   always uses the latest choice, even when it is restored with the Back button.
window.Settings = (function () {
  "use strict";

  const CASE_KEY = "english-games.letter-case";
  const VOICE_KEY = "english-games.voice"; // name of the chosen voice; "" = Default
  const SPEED_KEY = "english-games.speed";

  // Speech rates for the three speed choices ("normal" is the original 0.8)
  const SPEEDS = { slow: 0.6, normal: 0.8, fast: 1.0 };

  // If storage is blocked (private browsing, settings), keep choices for this page only.
  const memory = {};

  function read(key) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? memory[key] : v;
    } catch (e) {
      return memory[key];
    }
  }

  function write(key, value) {
    memory[key] = value;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* storage unavailable: the choice lasts only for this page */
    }
  }

  // ---------- Letter case ----------
  function getLetterCase() {
    return read(CASE_KEY) === "lower" ? "lower" : "upper";
  }

  function applyLetterCase() {
    document.documentElement.dataset.letterCase = getLetterCase();
  }

  function setLetterCase(value) {
    write(CASE_KEY, value === "lower" ? "lower" : "upper");
    applyLetterCase();
  }

  // ---------- Voice ----------
  // Every British English voice the device reports (lang "en-GB"; some browsers say "en_GB").
  // The list can be empty at first: browsers fill it in later and fire "voiceschanged".
  function allBritishVoices() {
    if (!("speechSynthesis" in window)) return [];
    return window.speechSynthesis
      .getVoices()
      .filter((v) => (v.lang || "").replace("_", "-").toLowerCase() === "en-gb");
  }

  // How good a version of a voice is, judging by its voiceURI. Apple devices list the
  // same voice several times (e.g. "Daniel" as premium, enhanced, compact, super-compact).
  function quality(v) {
    const uri = (v.voiceURI || "").toLowerCase();
    if (uri.includes("premium")) return 5;
    if (uri.includes("enhanced")) return 4;
    if (uri.includes("super-compact")) return 1;
    if (uri.includes("compact")) return 2;
    return 3;
  }

  // British English voices to offer: one per name, the best version of each,
  // in the order the device lists them.
  function britishVoices() {
    const best = new Map();
    allBritishVoices().forEach((v) => {
      const current = best.get(v.name);
      if (!current || quality(v) > quality(current)) best.set(v.name, v);
    });
    return Array.from(best.values());
  }

  // The voice for a saved choice, or null if this device doesn't have it.
  // Voices are saved by name (so "Daniel" means the best Daniel on each device);
  // a voiceURI saved by an earlier version is still recognised.
  function voiceFor(saved) {
    if (!saved) return null;
    const list = britishVoices();
    const byName = list.find((v) => v.name === saved);
    if (byName) return byName;
    const byURI = allBritishVoices().find((v) => v.voiceURI === saved);
    return byURI ? list.find((v) => v.name === byURI.name) || null : null;
  }

  // The saved voice ("" = Default).
  function getVoice() {
    return read(VOICE_KEY) || "";
  }

  function setVoice(name) {
    write(VOICE_KEY, name || "");
  }

  // ---------- Speed ----------
  function getSpeed() {
    const s = read(SPEED_KEY);
    return Object.prototype.hasOwnProperty.call(SPEEDS, s) ? s : "normal";
  }

  function setSpeed(value) {
    write(SPEED_KEY, Object.prototype.hasOwnProperty.call(SPEEDS, value) ? value : "normal");
  }

  function getRate(speed) {
    return SPEEDS[speed || getSpeed()] || SPEEDS.normal;
  }

  applyLetterCase();
  // Pages restored with the browser's Back button skip loading; re-read the setting.
  window.addEventListener("pageshow", applyLetterCase);

  return {
    getLetterCase,
    setLetterCase,
    britishVoices,
    voiceFor,
    getVoice,
    setVoice,
    getSpeed,
    setSpeed,
    getRate,
    SPEEDS,
  };
})();

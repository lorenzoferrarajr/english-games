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
  const VOICE_KEY = "english-games.voice"; // voiceURI of the chosen voice; "" = Default
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
  // British English voices on this device (lang "en-GB"; some browsers say "en_GB").
  // The list can be empty at first: browsers fill it in later and fire "voiceschanged".
  function britishVoices() {
    if (!("speechSynthesis" in window)) return [];
    return window.speechSynthesis
      .getVoices()
      .filter((v) => (v.lang || "").replace("_", "-").toLowerCase() === "en-gb");
  }

  // The saved voice's voiceURI, or "" for Default.
  function getVoice() {
    return read(VOICE_KEY) || "";
  }

  function setVoice(voiceURI) {
    write(VOICE_KEY, voiceURI || "");
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
    getVoice,
    setVoice,
    getSpeed,
    setSpeed,
    getRate,
    SPEEDS,
  };
})();

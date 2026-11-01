// Settings chosen on the games index page and used by every game.
// Stored in this browser (localStorage), so each device keeps its own choice.
//
// Load it in <head>, before the stylesheets apply, so text never flashes in the wrong case:
//   index page:  <script src="shared/settings.js"></script>
//   a game:      <script src="../shared/settings.js"></script>
//
// Letter case: sets <html data-letter-case="upper|lower">; shared/base.css does the rest.
window.Settings = (function () {
  "use strict";

  const CASE_KEY = "english-games.letter-case";

  function getLetterCase() {
    try {
      return localStorage.getItem(CASE_KEY) === "lower" ? "lower" : "upper";
    } catch (e) {
      return "upper";
    }
  }

  function applyLetterCase() {
    document.documentElement.dataset.letterCase = getLetterCase();
  }

  function setLetterCase(value) {
    try {
      localStorage.setItem(CASE_KEY, value === "lower" ? "lower" : "upper");
    } catch (e) {
      /* storage unavailable: the choice lasts only for this page */
    }
    document.documentElement.dataset.letterCase = value === "lower" ? "lower" : "upper";
  }

  applyLetterCase();
  // Pages restored with the browser's Back button skip loading; re-read the setting.
  window.addEventListener("pageshow", applyLetterCase);

  return { getLetterCase, setLetterCase };
})();

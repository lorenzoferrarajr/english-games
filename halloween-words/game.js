// Halloween Words: listen to a word and tap the right Halloween character.
// Characters and their drawings are in characters.js (window.CHARACTERS).
// Uses ../shared/kit.js (window.Kit) for speech, sounds, mute, progress and celebrations.
(function () {
  "use strict";

  const CHARACTERS = window.CHARACTERS;
  const TIMES_EACH = 2; // every word is asked twice per round (8 x 2 = 16 questions)
  const FIRST_HINT_MS = 5000; // idle time before repeating the word on the first question
  const HINT_MS = 7000; // idle time before repeating the word afterwards
  const NEXT_MS = 2200; // pause after a right answer
  const CONFETTI = ["🎃", "🦇", "👻", "⭐", "🍬", "✨"];

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const els = {
    learnCards: $("learn-cards"),
    play: $("play"),
    listen: $("listen"),
    bubble: $("bubble"),
    choices: $("choices"),
    progress: $("progress"),
    mute: $("mute"),
    again: $("again"),
    learn: $("learn"),
    endStars: $("end-stars"),
    endPumpkin: $("end-pumpkin"),
  };

  // ---------- State ----------
  const state = {
    questions: [], // words to ask this round
    index: 0,
    wrong: 0, // wrong taps on this question
    idles: 0, // how many times the idle timer fired on this question
    busy: false,
    timers: [],
    idleTimer: 0,
  };

  function later(fn, ms) {
    state.timers.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    clearTimeout(state.idleTimer);
  }

  function show(name) {
    clearTimers();
    Kit.show(name);
  }

  function makeCharButton(ch, withLabel) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "char";
    btn.dataset.word = ch.word;
    btn.setAttribute("aria-label", ch.word);
    btn.innerHTML = ch.svg + (withLabel ? `<span class="char-word">${ch.word}</span>` : "");
    btn.style.setProperty("--delay", -Kit.rand(0, 3).toFixed(2) + "s"); // float out of step
    return btn;
  }

  // ---------- Learn screen ----------
  function buildLearnCards() {
    CHARACTERS.forEach((ch) => {
      const btn = makeCharButton(ch, true);
      btn.addEventListener("click", () => {
        Kit.speak(ch.word);
        Kit.replayClass(btn, "cheer");
      });
      els.learnCards.appendChild(btn);
    });
  }

  // ---------- Game ----------
  // Each word TIMES_EACH times, shuffled, never the same word twice in a row.
  function makeQuestions() {
    const words = [];
    CHARACTERS.forEach((ch) => {
      for (let i = 0; i < TIMES_EACH; i++) words.push(ch.word);
    });
    let list = Kit.shuffle(words);
    for (let tries = 0; tries < 200 && list.some((w, i) => w === list[i - 1]); tries++) {
      list = Kit.shuffle(words);
    }
    return list;
  }

  function current() {
    return state.questions[state.index];
  }

  function startRound() {
    state.questions = makeQuestions();
    state.index = 0;
    show("game");
    nextQuestion();
  }

  function nextQuestion() {
    state.wrong = 0;
    state.idles = 0;
    state.busy = false;
    Kit.renderProgress(els.progress, state.questions.length, state.index);
    els.bubble.textContent = current();

    // All characters, in a new random order each time
    els.choices.innerHTML = "";
    Kit.shuffle(CHARACTERS).forEach((ch, i) => {
      const btn = makeCharButton(ch, false);
      btn.classList.add("appear");
      btn.style.setProperty("--appear-delay", i * 0.04 + "s");
      // pointerdown feels instant on touch; click with detail 0 = keyboard
      btn.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        onChoice(btn);
      });
      btn.addEventListener("click", (e) => {
        if (e.detail === 0) onChoice(btn);
      });
      els.choices.appendChild(btn);
    });

    sayWord();
    resetIdle();
  }

  function sayWord() {
    Kit.speak(current());
    Kit.replayClass(els.listen, "speaking");
  }

  function targetButton() {
    return els.choices.querySelector(`.char[data-word="${current()}"]`);
  }

  function showHint() {
    const btn = targetButton();
    if (btn) btn.classList.add("hint");
  }

  // If the child stops for a while, say the word again; the second time, also show it.
  function resetIdle() {
    clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(() => {
      if (state.busy) return;
      state.idles++;
      sayWord();
      if (state.idles >= 2) showHint();
      resetIdle();
    }, state.index === 0 && state.idles === 0 ? FIRST_HINT_MS : HINT_MS);
  }

  function onChoice(btn) {
    if (state.busy) return;
    resetIdle();

    if (btn.dataset.word === current()) {
      state.busy = true;
      clearTimeout(state.idleTimer);
      btn.classList.remove("hint", "appear");
      Kit.replayClass(btn, "right");
      els.choices.querySelectorAll(".char").forEach((c) => {
        if (c !== btn) c.classList.add("faded");
      });
      Kit.sfx.success();
      Kit.speak(current() + "!", Kit.pick(Kit.PRAISE));
      Kit.celebrate(8, CONFETTI);
      Kit.renderProgress(els.progress, state.questions.length, state.index + 1);
      later(() => {
        state.index++;
        if (state.index >= state.questions.length) endRound();
        else nextQuestion();
      }, NEXT_MS);
    } else {
      state.wrong++;
      Kit.sfx.oops();
      btn.classList.remove("appear");
      Kit.replayClass(btn, "wobble");
      // say the word again so the child can listen once more
      later(sayWord, 400);
      if (state.wrong >= 2) showHint();
    }
  }

  function endRound() {
    show("end");
    els.endStars.textContent = "⭐".repeat(state.questions.length);
    Kit.sfx.fanfare();
    Kit.speak("Well done!", "Happy Halloween!");
    Kit.celebrate(28, CONFETTI);
  }

  // ---------- Wire up ----------
  buildLearnCards();
  const svgOf = (word) => CHARACTERS.find((c) => c.word === word).svg;
  els.endPumpkin.innerHTML = svgOf("pumpkin");
  els.learn.innerHTML = svgOf("ghost");
  Kit.setupMute(els.mute);

  els.play.addEventListener("click", startRound);
  els.again.addEventListener("click", startRound);
  els.learn.addEventListener("click", () => show("start"));
  els.listen.addEventListener("click", () => {
    sayWord();
    resetIdle();
  });
})();

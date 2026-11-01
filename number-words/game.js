// Number Words: learn how the numbers 1-10 are written in English.
// Learn screen: tap a card to hear the word. Game: build the word from letter tiles.
// Uses ../shared/kit.js (window.Kit) for speech, sounds, mute, progress and celebrations.
(function () {
  "use strict";

  // ---------- Vocabulary ----------
  const NUMBERS = [
    { n: 1, word: "one", color: "#ef4f55" },
    { n: 2, word: "two", color: "#f57a1f" },
    { n: 3, word: "three", color: "#d99000" },
    { n: 4, word: "four", color: "#2faf5f" },
    { n: 5, word: "five", color: "#16a395" },
    { n: 6, word: "six", color: "#2f8cf0" },
    { n: 7, word: "seven", color: "#5b5ef0" },
    { n: 8, word: "eight", color: "#9a4cf5" },
    { n: 9, word: "nine", color: "#ea4aa8" },
    { n: 10, word: "ten", color: "#8a5a3c" },
  ];
  const OBJECTS = ["🍎", "🐟", "🐞", "⭐", "🎈", "🐥", "🌸", "🍓", "🚗", "🦋", "🐸", "🍌"];

  const FIRST_HINT_MS = 3500; // idle time before a hint on the very first word
  const HINT_MS = 7000; // idle time before a hint afterwards
  const NEXT_WORD_MS = 2600; // pause after a word is completed

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const els = {
    cards: $("cards"),
    play: $("play"),
    numeral: $("numeral"),
    numeralText: $("numeral-text"),
    objects: $("objects"),
    slots: $("slots"),
    tiles: $("tiles"),
    progress: $("progress"),
    mute: $("mute"),
    again: $("again"),
    learn: $("learn"),
    endStars: $("end-stars"),
  };

  // ---------- State ----------
  const state = {
    round: [], // the numbers for this round
    index: 0, // which number of the round we are on
    filled: 0, // letters placed so far
    wrong: 0, // wrong taps for the current letter
    busy: false, // true while celebrating a finished word
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

  // ---------- Learn screen ----------
  function buildCards() {
    NUMBERS.forEach((item) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.style.setProperty("--c", item.color);
      card.setAttribute("aria-label", item.word);
      card.innerHTML = `<span class="card-num">${item.n}</span><span class="card-word">${item.word}</span>`;
      card.addEventListener("click", () => {
        Kit.speak(item.word);
        Kit.replayClass(card, "bounce");
      });
      els.cards.appendChild(card);
    });
  }

  // ---------- Game ----------
  function current() {
    return state.round[state.index];
  }

  function startRound() {
    state.round = Kit.shuffle(NUMBERS); // every round covers all 10 numbers, in random order
    state.index = 0;
    show("game");
    nextWord();
  }

  // Shuffle the letters so they are not already in the right order.
  function scramble(word) {
    let letters = word.split("");
    for (let tries = 0; tries < 20 && letters.join("") === word; tries++) {
      letters = Kit.shuffle(letters);
    }
    return letters;
  }

  function nextWord() {
    const item = current();
    state.filled = 0;
    state.wrong = 0;
    state.busy = false;
    Kit.renderProgress(els.progress, state.round.length, state.index);

    els.numeralText.textContent = item.n;
    els.numeral.style.setProperty("--c", item.color);

    // Objects to count, in rows of five
    const emoji = Kit.pick(OBJECTS);
    els.objects.innerHTML = "";
    for (let i = 0; i < item.n; i++) {
      const obj = document.createElement("span");
      obj.className = "obj";
      obj.textContent = emoji;
      obj.style.animationDelay = i * 0.07 + "s";
      els.objects.appendChild(obj);
    }

    // Empty slots showing faint "ghost" letters to copy
    els.slots.innerHTML = "";
    els.slots.classList.remove("done");
    item.word.split("").forEach((letter) => {
      const slot = document.createElement("span");
      slot.className = "slot";
      slot.textContent = letter;
      els.slots.appendChild(slot);
    });

    // Letter tiles to tap
    els.tiles.innerHTML = "";
    scramble(item.word).forEach((letter) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.textContent = letter;
      tile.dataset.letter = letter;
      tile.setAttribute("aria-label", letter);
      // pointerdown feels instant on touch; click with detail 0 = keyboard
      tile.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        onTile(tile);
      });
      tile.addEventListener("click", (e) => {
        if (e.detail === 0) onTile(tile);
      });
      els.tiles.appendChild(tile);
    });

    markNextSlot();
    sayNumber();
    resetIdle();
  }

  function sayNumber() {
    Kit.speak(current().word);
    Kit.replayClass(els.numeral, "speaking");
  }

  function markNextSlot() {
    Array.from(els.slots.children).forEach((slot, i) => {
      slot.classList.toggle("next", i === state.filled);
    });
  }

  function showHint() {
    const expected = current().word[state.filled];
    const tile = Array.from(els.tiles.children).find(
      (t) => !t.classList.contains("used") && t.dataset.letter === expected
    );
    if (tile) tile.classList.add("hint");
  }

  function clearHint() {
    Array.from(els.tiles.children).forEach((t) => t.classList.remove("hint"));
  }

  // If the child stops for a while, repeat the word and show which tile is next.
  function resetIdle() {
    clearTimeout(state.idleTimer);
    const firstEver = state.index === 0 && state.filled === 0;
    state.idleTimer = setTimeout(() => {
      if (state.busy) return;
      sayNumber();
      showHint();
      resetIdle();
    }, firstEver ? FIRST_HINT_MS : HINT_MS);
  }

  function onTile(tile) {
    if (state.busy || tile.classList.contains("used")) return;
    resetIdle();
    const item = current();

    if (tile.dataset.letter === item.word[state.filled]) {
      tile.classList.add("used");
      tile.disabled = true;
      const slot = els.slots.children[state.filled];
      slot.classList.add("filled");
      Kit.replayClass(slot, "bounce");
      state.filled++;
      state.wrong = 0;
      clearHint();
      markNextSlot();
      if (state.filled === item.word.length) wordDone();
      else Kit.sfx.pop();
    } else {
      state.wrong++;
      Kit.sfx.oops();
      Kit.replayClass(tile, "wobble");
      if (state.wrong >= 2) showHint();
    }
  }

  function wordDone() {
    state.busy = true;
    clearTimeout(state.idleTimer);
    Kit.sfx.success();
    Kit.replayClass(els.slots, "done");
    Kit.speak(current().word, Kit.pick(Kit.PRAISE));
    Kit.celebrate(14);
    Kit.renderProgress(els.progress, state.round.length, state.index + 1);

    later(() => {
      state.index++;
      if (state.index >= state.round.length) endRound();
      else nextWord();
    }, NEXT_WORD_MS);
  }

  function endRound() {
    show("end");
    els.endStars.textContent = "⭐".repeat(state.round.length);
    Kit.sfx.fanfare();
    Kit.speak("Well done! You did it!");
    Kit.celebrate(28);
  }

  // ---------- Wire up ----------
  buildCards();
  Kit.setupMute(els.mute);

  els.play.addEventListener("click", startRound);
  els.again.addEventListener("click", startRound);
  els.learn.addEventListener("click", () => show("start"));
  els.numeral.addEventListener("click", () => {
    sayNumber();
    resetIdle();
  });
})();

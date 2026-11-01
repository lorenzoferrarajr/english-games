// Halloween Memory: look at the cards and hear their names, then the cards flip over
// and shuffle a little. The voice says a word: tap the card you think it is.
// Right card: it disappears. Wrong card: it shows itself, then flips back.
// Every turn asks for a different card than the turn before, right or wrong.
// No hints: cards never glow or reveal themselves; a pause only repeats the word.
// Characters and drawings: ../shared/halloween/characters.js (window.CHARACTERS).
// Uses ../shared/kit.js (window.Kit) for speech, sounds, mute, progress and celebrations.
(function () {
  "use strict";

  const CHARACTERS = window.CHARACTERS;
  const SWAPS = 3; // how many pairs of cards swap places after they flip ("shuffle a bit")
  const FLIP_MS = 450; // must match the .mem-inner transition in style.css
  const SWAP_MS = 650; // time for one swap
  const SHOW_WRONG_MS = 1500; // how long a wrong card stays face up
  const NEXT_MS = 1600; // shortest wait after a right card; the praise is always heard in full
  const IDLE_MS = 8000; // idle time before the word is said again (no other hint)
  const CONFETTI = ["🎃", "🦇", "👻", "⭐", "🍬", "✨"];

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const els = {
    cards: $("cards"),
    play: $("play"),
    listen: $("listen"),
    bubble: $("bubble"),
    progress: $("progress"),
    mute: $("mute"),
    again: $("again"),
    endStars: $("end-stars"),
    endPumpkin: $("end-pumpkin"),
  };

  // ---------- State ----------
  const state = {
    mode: "start", // "start" (cards face up) | "game" | "end"
    remaining: [], // words not found yet
    target: null, // the word asked this turn
    found: 0,
    busy: true, // blocks taps while cards flip, shuffle or celebrate
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

  // The board section is used for both "start" and "game"; "end" has its own section.
  function setMode(mode) {
    clearTimers();
    state.mode = mode;
    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.toggle("active", s.id === (mode === "end" ? "screen-end" : "screen-board"));
    });
    document.body.dataset.screen = mode;
  }

  function current() {
    return state.target;
  }

  // ---------- Board ----------
  function buildBoard() {
    setMode("start");
    state.busy = false;
    els.cards.innerHTML = "";
    Kit.shuffle(CHARACTERS).forEach((ch) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mem";
      card.dataset.word = ch.word;
      card.setAttribute("aria-label", ch.word);
      card.innerHTML =
        `<span class="mem-inner">` +
        `<span class="mem-face mem-front">${ch.svg}<span class="mem-word">${ch.word}</span></span>` +
        `<span class="mem-face mem-back" aria-hidden="true"><span class="mem-q">?</span></span>` +
        `</span>`;
      // While playing, pointerdown feels instant on touch. Before Play, cards speak on
      // click: on touch screens pointerdown doesn't unlock audio (iOS/Android rule), and
      // tapping a card is often the very first thing a child does. Click with detail 0 = keyboard.
      card.addEventListener("pointerdown", (e) => {
        if (state.mode !== "game") return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        onCard(card);
      });
      card.addEventListener("click", (e) => {
        if (state.mode === "start" || e.detail === 0) onCard(card);
      });
      els.cards.appendChild(card);
    });
  }

  function flip(card, faceDown) {
    card.classList.toggle("down", faceDown);
    card.setAttribute("aria-label", faceDown ? "hidden card" : card.dataset.word);
  }

  // Swap two cards' places with a smooth slide (FLIP technique: measure, move, animate).
  function swapCards(a, b) {
    const pair = [a, b];
    const before = pair.map((c) => c.getBoundingClientRect());
    const marker = document.createElement("span");
    a.replaceWith(marker);
    b.replaceWith(a);
    marker.replaceWith(b);
    pair.forEach((c, i) => {
      const after = c.getBoundingClientRect();
      c.style.transition = "none";
      c.style.transform = `translate(${before[i].left - after.left}px, ${before[i].top - after.top}px)`;
      c.classList.add("moving");
    });
    void a.offsetWidth; // apply the start position before animating
    pair.forEach((c) => {
      c.style.transition = `transform ${SWAP_MS - 100}ms ease-in-out`;
      c.style.transform = "";
    });
    later(() => {
      pair.forEach((c) => {
        c.style.transition = "";
        c.classList.remove("moving");
      });
    }, SWAP_MS);
  }

  function randomPairs(cards, count) {
    const pairs = [];
    for (let i = 0; i < count; i++) {
      const [a, b] = Kit.shuffle(cards);
      pairs.push([a, b]);
    }
    return pairs;
  }

  // ---------- Game ----------
  function startGame() {
    setMode("game");
    state.busy = true;
    state.remaining = CHARACTERS.map((c) => c.word);
    state.target = null;
    state.found = 0;
    Kit.renderProgress(els.progress, CHARACTERS.length, 0);
    els.bubble.textContent = "";

    // 1. flip all cards face down, one after another
    const cards = Array.from(els.cards.children);
    cards.forEach((card, i) => later(() => flip(card, true), i * 70));
    const flipped = cards.length * 70 + FLIP_MS + 200;

    // 2. shuffle a bit: a few swaps, one after another
    randomPairs(cards, SWAPS).forEach(([a, b], i) => {
      later(() => swapCards(a, b), flipped + i * SWAP_MS);
    });

    // 3. ask the first word
    later(ask, flipped + SWAPS * SWAP_MS + 300);
  }

  // Start a turn: ask for a card not found yet, different from the last one asked
  // (unless it is the only card left).
  function ask() {
    const others = state.remaining.filter((w) => w !== state.target);
    state.target = Kit.pick(others.length ? others : state.remaining);
    state.busy = false;
    els.bubble.textContent = current();
    sayWord();
    resetIdle();
  }

  function sayWord() {
    Kit.speak(current());
    Kit.replayClass(els.listen, "speaking");
  }

  function resetIdle() {
    clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(() => {
      if (state.busy) return;
      sayWord();
      resetIdle();
    }, IDLE_MS);
  }

  function onCard(card) {
    if (state.mode === "start") {
      Kit.speak(card.dataset.word);
      Kit.replayClass(card, "cheer");
      return;
    }
    if (state.mode !== "game" || state.busy) return;
    if (!card.classList.contains("down") || card.classList.contains("gone")) return;

    state.busy = true;
    clearTimeout(state.idleTimer);
    flip(card, false);

    if (card.dataset.word === current()) {
      later(() => {
        Kit.replayClass(card, "right");
        Kit.sfx.success();
        Kit.speak(card.dataset.word + "!", Kit.pick(Kit.PRAISE));
        Kit.celebrate(8, CONFETTI);
        state.found++;
        state.remaining = state.remaining.filter((w) => w !== card.dataset.word);
        Kit.renderProgress(els.progress, CHARACTERS.length, state.found);
      }, FLIP_MS);
      later(() => card.classList.add("gone"), FLIP_MS + 1300);
      // next turn once the praise has been said (and at least NEXT_MS after the tap)
      later(() => Kit.afterSpeech(nextTurn), FLIP_MS + NEXT_MS);
    } else {
      // show which card it was and say its name, then turn it back over;
      // the next turn asks for a different card
      later(() => {
        Kit.sfx.oops();
        Kit.replayClass(card, "wrong");
        Kit.speak(card.dataset.word);
      }, FLIP_MS);
      later(() => flip(card, true), FLIP_MS + SHOW_WRONG_MS);
      later(() => Kit.afterSpeech(nextTurn, 0), FLIP_MS * 2 + SHOW_WRONG_MS);
    }
  }

  function nextTurn() {
    if (state.mode !== "game") return; // left the game meanwhile
    if (state.remaining.length) ask();
    else endGame();
  }

  function endGame() {
    setMode("end");
    els.endStars.textContent = "⭐".repeat(CHARACTERS.length);
    Kit.sfx.fanfare();
    Kit.speak("Well done!", "Happy Halloween!");
    Kit.celebrate(28, CONFETTI);
  }

  // ---------- Wire up ----------
  els.endPumpkin.innerHTML = CHARACTERS.find((c) => c.word === "pumpkin").svg;
  Kit.setupMute(els.mute);
  buildBoard();

  els.play.addEventListener("click", () => {
    if (state.mode === "start") startGame();
  });
  els.again.addEventListener("click", buildBoard);
  els.listen.addEventListener("click", () => {
    if (state.mode !== "game" || !current()) return;
    sayWord();
    resetIdle();
  });
})();

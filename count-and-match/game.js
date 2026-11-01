// Count and Match: connect each number word ("three") to the card with that many things.
// Connect by dragging a line between two cards, or by tapping one card and then the other.
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
  const OBJECTS = ["🍎", "🐟", "🐞", "⭐", "🎈", "🐥", "🌸", "🍓", "🚗", "🦋", "🐸", "🍌", "⚽", "🐶"];

  const PER_BOARD = 5; // all 10 numbers per round = 2 boards of 5
  const FIRST_HINT_MS = 5000; // idle time before a hint on the first board
  const HINT_MS = 9000; // idle time before a hint afterwards
  const NEXT_BOARD_MS = 2600; // pause after a board is finished
  const DRAG_THRESHOLD = 12; // px a finger must move before it counts as a drag

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const els = {
    play: $("play"),
    again: $("again"),
    board: $("board"),
    words: $("words"),
    sets: $("sets"),
    lines: $("lines"),
    progress: $("progress"),
    mute: $("mute"),
    endStars: $("end-stars"),
  };
  const SVG_NS = "http://www.w3.org/2000/svg";

  // ---------- State ----------
  const state = {
    boards: [], // two lists of 5 numbers
    boardIndex: 0,
    done: 0, // matches made this round (0-10)
    pairs: [], // matched {word, set, color} elements, for redrawing lines
    selected: null, // card chosen by a tap, waiting for its partner
    drag: null, // {card, pointerId, x0, y0, moved, line}
    wrong: {}, // wrong tries per number on this board
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

  function total() {
    return NUMBERS.length;
  }

  // ---------- Round and boards ----------
  function startRound() {
    const order = Kit.shuffle(NUMBERS); // every round covers all 10 numbers
    state.boards = [];
    for (let i = 0; i < order.length; i += PER_BOARD) {
      state.boards.push(order.slice(i, i + PER_BOARD));
    }
    state.boardIndex = 0;
    state.done = 0;
    show("game");
    buildBoard();
  }

  // Order the cards so that no word sits right across from its own set.
  function arrange(items) {
    const words = Kit.shuffle(items);
    let sets = Kit.shuffle(items);
    for (let tries = 0; tries < 50 && sets.some((s, i) => s === words[i]); tries++) {
      sets = Kit.shuffle(items);
    }
    return { words, sets };
  }

  function buildBoard() {
    const items = state.boards[state.boardIndex];
    const { words, sets } = arrange(items);
    const emojis = Kit.shuffle(OBJECTS); // a different thing on each card

    state.pairs = [];
    state.selected = null;
    state.drag = null;
    state.wrong = {};
    state.busy = false;
    els.words.innerHTML = "";
    els.sets.innerHTML = "";
    els.lines.innerHTML = "";

    words.forEach((item) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mcard word-card";
      card.dataset.n = item.n;
      card.dataset.side = "word";
      card.textContent = item.word;
      card.style.setProperty("--c", item.color);
      card.setAttribute("aria-label", item.word);
      els.words.appendChild(card);
    });

    sets.forEach((item, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mcard set-card";
      card.dataset.n = item.n;
      card.dataset.side = "set";
      card.style.setProperty("--c", item.color);
      card.setAttribute("aria-label", item.n + " " + emojis[i]);
      const set = document.createElement("span");
      set.className = "set";
      for (let k = 0; k < item.n; k++) {
        const obj = document.createElement("span");
        obj.textContent = emojis[i];
        set.appendChild(obj);
      }
      card.appendChild(set);
      els.sets.appendChild(card);
    });

    Kit.renderProgress(els.progress, total(), state.done);
    resetIdle();
  }

  // ---------- Lines ----------
  // Point (relative to the board) where a line attaches to a card: its connector dot.
  // Uses offset* (layout position) rather than getBoundingClientRect, so cards that are
  // bouncing or scaled up don't pull the line out of place.
  function anchor(card) {
    const x = card.dataset.side === "word" ? card.offsetLeft + card.offsetWidth : card.offsetLeft;
    return { x, y: card.offsetTop + card.offsetHeight / 2 };
  }

  function makeLine(cls, color) {
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("class", cls);
    if (color) line.setAttribute("stroke", color);
    els.lines.appendChild(line);
    return line;
  }

  function setLine(line, a, b) {
    line.setAttribute("x1", a.x);
    line.setAttribute("y1", a.y);
    line.setAttribute("x2", b.x);
    line.setAttribute("y2", b.y);
  }

  function redrawLines() {
    els.lines.querySelectorAll(".match-line").forEach((l) => l.remove());
    state.pairs.forEach((p) => {
      setLine(makeLine("match-line", p.color), anchor(p.word), anchor(p.set));
    });
  }

  // ---------- Input: drag a line, or tap one card then the other ----------
  function cardAt(x, y) {
    const el = document.elementFromPoint(x, y);
    const card = el && el.closest(".mcard");
    return card && els.board.contains(card) ? card : null;
  }

  function isOpen(card) {
    return card && !card.classList.contains("matched");
  }

  function clearTargets() {
    els.board.querySelectorAll(".mcard.target").forEach((c) => c.classList.remove("target"));
  }

  els.board.addEventListener("pointerdown", (e) => {
    if (state.busy || state.drag) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const card = e.target.closest(".mcard");
    if (!isOpen(card)) return;
    e.preventDefault();
    els.board.setPointerCapture(e.pointerId);
    state.drag = { card, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, line: null };
    resetIdle();
  });

  els.board.addEventListener("pointermove", (e) => {
    const d = state.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > DRAG_THRESHOLD) {
      d.moved = true;
      select(d.card);
      d.line = makeLine("drag-line");
    }
    if (!d.moved) return;
    const b = els.board.getBoundingClientRect();
    setLine(d.line, anchor(d.card), { x: e.clientX - b.left, y: e.clientY - b.top });
    clearTargets();
    const over = cardAt(e.clientX, e.clientY);
    if (isOpen(over) && over.dataset.side !== d.card.dataset.side) over.classList.add("target");
  });

  els.board.addEventListener("pointerup", (e) => {
    const d = state.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    state.drag = null;
    clearTargets();
    if (d.line) d.line.remove();
    if (d.moved) {
      const over = cardAt(e.clientX, e.clientY);
      if (isOpen(over) && over.dataset.side !== d.card.dataset.side) tryMatch(d.card, over);
    } else {
      onTap(d.card);
    }
  });

  els.board.addEventListener("pointercancel", () => {
    if (state.drag && state.drag.line) state.drag.line.remove();
    state.drag = null;
    clearTargets();
  });

  // Keyboard: Enter/Space on a card behaves like a tap.
  els.board.addEventListener("click", (e) => {
    if (e.detail !== 0 || state.busy) return;
    const card = e.target.closest(".mcard");
    if (isOpen(card)) onTap(card);
  });

  function select(card) {
    if (state.selected) state.selected.classList.remove("selected");
    state.selected = card;
    if (card) {
      card.classList.add("selected");
      if (card.dataset.side === "word") Kit.speak(card.textContent);
    }
  }

  function onTap(card) {
    const sel = state.selected;
    if (sel && sel !== card && sel.dataset.side !== card.dataset.side) {
      tryMatch(sel, card);
    } else {
      select(card);
      if (card.dataset.side === "set") hopObjects(card);
    }
  }

  // ---------- Matching ----------
  function tryMatch(a, b) {
    const word = a.dataset.side === "word" ? a : b;
    const set = a.dataset.side === "set" ? a : b;
    const n = Number(word.dataset.n);

    if (word.dataset.n === set.dataset.n) {
      select(null);
      clearHints();
      word.classList.add("matched");
      set.classList.add("matched");
      const color = getComputedStyle(word).getPropertyValue("--c").trim();
      state.pairs.push({ word, set, color });
      setLine(makeLine("match-line", color), anchor(word), anchor(set));
      Kit.sfx.pop();
      Kit.speak(word.textContent);
      Kit.replayClass(word, "bounce");
      hopObjects(set);
      state.done++;
      Kit.renderProgress(els.progress, total(), state.done);
      if (els.board.querySelectorAll(".mcard:not(.matched)").length === 0) boardDone();
      else resetIdle();
    } else {
      const line = makeLine("wrong-line");
      setLine(line, anchor(word), anchor(set));
      setTimeout(() => line.remove(), 700);
      Kit.sfx.oops();
      Kit.replayClass(word, "wobble");
      Kit.replayClass(set, "wobble");
      // keep the word chosen and say it again, so the child can listen and recount
      select(word);
      state.wrong[n] = (state.wrong[n] || 0) + 1;
      if (state.wrong[n] >= 2) showHint(word);
      resetIdle();
    }
  }

  // Make the objects jump one after another, like counting them.
  function hopObjects(card) {
    Array.from(card.querySelectorAll(".set > span")).forEach((obj, i) => {
      obj.classList.remove("hop");
      void obj.offsetWidth;
      obj.style.animationDelay = i * 0.12 + "s";
      obj.classList.add("hop");
    });
  }

  function partnerOf(card) {
    const side = card.dataset.side === "word" ? els.sets : els.words;
    return side.querySelector(`.mcard[data-n="${card.dataset.n}"]`);
  }

  function showHint(card) {
    clearHints();
    card.classList.add("hint");
    const partner = partnerOf(card);
    if (partner) partner.classList.add("hint");
  }

  function clearHints() {
    els.board.querySelectorAll(".mcard.hint").forEach((c) => c.classList.remove("hint"));
  }

  // If the child stops for a while: say a word again and nudge it;
  // if a word was already chosen, show where it goes.
  function resetIdle() {
    clearTimeout(state.idleTimer);
    const first = state.boardIndex === 0 && state.done === 0;
    state.idleTimer = setTimeout(() => {
      if (state.busy) return;
      const sel = state.selected;
      if (sel && sel.dataset.side === "word") {
        Kit.speak(sel.textContent);
        showHint(sel);
      } else {
        const open = Array.from(els.words.querySelectorAll(".mcard:not(.matched)"));
        if (open.length) {
          const word = Kit.pick(open);
          select(word);
          Kit.replayClass(word, "nudge");
        }
      }
      resetIdle();
    }, first ? FIRST_HINT_MS : HINT_MS);
  }

  function boardDone() {
    state.busy = true;
    clearTimeout(state.idleTimer);
    clearHints();
    later(() => {
      Kit.sfx.success();
      Kit.speak(Kit.pick(Kit.PRAISE));
      Kit.celebrate(16);
    }, 700);
    later(() => {
      state.boardIndex++;
      if (state.boardIndex >= state.boards.length) endRound();
      else buildBoard();
    }, NEXT_BOARD_MS);
  }

  function endRound() {
    show("end");
    els.endStars.textContent = "⭐".repeat(total());
    Kit.sfx.fanfare();
    Kit.speak("Well done! You did it!");
    Kit.celebrate(28);
  }

  // ---------- Wire up ----------
  Kit.setupMute(els.mute);
  els.play.addEventListener("click", startRound);
  els.again.addEventListener("click", startRound);
  window.addEventListener("resize", () => {
    if (document.body.dataset.screen === "game") redrawLines();
  });
})();

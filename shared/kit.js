// Shared helpers for all games: speech, sound effects, mute, screens, progress, celebrations.
// Load it before the game script:  <script src="../shared/kit.js"></script>
// Everything is exposed on window.Kit.
window.Kit = (function () {
  "use strict";

  const MUTE_KEY = "english-games.muted";
  let muted = false;
  let infoOpen = false; // the game's information panel is showing: stay quiet

  function quiet() {
    return muted || infoOpen;
  }

  // ---------- Small helpers ----------
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  // Restart a one-shot CSS animation class.
  function replayClass(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable: ignore */
    }
  }

  // ---------- Speech ----------
  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  const LANG = "en-GB";
  // Well-known, clear voices, best first. iOS/macOS also list novelty voices
  // (Eddy, Flo, Grandma, Rocko, ...) that can sound odd or stay silent, so we
  // only pick a voice by name; otherwise we just set the language and let the
  // device use its default voice for it, which is the most reliable option.
  const GOOD_VOICES = [
    "Google UK English Female",
    "Google UK English Male",
    "Serena",
    "Kate",
    "Daniel",
    "Arthur",
    "Martha",
    "Stephanie",
    "Microsoft Libby",
    "Microsoft Sonia",
    "Microsoft Hazel",
    "Microsoft George",
  ];
  const NORMAL_RATE = 0.8; // used when shared/settings.js isn't loaded

  function britishVoices() {
    if (window.Settings) return Settings.britishVoices();
    if (!synth) return [];
    return synth.getVoices().filter((v) => (v.lang || "").replace("_", "-").toLowerCase() === "en-gb");
  }

  // "Default" voice: a known good British voice by name, or null = let the device
  // choose its own voice for LANG.
  function defaultVoice(voices) {
    for (const name of GOOD_VOICES) {
      const v = voices.find((x) => x.name === name || x.name.startsWith(name + " "));
      if (v) return v;
    }
    return null;
  }

  // The voice to use: the one asked for (or saved on the games page) if this device
  // has it, otherwise Default. Looked up every time, so new settings apply at once
  // and a voice missing on this device (other tablet, system update) is never used.
  // `wanted` is a voice name (or an older saved voiceURI); "" means Default.
  function chooseVoice(wanted) {
    const voices = britishVoices();
    if (wanted === undefined) wanted = window.Settings ? Settings.getVoice() : "";
    const found = !wanted
      ? null
      : window.Settings
      ? Settings.voiceFor(wanted)
      : voices.find((v) => v.name === wanted || v.voiceURI === wanted);
    return found || defaultVoice(voices);
  }

  // Some browsers only list voices after "voiceschanged"; asking once makes them load.
  if (synth) synth.getVoices();

  let hasSpoken = false; // has speak() been called at least once?
  // iOS only plays speech after something was spoken inside a real tap (click, keydown).
  // A speak() from pointerdown, or one delayed by a timer, doesn't count.
  let speechUnlocked = false;
  let inGesture = false; // inside a click/keydown right now
  let spokeInGesture = false; // synth.speak() was called during this click/keydown

  // A short "space" before each word. Tablets put their audio output to sleep after
  // some silence, and the first part of a word can be lost while it wakes up. So we
  // first wake the output with an inaudible signal, then start speaking a moment later.
  const LEAD_MS = 150;

  function wakeOutput() {
    if (!audioCtx || audioCtx.state !== "running") return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 20; // below what tablet speakers can play
    gain.gain.value = 0.001; // and far too quiet to hear anyway
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + LEAD_MS / 1000 + 0.6); // keep it awake while the word starts
  }

  let pendingSpeech = 0; // timer of a word waiting for its "space"

  // Speak one or more phrases in order, interrupting anything already playing.
  // Uses the voice and speed saved on the games page.
  function speak(...phrases) {
    speakWith({}, ...phrases);
  }

  // Like speak(), with options: { voice: name ("" = Default), speed: "slow" | "normal" | "fast" }.
  // Used by the ▶ sample buttons on the games page.
  function speakWith(options, ...phrases) {
    if (!synth || quiet()) return;
    clearTimeout(pendingSpeech); // a newer request replaces one still waiting
    // The very first speech must start inside the tap (iOS rule), so no delay then.
    const lead = hasSpoken ? LEAD_MS : 0;
    hasSpoken = true;
    if (lead) wakeOutput();
    const run = () => {
      pendingSpeech = 0;
      if (quiet()) return; // muted or info panel opened while waiting
      const voice = chooseVoice(options.voice);
      const rate = window.Settings ? Settings.getRate(options.speed) : NORMAL_RATE;
      phrases.forEach((text) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = LANG;
        if (voice) u.voice = voice;
        u.rate = rate;
        u.pitch = 1.1;
        synth.speak(u);
      });
      if (inGesture) spokeInGesture = true;
    };
    if (synth.paused) synth.resume();
    if (synth.speaking || synth.pending) {
      // Safari drops an utterance queued right after cancel(), so wait a moment.
      synth.cancel();
      pendingSpeech = setTimeout(run, Math.max(80, lead));
    } else if (lead) {
      pendingSpeech = setTimeout(run, lead);
    } else {
      run();
    }
  }

  // Run fn once nothing is being said any more (a word waiting for its "space" counts
  // as being said), after a short pause. Use it to start the next question, so it never
  // cuts off praise like "Pumpkin! Brilliant!", whatever the speed. Muted = no waiting.
  // Gives up waiting after maxMs, in case a browser never reports the end of speech.
  function afterSpeech(fn, pauseMs = 400, maxMs = 8000) {
    const start = Date.now();
    const talking = () =>
      synth && !quiet() && (pendingSpeech || synth.speaking || synth.pending);
    const check = () => {
      if (talking() && Date.now() - start < maxMs) setTimeout(check, 100);
      else setTimeout(fn, pauseMs);
    };
    check();
  }

  // ---------- Sound effects (Web Audio, no files needed) ----------
  let audioCtx = null;

  function tone(freq, at, dur, type, vol) {
    if (!audioCtx || quiet()) return;
    const t0 = audioCtx.currentTime + at;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  const sfx = {
    // a small step done right
    pop() {
      tone(700, 0, 0.15, "triangle", 0.25);
      tone(1050, 0.06, 0.15, "triangle", 0.2);
    },
    // a wrong try: soft and low, never a buzzer
    oops() {
      tone(330, 0, 0.2, "sine", 0.15);
      tone(262, 0.15, 0.25, "sine", 0.12);
    },
    // a bigger success (a word or a board finished)
    success() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, "triangle", 0.2));
    },
    // end of round
    fanfare() {
      [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.35, "triangle", 0.22));
    },
  };

  // Browsers (especially iOS Safari) only allow audio after a user gesture.
  // On touch, pointerdown is NOT a user activation, so unlock on touchend/click.

  // Let sounds play even when the iPad is in silent mode (Safari 17+; ignored elsewhere).
  try {
    if (navigator.audioSession) navigator.audioSession.type = "playback";
  } catch (e) {
    /* not supported: ignore */
  }

  // Web Audio: create/resume the context inside a gesture. iOS can also leave it
  // "interrupted" after switching apps, so resume whenever it isn't running.
  function unlockSounds() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state !== "running") audioCtx.resume().catch(() => {});
  }
  ["touchend", "click", "keydown"].forEach((type) =>
    document.addEventListener(type, unlockSounds, { capture: true, passive: true })
  );

  // Speech: iOS only allows speech once something has been spoken inside a gesture.
  // markGesture runs first (capture phase), unlockSpeech last (bubble phase on window),
  // AFTER the game's own click handlers: if the game spoke during this click, that
  // unlocked speech; if not (nothing said, a pointerdown speak, or a word waiting for
  // its "space"), speak a silent utterance now. (Doing it before the game's handler would
  // make the game cancel it straight away, which Safari doesn't handle well.)
  function markGesture() {
    inGesture = true;
    spokeInGesture = false;
  }
  function unlockSpeech() {
    inGesture = false;
    if (!synth || speechUnlocked) return;
    speechUnlocked = true;
    if (spokeInGesture) return;
    hasSpoken = true;
    const u = new SpeechSynthesisUtterance(" ");
    u.lang = LANG;
    u.volume = 0;
    synth.speak(u);
  }
  ["click", "keydown"].forEach((type) => {
    window.addEventListener(type, markGesture, true);
    window.addEventListener(type, unlockSpeech);
  });

  // ---------- Mute (remembered across all games) ----------
  function setupMute(button) {
    function setMuted(value) {
      muted = value;
      button.textContent = muted ? "🔇" : "🔊";
      button.setAttribute("aria-pressed", String(muted));
      if (muted && synth) synth.cancel();
      save(MUTE_KEY, muted);
    }
    setMuted(load(MUTE_KEY, false));
    button.addEventListener("click", () => setMuted(!muted));
  }

  // ---------- Information panel (optional, per game) ----------
  // If the page has <template id="game-info"> (rules, who invented the game, ...),
  // add an ℹ️ button to the top bar that shows it in a panel. Without the template,
  // nothing is added. While the panel is open, speech and sounds are paused.
  function setupInfo() {
    const tpl = document.getElementById("game-info");
    const topbar = document.querySelector(".topbar");
    const mute = document.getElementById("mute");
    if (!tpl || !topbar || !mute) return;

    // Group the ℹ️ and mute buttons on the right of the top bar
    const right = document.createElement("div");
    right.className = "topbar-right";
    mute.replaceWith(right);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-btn";
    button.id = "info";
    button.textContent = "ℹ️";
    button.setAttribute("aria-label", "About this game");
    right.append(button, mute);

    const dialog = document.createElement("dialog");
    dialog.className = "info-panel";
    dialog.setAttribute("aria-label", "About this game");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "info-close";
    close.textContent = "✕";
    close.setAttribute("aria-label", "Close");
    const body = document.createElement("div");
    body.className = "info-body";
    body.appendChild(tpl.content.cloneNode(true));
    dialog.append(close, body);
    document.body.appendChild(dialog);

    button.addEventListener("click", () => {
      infoOpen = true;
      if (synth) synth.cancel();
      if (dialog.showModal) dialog.showModal();
      else dialog.setAttribute("open", "");
    });
    close.addEventListener("click", () => dialog.close ? dialog.close() : dialog.removeAttribute("open"));
    // Tapping the dark area around the panel also closes it
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      infoOpen = false;
    });
  }

  // ---------- Screens ----------
  // Shows <section id="screen-NAME" class="screen"> and sets body[data-screen].
  function show(name) {
    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.toggle("active", s.id === "screen-" + name);
    });
    document.body.dataset.screen = name;
  }

  // ---------- Progress dots in the top bar ----------
  function renderProgress(el, total, done) {
    el.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("span");
      dot.className = "dot";
      if (i < done) {
        dot.classList.add("done");
        dot.textContent = "⭐";
      } else if (i === done) {
        dot.classList.add("current");
      }
      el.appendChild(dot);
    }
  }

  // ---------- Celebration burst ----------
  const CONFETTI = ["⭐", "🌟", "🎉", "✨", "🎈"];

  // icons: optional list of emoji to use instead of the default confetti
  function celebrate(count, icons) {
    const layer = document.getElementById("celebrate");
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "burst";
      s.textContent = pick(icons || CONFETTI);
      s.style.left = rand(3, 92) + "%";
      s.style.fontSize = Math.round(rand(32, 64)) + "px";
      s.style.animationDelay = Math.round(rand(0, 350)) + "ms";
      s.style.setProperty("--dx", Math.round(rand(-100, 100)) + "px");
      s.style.setProperty("--rot", Math.round(rand(-90, 90)) + "deg");
      layer.appendChild(s);
      setTimeout(() => s.remove(), 2200);
    }
  }

  setupInfo(); // kit.js is loaded at the end of <body>, so the page is ready

  return {
    shuffle,
    pick,
    rand,
    replayClass,
    load,
    save,
    speak,
    speakWith,
    afterSpeech,
    sfx,
    setupMute,
    show,
    renderProgress,
    celebrate,
    // for the games page: which voice "Default" means on this device (null = device's own)
    defaultVoice: () => defaultVoice(britishVoices()),
    // for shared/audio-check.html
    debugInfo: () => {
      const voice = chooseVoice();
      return {
        voice: voice ? voice.name + " (" + voice.lang + ")" : "device default for " + LANG,
        speed: window.Settings ? Settings.getSpeed() + " (" + Settings.getRate() + "×)" : "normal",
        sounds: audioCtx ? audioCtx.state : "not started yet",
        muted,
      };
    },
    PRAISE: ["Well done!", "Great job!", "Super!", "Brilliant!", "Fantastic!", "Yes!"],
  };
})();

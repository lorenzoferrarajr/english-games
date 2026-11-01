// Shared helpers for all games: speech, sound effects, mute, screens, progress, celebrations.
// Load it before the game script:  <script src="../shared/kit.js"></script>
// Everything is exposed on window.Kit.
window.Kit = (function () {
  "use strict";

  const MUTE_KEY = "english-games.muted";
  let muted = false;

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
  let voice = null;

  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices().filter((v) =>
      (v.lang || "").replace("_", "-").toLowerCase().startsWith("en-gb")
    );
    voice = null;
    for (const name of GOOD_VOICES) {
      voice = voices.find((v) => v.name === name || v.name.startsWith(name + " ")) || null;
      if (voice) break;
    }
  }

  if (synth) {
    pickVoice();
    if (synth.addEventListener) synth.addEventListener("voiceschanged", pickVoice);
    else synth.onvoiceschanged = pickVoice;
  }

  let hasSpoken = false; // has speak() been called at least once?

  // Speak one or more phrases in order, interrupting anything already playing.
  function speak(...phrases) {
    if (!synth || muted) return;
    hasSpoken = true;
    const run = () => {
      phrases.forEach((text) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = LANG;
        if (voice) u.voice = voice;
        u.rate = 0.8;
        u.pitch = 1.1;
        synth.speak(u);
      });
    };
    if (synth.paused) synth.resume();
    if (synth.speaking || synth.pending) {
      // Safari drops an utterance queued right after cancel(), so wait a moment.
      synth.cancel();
      setTimeout(run, 80);
    } else {
      run();
    }
  }

  // ---------- Sound effects (Web Audio, no files needed) ----------
  let audioCtx = null;

  function tone(freq, at, dur, type, vol) {
    if (!audioCtx || muted) return;
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
  // This runs in the bubble phase, AFTER the game's own click handlers: if the game
  // already spoke during this click, that unlocked speech; if not, speak a silent
  // utterance now. (Doing it before the game's handler would make the game cancel it
  // straight away, which Safari doesn't handle well.)
  function unlockSpeech() {
    if (!synth || hasSpoken) return;
    hasSpoken = true;
    const u = new SpeechSynthesisUtterance(" ");
    u.lang = LANG;
    u.volume = 0;
    synth.speak(u);
  }
  ["click", "keydown"].forEach((type) => document.addEventListener(type, unlockSpeech));

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

  return {
    shuffle,
    pick,
    rand,
    replayClass,
    load,
    save,
    speak,
    sfx,
    setupMute,
    show,
    renderProgress,
    celebrate,
    // for shared/audio-check.html
    debugInfo: () => ({
      voice: voice ? voice.name + " (" + voice.lang + ")" : "device default for " + LANG,
      sounds: audioCtx ? audioCtx.state : "not started yet",
      muted,
    }),
    PRAISE: ["Well done!", "Great job!", "Super!", "Brilliant!", "Fantastic!", "Yes!"],
  };
})();

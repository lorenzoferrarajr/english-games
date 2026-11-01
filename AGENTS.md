# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository.

## Project overview

A collection of simple browser games that help **6-year-old children who are not native English speakers** learn English. Each game is a self-contained HTML + JavaScript application that runs directly in a web browser.

## Repository layout

Each game lives in its own folder at the repository root:

```
english-games/
├── AGENTS.md
├── index.html            # Launcher page linking to every game, plus settings
├── serve.py              # Local server with caching off, for testing on tablets
├── shared/
│   ├── base.css          # Common look: colours, top bar, buttons, end screen, animations, touch CSS
│   ├── kit.js            # window.Kit: speech, sound effects, mute, screens, progress dots, celebrations
│   ├── settings.js       # window.Settings: options chosen on the index page (letters ABC/abc, voice, speech speed)
│   ├── audio-check.html  # Page to check speech and sounds on a device
│   └── halloween/        # Shared by the Halloween games: characters.js (words + SVG drawings), theme.css (night sky)
└── <game-name>/          # kebab-case, e.g. animal-sounds, color-match
    ├── index.html        # Entry point; must open and work on its own
    ├── style.css         # Optional
    ├── game.js           # Optional; split into more files if it gets large
    └── assets/           # Optional: images/, audio/
```

Rules:
- Folder names are lowercase `kebab-case` and describe the game (`fruit-memory`, `count-the-stars`).
- Every game folder has an `index.html` entry point.
- Games are independent: no game imports files from another game's folder. Common code lives in `shared/` and is loaded with relative paths (`../shared/base.css` before the game's `style.css`, `../shared/kit.js` before the game's `game.js`).
- Every page loads `../shared/settings.js` in `<head>`, before the stylesheets, so settings chosen on the index page (letter case, voice, speed) apply to it. Settings are per device, in `localStorage`.
- All text is shown in UPPERCASE or lowercase depending on that setting (CSS `text-transform` in `shared/base.css`). Write words in lowercase in the code, never hard-code capitals for case, and make sure the longest word fits in capitals.
- Optional information panel: a game can add `<template id="game-info">…</template>` to its `index.html` (rules, what it teaches, who invented it, …). `Kit` then adds an ℹ️ button to the top bar that shows it; speech and sounds pause while it is open. No template, no button. Keep it short, written for grown-ups, and in sync with the game's `README.md`.
- Use `Kit` for speech, sound effects, mute, screens, progress and celebrations instead of re-implementing them, so all games look, sound and behave the same. Only add to `shared/` what at least two games need, and when changing it, re-test every game.
- When adding a game, add a link to it in the root `index.html` launcher (create it if missing).

## Licensing

- Code is under the PolyForm Noncommercial License 1.0.0 (`LICENSE.md`); drawings and texts are under CC BY-NC 4.0 (`LICENSE-CONTENT.txt`). See the License section of `README.md`. The author may also release the games commercially.
- Only add material made for this project. Don't copy in third-party code, drawings, sounds or fonts unless their license clearly allows commercial redistribution, and note the source and license next to it.

## Technical constraints

- **Plain HTML, CSS and JavaScript only.** No frameworks, no bundlers, no build step, no `npm install`. A game must work by opening its `index.html` in a browser.
- Prefer working from `file://`. Avoid ES module imports and `fetch()` of local files, which are blocked from `file://` in most browsers; use classic `<script src="...">` tags and keep word lists as JS arrays/objects instead of JSON files.
- No external network dependencies at runtime (no CDNs, remote fonts, analytics or trackers). Everything needed ships in the repository.
- No accounts, logins, ads, in-app purchases, or collection of personal data. `localStorage` is fine for things like stars earned or a mute setting.
- Use relative paths for all assets.

## Target devices

- **Primary target: touch tablets** — iPad (Safari on iPadOS) and Android tablets (Chrome). Games must be fully playable by touch alone.
- Secondary: desktop browsers (Chrome, Firefox, Safari, Edge) with a mouse, mainly for development and testing.
- **Smartphones are not a target.** Don't spend effort on phone-sized layouts; just make sure nothing breaks badly.
- Design for tablet screens of roughly 768×1024 up to 1366×1024 CSS px, in landscape first, and make portrait still usable.
- Note that all iOS/iPadOS browsers use Safari's engine (WebKit), so Safari quirks apply even in "Chrome" on an iPad.

## Touch requirements

- Use **pointer events** (`pointerdown`, `pointerup`, …) so the same code handles touch and mouse. Don't rely on `click` alone for anything that needs to feel instant, and don't add separate `touchstart` and `mousedown` handlers that both fire.
- **Never rely on hover.** No hover-only menus, hints or states; everything must be reachable with a tap.
- No multi-finger gestures, long-presses, or double-taps as required actions. Single taps and simple drags only.
- For drag-and-drop, implement it with pointer events (and `setPointerCapture`), not the HTML5 drag-and-drop API, which doesn't work on touch devices.
- Include `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- Stop accidental zooming, scrolling and selection on the play area with CSS:
  - `touch-action: manipulation;` on the page (no double-tap zoom), `touch-action: none;` on draggable elements
  - `user-select: none; -webkit-user-select: none;` and `-webkit-touch-callout: none;` on game elements
  - `-webkit-tap-highlight-color: transparent;` (and provide your own pressed state instead)
  - `overscroll-behavior: none;` so swipes don't trigger pull-to-refresh
- Use `100dvh` (with a `100vh` fallback) for full-screen layouts so browser toolbars don't cut off the bottom, and respect `env(safe-area-inset-*)` paddings.
- Give every button a visible pressed state (e.g. `:active` scale/colour change) so children see that their tap registered.

### Audio on iOS and Android
- Audio and speech only work after a user gesture: call `speechSynthesis.speak()` / `audio.play()` for the first time **inside the tap handler** of the start button.
- On touch screens `pointerdown` does **not** count as a user gesture for unlocking audio; unlock (create/resume the `AudioContext`, speak a first utterance) from `click` or `touchend`. After that, sounds can play from any handler.
- All of this is handled by `Kit.speak()` / `Kit.sfx` in `shared/kit.js`; use them rather than calling the APIs directly. Known Safari pitfalls it works around:
  - Don't call `speechSynthesis.cancel()` and then `speak()` straight away: Safari drops the new utterance. Only cancel when something is actually speaking, and speak again after a short delay.
  - Don't pick "the first en-GB voice": iOS lists novelty voices that can sound odd or stay silent. Choose a known voice by name, or only set `utterance.lang` and let the device pick.
  - Tablets let their audio output fall asleep, cutting the start of words: `Kit.speak()` plays an inaudible 20 Hz signal and starts the word 150 ms later (a "space"). The first word after a tap is spoken immediately, inside the tap (iOS rule).
  - Silent mode mutes web audio on iPad; `navigator.audioSession.type = "playback"` (Safari 17+) lets it play.
- Voice and speed: chosen in ⚙️ Settings on the games list. `Kit.speak()` reads them every time it speaks, so changes apply at once (also after the Back button). Speeds: slow 0.6×, normal 0.8× (default), fast 1.0×. The voice list shows the device's British English voices (`en-GB`, also `en_GB`). "Default" = a known good British voice by name, otherwise the device's own voice with `lang = "en-GB"`; a saved voice that isn't on the device falls back to Default. Games never pass their own voice or rate; `Kit.speakWith({ voice, speed }, ...)` is only for the ▶ samples in Settings.
- To check audio on a new device, open `shared/audio-check.html` on it.
- `speechSynthesis.getVoices()` may be empty at first; listen for `voiceschanged`. Always set `utterance.lang` (e.g. `"en-GB"`).
- Don't assume a device has a particular voice installed; recorded audio files are the most reliable option when quality matters.
- Remember the iPad silent switch / volume may be off: a visual cue should accompany every sound.

## Audience and design guidelines

The players are 6 years old, are still learning to read (in any language), and do not speak English natively. Design for them first.

### Language
- Teach **one small vocabulary set per game** (about 5–12 words): colors, numbers 1–10, animals, fruits, body parts, family, clothes, weather, etc.
- Use simple, high-frequency, concrete words. Prefer nouns and simple verbs/adjectives that can be shown in a picture.
- Keep on-screen text minimal and in large type. Never rely on reading alone to understand what to do.
- Use correct, natural English. Pick one variant (default: British English spelling, e.g. "colour") and stay consistent within a game.

### Audio
- **Every word that is taught must be heard.** Use the Web Speech API (`speechSynthesis`) with an `en-GB` or `en-US` voice, or recorded audio files in `assets/audio/`.
- Speak words slowly (the default speed is 0.8×; grown-ups can change it in Settings) and let the child replay them by tapping.
- Browsers block audio until the user interacts, so start with a big "Play" / ▶ button.
- Provide a clearly visible mute button.

### Instructions
- Explain how to play with visuals, animation, and spoken instructions, not paragraphs of text.
- One simple task at a time. Show an example or demo round if the mechanic is new.

### Interaction and layout
- Large tap targets (at least ~64×64 px), generous spacing, no precision dragging or fast reflexes.
- No timers or countdowns that cause stress. If time is used, it should be generous and optional.
- Avoid scrolling during play; fit the game to the tablet screen (landscape first).
- Bright, friendly colours with good contrast. Don't use colour as the only cue except in colour-learning games, and even then pair it with the spoken word.
- Use emoji or simple SVG/CSS drawings for pictures when possible; they need no asset files and scale well.

### Feedback and motivation
- Positive, encouraging feedback for correct answers (sound, animation, stars, "Well done!").
- Wrong answers get gentle feedback ("Try again!"), never a harsh buzzer, punishment, or lost lives. Let the child retry until correct.
- Short sessions: a round should take roughly 1–3 minutes, ending with a celebration screen and a "Play again" button.
- Randomise order of questions/answers so replaying stays fresh.

### Content safety
- All content must be age-appropriate: no violence, scary imagery, or mature themes.
- No external links inside games (a child should not be able to leave the game by accident), except a "back to all games" link to the launcher.

## Code style

- Keep code simple and readable; prefer clarity over cleverness. Comments in English.
- Use `const`/`let`, no global variable soup: wrap a game in a function or object, or keep top-level state in one `state` object.
- Keep vocabulary data separate from logic (e.g. a `words` array at the top of `game.js`) so new words are easy to add.
- Use semantic HTML and `aria-label`s on icon-only buttons.
- 2-space indentation, double quotes in HTML, semicolons in JS.

## Testing a game

There is no automated test suite. Before considering a game done:
1. Serve the repo with `python3 serve.py` (like `python3 -m http.server`, but with browser caching turned off) and open `http://localhost:8000/<game-name>/`. Opening `<game-name>/index.html` directly also works for a quick look.
2. Play through a full round with the mouse, then with touch emulation in the browser dev tools at tablet sizes (e.g. iPad 1024×768 / 820×1180 and a typical Android tablet 1280×800), in landscape and portrait.
3. Whenever possible, test on a **real iPad and a real Android tablet** (run `python3 serve.py` and open the tablet address it prints, on the same Wi-Fi). Always use `serve.py` for this: with a plain server, Safari on iPad keeps old copies of the files and shows stale versions. Emulation doesn't catch audio, speech and touch quirks.
4. Check that every word is spoken, the mute button works, wrong answers can be retried, and the end screen and "Play again" work.
5. Check there is no accidental zoom, scroll, text selection or pull-to-refresh while playing.
6. Check the browser console has no errors.

## Adding a new game: checklist

- [ ] New `kebab-case` folder with `index.html`
- [ ] Clear learning goal and small word set
- [ ] Spoken audio for every taught word, plus a start button and mute button
- [ ] Fully playable by touch on iPad and Android tablets (no hover, no accidental zoom/scroll); also works with a mouse
- [ ] No build step, no network
- [ ] Gentle feedback, end-of-round celebration, "Play again"
- [ ] Linked from the root `index.html`
- [ ] Short `README.md` in the game folder: what it teaches, the word list, how to play
- [ ] Optional: `<template id="game-info">` with the rules, shown by the ℹ️ button

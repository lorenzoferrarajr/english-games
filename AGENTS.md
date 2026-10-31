# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository.

## Project overview

A collection of simple browser games that help **6-year-old children who are not native English speakers** learn English. Each game is a self-contained HTML + JavaScript application that runs directly in a web browser.

## Repository layout

Each game lives in its own folder at the repository root:

```
english-games/
├── AGENTS.md
├── index.html            # Optional launcher page linking to every game
└── <game-name>/          # kebab-case, e.g. animal-sounds, color-match
    ├── index.html        # Entry point; must open and work on its own
    ├── style.css         # Optional
    ├── game.js           # Optional; split into more files if it gets large
    └── assets/           # Optional: images/, audio/
```

Rules:
- Folder names are lowercase `kebab-case` and describe the game (`fruit-memory`, `count-the-stars`).
- Every game folder has an `index.html` entry point.
- Games are independent: no game imports files from another game's folder. If shared code becomes worthwhile, put it in a top-level `shared/` folder and reference it with relative paths.
- When adding a game, add a link to it in the root `index.html` launcher (create it if missing).

## Technical constraints

- **Plain HTML, CSS and JavaScript only.** No frameworks, no bundlers, no build step, no `npm install`. A game must work by opening its `index.html` in a browser.
- Prefer working from `file://`. Avoid ES module imports and `fetch()` of local files, which are blocked from `file://` in most browsers; use classic `<script src="...">` tags and keep word lists as JS arrays/objects instead of JSON files.
- No external network dependencies at runtime (no CDNs, remote fonts, analytics or trackers). Everything needed ships in the game folder.
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
- `speechSynthesis.getVoices()` may be empty at first; listen for `voiceschanged` and fall back to the default voice if no English voice is found. Always set `utterance.lang` (e.g. `"en-GB"`).
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
- Speak words slowly (`utterance.rate` around 0.8) and let the child replay them by tapping.
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
1. Open `<game-name>/index.html` directly in a browser (and/or serve the repo with `python3 -m http.server` and open `http://localhost:8000/<game-name>/`).
2. Play through a full round with the mouse, then with touch emulation in the browser dev tools at tablet sizes (e.g. iPad 1024×768 / 820×1180 and a typical Android tablet 1280×800), in landscape and portrait.
3. Whenever possible, test on a **real iPad and a real Android tablet** (serve with `python3 -m http.server` and open `http://<computer-ip>:8000/<game-name>/` on the same Wi-Fi). Emulation doesn't catch audio, speech and touch quirks.
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

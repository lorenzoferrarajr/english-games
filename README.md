# English Games

**▶ Play online: https://lorenzoferrarajr.github.io/english-games/**

Simple browser games that help young children (around 6 years old) who are not native English speakers learn their first English words. Every word is spoken aloud, so the games work even before children can read.

The games are made for **touch tablets** (iPad and Android) and also work on a computer. They need no installation, no account and no internet connection once loaded, and they collect no data.

## The games

| Game | What it teaches |
| --- | --- |
| [Number Words](number-words/) | How the numbers 1–10 are written: build each word from letter tiles |
| [Count and Match](count-and-match/) | Number words: connect each word to a card with that many things |
| [Halloween](halloween-words/) | Eight Halloween words: listen and tap the right picture |
| [Halloween Memory](halloween-memory/) | The same words, as a listening and memory game. Invented by Flora, 6 years old, from Italy |

Open `index.html` to see them all. In each game, the ℹ️ button shows the rules.

**⚙️ Settings** on the games page apply to every game and are remembered on each device:

- **Letters:** UPPERCASE (ABC) or lowercase (abc).
- **Speed:** slow, normal or fast speech.
- **Voice:** any British English voice the device has, or *Default*. Tap ▶ next to a voice to hear a sample. If a saved voice isn't available (another tablet, a system update), the games use Default.

## Running locally

```
python3 serve.py
```

Then open the address it prints, on the computer or on a tablet connected to the same Wi-Fi. (`serve.py` is a plain web server with browser caching turned off, so tablets always load the latest version.) For a quick look, you can also just open `index.html` in a browser.

There is no build step: everything is plain HTML, CSS and JavaScript. See [AGENTS.md](AGENTS.md) for how the project is organised and how to add a game.

## License

© 2026 Lorenzo Ferrara.

Free for **personal, family, classroom and other noncommercial use**. You may play, copy, share and adapt the games for those purposes. **Commercial use is not allowed** without permission; the author may offer commercial versions (for example a paid app).

- **Code** (HTML, CSS, JavaScript, Python): [PolyForm Noncommercial License 1.0.0](LICENSE.md)
- **Drawings and texts** (including the characters in `shared/halloween/characters.js`, the rules and the information texts): [Creative Commons Attribution-NonCommercial 4.0 International](LICENSE-CONTENT.txt). When you share or adapt them, credit "Lorenzo Ferrara" and, for Halloween Memory, its inventor "Flora, 6 years old, from Italy".

For commercial licensing, please get in touch through this repository.

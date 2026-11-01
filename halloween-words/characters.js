// Halloween characters: the words taught by this game and a friendly SVG drawing of each.
// All drawings use a 100x100 viewBox. Keep them cute, never scary.
window.CHARACTERS = (function () {
  "use strict";

  const OUTLINE = "#b9a6f0"; // light outline so dark shapes stand out on the night sky
  const DARK = "#2b2140";
  const BONE = "#f6f2e6";

  const svg = (inner) =>
    `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${inner}</svg>`;

  return [
    {
      word: "ghost",
      svg: svg(`
        <path d="M20 90 V46 A30 30 0 0 1 80 46 V90 Q75 80 70 90 Q65 80 60 90 Q55 80 50 90 Q45 80 40 90 Q35 80 30 90 Q25 80 20 90 Z"
              fill="#fbfaff" stroke="#d6cff2" stroke-width="2" stroke-linejoin="round"/>
        <ellipse cx="40" cy="48" rx="5" ry="7" fill="${DARK}"/>
        <ellipse cx="60" cy="48" rx="5" ry="7" fill="${DARK}"/>
        <circle cx="42" cy="45" r="1.6" fill="#fff"/>
        <circle cx="62" cy="45" r="1.6" fill="#fff"/>
        <ellipse cx="50" cy="64" rx="5" ry="6" fill="${DARK}"/>
        <circle cx="31" cy="58" r="4.5" fill="#ffb8cc"/>
        <circle cx="69" cy="58" r="4.5" fill="#ffb8cc"/>`),
    },
    {
      word: "bat",
      svg: svg(`
        <g fill="#2a1f45" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round">
          <path d="M38 50 Q20 30 3 40 Q10 49 7 58 Q16 53 20 62 Q26 55 30 66 Q34 59 39 62 Z"/>
          <path d="M62 50 Q80 30 97 40 Q90 49 93 58 Q84 53 80 62 Q74 55 70 66 Q66 59 61 62 Z"/>
          <path d="M39 44 L37 27 L47 37 Z"/>
          <path d="M61 44 L63 27 L53 37 Z"/>
          <ellipse cx="50" cy="55" rx="15" ry="18"/>
        </g>
        <circle cx="44" cy="51" r="5" fill="#fff"/>
        <circle cx="56" cy="51" r="5" fill="#fff"/>
        <circle cx="45" cy="52" r="2.3" fill="${DARK}"/>
        <circle cx="55" cy="52" r="2.3" fill="${DARK}"/>
        <path d="M44 61 Q50 66 56 61" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        <path d="M46 62.5 L47.5 67 L49 63.5 Z M51 63.5 L52.5 67 L54 62.5 Z" fill="#fff"/>`),
    },
    {
      word: "pumpkin",
      svg: svg(`
        <path d="M47 36 Q45 24 54 18 L58 22 Q52 27 54 36 Z" fill="#4f8a2b"/>
        <path d="M55 24 Q66 16 72 24 Q64 30 55 24 Z" fill="#6fb33f"/>
        <g stroke="#d4620a" stroke-width="2">
          <ellipse cx="33" cy="62" rx="21" ry="26" fill="#ff8c1a"/>
          <ellipse cx="67" cy="62" rx="21" ry="26" fill="#ff8c1a"/>
          <ellipse cx="50" cy="62" rx="22" ry="28" fill="#ffa033"/>
        </g>
        <path d="M33 57 L45 57 L39 47 Z M55 57 L67 57 L61 47 Z" fill="#5a2d00"/>
        <path d="M47 63 L53 63 L50 58 Z" fill="#5a2d00"/>
        <path d="M33 68 Q50 86 67 68 Q50 76 33 68 Z" fill="#5a2d00"/>
        <rect x="46" y="70.5" width="8" height="5" rx="1" fill="#ffa033"/>`),
    },
    {
      word: "witch",
      svg: svg(`
        <path d="M30 50 Q22 70 28 86 L38 72 Z M70 50 Q78 70 72 86 L62 72 Z" fill="#ff7a3d"/>
        <circle cx="50" cy="62" r="21" fill="#a8e690"/>
        <circle cx="42" cy="61" r="3.3" fill="${DARK}"/>
        <circle cx="58" cy="61" r="3.3" fill="${DARK}"/>
        <circle cx="50" cy="67" r="3" fill="#7cc95e"/>
        <circle cx="37" cy="68" r="3.5" fill="#ffb8cc" opacity="0.8"/>
        <circle cx="63" cy="68" r="3.5" fill="#ffb8cc" opacity="0.8"/>
        <path d="M42 73 Q50 79 58 73" fill="none" stroke="${DARK}" stroke-width="2.5" stroke-linecap="round"/>
        <g fill="#3b2766" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round">
          <path d="M31 45 L52 6 Q57 2 60 9 L69 45 Z"/>
          <ellipse cx="50" cy="45" rx="35" ry="7"/>
        </g>
        <rect x="33" y="35" width="34" height="6" fill="#9a4cf5"/>
        <rect x="46" y="33.5" width="8" height="9" rx="1.5" fill="none" stroke="#ffd84d" stroke-width="2"/>`),
    },
    {
      word: "cat",
      svg: svg(`
        <g fill="#1f1733" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round">
          <path d="M68 86 Q94 82 87 54 Q84 47 79 52 Q86 74 64 79 Z"/>
          <ellipse cx="50" cy="75" rx="22" ry="18"/>
          <ellipse cx="41" cy="91" rx="7" ry="4"/>
          <ellipse cx="59" cy="91" rx="7" ry="4"/>
          <path d="M33 38 L35 17 L47 29 Z"/>
          <path d="M67 38 L65 17 L53 29 Z"/>
          <circle cx="50" cy="45" r="19"/>
        </g>
        <path d="M37 32 L38 23 L43 29 Z M63 32 L62 23 L57 29 Z" fill="#ff9cb8"/>
        <ellipse cx="42.5" cy="44" rx="5" ry="6" fill="#ffd84d"/>
        <ellipse cx="57.5" cy="44" rx="5" ry="6" fill="#ffd84d"/>
        <ellipse cx="42.5" cy="44" rx="1.6" ry="4.5" fill="${DARK}"/>
        <ellipse cx="57.5" cy="44" rx="1.6" ry="4.5" fill="${DARK}"/>
        <path d="M47.5 51 L52.5 51 L50 54 Z" fill="#ff9cb8"/>
        <path d="M45.5 56 Q48 58.5 50 56 Q52 58.5 54.5 56" fill="none" stroke="${OUTLINE}" stroke-width="1.8" stroke-linecap="round"/>
        <g stroke="${OUTLINE}" stroke-width="1.5" stroke-linecap="round">
          <line x1="38" y1="52" x2="24" y2="49"/>
          <line x1="38" y1="55" x2="24" y2="58"/>
          <line x1="62" y1="52" x2="76" y2="49"/>
          <line x1="62" y1="55" x2="76" y2="58"/>
        </g>`),
    },
    {
      word: "skeleton",
      svg: svg(`
        <g fill="none" stroke="${BONE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="50" y1="34" x2="50" y2="68"/>
          <path d="M38 42 Q50 37 62 42"/>
          <path d="M39 49 Q50 44 61 49"/>
          <path d="M41 56 Q50 51 59 56"/>
          <path d="M39 40 L28 30 L21 18"/>
          <path d="M61 40 L71 53 L76 65"/>
          <path d="M45 71 L42 84 L39 94"/>
          <path d="M55 71 L58 84 L61 94"/>
        </g>
        <g fill="${BONE}">
          <ellipse cx="50" cy="70" rx="10" ry="5"/>
          <circle cx="28" cy="30" r="3"/>
          <circle cx="71" cy="53" r="3"/>
          <circle cx="42" cy="84" r="3"/>
          <circle cx="58" cy="84" r="3"/>
          <circle cx="20" cy="16" r="4"/>
          <circle cx="77" cy="67" r="4"/>
          <ellipse cx="36" cy="95" rx="5" ry="3"/>
          <ellipse cx="64" cy="95" rx="5" ry="3"/>
          <circle cx="50" cy="18" r="13"/>
          <rect x="42.5" y="24" width="15" height="10" rx="3"/>
        </g>
        <circle cx="45" cy="17" r="3.8" fill="${DARK}"/>
        <circle cx="55" cy="17" r="3.8" fill="${DARK}"/>
        <path d="M48.5 24 L51.5 24 L50 21.5 Z" fill="${DARK}"/>
        <path d="M44 28 Q50 32 56 28" fill="none" stroke="${DARK}" stroke-width="1.6" stroke-linecap="round"/>
        <g stroke="${DARK}" stroke-width="1.2">
          <line x1="47" y1="28.8" x2="47" y2="31.5"/>
          <line x1="50" y1="29.8" x2="50" y2="32.5"/>
          <line x1="53" y1="28.8" x2="53" y2="31.5"/>
        </g>`),
    },
    {
      word: "monster",
      svg: svg(`
        <path d="M32 38 L26 16 L42 31 Z M68 38 L74 16 L58 31 Z" fill="#ffd84d" stroke="#d9a400" stroke-width="2" stroke-linejoin="round"/>
        <g fill="none" stroke="#5cc25c" stroke-width="7" stroke-linecap="round">
          <path d="M24 60 Q11 60 12 72"/>
          <path d="M76 60 Q89 60 88 72"/>
        </g>
        <ellipse cx="38" cy="90" rx="9" ry="4.5" fill="#3f9e3f"/>
        <ellipse cx="62" cy="90" rx="9" ry="4.5" fill="#3f9e3f"/>
        <path d="M22 88 Q15 50 30 34 Q50 18 70 34 Q85 50 78 88 Z" fill="#6fd36f" stroke="#3f9e3f" stroke-width="2"/>
        <circle cx="30" cy="74" r="3.5" fill="#94e894"/>
        <circle cx="70" cy="78" r="4.5" fill="#94e894"/>
        <circle cx="66" cy="32" r="3" fill="#94e894"/>
        <circle cx="50" cy="48" r="13" fill="#fff" stroke="#3f9e3f" stroke-width="2"/>
        <circle cx="52" cy="49" r="6" fill="${DARK}"/>
        <circle cx="54.5" cy="46.5" r="2" fill="#fff"/>
        <path d="M35 66 Q50 82 65 66 Z" fill="${DARK}"/>
        <path d="M40 67 L43 72 L46 67.5 Z M54 67.5 L57 72 L60 67 Z" fill="#fff"/>`),
    },
  ];
})();

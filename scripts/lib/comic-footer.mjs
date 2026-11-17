// Doodle-crew footer: giant dry-brush ALPHA730 (glyph outlines + feTurbulence /
// feDisplacementMap) with a raven, a wolf pup, a hooded watchman and a small dragon
// sitting on the letters, drifting ink doodles, and a copyright bar.
// Shapes follow scripts/art/mockup/footer-mockup.html (792 x 222 letter space).
// Links inside an <img> are not clickable, so the real links live in README.md.
import { Type } from "./type.mjs";
import { C, docComic, panelBack, panelBorder } from "./comic.mjs";

const X0 = 4, W = 786, K = 778 / 792;
const LINED = "#f7f1df";

const DRY = `<filter id="dry" x="-5%" y="-5%" width="110%" height="110%">
<feTurbulence type="fractalNoise" baseFrequency="0.015 0.55" numOctaves="2" seed="4" result="n"/>
<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3 0 0 0 2.25" result="streak"/>
<feComposite in="SourceGraphic" in2="streak" operator="in" result="s"/>
<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="r"/>
<feDisplacementMap in="s" in2="r" scale="3.5"/>
</filter>
<pattern id="rule" width="8" height="28" patternUnits="userSpaceOnUse"><rect y="27" width="8" height="1" fill="#2f6f9a" fill-opacity=".16"/></pattern>`;

const DOODLES = `<g fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round">
<g transform="translate(110,6)"><path class="dr" d="M0 -7 V7 M-6 -4 L6 4 M-6 4 L6 -4"/></g>
<g transform="translate(250,14)"><path class="dr" style="animation-delay:2.2s" d="M0 0 C4 -5 10 -5 12 0 C10 5 4 5 0 0 Z" fill="${C.red}"/></g>
<g transform="translate(420,4)"><path class="dr" style="animation-delay:4.4s" d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z"/></g>
<g transform="translate(600,10)"><path class="dr" style="animation-delay:6.1s" d="M0 -7 V7 M-6 -4 L6 4 M-6 4 L6 -4"/></g>
<g transform="translate(690,2)"><path class="dr" style="animation-delay:8.3s" d="M0 0 C4 -5 10 -5 12 0 C10 5 4 5 0 0 Z" fill="${C.red}"/></g>
<g transform="translate(180,0)"><path class="dr" style="animation-delay:9.4s" d="M-8 6 L6 -8 M3 -8 H6 V-5 M-6 1 L-1 6"/></g>
<g transform="translate(330,8)"><path class="dr" style="animation-delay:5.3s" d="M0 -6 C3 -6 5 -3 5 0 C5 3 3 6 0 6 C3 4 3 -4 0 -6 Z"/></g>
</g>`;

const CREW = `<g transform="translate(66,82)"><g class="bob">
<path d="M-12 -10 L-28 -2 L-12 -20 Z" fill="${C.ink}"/>
<ellipse cx="0" cy="-16" rx="14" ry="12" fill="${C.ink}"/>
<circle cx="9" cy="-32" r="8" fill="${C.ink}"/>
<path d="M16 -34 L27 -30 L16 -27 Z" fill="${C.ink}"/>
<circle cx="11" cy="-34" r="1.8" fill="${C.red}"/>
<path d="M-3 -5 V0 M4 -5 V0" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
</g></g>
<g transform="translate(348,84)">
<path d="M14 -4 C30 -4 34 -18 26 -28 C28 -16 22 -11 14 -11" fill="#c9c2b0" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M-16 0 C-18 -20 -10 -34 0 -36 C10 -34 18 -20 16 0 Z" fill="#c9c2b0" stroke="${C.ink}" stroke-width="2.5"/>
<path d="M-8 -14 Q0 -8 8 -14" fill="none" stroke="${C.ink}" stroke-width="1.5"/>
<g class="bob">
<path d="M-12 -34 L-14 -54 L-5 -45 L5 -45 L14 -54 L12 -34 C10 -26 4 -22 0 -22 C-4 -22 -10 -26 -12 -34 Z" fill="#c9c2b0" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
<ellipse cx="0" cy="-28" rx="5.5" ry="4" fill="${LINED}" stroke="${C.ink}" stroke-width="2"/>
<circle cx="0" cy="-30" r="1.8" fill="${C.ink}"/>
<circle cx="-5" cy="-38" r="1.8" fill="${C.ink}"/><circle cx="5" cy="-38" r="1.8" fill="${C.ink}"/>
</g>
</g>
<g transform="translate(540,84)">
<circle class="gl" cx="23" cy="-12" r="14" fill="${C.yellow}" opacity="0.3"/>
<path d="M-14 0 C-16 -18 -12 -34 0 -42 C12 -34 16 -18 14 0 Z" fill="${C.ink}"/>
<ellipse cx="0" cy="-30" rx="5.5" ry="6.5" fill="${LINED}" stroke="${C.ink}" stroke-width="1.5"/>
<circle cx="-2" cy="-31" r="1.2" fill="${C.ink}"/><circle cx="2.4" cy="-31" r="1.2" fill="${C.ink}"/>
<path d="M8 -16 L19 -16" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
<rect x="18" y="-18" width="10" height="12" rx="2" fill="${C.yellow}" stroke="${C.ink}" stroke-width="2"/>
</g>
<g transform="translate(720,86)">
<path d="M-26 0 C-34 2 -40 -8 -31 -11" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
<path d="M-4 -20 L-14 -46 L2 -34 L8 -50 L12 -26 Z" fill="${C.blood}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M-26 0 C-28 -16 -12 -24 4 -20 C18 -17 26 -8 24 0 Z" fill="${C.red}" stroke="${C.ink}" stroke-width="2.5"/>
<path d="M-14 -4 v-4 M-4 -4 v-5 M6 -4 v-4" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"/>
<path d="M18 -12 C26 -22 34 -24 40 -18 L45 -16 L38 -10 C32 -8 26 -6 22 -4 Z" fill="${C.red}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
<circle cx="34" cy="-17" r="1.8" fill="${C.ink}"/>
<circle class="pf" cx="50" cy="-22" r="4" fill="${LINED}" stroke="${C.ink}" stroke-width="1.5"/>
<circle class="pf" cx="56" cy="-30" r="3" fill="${LINED}" stroke="${C.ink}" stroke-width="1.5" style="animation-delay:1.2s"/>
</g>`;

export function footer(cfg) {
  const T = new Type();
  const { person } = cfg;
  const top = 4, titleH = 58, artY = top + 4 + titleH, artH = 222 * K, barH = 50;
  const ph = 4 + titleH + artH + 6 + barH;
  const barY = top + ph - 4 - barH;

  // giant dry-brush letters, each glyph placed as in the mockup
  const letters = [...person.github.toUpperCase()]
    .map((ch, i) => T.text("bangers", ch, { x: 24 + i * 94, y: 206, size: 172, fill: C.ink, eff: K }))
    .join("");
  const art = `<g transform="translate(${X0 + 4} ${artY}) scale(${K.toFixed(6)})">${DOODLES}<g filter="url(#dry)">${letters}</g>${CREW}</g>`;

  const year = 2026;
  const body =
    panelBack(X0, top, W, ph, { fill: LINED }) +
    `<rect x="${X0}" y="${top}" width="${W}" height="${ph}" fill="url(#rule)"/>` +
    T.text("bangers", "SEND A RAVEN.", { x: X0 + 24, y: top + 48, size: 34, ls: 2 }) +
    art +
    `<rect x="${X0}" y="${barY}" width="${W}" height="${barH}" fill="${LINED}"/><rect x="${X0}" y="${barY}" width="${W}" height="3" fill="${C.ink}"/>` +
    T.text("comic", `© ${year} ${person.name}`, { x: X0 + 24, y: barY + 32, size: 14, cls: "wd" }) +
    T.text("comic", person.role, { x: X0 + W - 24, y: barY + 32, size: 14, anchor: "end", cls: "wd" }) +
    T.text("comic", `© ${year} ${person.name}`, { x: X0 + 24, y: barY + 37, size: 26, cls: "nw" }) +
    panelBorder(X0, top, W, ph);

  return docComic({
    w: 800, h: Math.ceil(top + ph + 6 + 4), type: T, defs: DRY,
    title: "Send a raven",
    desc: `Footer: Send a raven. The name ${person.github} in giant dry-brush ink letters, with a raven, a wolf pup, a hooded watchman with a lantern and a small dragon sitting on top of the letters, and ink doodles drifting down. © ${year} ${person.name}, ${person.role}.`,
    css: `.dr,.pf{transform-box:fill-box;transform-origin:center}`,
    mot:
      `@keyframes drift{0%{transform:translate(0,0) rotate(0deg);opacity:0}12%{opacity:1}100%{transform:translate(-20px,210px) rotate(160deg);opacity:0}}.dr{animation:drift 11s linear infinite}` +
      `@keyframes bob{50%{transform:translateY(-4px)}}.bob{animation:bob 2.8s ease-in-out infinite}` +
      `@keyframes glow{50%{opacity:.08}}.gl{animation:glow 1.8s ease-in-out infinite}` +
      `@keyframes puff{0%{transform:translate(0,0);opacity:.9}100%{transform:translate(10px,-18px);opacity:0}}.pf{animation:puff 2.4s ease-out infinite}`,
    body,
  });
}

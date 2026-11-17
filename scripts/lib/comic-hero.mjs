// Hero: black cover strip + splash panel (pixel-art heart tree) with comic overlays.
// Overlay coordinates follow scripts/art/mockup/main-mockup.html (792 x 432 panel space).
import { fileURLToPath } from "node:url";
import { Type } from "./type.mjs";
import { C, docComic, panelBack, panelBorder, pixelImage, caption, cyc } from "./comic.mjs";

const PIXEL = (f) => fileURLToPath(new URL(`../art/pixel/${f}`, import.meta.url));
const W = 800, X0 = 4, CW = 786; // content width; +6 shadow +4 margin = 800
const K = 778 / 792; // mockup panel space -> SVG units
export const BP = 600; // narrow layout below this displayed width

// Red leaves falling from the heart-tree crown: [x, y, delay s, colour].
const LEAVES = [
  [520, 120, 0, C.red], [600, 40, 1.1, C.blood], [700, 90, 2.0, C.red], [760, 160, 3.1, C.blood], [480, 200, 4.0, C.red],
  [650, 180, 5.2, C.red], [560, 70, 6.1, C.blood], [730, 30, 7.0, C.red], [620, 230, 7.9, C.blood], [500, 150, 8.5, C.red],
];
const FALL = 9, POP = 1.8;

// t = null: animated (CSS). t = seconds: that instant as a static frame (filmstrip).
export function heroSvg(person, { t = null } = {}) {
  const T = new Type();
  const eff = K; // overlay text is scaled by K
  let o = ""; // overlay, in mockup panel coords

  // caption: MEANWHILE, IN THE NORTH...
  o += caption(T, ["MEANWHILE, IN THE NORTH..."], { x: 18, y: 18, size: 15, eff, cls: "wd" }).svg;
  o += caption(T, ["MEANWHILE,", "IN THE NORTH..."], { x: 18, y: 14, size: 25.5, eff, cls: "nw" }).svg;

  // "@alpha730" speech bubble, tail pointing at the raven over the moon
  const bubble =
    `<path d="M362 64 L420 78 L380 60 Z" fill="#ffffff" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>` +
    `<ellipse cx="336" cy="46" rx="70" ry="26" fill="#ffffff" stroke="${C.ink}" stroke-width="3"/>` +
    `<path d="M365 62 L414 76 L378 59 Z" fill="#ffffff"/>` +
    T.text("bangers", `@${person.github}`, { x: 336, y: 55, size: 26, ls: 1, anchor: "middle", eff });
  if (t === null) o += `<g class="pop">${bubble}</g>`;
  else {
    const p = cyc(t, 0, POP), s = 1 + 0.05 * (1 - Math.cos(2 * Math.PI * p));
    o += `<g transform="translate(343 49) scale(${s.toFixed(4)}) translate(-343 -49)">${bubble}</g>`;
  }

  // ARYAN / KUMAR: yellow Bangers, black stroke, red offset shadow
  const [first, last] = person.name.toUpperCase().split(" ");
  for (const [word, y] of [[first, 214], [last, 318]]) {
    o += T.text("bangers", word, { x: 48, y: y + 8, size: 112, ls: 3, fill: C.red, stroke: C.ink, sw: 8, eff });
    o += T.text("bangers", word, { x: 40, y, size: 112, ls: 3, fill: C.yellow, stroke: C.ink, sw: 8, eff });
  }

  // role caption (wide: as the mockup; narrow: larger, so >= 10px at 330px)
  const role = person.role.toUpperCase().split(" · ");
  const roleLines = [`${role[0]} · ${role[1]}`, role.slice(2).join(" · ")];
  o += caption(T, roleLines, { x: 18, y: 346, size: 16, lineH: 22, eff, cls: "wd" }).svg;
  o += caption(T, roleLines, { x: 14, y: 334, size: 25.5, lineH: 33, eff, cls: "nw" }).svg;

  // falling leaves
  for (const [x, y, delay, fill] of LEAVES) {
    const leaf = `<g transform="scale(1.6)"><use href="#leaf" fill="${fill}" stroke="${C.ink}" stroke-width="0.8"/></g>`;
    if (t === null) o += `<g transform="translate(${x} ${y})"><g class="lf" style="animation-delay:${delay}s">${leaf}</g></g>`;
    else {
      const p = cyc(t, delay, FALL);
      const op = p < 0.1 ? p / 0.1 : 1 - (p - 0.1) / 0.9;
      o += `<g transform="translate(${(x - 34 * p).toFixed(1)} ${(y + 240 * p).toFixed(1)}) rotate(${(220 * p).toFixed(1)} 9.6 0)" opacity="${op.toFixed(3)}">${leaf}</g>`;
    }
  }

  // cover strip
  const strip =
    panelBack(X0, 4, CW, 48, { fill: C.ink, shadow: C.red }) +
    T.text("bangers", "THE NORTHERN REALM", { x: X0 + 18, y: 39, size: 28, ls: 2, fill: C.yellow }) +
    T.text("bangers", `ISSUE 01 · @${person.github.toUpperCase()}`, { x: X0 + CW - 18, y: 37, size: 20, ls: 1.5, fill: C.paper, anchor: "end", cls: "wd" }) +
    T.text("bangers", `ISSUE 01 · @${person.github.toUpperCase()}`, { x: X0 + CW - 16, y: 40, size: 25.5, ls: 1, fill: C.paper, anchor: "end", cls: "nw" });

  // splash panel
  const py = 68, ph = 4 + 432 * K + 4;
  const panel =
    panelBack(X0, py, CW, ph, { fill: "#1c2633" }) +
    pixelImage(PIXEL("hero.png"), X0 + 4, py + 4, 778, 432 * K) +
    `<g transform="translate(${X0 + 4} ${py + 4}) scale(${K.toFixed(6)})">${o}</g>` +
    panelBorder(X0, py, CW, ph);

  const H = Math.ceil(py + ph + 6 + 4);
  return docComic({
    w: W, h: H, bp: BP, type: T,
    title: `${person.name}, the northern realm`,
    desc: `Comic cover, The Northern Realm, issue 01, @${person.github}. Splash panel in pixel art: a pale heart tree with blood-red leaves and a carved face in the snow, a raven crossing the moon. Caption: Meanwhile, in the north... A speech bubble from the raven says @${person.github}. ${person.name} in big yellow letters, and the caption ${person.role}.`,
    css: `.lf,.pop{transform-box:fill-box;transform-origin:center}`,
    mot:
      `@keyframes fall{0%{transform:translate(0,0) rotate(0deg);opacity:0}10%{opacity:1}100%{transform:translate(-34px,240px) rotate(220deg);opacity:0}}` +
      `.lf{animation:fall ${FALL}s linear infinite}` +
      `@keyframes pop{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}.pop{animation:pop ${POP}s ease-in-out infinite}`,
    body: strip + panel,
  });
}

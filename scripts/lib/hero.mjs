// Hero banner: dithered ASCII weirwood heart tree + raven, pulsing from the heart.
import { docInk, esc } from "./svg.mjs";
import { Canvas, rng, expand, fitTree, rowSvg, dividerRows, cellsOf, radialPulse, artRows, flipbook } from "./ascii.mjs";

const W = 800, H = 330;
const C = 60, R = 24, CW = 6, CH = 10; // art grid: 360 x 240 px
const AX = 436, AY = 14; // art origin inside the banner
export const FRAMES = 10, PERIOD = 14; // seconds per full pulse

function scene() {
  const cv = new Canvas(C * CW, R * CH);
  const rnd = rng(730);
  const groundY = 226;

  // pale moon, low on the left of the art panel
  cv.disc("ink", 52, 128, 44, 0.78);

  // weirwood: thick pale trunk from a stochastic L-system
  const str = expand("FFA", { A: ["F[+A][-A]", "F[-A]F[+A]A", "F[+A][-A]FA"] }, 4, rnd);
  const tree = fitTree(cv, 731, str,
    { trunk: 42, taper: 0.66, len: 21, lenDecay: 0.8, angle: [26, 42], up: 0.1, v: 0.8, minW: 7 },
    { x: 214, y: groundY, w: 270, h: 196 });

  // root flare
  for (const [dx, w] of [[-46, 12], [-24, 14], [26, 14], [48, 10]]) cv.line("ink", 214, groundY - 18, 214 + dx, groundY + 6, w, 5, 0.8);

  // blood-red leaves clustered on the tips
  for (const t of tree.tips) {
    const n = 5 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * 16;
      cv.disc("red", t.x + Math.cos(a) * d, t.y + Math.sin(a) * d * 0.8, 4 + rnd() * 4, 0.5 + rnd() * 0.45);
    }
  }

  // ground mound with fallen leaves
  for (let x = 0; x < cv.w; x++) {
    const gy = groundY + 3 * Math.sin(x * 0.045) + 2 * Math.sin(x * 0.13 + 1);
    const fall = 1 - Math.abs(x - 214) / 260;
    for (let y = Math.floor(gy); y < cv.h; y++) cv.put(cv.ink, x, y, 1, 0.18 + 0.32 * Math.max(0, fall));
  }
  for (let i = 0; i < 14; i++) cv.disc("red", 214 + (rnd() - 0.5) * 260, groundY + 4 + rnd() * 8, 3 + rnd() * 2, 0.75);

  // heart-tree face carved into the trunk: slanted eyes, open mouth, sap tears
  const hx = 214, hy = groundY - 62;
  cv.line("red", hx - 15, hy - 5, hx - 4, hy + 2, 8, 6, 1);
  cv.line("red", hx + 15, hy - 5, hx + 4, hy + 2, 8, 6, 1);
  cv.ellipse("red", hx, hy + 26, 5, 8, 0, 1);
  cv.line("red", hx - 10, hy + 4, hx - 12, hy + 42, 5, 3, 0.75);
  cv.line("red", hx + 10, hy + 4, hx + 12, hy + 36, 5, 3, 0.75);

  // raven crossing the moon (cut out of the moonlight)
  const rv = (pts, ox = 56, oy = 134) => pts.map(([x, y]) => [ox + x * 1.6, oy + y * 1.6]);
  cv.carve(rv([[-12, 2], [-4, -2], [6, -3], [12, -6], [17, -5], [24, -3], [17, -1], [12, 2], [2, 5], [-8, 6], [-26, 9], [-24, 4]]));
  cv.carve(rv([[-6, 0], [-14, -22], [-4, -20], [8, -4]]));
  cv.carve(rv([[0, 3], [-6, 18], [6, 12], [10, 2]]));

  return { values: cellsOf(cv, C, R, CW, CH), heart: { x: hx, y: hy } };
}

// frame: null -> animated (all frames); number -> that single frame, static.
export function heroSvg({ name, github, role }, { frame = null } = {}) {
  const sc = scene();
  const pulse = radialPulse({
    ...sc.heart, cw: CW, ch: CH, frames: FRAMES,
    mist: (w, c, r) => (r > R - 8 ? 0.035 * w * w : 0), // faint mist ring travelling outward
  });
  const art = flipbook({ id: "fh", frames: FRAMES, period: PERIOD, only: frame, render: (k) => artRows(sc.values, C, R, CW, CH, pulse(k)) });
  const div = dividerRows(Math.floor((W - 48) / CW), 1, 11)
    .map((row) => rowSvg(row, 24, 266, CW))
    .join("");
  const parts = role.split("·").map((p) => esc(p.trim()));
  const sep = '<tspan class="rd"> · </tspan>';
  // Wide: one 24px line. Narrow (<=520px shown): two 28px lines, so it stays >=10px on phones.
  const body = `
<g transform="translate(${AX} ${AY})" class="ink" font-size="10" xml:space="preserve">${art.svg}</g>
<text x="30" y="118" font-size="60" class="ink b" textLength="396" lengthAdjust="spacing">${esc(name.toUpperCase())}</text>
<circle cx="40" cy="152" r="7" class="rd led"/>
<text x="58" y="161" font-size="28" class="ink">@${esc(github)}</text>
<g class="mu wd" font-size="10" xml:space="preserve">${div}</g>
<text x="40" y="306" font-size="24" class="ink wd" xml:space="preserve">${parts.join(sep)}</text>
<text x="34" y="288" font-size="28" class="ink nw" xml:space="preserve">${parts.slice(0, 2).join(sep)}${sep}</text>
<text x="34" y="322" font-size="28" class="ink nw" xml:space="preserve">${parts.slice(2).join(sep)}</text>`;
  return docInk({
    w: W, h: H, round: 10,
    title: `${name} — the heart tree`,
    desc: `ASCII-art weirwood heart tree with blood-red leaves and a raven crossing the moon, beside the name ${name}, GitHub @${github}, and the line: ${role}.`,
    css: art.css,
    mot: art.mot,
    body,
  });
}

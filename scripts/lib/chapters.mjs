// "The Realm": an overview map of the four projects and one illustrated chapter per
// project. Every visible word is a fact from profile.config.json (or a project name).
// All real text is >= 26px on these 800-wide panels, so it stays >= 10px at 330px.
import { docInk, esc, dot } from "./svg.mjs";
import { Canvas, rng, cellsOf, artRows, radialPulse, flipbook, rowSvg } from "./ascii.mjs";
import { dragon, flyingRaven, field } from "./emblems.mjs";

const W = 800, T = 26;
const head = (t) => `<text x="24" y="48" font-size="28" letter-spacing="1.5" class="ink b">${esc(t)}</text>${dot(772, 38, 6)}`;
const txt = (x, y, s, { size = T, cls = "ink", anchor = "" } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" class="${cls}"${anchor ? ` text-anchor="${anchor}"` : ""}>${esc(s)}</text>`;
const artG = (x, y, inner) => `<g transform="translate(${x} ${y})" class="ink" font-size="10" xml:space="preserve">${inner}</g>`;
const merge = (...fbs) => ({ css: fbs.map((f) => f.css).join(""), mot: fbs.map((f) => f.mot).join("") });

// Pulsing ASCII art from a canvas, as a flipbook.
function pulsing(cv, C, R, center, id, frames = 6, period = 9, lambda = 110) {
  const values = cellsOf(cv, C, R, 6, 10);
  const pulse = radialPulse({ ...center, cw: 6, ch: 10, frames, lambda });
  return flipbook({ id, frames, period, render: (k) => artRows(values, C, R, 6, 10, pulse(k)) });
}

// ---------- The Realm: overview map ----------
function keep(cx, top) {
  const x = cx - 20;
  return `<g class="ink"><path d="M${x} ${top + 14}h6v-6h6v6h4v-6h8v6h4v-6h6v6h6v26h-40z"/></g>
<path d="M${x + 14} ${top + 40}v-10a6 6 0 0 1 12 0v10z" class="bg"/>
<line x1="${cx}" y1="${top + 8}" x2="${cx}" y2="${top - 12}" class="s-ink" stroke-width="1.5"/>
<path d="M${cx} ${top - 12}l14 4l-14 4z" class="rd led"/>`;
}
function plate(cx, y, w, h) {
  return `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="4" class="bg" opacity=".88"/>`;
}

export function realm(cfg) {
  const H = 410;
  const cv = new Canvas(798, 340);
  const nCoast = (x) => 128 + 9 * Math.sin(x * 0.021) + 6 * Math.sin(x * 0.067 + 1);
  const sCoast = (x) => 186 + 8 * Math.sin(x * 0.026 + 2) + 5 * Math.sin(x * 0.091);
  const grain = (x, y) => 0.5 + 0.25 * Math.sin(x * 0.05 + y * 0.03) + 0.25 * Math.sin(x * 0.013 - y * 0.07 + 2);
  field(cv, "ink", 0, 0, 798, 340, (x, y) => {
    const nc = nCoast(x), sc = sCoast(x);
    if (y < nc) return nc - y < 5 ? 0.5 : 0.1 + 0.14 * grain(x, y);
    if (y > sc) return y - sc < 5 ? 0.5 : 0.1 + 0.14 * grain(x, y);
    return 0.07 * (0.5 + 0.5 * Math.sin(x * 0.09 + y * 0.45)); // sea swell
  });
  const map = pulsing(cv, 133, 34, { x: 400, y: 160 }, "fm", 6, 12, 260);
  const raven = flipbook({
    id: "fr", frames: 4, period: 2.4,
    render: (k) => artRows(flyingRaven(k % 2).values, 26, 7, 6, 10),
  });
  const keeps = [
    { cx: 200, top: 86, ny: 170, fy: 200 },
    { cx: 600, top: 86, ny: 170, fy: 200 },
    { cx: 200, top: 270, ny: 352, fy: 382 },
    { cx: 600, top: 270, ny: 352, fy: 382 },
  ];

  let body = head("THE REALM · FOUR KEEPS") + artG(1, 62, map.svg) + artG(342, 186, raven.svg);
  // roads: only stacks two projects really share
  body += `<path d="M236 108Q400 84 564 108" fill="none" class="s-ink" stroke-width="2" stroke-dasharray="7 6" opacity=".8"/>
${plate(400, 78, 186, 36)}${txt(400, 105, "LangGraph", { anchor: "middle" })}
<path d="M236 292Q400 268 564 292" fill="none" class="s-ink" stroke-width="2" stroke-dasharray="7 6" opacity=".8"/>
${plate(400, 262, 202, 36)}${txt(400, 289, "TypeScript", { anchor: "middle" })}`;
  keeps.forEach((k, i) => {
    const m = cfg.missions[i];
    body += keep(k.cx, k.top) + plate(k.cx, k.ny - 28, 340, 68);
    body += txt(k.cx, k.ny, m.banner.toUpperCase(), { anchor: "middle", cls: "ink b" });
    body += txt(k.cx, k.fy, m.keyFact, { anchor: "middle", cls: "mu" });
  });
  const fb = merge(map, raven);
  return docInk({
    w: W, h: H, round: 8,
    title: "The Realm: four keeps",
    desc:
      "A dithered ASCII map of four project keeps. I, The Wall: 0 of 600 attacked runs led to a harmful action. II, The Raven's Eye: SAR and optical imagery with visual question answering. " +
      "A LangGraph road joins them. III, The Horn: 139 automated tests. IV, Dragonfire: played on Oct 22, 2026. A TypeScript road joins those two. A raven crosses the sea between.",
    css: fb.css, mot: fb.mot, body,
  });
}

// ---------- I · The Wall: 600 arrows, none through ----------
export function chapterWall(m) {
  const H = 320, COLS = 40, ROWS = 15; // 40 x 15 = 600 arrows, one per attacked run
  const arrows = flipbook({
    id: "fa", frames: 6, period: 3,
    render: (k) => {
      let s = "";
      for (let r = 0; r < ROWS; r++) {
        let chars = "";
        for (let c = 0; c < COLS; c++) chars += Math.sin((c - k * 2 + r * 0.7) * 0.5) > 0.6 ? "=" : ">";
        s += rowSvg({ chars, red: new Array(COLS).fill(false) }, 0, (r + 1) * 10 - 2, 6);
      }
      return s;
    },
  });
  const cv = new Canvas(156, 150);
  const rnd = rng(11);
  field(cv, "ink", 6, 0, 42, 150, (x, y) => {
    const row = Math.floor(y / 12);
    return y % 12 < 2 || (x + (row % 2) * 9) % 18 < 2 ? 0.3 : 0.8;
  });
  for (let r = 0; r < 15; r += 2) cv.disc("red", 4, r * 10 + 5 + (rnd() - 0.5) * 4, 4.5, 0.95);
  field(cv, "ink", 80, 64, 120, 150, () => 0.74);
  for (let x = 76; x < 124; x += 10) field(cv, "ink", x, 54, x + 6, 64, () => 0.8);
  cv.disc("red", 100, 88, 5, 1);
  const wall = pulsing(cv, 26, 15, { x: 4, y: 75 }, "fw", 6, 6, 90);
  const body = `${head(m.banner)}
${artG(24, 70, arrows.svg)}${artG(270, 70, wall.svg)}
${txt(440, 132, "0/600", { size: 72, cls: "rd b" })}
${txt(440, 172, "attacked runs led to")}
${txt(440, 204, "a harmful action")}
${txt(440, 258, "96.5-100%", { size: 40, cls: "ink b" })}
${txt(440, 292, "task success", { cls: "mu" })}
${txt(24, 256, "600 ATTACKED · 0 THROUGH", { cls: "mu" })}
${txt(24, 292, "5 STYLES · 2 DEFENSES", { cls: "mu" })}`;
  const fb = merge(arrows, wall);
  return docInk({
    w: W, h: H, round: 8,
    title: `${m.banner}: ${m.title}`,
    desc: `600 ASCII arrows, one per attacked run, strike a wall and none get through: ${m.result} 5 injection styles, 2 defenses.`,
    css: fb.css, mot: fb.mot, body,
  });
}

// ---------- II · The Raven's Eye: SAR + optical -> the raven's eye ----------
export function chapterRaven(m) {
  const H = 320;
  const cv = new Canvas(552, 150);
  const rnd = rng(22);
  for (let by = 0; by < 120; by += 4)
    for (let bx = 0; bx < 150; bx += 4) {
      const v = 0.12 + 0.75 * rnd() ** 1.6; // SAR-like speckle
      field(cv, "ink", bx, by, bx + 4, by + 4, () => v);
    }
  for (let gy = 0; gy < 4; gy++)
    for (let gx = 0; gx < 5; gx++) {
      const x = 200 + gx * 30, y = gy * 30, hot = gx === 3 && gy === 1;
      const v = [0.16, 0.36, 0.56, 0.76][Math.floor(rnd() * 4)];
      field(cv, hot ? "red" : "ink", x, y, x + 26, y + 26, () => (hot ? 0.95 : v));
    }
  cv.line("ink", 362, 60, 398, 60, 4, 4, 0.85);
  cv.poly("ink", [[398, 50], [412, 60], [398, 70]], 0.9);
  const sh = (pts) => pts.map(([x, y]) => [x + 398, y + 14]);
  cv.poly("ink", sh([[30, 90], [20, 60], [36, 32], [60, 22], [84, 26], [98, 34], [150, 46], [96, 52], [86, 66], [92, 90]]), 0.82);
  cv.disc("red", 74 + 398, 36 + 14, 7, 1);
  const art = pulsing(cv, 92, 15, { x: 472, y: 50 }, "fe", 6, 9, 150);
  const body = `${head(m.banner)}
${artG(24, 66, art.svg)}
${txt(184, 140, "+", { size: 40, cls: "mu b" })}
${txt(24, 222, "SAR")}${txt(224, 222, "OPTICAL")}
${txt(600, 134, "VQA", { size: 72, cls: "ink b" })}
${txt(600, 176, "visual", { cls: "mu" })}${txt(600, 208, "question", { cls: "mu" })}${txt(600, 240, "answering", { cls: "mu" })}
${txt(24, 292, "AGENTIC EARTH OBSERVATION", { cls: "mu" })}`;
  return docInk({
    w: W, h: H, round: 8,
    title: `${m.banner}: ${m.title}`,
    desc: `A SAR speckle tile and an optical field tile feed a raven's red eye: ${m.description}`,
    css: art.css, mot: art.mot, body,
  });
}

// ---------- III · The Horn: three voices -> one record; 139 tally marks ----------
export function chapterHorn(m) {
  const H = 310, langs = ["HINDI", "ENGLISH", "MARWARI"];
  const waves = flipbook({
    id: "fv", frames: 6, period: 2.4,
    render: (k) => {
      const cv = new Canvas(180, 110);
      langs.forEach((_, i) => {
        const cy = i * 40 + 15;
        for (let x = 2; x < 178; x += 4) {
          const env = 0.35 + 0.65 * Math.abs(Math.sin(x * 0.045 + i * 1.7));
          const a = 13 * env * (0.45 + 0.55 * Math.abs(Math.sin(x * 0.6 + k * 1.05 + i)));
          cv.line("ink", x, cy - a, x, cy + a, 3, 3, 0.85);
        }
      });
      return artRows(cellsOf(cv, 30, 11, 6, 10), 30, 11, 6, 10);
    },
  });
  const sc = new Canvas(84, 120);
  field(sc, "ink", 10, 12, 74, 108, (x, y) => ((y - 12) % 12 < 3 ? 0.22 : 0.62));
  sc.ellipse("ink", 42, 12, 36, 7, 0, 0.82);
  sc.ellipse("ink", 42, 108, 36, 7, 0, 0.82);
  sc.disc("red", 62, 94, 9, 1);
  const scroll = pulsing(sc, 14, 12, { x: 62, y: 94 }, "fs", 6, 9, 80);
  let tally = "";
  for (let g = 0; g < 28; g++) {
    const gx = 506 + (g % 7) * 38, gy = 62 + Math.floor(g / 7) * 46;
    const n = g < 27 ? 5 : 4; // 27 x 5 + 4 = 139
    for (let j = 0; j < Math.min(n, 4); j++) tally += `<line x1="${gx + j * 6}" y1="${gy}" x2="${gx + j * 6}" y2="${gy + 34}"/>`;
    if (n === 5) tally += `<line x1="${gx - 4}" y1="${gy + 29}" x2="${gx + 22}" y2="${gy + 5}"/>`;
  }
  const body = `${head(m.banner)}
${langs.map((l, i) => txt(24, 66 + i * 40 + 24, l)).join("")}
${artG(160, 66, waves.svg)}
${txt(352, 134, "→", { size: 40, cls: "mu b" })}
${artG(400, 58, scroll.svg)}
<g class="s-ink" stroke-width="2.2" stroke-linecap="round">${tally}</g>
${txt(24, 236, "VOICE → HEALTH RECORD")}
${txt(24, 272, "IMNCI TRIAGE · SOURCE-CITED", { cls: "mu" })}
${txt(506, 286, "139", { size: 48, cls: "rd b" })}${txt(606, 286, "TESTS", { cls: "mu" })}`;
  const fb = merge(waves, scroll);
  return docInk({
    w: W, h: H, round: 8,
    title: `${m.banner}: ${m.title}`,
    desc: `Speech waves in Hindi, English and Marwari flow into a sealed scroll, a structured health record, beside 139 tally marks for ${m.result}. IMNCI triage with a source-cited rules engine.`,
    css: fb.css, mot: fb.mot, body,
  });
}

// ---------- IV · Dragonfire: the dragon in an AR viewfinder; streak flames ----------
export function chapterDragon(m) {
  const H = 320;
  const d = dragon();
  const pulse = radialPulse({ ...d.center, cw: 6, ch: 10, frames: 6, lambda: 120 });
  const dfb = flipbook({ id: "fd", frames: 6, period: 9, render: (k) => artRows(d.values, d.C, d.R, 6, 10, pulse(k)) });
  const flames = flipbook({
    id: "ff", frames: 6, period: 1.8,
    render: (k) => {
      const cv = new Canvas(300, 80);
      const rnd = rng(500 + k);
      for (let i = 0; i < 5; i++) {
        const cx = 28 + i * 60, h = 26 + i * 11 + (rnd() - 0.5) * 6, w = 9 + i * 1.6;
        cv.ellipse("red", cx, 78 - w, w, w, 0, 0.95);
        cv.poly("red", [[cx - w, 78 - w], [cx + (rnd() - 0.5) * 6, 78 - h - w], [cx + w, 78 - w]], 0.85);
      }
      return artRows(cellsOf(cv, 50, 8, 6, 10), 50, 8, 6, 10);
    },
  });
  const corner = (x, y, dx, dy) => `<path d="M${x} ${y + dy * 22}V${y}H${x + dx * 22}" fill="none" class="s-rd" stroke-width="3"/>`;
  const body = `${head(m.banner)}
<rect x="24.5" y="66.5" width="380" height="160" rx="4" fill="none" class="s-ink" opacity=".3"/>
${corner(30, 72, 1, 1)}${corner(398, 72, -1, 1)}${corner(30, 220, 1, -1)}${corner(398, 220, -1, -1)}
${artG(34, 100, dfb.svg)}
<rect class="rd scanl" x="34" y="145" width="360" height="2" opacity=".75"/>
${txt(24, 262, "SCAN POSTERS · CATCH LINGOS")}
${txt(452, 96, "LEVELS & STREAKS", { cls: "ink b" })}
${artG(452, 108, flames.svg)}
${txt(452, 236, "OCT 22, 2026", { size: 40, cls: "ink b" })}
${txt(452, 270, "PLAYED AT A", { cls: "mu" })}${txt(452, 300, "CAMPUS EVENT", { cls: "mu" })}`;
  return docInk({
    w: W, h: H, round: 8,
    title: `${m.banner}: ${m.title}`,
    desc: `A dragon caught in an AR viewfinder with a red scan line, beside five growing streak flames. ${m.description} ${m.result}.`,
    css: dfb.css + flames.css,
    mot: dfb.mot + flames.mot + `@keyframes sc{0%{transform:translateY(-72px)}100%{transform:translateY(72px)}}.scanl{animation:sc 3.2s ease-in-out infinite alternate}`,
    body,
  });
}

// "THE FOUR CHAPTERS" title, the four chapter cards, and the Maester's Chain.
// Card overlays follow scripts/art/mockup/main-mockup.html (384 x 236 image space).
import { fileURLToPath } from "node:url";
import { Type } from "./type.mjs";
import { C, docComic, panelBack, panelBorder, pixelImage, burst } from "./comic.mjs";

const PIXEL = (f) => fileURLToPath(new URL(`../art/pixel/${f}`, import.meta.url));
const POP = 1.8;
const POP_CSS = `.pop{transform-box:fill-box;transform-origin:center}`;
const POP_MOT = `@keyframes pop{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}.pop{animation:pop ${POP}s ease-in-out infinite}`;

// Wrap `text` to lines no wider than `max` px.
function wrapPx(T, font, text, size, max, ls = 0) {
  const lines = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (line && T.width(font, next, size, ls) > max) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// ---------- THE FOUR CHAPTERS ----------
export function chaptersTitle() {
  const T = new Type();
  const w = 800, h = 66, t = "THE FOUR CHAPTERS";
  const o = { x: w / 2, y: 50, size: 40, ls: 3, anchor: "middle" };
  const body =
    T.text("bangers", t, { ...o, x: o.x + 4, y: o.y + 4, fill: C.ink, stroke: C.ink, sw: 4 }) +
    T.text("bangers", t, { ...o, fill: C.yellow, stroke: C.ink, sw: 4 });
  return docComic({ w, h, type: T, title: "The four chapters", desc: "Section title in comic lettering: The Four Chapters.", body });
}

// ---------- chapter cards (392 card + 6 shadow; README shows them 392 wide) ----------
const CW = 392, CH = 380, IW = 384, IH = 236;

// Yellow title badge, sized to its text, in image space.
const badge = (T, label) => {
  const w = Math.ceil(T.width("bangers", label, 21, 1) + 22);
  return `<rect x="8" y="8" width="${w}" height="30" fill="${C.yellow}" stroke="${C.ink}" stroke-width="3"/>` + T.text("bangers", label, { x: 18, y: 31, size: 21, ls: 1 });
};
// Sound effect, rotated, popping.
const sfx = (T, word, x, y, rot, fill) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})"><g class="pop">${T.text("bangers", word, { size: 40, ls: 2, anchor: "middle", fill, stroke: C.ink, sw: 6 })}</g></g>`;
const big = (T, s, x, y, size) => T.text("bangers", s, { x, y, size, ls: 1, anchor: "middle", fill: C.red, stroke: C.ink, sw: 4 });
const small = (T, s, x, y) => T.text("bangers", s, { x, y, size: 15, ls: 1, anchor: "middle" });

// Per-chapter overlays. Bursts and SFX are placed clear of the key art:
// wall arrows (x 100-230), raven head (x 220-300), wax seal (x 240-283), dragon head (x 200-235, y 70-95).
const OVERLAYS = [
  (T, m) => badge(T, m.banner) + sfx(T, "THUNK!", 300, 78, -10, C.red) + burst(304, 176) + big(T, "0/600", 304, 188, 36),
  (T, m) =>
    badge(T, m.banner) +
    sfx(T, "CAW!", 96, 96, -8, C.yellow) +
    `<rect x="248" y="170" width="128" height="58" fill="${C.paper}" stroke="${C.ink}" stroke-width="3"/>` +
    `<rect x="250" y="172" width="62" height="54" fill="url(#htK)"/>` +
    `<path d="M313 172 V226 M313 190 H374 M313 208 H374 M338 172 V190 M356 190 V208 M330 208 V226" stroke="${C.ink}" stroke-width="1.5"/>` +
    `<rect x="255" y="207" width="40" height="17" fill="${C.paper}"/>` + T.text("comic", "SAR", { x: 275, y: 221, size: 13, anchor: "middle" }) +
    `<rect x="315" y="174" width="58" height="17" fill="${C.paper}"/>` + T.text("comic", "OPTICAL", { x: 344, y: 188, size: 13, anchor: "middle" }),
  (T, m) => badge(T, m.banner) + sfx(T, "SCRITCH!", 262, 84, -6, C.yellow) + burst(76, 188) + big(T, "139", 76, 190, 36) + small(T, "TESTS", 76, 208),
  (T, m) =>
    badge(T, m.banner) +
    `<path d="M354 16 H370 V32 M370 204 V220 H354 M30 220 H14 V204" fill="none" stroke="${C.yellow}" stroke-width="4"/>` +
    sfx(T, "FWOOSH!", 256, 50, -8, C.yellow) +
    burst(316, 184) + big(T, "OCT 22", 316, 186, 26) + small(T, "2026", 316, 204),
];

export function chapterCard(m, i) {
  const T = new Type();
  let body = panelBack(0, 0, CW, CH);
  body += pixelImage(PIXEL(m.art), 4, 4, IW, IH);
  body += `<g transform="translate(4 4)">${OVERLAYS[i](T, m)}</g>`;
  body += `<rect x="4" y="${4 + IH}" width="${IW}" height="4" fill="${C.ink}"/>`;
  // text strip: one line of copy, then the stack (smaller, muted, letter-spaced)
  let y = 4 + IH + 4 + 26;
  for (const l of wrapPx(T, "comic", m.blurb, 16, IW - 28)) {
    body += T.text("comic", l, { x: 18, y, size: 16 });
    y += 21.6;
  }
  y += 6;
  for (const l of wrapPx(T, "comic", m.stack.join(" · "), 13, IW - 28, 0.6)) {
    body += T.text("comic", l, { x: 18, y, size: 13, ls: 0.6, fill: C.muted });
    y += 17;
  }
  body += panelBorder(0, 0, CW, CH);
  return docComic({
    w: CW + 6, h: CH + 6, type: T, page: false,
    title: `Chapter ${m.banner}`,
    desc: `Comic panel, chapter ${m.banner}. ${m.artAlt}. ${m.blurb} Stack: ${m.stack.join(", ")}.`,
    css: POP_CSS, mot: POP_MOT, body,
  });
}

// ---------- The Maester's Chain (800 wide) ----------
// Wide: chain art left, six skill rows right. Narrow (phones): rows only, larger.
export function chain(cfg) {
  const T = new Type();
  const X0 = 4, W = 786;
  const rows = cfg.chain;

  // wide layout
  const rx = X0 + 4 + 300 + 4 + 20, rw = X0 + W - 20 - rx;
  let wide = "";
  const tb = T.width("bangers", "THE MAESTER'S CHAIN", 24, 1.5) + 24;
  wide += `<rect x="${rx}" y="22" width="${tb}" height="34" fill="${C.yellow}" stroke="${C.ink}" stroke-width="3"/>`;
  wide += T.text("bangers", "THE MAESTER'S CHAIN", { x: rx + 12, y: 48, size: 24, ls: 1.5 });
  wide += T.text("comic", "one link for each discipline", { x: rx + tb + 12, y: 45, size: 14, fill: C.muted });
  const ix = rx + 22 + 128;
  const wrapped = rows.map((r) => wrapPx(T, "comic", r.items.join(" · "), 16, rw - (ix - rx)));
  const textH = wrapped.reduce((a, l) => a + 21 * l.length, 0);
  const wideH = Math.max(92 + textH + 16 * (rows.length - 1) + 4, 4 + 272 + 4 + 16);
  const layoutWide = (ph) => {
    const gap = Math.min(40, (ph - 92 - 20 - textH) / (rows.length - 1));
    let y = 92, s = "";
    rows.forEach((r, i) => {
      s += `<circle cx="${rx + 7}" cy="${y - 6}" r="7" fill="${r.color}" stroke="${C.ink}" stroke-width="2"/>`;
      s += T.text("bangers", r.label, { x: rx + 22, y, size: 18, ls: 1, fill: C.red });
      wrapped[i].forEach((l, k) => (s += T.text("comic", l, { x: ix, y: y + k * 21, size: 16 })));
      y += 21 * wrapped[i].length + gap;
    });
    return s;
  };

  // narrow layout: label line, then items, all >= 25px (>= 10px at 330px)
  let nar = "";
  const nb = T.width("bangers", "THE MAESTER'S CHAIN", 34, 1.5) + 28;
  nar += `<rect x="24" y="22" width="${nb}" height="46" fill="${C.yellow}" stroke="${C.ink}" stroke-width="3"/>`;
  nar += T.text("bangers", "THE MAESTER'S CHAIN", { x: 38, y: 57, size: 34, ls: 1.5 });
  let ny = 112;
  for (const r of rows) {
    nar += `<circle cx="38" cy="${ny - 10}" r="11" fill="${r.color}" stroke="${C.ink}" stroke-width="3"/>`;
    nar += T.text("bangers", r.label, { x: 60, y: ny, size: 30, ls: 1, fill: C.red });
    const items = r.items.join(" · ");
    const after = 60 + T.width("bangers", r.label, 30, 1) + 18;
    if (after + T.width("comic", items, 26) <= W - 24) {
      nar += T.text("comic", items, { x: after, y: ny, size: 26 });
      ny += 46;
    } else {
      const lines = wrapPx(T, "comic", items, 26, W - 60 - 24);
      lines.forEach((l, k) => (nar += T.text("comic", l, { x: 60, y: ny + 36 + k * 34, size: 26 })));
      ny += 36 + 34 * lines.length + 12;
    }
  }
  const narH = ny - 8;

  const ph = Math.max(wideH, narH);
  wide += layoutWide(ph);
  const art =
    `<rect x="${X0 + 4}" y="8" width="300" height="${ph - 8}" fill="#120a0b"/>` +
    pixelImage(PIXEL("chain.png"), X0 + 4, 8 + (ph - 8 - 4 - 272) / 2, 300, 272) +
    `<rect x="${X0 + 4 + 300}" y="8" width="4" height="${ph - 8}" fill="${C.ink}"/>`;
  const body =
    panelBack(X0, 4, W, ph) +
    `<g class="wd">${art}${wide}</g><g class="nw">${nar}</g>` +
    panelBorder(X0, 4, W, ph);
  return docComic({
    w: 800, h: ph + 4 + 6 + 4, type: T,
    title: "The Maester's Chain",
    desc:
      "Pixel art: a maester's chain of interlocking links in iron, bronze, gold, silver, black iron and copper, hanging on dark red velvet. One link for each discipline. " +
      rows.map((r) => `${r.label} (${r.metal}): ${r.items.join(", ")}.`).join(" "),
    body,
  });
}

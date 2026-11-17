// Comic-book page primitives: newsprint, 4px ink borders, hard offset shadows,
// halftone, starbursts, pixel-art panels. One self-backgrounded look (no light mode);
// all animation sits inside the prefers-reduced-motion guard.
import { readFileSync } from "node:fs";

export const C = {
  ink: "#111111",
  paper: "#f4ecd6", // panels
  page: "#ece2c4", // dotted page
  dot: "#d8cca8",
  yellow: "#f5c842",
  red: "#c41e2a", // accent
  blood: "#7a1018",
  muted: "#3d3a33",
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Page dots + shared shapes.
export const PAGE_DEFS = `<pattern id="pg" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.15" fill="${C.dot}"/></pattern>
<pattern id="htK" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="1.4" fill="${C.ink}"/></pattern>
<path id="burst" d="M0 -78 L14 -52 L44 -66 L42 -38 L76 -34 L54 -12 L80 10 L52 22 L64 50 L34 44 L24 74 L4 50 L-18 76 L-26 46 L-56 58 L-48 30 L-80 16 L-54 -4 L-74 -30 L-44 -32 L-50 -62 L-22 -48 Z"/>
<path id="leaf" d="M0 0 C4 -5 10 -5 12 0 C10 5 4 5 0 0 Z"/>`;

// Narrow display (<= bp px shown): swap `.wd` (wide-only) for `.nw` (narrow-only).
// render-check emulates this block by its markers.
const narrow = (bp) => `.nw{display:none}/*NARROW*/@media (max-width: ${bp}px){.wd{display:none}.nw{display:inline}}/*ENDNARROW*/`;

export function docComic({ w, h, title, desc, type, defs = "", body, css = "", mot = "", page = true, bp = 600 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>${narrow(bp)}${css}@media (prefers-reduced-motion: no-preference){${mot}}</style>
<defs>${PAGE_DEFS}${defs}${type ? type.defs() : ""}</defs>
${page ? `<rect width="${w}" height="${h}" fill="${C.page}"/><rect width="${w}" height="${h}" fill="url(#pg)"/>` : ""}
${body}
</svg>
`;
}

// Panel frame: hard offset shadow, then fill, then (separately, after contents) the 4px border.
export const panelBack = (x, y, w, h, { fill = C.paper, shadow = C.ink, off = 6 } = {}) =>
  `<rect x="${x + off}" y="${y + off}" width="${w}" height="${h}" fill="${shadow}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
export const panelBorder = (x, y, w, h, sw = 4) =>
  `<rect x="${x + sw / 2}" y="${y + sw / 2}" width="${w - sw}" height="${h - sw}" fill="none" stroke="${C.ink}" stroke-width="${sw}"/>`;

// Pixel-art PNG embedded as a data URI, kept crisp.
const pngCache = new Map();
export function pixelImage(file, x, y, w, h) {
  if (!pngCache.has(file)) pngCache.set(file, readFileSync(file).toString("base64"));
  return `<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" style="image-rendering:pixelated" href="data:image/png;base64,${pngCache.get(file)}"/>`;
}

// Yellow starburst badge centred at (x, y).
export const burst = (x, y, scale = 0.72) =>
  `<g transform="translate(${x} ${y}) scale(${scale})"><use href="#burst" fill="${C.yellow}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="miter"/></g>`;

// Yellow caption box sized to its text. Returns { svg, w }.
export function caption(type, lines, { x, y, size, font = "comic", ls = 0.5, padX = 12, lineH = null, eff = 1, cls = "" }) {
  const lh = lineH ?? Math.round(size * 1.36);
  const tw = Math.max(...lines.map((l) => type.width(font, l, size, ls)));
  const w = Math.ceil(tw + 2 * padX), h = Math.round(lines.length * lh + size * 0.62);
  let svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.yellow}" stroke="${C.ink}" stroke-width="3"/>`;
  lines.forEach((l, i) => (svg += type.text(font, l, { x: x + padX, y: y + size * 0.95 + i * lh + (lh - size) * 0.35, size, ls, eff })));
  return { svg: cls ? `<g class="${cls}">${svg}</g>` : svg, w, h };
}

// Linear interpolation for static animation frames (filmstrip previews).
export const cyc = (t, delay, dur) => ((((t - delay) % dur) + dur) % dur) / dur;

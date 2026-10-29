// Procedural ASCII art: raster silhouettes -> Bayer-dithered character grids.
// Everything is seeded, so builds are byte-for-byte reproducible.

export const RAMP = " .:-=+*#%@";

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bayer(n) {
  let m = [[0]];
  while (m.length < n) {
    const s = m.length;
    const nm = Array.from({ length: s * 2 }, () => new Array(s * 2));
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const v = m[y][x] * 4;
        nm[y][x] = v;
        nm[y][x + s] = v + 2;
        nm[y + s][x] = v + 3;
        nm[y + s][x + s] = v + 1;
      }
    m = nm;
  }
  return m.map((r) => r.map((v) => (v + 0.5) / (n * n)));
}
const B8 = bayer(8);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// Pixel canvas with two layers: "ink" (bone/ink glyphs) and "red" (accent glyphs).
export class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.ink = new Float32Array(w * h);
    this.red = new Float32Array(w * h);
  }
  L(name) {
    return name === "red" ? this.red : this.ink;
  }
  put(buf, x, y, c, v) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || c <= 0) return;
    const i = y * this.w + x;
    const nv = c * v;
    if (nv > buf[i]) buf[i] = nv;
  }
  // Tapered thick line, anti-aliased by distance.
  line(layer, x0, y0, x1, y1, w0, w1 = w0, v = 1) {
    const buf = this.L(layer);
    const pad = Math.max(w0, w1) / 2 + 1;
    const minX = Math.floor(Math.min(x0, x1) - pad), maxX = Math.ceil(Math.max(x0, x1) + pad);
    const minY = Math.floor(Math.min(y0, y1) - pad), maxY = Math.ceil(Math.max(y0, y1) + pad);
    const dx = x1 - x0, dy = y1 - y0;
    const len2 = dx * dx + dy * dy || 1;
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const t = clamp(((x + 0.5 - x0) * dx + (y + 0.5 - y0) * dy) / len2);
        const px = x0 + dx * t, py = y0 + dy * t;
        const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
        const half = (w0 + (w1 - w0) * t) / 2;
        this.put(buf, x, y, clamp(half - d + 0.5), v);
      }
  }
  disc(layer, cx, cy, r, v = 1, soft = 0) {
    this.ellipse(layer, cx, cy, r, r, 0, v, soft);
  }
  ellipse(layer, cx, cy, rx, ry, rotDeg = 0, v = 1, soft = 0) {
    const buf = this.L(layer);
    const a = (rotDeg * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const R = Math.max(rx, ry) + 2;
    for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++)
      for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
        const ux = x + 0.5 - cx, uy = y + 0.5 - cy;
        const px = (ux * ca + uy * sa) / rx, py = (-ux * sa + uy * ca) / ry;
        const d = Math.hypot(px, py);
        const c = soft ? clamp((1 - d) / soft) : clamp((1 - d) * Math.min(rx, ry) + 0.5);
        this.put(buf, x, y, c, v);
      }
  }
  inPoly(pts, x, y) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  poly(layer, pts, v = 1) {
    const buf = this.L(layer);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++)
        if (this.inPoly(pts, x + 0.5, y + 0.5)) this.put(buf, x, y, 1, v);
  }
  // Remove ink/red under a polygon (silhouettes cut out of what is behind them).
  carve(pts) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(this.h - 1, Math.ceil(Math.max(...ys))); y++)
      for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(this.w - 1, Math.ceil(Math.max(...xs))); x++)
        if (this.inPoly(pts, x + 0.5, y + 0.5)) {
          this.ink[y * this.w + x] = 0;
          this.red[y * this.w + x] = 0;
        }
  }
  // Mean coverage per character cell.
  cells(layer, C, R, cw, ch) {
    const buf = this.L(layer);
    const out = new Float32Array(C * R);
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        let s = 0;
        for (let y = r * ch; y < (r + 1) * ch; y++)
          for (let x = c * cw; x < (c + 1) * cw; x++) s += buf[y * this.w + x];
        out[r * C + c] = s / (cw * ch);
      }
    return out;
  }
}

// Stochastic bracketed L-system, expanded with the seeded rng.
export function expand(axiom, rules, iterations, rnd) {
  let s = axiom;
  for (let i = 0; i < iterations; i++) {
    let o = "";
    for (const ch of s) {
      const r = rules[ch];
      if (!r) o += ch;
      else o += Array.isArray(r) ? r[Math.floor(rnd() * r.length)] : r;
    }
    s = o;
  }
  return s;
}

// Turtle-draw the L-system as a tree; returns branch segments and tips.
export function drawTree(cv, rnd, { x, y, str, trunk = 22, taper = 0.66, len = 20, lenDecay = 0.8, angle = [24, 36], up = 0.07, v = 0.85, scale = 1, minW = 1.5, sx = 1 }) {
  len *= scale;
  const stack = [];
  let px = x, py = y, hd = -90, depth = 0;
  const segs = [], tips = [];
  for (const c of str) {
    if (c === "F") {
      const l = Math.max(5, len * Math.pow(lenDecay, depth)) * (0.85 + rnd() * 0.3);
      hd += (-90 - hd) * up + (rnd() - 0.5) * 8;
      const nx = px + Math.cos((hd * Math.PI) / 180) * l * sx;
      const ny = py + Math.sin((hd * Math.PI) / 180) * l;
      const w0 = Math.max(minW, trunk * Math.pow(taper, depth));
      const w1 = Math.max(minW, trunk * Math.pow(taper, depth + 0.25));
      cv.line("ink", px, py, nx, ny, w0, w1, v);
      segs.push({ x0: px, y0: py, x1: nx, y1: ny, depth });
      px = nx;
      py = ny;
    } else if (c === "+" || c === "-") {
      const a = angle[0] + rnd() * (angle[1] - angle[0]);
      hd += c === "+" ? a : -a;
    } else if (c === "[") {
      stack.push([px, py, hd, depth]);
      depth++;
    } else if (c === "]") {
      [px, py, hd, depth] = stack.pop();
    } else if (c === "A") {
      tips.push({ x: px, y: py, depth });
    }
  }
  return { segs, tips };
}

// Grow a tree that fits a box: dry-run with the same seed to measure, then draw scaled.
export function fitTree(cv, seed, str, opts, box) {
  const probe = { line() {} };
  const dry = drawTree(probe, rng(seed), { ...opts, str, x: 0, y: 0 });
  const xs = dry.segs.flatMap((s) => [s.x0, s.x1]), ys = dry.segs.flatMap((s) => [s.y0, s.y1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys);
  const scale = box.h / -minY;
  const sx = Math.min((box.w / 2) / (Math.max(-minX, maxX) * scale), box.maxStretch ?? 1.6);
  return drawTree(cv, rng(seed), { ...opts, str, x: box.x, y: box.y, scale, sx });
}

// Turn per-cell densities into dithered character rows.
// values: array of {v, red} per cell (row-major). Returns [{chars, red:boolean[]}].
export function ditherRows(values, C, R, pulse = null) {
  const rows = [];
  const n = RAMP.length;
  for (let r = 0; r < R; r++) {
    let chars = "";
    const red = [];
    for (let c = 0; c < C; c++) {
      const cell = values[r * C + c];
      let v = cell.v;
      if (pulse) v = pulse(v, c, r);
      const idx = clamp(Math.round(v * (n - 1) + B8[r & 7][c & 7] - 0.5), 0, n - 1);
      chars += RAMP[idx];
      red.push(cell.red && idx > 0);
    }
    rows.push({ chars, red });
  }
  return rows;
}

// SVG text for a dithered row: one <text> per colour run, each textLength-locked
// so columns line up in any monospace fallback. Space-only runs are skipped.
export function rowSvg(row, x0, y, cw, redClass = "rd") {
  const chars = row.chars;
  let out = "";
  let i = 0;
  while (i < chars.length) {
    const isRed = row.red[i];
    let j = i;
    while (j < chars.length && row.red[j] === isRed) j++;
    let a = i, b = j;
    while (a < b && chars[a] === " ") a++;
    while (b > a && chars[b - 1] === " ") b--;
    if (a < b) {
      const cls = isRed ? ` class="${redClass}"` : "";
      out += `<text x="${+(x0 + a * cw).toFixed(1)}" y="${y}" textLength="${(b - a) * cw}" lengthAdjust="spacing"${cls}>${chars.slice(a, b)}</text>`;
    }
    i = j;
  }
  return out;
}

// Thin dithered divider strip: cols x rows of drifting density, deterministic.
// `shift` (0..1) slides the wave sideways, for animated dividers.
export function dividerRows(cols, rowsN, seed, shift = 0) {
  const rnd = rng(seed);
  const ph = rnd() * 6 - shift * Math.PI * 2;
  const values = [];
  for (let r = 0; r < rowsN; r++)
    for (let c = 0; c < cols; c++) {
      const edge = Math.sin((Math.PI * c) / (cols - 1));
      const wave = 0.5 + 0.5 * Math.sin(c * 0.21 + ph + r);
      values.push({ v: clamp(0.62 * edge * (0.35 + 0.65 * wave) * (rowsN === 1 ? 1 : r === 0 ? 0.7 : 1)), red: false });
    }
  return ditherRows(values, cols, rowsN);
}

// Per-cell {v, red} from a canvas: red wins a cell when its coverage dominates.
export function cellsOf(cv, C, R, cw, ch) {
  const ink = cv.cells("ink", C, R, cw, ch);
  const red = cv.cells("red", C, R, cw, ch);
  return Array.from(ink, (vi, i) => ({ v: Math.max(vi, red[i]), red: red[i] > 0.1 && red[i] >= vi * 0.8 }));
}

// Slow radial pulse: a wave travels outward from (x, y) and shifts the dither
// threshold. Returns k -> per-cell value transform for frame k.
export function radialPulse({ x, y, cw, ch, frames, lambda = 140, lo = 0.82, amp = 0.3, mist = null }) {
  return (k) => (v, c, r) => {
    const d = Math.hypot((c + 0.5) * cw - x, (r + 0.5) * ch - y);
    const w = 0.5 + 0.5 * Math.sin(2 * Math.PI * (k / frames - d / lambda));
    if (v > 0.02) return v * (lo + amp * w);
    return mist ? mist(w, c, r) : 0;
  };
}

// Dithered art -> SVG rows for one frame, placed at the group's origin.
export function artRows(values, C, R, cw, ch, pulse = null) {
  return ditherRows(values, C, R, pulse)
    .map((row, r) => rowSvg(row, 0, (r + 1) * ch - 2, cw))
    .join("");
}

// CSS flipbook: `frames` groups, exactly one visible at a time via steps().
// Reduced motion (or a renderer without CSS animation) shows frame 0 only.
// `only` renders a single static frame (used for the preview filmstrip).
export function flipbook({ id, frames, period, render, only = null }) {
  const ks = only === null ? [...Array(frames).keys()] : [only];
  const svg = ks.map((k, i) => `<g class="${id} ${id}${only === null ? k : i}">${render(k)}</g>`).join("");
  const css = `.${id}{opacity:0}.${id}0{opacity:1}`;
  if (only !== null) return { svg, css, mot: "" };
  const step = period / frames;
  const mot =
    `@keyframes ${id}{0%{opacity:1}${(100 / frames).toFixed(2)}%,100%{opacity:0}}` +
    `.${id}{animation:${id} ${period}s steps(1,end) infinite}` +
    ks.map((k) => `.${id}${k}{animation-delay:${(k * step).toFixed(2)}s}`).join("");
  return { svg, css, mot };
}

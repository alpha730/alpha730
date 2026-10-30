// Original ASCII emblems, drawn as silhouettes on a pixel canvas and dithered.
// Each returns { values, C, R, cw, ch, center } for artRows/radialPulse.
import { Canvas, rng, cellsOf } from "./ascii.mjs";

const CW = 6, CH = 10;
const pack = (cv, C, R, center) => ({ values: cellsOf(cv, C, R, CW, CH), C, R, cw: CW, ch: CH, center });

// Fill by a per-pixel function (max-blended), for textured masses.
export function field(cv, layer, x0, y0, x1, y1, fn) {
  const buf = cv.L(layer);
  for (let y = Math.max(0, y0); y < Math.min(cv.h, y1); y++)
    for (let x = Math.max(0, x0); x < Math.min(cv.w, x1); x++) cv.put(buf, x, y, 1, fn(x, y));
}

// Points along a quadratic Bezier.
export const qb = (p0, p1, p2, t) => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

// Banner band: 60 x 9 cells (360 x 90 px).
const BC = 60, BR = 9;

// I. The Wall: an ice wall with bricked face; injected arrows stop at it in red sparks.
export function wall() {
  const cv = new Canvas(BC * CW, BR * CH);
  const rnd = rng(101);
  const x0 = 168;
  field(cv, "ink", x0, 30, 360, 90, (x, y) => {
    const row = Math.floor((y - 30) / 12);
    const mortarY = (y - 30) % 12 < 2;
    const mortarX = (x - x0 + (row % 2) * 14) % 28 < 2;
    return mortarY || mortarX ? 0.3 : 0.74 + 0.12 * Math.sin(y * 0.15);
  });
  for (let x = x0; x < 360; x += 28) field(cv, "ink", x, 16, x + 16, 30, () => 0.74);
  for (let i = 0; i < 24; i++) cv.disc("ink", rnd() * 150, rnd() * 86, 1.6, 0.9); // snow
  for (const [y0, y1] of [[18, 40], [56, 52], [80, 70]]) {
    cv.line("ink", 8, y0, x0 - 6, y1, 3, 3, 0.85);
    cv.poly("ink", [[x0 - 4, y1], [x0 - 16, y1 - 6], [x0 - 16, y1 + 6]], 0.9);
    cv.disc("red", x0 + 2, y1, 7, 1);
    for (let k = 0; k < 4; k++) cv.disc("red", x0 - 4 - rnd() * 16, y1 + (rnd() - 0.5) * 18, 2.4, 0.9);
  }
  return pack(cv, BC, BR, { x: x0, y: 52 });
}

// II. The Raven's Eye: a raven head with a red eye scanning a patchwork of fields.
export function ravenEye() {
  const cv = new Canvas(BC * CW, BR * CH);
  const rnd = rng(202);
  for (let gy = 0; gy < 5; gy++)
    for (let gx = 0; gx < 6; gx++) {
      const x = 176 + gx * 30, y = 4 + gy * 17;
      const v = [0.16, 0.34, 0.52, 0.7][Math.floor(rnd() * 4)];
      field(cv, gx === 3 && gy === 2 ? "red" : "ink", x, y, x + 26, y + 14, () => (gx === 3 && gy === 2 ? 0.95 : v));
    }
  cv.line("ink", 96, 38, 176, 6, 2.5, 2.5, 0.45);
  cv.line("ink", 96, 40, 176, 88, 2.5, 2.5, 0.45);
  cv.poly("ink", [[30, 90], [20, 60], [36, 32], [60, 22], [84, 26], [98, 34], [150, 46], [96, 52], [86, 66], [92, 90]], 0.82);
  cv.disc("red", 74, 36, 7, 1);
  return pack(cv, BC, BR, { x: 74, y: 36 });
}

// III. The Horn: a curved war horn with red bands, sound rolling out in arcs.
export function horn() {
  const cv = new Canvas(BC * CW, BR * CH);
  const p0 = [24, 24], p1 = [70, 96], p2 = [170, 46];
  const N = 60;
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N;
    const [ax, ay] = qb(p0, p1, p2, t0), [bx, by] = qb(p0, p1, p2, t1);
    cv.line("ink", ax, ay, bx, by, 5 + 34 * t0 ** 1.6, 5 + 34 * t1 ** 1.6, 0.8);
  }
  for (const t of [0.42, 0.7]) {
    const [ax, ay] = qb(p0, p1, p2, t - 0.025), [bx, by] = qb(p0, p1, p2, t + 0.025);
    cv.line("red", ax, ay, bx, by, 9 + 34 * t ** 1.6, 9 + 34 * t ** 1.6, 1);
  }
  [26, 46, 66, 86, 106].forEach((r, i) => {
    for (let a = -55; a < 55; a += 4) {
      const t0 = (a * Math.PI) / 180, t1 = ((a + 4) * Math.PI) / 180;
      cv.line("ink", 176 + r * Math.cos(t0), 46 + r * Math.sin(t0), 176 + r * Math.cos(t1), 46 + r * Math.sin(t1), 5, 5, 0.75 - i * 0.1);
    }
  });
  return pack(cv, BC, BR, { x: 176, y: 46 });
}

// IV. Dragonfire: a winged dragon silhouette breathing a red plume.
export function dragon() {
  const cv = new Canvas(BC * CW, BR * CH);
  const rnd = rng(404);
  cv.ellipse("ink", 104, 54, 36, 11, -8, 0.85);
  cv.line("ink", 134, 48, 160, 32, 12, 8, 0.85);
  cv.poly("ink", [[154, 26], [176, 24], [186, 30], [172, 36], [158, 38]], 0.9);
  cv.poly("ink", [[160, 26], [154, 14], [166, 24]], 0.9);
  let [tx, ty] = [72, 58];
  for (let i = 1; i <= 14; i++) {
    const nx = 72 - i * 4.4, ny = 58 + i * 1.2 + 6 * Math.sin(i * 0.6);
    cv.line("ink", tx, ty, nx, ny, 10 - i * 0.6, 9.4 - i * 0.6, 0.85);
    [tx, ty] = [nx, ny];
  }
  cv.poly("ink", [[90, 48], [66, 4], [86, 14], [100, 2], [112, 16], [130, 6], [124, 46]], 0.8);
  cv.poly("ink", [[96, 60], [80, 86], [112, 66]], 0.7);
  for (let i = 0; i < 70; i++) {
    const t = rnd();
    const d = 10 + t * 170;
    const spread = 4 + t * 26;
    cv.disc("red", 186 + d, 31 + t * 10 + (rnd() - 0.5) * spread, 3 + t * 6, 0.5 + 0.5 * (1 - t));
  }
  return pack(cv, BC, BR, { x: 186, y: 31 });
}

// The Citadel: a lone tower with a red-lit window. 14 x 8 cells.
export function tower() {
  const C = 14, R = 8;
  const cv = new Canvas(C * CW, R * CH);
  field(cv, "ink", 26, 26, 58, 80, (x, y) => 0.72 + 0.1 * Math.sin(y * 0.4));
  for (let x = 22; x < 62; x += 10) field(cv, "ink", x, 18, x + 6, 26, () => 0.78);
  cv.poly("ink", [[30, 18], [42, 0], [54, 18]], 0.8);
  cv.carve([[39, 34], [45, 34], [45, 46], [39, 46]]);
  cv.disc("red", 42, 40, 5, 1);
  field(cv, "ink", 0, 76, 84, 80, () => 0.4);
  return pack(cv, C, R, { x: 42, y: 40 });
}

// Footer raven in flight, carrying a red message. 26 x 7 cells; pose 0 wings up, 1 down.
export function flyingRaven(pose) {
  const C = 26, R = 7;
  const cv = new Canvas(C * CW, R * CH);
  const T = (pts) => pts.map(([x, y]) => [78 + x * 2.1, 36 + y * 2.1]);
  cv.poly("ink", T([[-12, 2], [-4, -2], [6, -3], [12, -6], [17, -5], [24, -3], [17, -1], [12, 2], [2, 5], [-8, 6], [-26, 9], [-24, 4]]), 0.9);
  cv.poly("ink", T(pose === 0 ? [[-6, 0], [-16, -15], [-2, -13], [8, -2]] : [[-4, 3], [-14, 14], [0, 11], [8, 3]]), 0.9);
  cv.ellipse("red", 78 + 4 * 2.1, 36 + 7 * 2.1, 6, 3.5, 0, 1);
  return pack(cv, C, R, { x: 78, y: 36 });
}

// The Forge: an anvil throwing red sparks. 14 x 8 cells.
export function anvil() {
  const C = 14, R = 8;
  const cv = new Canvas(C * CW, R * CH);
  const rnd = rng(606);
  cv.poly("ink", [[6, 34], [62, 34], [62, 42], [78, 46], [62, 50], [56, 54], [52, 64], [62, 74], [18, 74], [28, 64], [24, 54], [14, 48], [6, 42]], 0.82);
  field(cv, "ink", 0, 76, 84, 80, () => 0.4);
  for (let i = 0; i < 9; i++) cv.disc("red", 40 + (rnd() - 0.5) * 44, 26 - rnd() * 24, 2 + rnd() * 2, 0.95);
  return pack(cv, C, R, { x: 40, y: 30 });
}

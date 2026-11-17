// Text as paths. GitHub serves README SVGs as images, which cannot load web fonts,
// so every string is drawn from the baked glyph atlas (scripts/lib/glyphs.json,
// built by scripts/art/build-glyphs.mjs). Each glyph is defined once per document
// and placed with <use>. No dependencies: the GitHub Action uses this too.
import { readFileSync } from "node:fs";

const ATLAS = JSON.parse(readFileSync(new URL("./glyphs.json", import.meta.url), "utf8"));
const PREFIX = { bangers: "b", comic: "c" };

export class Type {
  constructor() {
    this.used = new Map(); // id -> path data
  }

  // Advance width of `text` in px at `size`, including kerning and letter-spacing.
  width(font, text, size, ls = 0) {
    const f = ATLAS[font];
    const s = size / f.upm;
    let w = 0;
    const chars = [...text];
    chars.forEach((ch, i) => {
      const g = f.glyphs[ch] ?? f.glyphs["?"];
      w += g.a * s + (i < chars.length - 1 ? ls + (f.kern[ch + chars[i + 1]] ?? 0) * s : 0);
    });
    return w;
  }

  // One run of text as a group of <use> glyphs.
  //   x, y: baseline origin (y is the baseline); anchor: start | middle | end
  //   fill/stroke/sw: paint; stroke is painted under the fill, like paint-order:stroke
  //   eff: displayed px per px of `size` (for nested scaling), recorded in data-fs
  //   cls: extra classes (e.g. "wd" / "nw" for wide-only / narrow-only text)
  text(font, text, { x = 0, y = 0, size = 16, ls = 0, anchor = "start", fill = "#111111", stroke = null, sw = 0, cls = "", eff = 1, attrs = "" } = {}) {
    const f = ATLAS[font];
    const s = size / f.upm;
    let x0 = x;
    if (anchor !== "start") x0 -= this.width(font, text, size, ls) * (anchor === "middle" ? 0.5 : 1);
    let pen = 0;
    let uses = "";
    const chars = [...text];
    chars.forEach((ch, i) => {
      const key = f.glyphs[ch] ? ch : "?";
      const g = f.glyphs[key];
      if (key !== " " && g.d) {
        const id = `${PREFIX[font]}${key.codePointAt(0)}`;
        if (!this.used.has(id)) this.used.set(id, g.d);
        uses += `<use href="#${id}"${pen ? ` x="${Math.round(pen)}"` : ""}/>`;
      }
      pen += g.a + (i < chars.length - 1 ? ls / s + (f.kern[ch + chars[i + 1]] ?? 0) : 0);
    });
    const t = `translate(${+x0.toFixed(2)} ${+y.toFixed(2)}) scale(${+s.toFixed(5)})`;
    const meta = `data-fs="${+(size * eff).toFixed(2)}"${cls ? ` class="${cls}"` : ""}${attrs ? " " + attrs : ""}`;
    const base = stroke
      ? `<g fill="${stroke}" stroke="${stroke}" stroke-width="${+(sw / s).toFixed(1)}" stroke-linejoin="round">${uses}</g>`
      : "";
    return `<g ${meta} transform="${t}">${base}<g fill="${fill}">${uses}</g></g>`;
  }

  // <defs> content: every glyph used so far.
  defs() {
    return [...this.used].map(([id, d]) => `<path id="${id}" d="${d}"/>`).join("");
  }
}

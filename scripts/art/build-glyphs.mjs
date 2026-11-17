// Dev-only: bakes glyph outlines, advances and kerning for the two comic fonts into
// scripts/lib/glyphs.json, so SVG text can be drawn as paths with no runtime
// dependency (the GitHub Action renders live stats without `npm install`).
//   node scripts/art/build-glyphs.mjs
// Fonts (SIL OFL 1.1, licences beside them): Bangers Regular, Comic Neue Bold.
import opentype from "opentype.js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const FONTS = { bangers: "Bangers-Regular.ttf", comic: "ComicNeue-Bold.ttf" };
// Printable ASCII plus the few typographic characters the profile uses.
const CHARS = [...Array(95)].map((_, i) => String.fromCharCode(32 + i)).join("") + "·©–—…→’“”";

const out = {};
for (const [key, file] of Object.entries(FONTS)) {
  const font = opentype.loadSync(path.join(here, "fonts", file));
  const upm = font.unitsPerEm;
  const glyphs = {};
  const gl = {};
  for (const ch of CHARS) {
    const g = font.charToGlyph(ch);
    if (!g || (g.index === 0 && ch !== " ")) continue; // .notdef: font lacks it
    gl[ch] = g;
    // y grows downward in SVG: draw at baseline 0, size = upm (1 unit per font unit)
    glyphs[ch] = { a: Math.round(g.advanceWidth), d: g.getPath(0, 0, upm).toPathData(0) };
  }
  const kern = {};
  for (const a of Object.keys(gl))
    for (const b of Object.keys(gl)) {
      const k = font.getKerningValue(gl[a], gl[b]);
      if (k) kern[a + b] = k;
    }
  out[key] = { upm, ascender: font.ascender, descender: font.descender, glyphs, kern };
  console.log(`${key}: ${Object.keys(glyphs).length} glyphs, ${Object.keys(kern).length} kerning pairs, upm ${upm}`);
}
writeFileSync(path.join(here, "..", "lib", "glyphs.json"), JSON.stringify(out));

// Renders every SVG to PNG (desktop + 330px phone width, dark + light) and builds README-style
// composite previews. resvg ignores @media, so the light and narrow blocks are
// unwrapped/removed here to emulate what a browser shows at each width and scheme.
// `--hero` renders only the hero and its animation filmstrip.
import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "assets");
const out = path.join(root, "preview");
const heroOnly = process.argv.includes("--hero");
const PHONE = 330; // GitHub's README width on a ~360px phone
if (!heroOnly) await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// Apply or drop a marked block: /*TAG*/@media (...){ ... }/*ENDTAG*/
function media(svg, tag, on) {
  const start = svg.indexOf(`/*${tag}*/`), end = svg.indexOf(`/*END${tag}*/`);
  if (start < 0 || end < 0) return svg;
  const block = svg.slice(start + tag.length + 4, end);
  const inner = block.slice(block.indexOf("{") + 1, block.lastIndexOf("}"));
  return svg.slice(0, start) + (on ? inner : "") + svg.slice(end + tag.length + 7);
}
// The narrow block applies when the SVG is displayed <= 520px wide.
const scheme = (svg, mode, shownWidth) => media(media(svg, "LIGHT", mode === "light"), "NARROW", shownWidth <= 520);

const opts = (width) => ({
  fitTo: { mode: "width", value: width },
  font: { loadSystemFonts: true, defaultFontFamily: "Consolas", monospaceFamily: "Consolas" },
});
const png = (svg, width) => new Resvg(svg, opts(width)).render().asPng();
const dims = (s) => {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(s);
  return [Number(m[1]), Number(m[2])];
};

const files = (await readdir(assets)).filter((f) => f.endsWith(".svg") && (!heroOnly || f === "header.svg"));
const src = {};
for (const f of files) src[f] = await readFile(path.join(assets, f), "utf8");

for (const mode of ["dark", "light"])
  for (const f of files) {
    const [w] = dims(src[f]);
    const name = f.replace(".svg", "");
    await writeFile(path.join(out, `${name}.${mode}.desktop.png`), png(scheme(src[f], mode, w), w));
    await writeFile(path.join(out, `${name}.${mode}.330.png`), png(scheme(src[f], mode, PHONE), PHONE));
  }

// ---- hero animation filmstrip: 4 frames of the pulse, stacked ----
{
  const { heroSvg, FRAMES } = await import("./lib/hero.mjs");
  const cfg = JSON.parse(await readFile(path.join(root, "profile.config.json"), "utf8"));
  const picks = [0, 1, 2, 3].map((i) => Math.round((i * FRAMES) / 4));
  for (const mode of ["dark", "light"]) {
    let parts = "", y = 0;
    for (const k of picks) {
      const s = scheme(heroSvg(cfg.person, { frame: k }), mode, 800);
      const [, h] = dims(s);
      const data = "data:image/png;base64," + Buffer.from(png(s, 800)).toString("base64");
      parts += `<image x="0" y="${y}" width="800" height="${h}" href="${data}"/><text x="790" y="${y + 24}" text-anchor="end" font-family="Consolas" font-size="14" fill="#888">frame ${k}/${FRAMES}</text>`;
      y += h + 8;
    }
    const strip = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${y}" viewBox="0 0 800 ${y}"><rect width="800" height="${y}" fill="#777"/>${parts}</svg>`;
    await writeFile(path.join(out, `hero-filmstrip.${mode}.png`), png(strip, 800));
  }
}
if (heroOnly) {
  console.log("rendered header.svg x 4 + hero filmstrips -> preview/");
  process.exit(0);
}

// ---- README composites (resvg drops fonts in nested SVG images, so embed PNGs) ----
const cache = new Map();
function uriFor(f, mode, shown) {
  const k = `${f}|${mode}|${shown <= 520}`;
  if (!cache.has(k)) {
    const s = scheme(src[f], mode, shown);
    cache.set(k, "data:image/png;base64," + Buffer.from(png(s, dims(s)[0] * 2)).toString("base64"));
  }
  return cache.get(k);
}

function composite(mode, W, pad, mobile) {
  const page = mode === "dark" ? "#0d1117" : "#ffffff";
  const ink = mode === "dark" ? "#e6edf3" : "#1f2328";
  const link = mode === "dark" ? "#4493f8" : "#0969da";
  const inner = W - 2 * pad;
  let y = pad, parts = "";
  const img = (f, x, w) => {
    const [sw, sh] = dims(src[f]);
    const h = (sh * w) / sw;
    parts += `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${uriFor(f, mode, w)}"/>`;
    return h;
  };
  const row = (f) => {
    const nw = Math.min(inner, dims(src[f])[0]);
    y += img(f, (W - nw) / 2, nw) + 10;
  };
  const pair = (a, b) => {
    if (mobile) {
      y += img(a, pad, inner) + 10;
      y += img(b, pad, inner) + 10;
    } else {
      const x0 = (W - 2 * 392 - 8) / 2;
      const h = Math.max(img(a, x0, 392), img(b, x0 + 400, 392));
      y += h + 10;
    }
  };
  const heading = (t) => {
    y += 12;
    parts += `<text x="${W / 2}" y="${y + 18}" text-anchor="middle" font-family="Segoe UI,Arial" font-size="24" font-weight="600" fill="${ink}">${t}</text>`;
    parts += `<line x1="${pad}" x2="${W - pad}" y1="${y + 30}" y2="${y + 30}" stroke="${mode === "dark" ? "#30363d" : "#d0d7de"}"/>`;
    y += 44;
  };
  // mirrors README.md, top to bottom
  row("header.svg");
  row("telemetry.svg");
  row("divider.svg");
  heading("The Four Banners");
  pair("mission-1.svg", "mission-2.svg");
  pair("mission-3.svg", "mission-4.svg");
  row("divider.svg");
  row("instruments.svg");
  row("divider.svg");
  row("streak.svg");
  pair("languages.svg", "activity.svg");
  row("divider.svg");
  row("footer.svg");
  parts += `<text x="${W / 2}" y="${y + 14}" text-anchor="middle" font-family="Segoe UI,Arial" font-size="15" fill="${link}">Portfolio · GitHub</text>`;
  y += 22;
  const H = Math.ceil(y + pad);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${page}"/>${parts}</svg>`;
}

for (const mode of ["dark", "light"]) {
  await writeFile(path.join(out, `README.${mode}.desktop.png`), png(composite(mode, 880, 20, false), 880));
  await writeFile(path.join(out, `README.${mode}.330.png`), png(composite(mode, PHONE + 32, 16, true), PHONE + 32));
}
console.log(`rendered ${files.length} svgs x 4 + hero filmstrips + 4 README composites -> preview/`);

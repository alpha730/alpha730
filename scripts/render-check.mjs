// Renders every SVG to PNG at desktop width and at a 330px phone width, plus README-style
// composite previews. The comic assets are one self-backgrounded look (no light mode).
// resvg ignores @media and CSS animation, so the narrow block is applied/removed here
// by its markers, and animations are previewed as filmstrips of timed static frames.
// `--hero` renders only the hero and its filmstrip.
import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "assets");
const out = path.join(root, "preview");
const heroOnly = process.argv.includes("--hero");
const PHONE = 330; // GitHub's README width on a ~360px phone
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// Apply or drop a marked block: /*TAG*/@media (...){ ... }/*ENDTAG*/
function media(svg, tag, on) {
  const start = svg.indexOf(`/*${tag}*/`), end = svg.indexOf(`/*END${tag}*/`);
  if (start < 0 || end < 0) return svg;
  const block = svg.slice(start + tag.length + 4, end);
  const inner = block.slice(block.indexOf("{") + 1, block.lastIndexOf("}"));
  return svg.slice(0, start) + (on ? inner : "") + svg.slice(end + tag.length + 7);
}
// The narrow block applies when the SVG is displayed at or below its own breakpoint.
const breakpoint = (svg) => Number(/\/\*NARROW\*\/@media \(max-width: (\d+)px\)/.exec(svg)?.[1] ?? 0);
const scheme = (svg, shownWidth) => media(svg, "NARROW", shownWidth <= breakpoint(svg));

const opts = (width) => ({ fitTo: { mode: "width", value: width }, font: { loadSystemFonts: false } });
const png = (svg, width) => new Resvg(svg, opts(width)).render().asPng();
const dims = (s) => {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(s);
  return [Number(m[1]), Number(m[2])];
};

const cfg = JSON.parse(await readFile(path.join(root, "profile.config.json"), "utf8"));
const files = (await readdir(assets)).filter((f) => f.endsWith(".svg") && (!heroOnly || f === "hero.svg"));
const src = {};
for (const f of files) src[f] = await readFile(path.join(assets, f), "utf8");

for (const f of files) {
  const [w] = dims(src[f]);
  const name = f.replace(".svg", "");
  await writeFile(path.join(out, `${name}.desktop.png`), png(scheme(src[f], w), w));
  await writeFile(path.join(out, `${name}.${PHONE}.png`), png(scheme(src[f], PHONE), PHONE));
}

// ---- animation filmstrip: 4 timed static frames, stacked ----
async function filmstrip(name, make, times) {
  let parts = "", y = 0;
  for (const t of times) {
    const s = scheme(make(t), 800);
    const [w, h] = dims(s);
    const data = "data:image/png;base64," + Buffer.from(png(s, w)).toString("base64");
    parts += `<image x="0" y="${y}" width="${w}" height="${h}" href="${data}"/><rect x="${w - 100}" y="${y + h - 40}" width="84" height="22" fill="#111111"/><text x="${w - 58}" y="${y + h - 24}" text-anchor="middle" font-family="Arial" font-size="14" fill="#f5c842">t = ${t}s</text>`;
    y += h + 8;
    var width = w;
  }
  const strip = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${y}" viewBox="0 0 ${width} ${y}"><rect width="${width}" height="${y}" fill="#777"/>${parts}</svg>`;
  await writeFile(path.join(out, `${name}-filmstrip.png`), new Resvg(strip, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: true } }).render().asPng());
}
{
  const { heroSvg } = await import("./lib/comic-hero.mjs");
  await filmstrip("hero", (t) => heroSvg(cfg.person, { t }), [0, 2.25, 4.5, 6.75]);
}
if (heroOnly) {
  console.log("rendered hero.svg (desktop + 330px) + hero filmstrip -> preview/");
  process.exit(0);
}

// ---- README composites (resvg drops fonts in nested SVG images, so embed PNGs) ----
// The comic SVGs paint their own backgrounds, so the composite shows each on GitHub's
// dark and light page colours. Card pairs sit side by side on desktop and stack on phones.
const cache = new Map();
function uriFor(f, shown) {
  const k = `${f}|${shown <= breakpoint(src[f])}`;
  if (!cache.has(k)) {
    const s = scheme(src[f], shown);
    cache.set(k, "data:image/png;base64," + Buffer.from(png(s, dims(s)[0] * 2)).toString("base64"));
  }
  return cache.get(k);
}

function composite(mode, W, pad, mobile) {
  const page = mode === "dark" ? "#0d1117" : "#ffffff";
  const link = mode === "dark" ? "#4493f8" : "#0969da";
  const inner = W - 2 * pad;
  let y = pad, parts = "";
  const img = (f, x, w) => {
    const [sw, sh] = dims(src[f]);
    const h = (sh * w) / sw;
    parts += `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${uriFor(f, w)}"/>`;
    return h;
  };
  // README sets width="800" / "392"; GitHub caps images at the column width
  const row = (f, readmeW = 800) => {
    const nw = Math.min(inner, readmeW);
    y += img(f, (W - nw) / 2, nw) + 8;
  };
  const pair = (a, b) => {
    if (mobile) {
      row(a, 392);
      row(b, 392);
    } else {
      const x0 = (W - 2 * 392 - 4) / 2;
      const h = Math.max(img(a, x0, 392), img(b, x0 + 396, 392));
      y += h + 8;
    }
  };
  const linkLine = (t) => {
    y += 22;
    parts += `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="Segoe UI,Arial" font-size="${mobile ? 13 : 15}" fill="${link}">${t}</text>`;
  };
  // mirrors README.md (generated by build.mjs), top to bottom
  row("hero.svg");
  row("chapters-title.svg");
  pair("chapter-1.svg", "chapter-2.svg");
  pair("chapter-3.svg", "chapter-4.svg");
  row("chain.svg");
  row("watch.svg");
  pair("languages.svg", "activity.svg");
  row("footer.svg");
  linkLine("Portfolio · GitHub");
  const ch = cfg.missions.map((m) => m.banner.replace(/ · /, " · ").replace("&", "&amp;"));
  if (mobile) { linkLine(ch.slice(0, 2).join(" · ")); linkLine(ch.slice(2).join(" · ")); }
  else linkLine(ch.join(" · "));
  const H = Math.ceil(y + pad + 6);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${page}"/>${parts}</svg>`;
}

const composites = (mode, W, pad, mobile) => new Resvg(composite(mode, W, pad, mobile), { fitTo: { mode: "width", value: W }, font: { loadSystemFonts: true } }).render().asPng();
for (const mode of ["dark", "light"]) {
  await writeFile(path.join(out, `README.${mode}.desktop.png`), composites(mode, 880, 20, false));
  await writeFile(path.join(out, `README.${mode}.${PHONE}.png`), composites(mode, PHONE + 32, 16, true));
}
console.log(`rendered ${files.length} svgs (desktop + ${PHONE}px) + hero filmstrip + 4 README composites -> preview/`);

// Renders every SVG to PNG (desktop + 380px, dark + light) and builds README-style
// composite previews. resvg ignores @media, so the light block is unwrapped/removed here.
import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "assets");
const out = path.join(root, "preview");
await mkdir(out, { recursive: true });

const scheme = (svg, mode) =>
  mode === "light"
    ? svg.replace(/\/\*LIGHT\*\/@media \(prefers-color-scheme: light\)\{([\s\S]*?)\}\/\*ENDLIGHT\*\//, "$1")
    : svg.replace(/\/\*LIGHT\*\/[\s\S]*?\/\*ENDLIGHT\*\//, "");

const opts = (width) => ({
  fitTo: { mode: "width", value: width },
  font: { loadSystemFonts: true, defaultFontFamily: "Consolas", monospaceFamily: "Consolas" },
});
const png = (svg, width) => new Resvg(svg, opts(width)).render().asPng();

const files = (await readdir(assets)).filter((f) => f.endsWith(".svg"));
const src = {};
for (const f of files) src[f] = await readFile(path.join(assets, f), "utf8");

for (const mode of ["dark", "light"]) {
  for (const f of files) {
    const s = scheme(src[f], mode);
    const w = Number(/viewBox="0 0 (\d+)/.exec(s)[1]);
    const name = f.replace(".svg", "");
    await writeFile(path.join(out, `${name}.${mode}.desktop.png`), png(s, w));
    await writeFile(path.join(out, `${name}.${mode}.380.png`), png(s, 380));
  }
}

// ---- README composites ----
const uri = (svg) => "data:image/png;base64," + Buffer.from(png(svg, Number(/viewBox="0 0 (\d+)/.exec(svg)[1]) * 2)).toString("base64");
const dims = (s) => {
  const m = /viewBox="0 0 (\d+) (\d+)"/.exec(s);
  return [Number(m[1]), Number(m[2])];
};

function composite(mode, W, pad, mobile) {
  const page = mode === "dark" ? "#0d1117" : "#ffffff";
  const ink = mode === "dark" ? "#e6edf3" : "#1f2328";
  const inner = W - 2 * pad;
  let y = pad, parts = "";
  const img = (f, x, w) => {
    const [sw, sh] = dims(src[f]);
    const h = (sh * w) / sw;
    parts += `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${uri(scheme(src[f], mode))}"/>`;
    return h;
  };
  const heading = (t) => {
    y += 22;
    parts += `<text x="${W / 2}" y="${y + 18}" text-anchor="middle" font-family="Segoe UI,Arial" font-size="24" font-weight="600" fill="${ink}">${t}</text>`;
    parts += `<line x1="${pad}" x2="${W - pad}" y1="${y + 30}" y2="${y + 30}" stroke="${mode === "dark" ? "#30363d" : "#d0d7de"}"/>`;
    y += 46;
  };
  const row = (f) => { const nw = Math.min(inner, dims(src[f])[0]); y += img(f, (W - nw) / 2, nw) + 8; };
  row("header.svg"); row("typing.svg"); row("telemetry.svg");
  heading("Missions");
  const cw = 392, sc = mobile ? inner : cw;
  const cards = ["mission-1.svg", "mission-2.svg", "mission-3.svg", "mission-4.svg"];
  if (mobile) cards.forEach((f) => { y += img(f, pad, sc) + 10; });
  else for (let i = 0; i < 4; i += 2) {
    const x0 = (W - 2 * cw - 8) / 2;
    const h = img(cards[i], x0, cw); img(cards[i + 1], x0 + cw + 8, cw);
    y += h + 10;
  }
  heading("Instrument Panel"); row("instruments.svg");
  heading("Live Telemetry"); row("streak.svg");
  if (mobile) { y += img("languages.svg", pad, inner) + 10; y += img("activity.svg", pad, inner) + 10; }
  else { const x0 = (W - 2 * cw - 8) / 2; const h = img("languages.svg", x0, cw); img("activity.svg", x0 + cw + 8, cw); y += h + 10; }
  heading("Contact"); row("footer.svg");
  const H = Math.ceil(y + pad);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${page}"/>${parts}</svg>`;
}

for (const mode of ["dark", "light"]) {
  await writeFile(path.join(out, `README.${mode}.desktop.png`), png(composite(mode, 880, 20, false), 880));
  await writeFile(path.join(out, `README.${mode}.380.png`), png(composite(mode, 380, 20, true), 380));
}
console.log(`rendered ${files.length} svgs x 4 + 4 README composites -> preview/`);

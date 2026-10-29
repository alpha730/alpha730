// Builds every static SVG in assets/ from profile.config.json.
// Live-stat SVGs are only created here as placeholders if they don't exist yet.
//
// Minimum text sizes keep real text >= 10px when shown 380px wide:
// 800-wide art -> >= 22px, 480-wide -> >= 14px, 392-wide banners -> >= 13px.
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { docInk, esc, wrap, dot, tag, tilesPanel, CW } from "./lib/svg.mjs";
import { artRows, radialPulse, flipbook, dividerRows, rowSvg } from "./lib/ascii.mjs";
import { wall, ravenEye, horn, dragon, tower, flyingRaven } from "./lib/emblems.mjs";
import { streakSvg, langSvg, activitySvg } from "./lib/live.mjs";
import { heroSvg } from "./lib/hero.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(await readFile(path.join(root, "profile.config.json"), "utf8"));
const out = path.join(root, "assets");
await mkdir(out, { recursive: true });
const write = (name, svg) => writeFile(path.join(out, name), svg);
const { person } = cfg;

// A pulsing emblem as a flipbook group at (x, y).
function emblem(e, id, x, y, frames = 8, period = 12) {
  const pulse = radialPulse({ ...e.center, cw: e.cw, ch: e.ch, frames, lambda: 120 });
  const fb = flipbook({ id, frames, period, render: (k) => artRows(e.values, e.C, e.R, e.cw, e.ch, pulse(k)) });
  return { svg: `<g transform="translate(${x} ${y})" class="ink" font-size="10" xml:space="preserve">${fb.svg}</g>`, css: fb.css, mot: fb.mot };
}

// Static dithered strip (decorative), `cols` cells wide at (x, y).
const strip = (cols, x, y, seed) =>
  `<g class="mu" font-size="10" xml:space="preserve">${dividerRows(cols, 1, seed).map((r) => rowSvg(r, x, y, 6)).join("")}</g>`;

// ---------- The Maester's Ledger (800 wide, 3 tiles) ----------
function ledger() {
  const w = 800, h = 222;
  const body = tilesPanel({
    title: "THE MAESTER'S LEDGER",
    tiles: cfg.ledger.map((t) => ({ value: t.value, label: t.label.join(" "), key: t.key })),
    extra: strip(126, 24, 206, 21),
  });
  return docInk({
    w, h, round: 8,
    title: "The Maester's Ledger",
    desc: "Key numbers: " + cfg.ledger.map((t) => `${t.value} ${t.label.join(" ").toLowerCase()}`).join(", ") + ".",
    body,
  });
}

// ---------- the four banners (392 wide, swallowtail bottom) ----------
const BW = 392, PAD = 18, EMBLEMS = { wall, raven: ravenEye, horn, dragon };
function banner(m, i, H) {
  const els = [];
  els.push(`<text x="${PAD}" y="27" font-size="13" letter-spacing="1.5" class="ink b">${esc(m.banner)}</text>`, dot(BW - 24, 22, 4.5));
  const em = emblem(EMBLEMS[m.emblem](), "fe", 16, 38);
  els.push(em.svg);
  let y = 154;
  for (const l of wrap(m.title, Math.floor((BW - 2 * PAD) / (16 * CW)))) {
    els.push(`<text x="${PAD}" y="${y}" font-size="16" class="ink b">${esc(l)}</text>`);
    y += 21;
  }
  y += 3;
  for (const l of wrap(m.description, Math.floor((BW - 2 * PAD) / (13 * CW)))) {
    els.push(`<text x="${PAD}" y="${y}" font-size="13" class="mu">${esc(l)}</text>`);
    y += 19;
  }
  y += 5;
  if (m.result) {
    const lines = wrap(m.result, Math.floor((BW - 2 * PAD - 26) / (13 * CW)));
    const bh = lines.length * 18 + 14;
    els.push(`<rect x="${PAD + 0.5}" y="${y + 0.5}" width="${BW - 2 * PAD}" height="${bh}" rx="3" fill="none" class="s-rd" stroke-width="1.5"/>`);
    lines.forEach((l, k) => els.push(`<text x="${PAD + 12}" y="${y + 20 + k * 18}" font-size="13" class="ink">${esc(l)}</text>`));
    y += bh + 14;
  }
  // Lay out the stack tags from y0; returns the bottom edge. draw=false only measures.
  const tags = (y0, fs, draw = true) => {
    const inset = m.result ? 0 : 12;
    let x = PAD + inset, yy = y0, th = 0;
    for (const s of m.stack) {
      let t = tag(x, yy, s, fs);
      if (x + t.w > BW - PAD - inset) {
        x = PAD + inset;
        yy += t.h + 6;
        t = tag(x, yy, s, fs);
      }
      if (draw) els.push(t.svg);
      x += t.w + 6;
      th = t.h;
    }
    return yy + th;
  };
  let need, Hh, ly;
  if (m.result) {
    y = tags(y, 13) + 16;
    need = y + 52;
    Hh = Math.max(H, need);
    ly = Hh - 36;
  } else {
    // No result to show (no measured metric yet): a framed stack + repo block, centred
    // in the space the result box takes on the other banners. Only existing facts.
    const blockH = 34 + (tags(0, 15, false) - 0) + 36; // label + tag rows + repo line
    need = y + blockH + 16 + 52;
    Hh = Math.max(H, need);
    ly = Hh - 36;
    const top = y, bottom = ly - 34;
    els.push(`<rect x="${PAD + 0.5}" y="${top + 0.5}" width="${BW - 2 * PAD}" height="${bottom - top}" rx="3" fill="none" class="s-ink" stroke-opacity=".4" stroke-dasharray="4 4"/>`);
    const y0 = top + (bottom - top - blockH) / 2;
    els.push(`<text x="${PAD + 12}" y="${y0 + 22}" font-size="13" letter-spacing="1.5" class="mu">STACK</text>`);
    const tagsEnd = tags(y0 + 34, 15);
    els.push(`<text x="${PAD + 12}" y="${tagsEnd + 28}" font-size="13" class="mu">REPO  <tspan class="ink">${esc(m.repo)}</tspan></text>`);
  }
  els.push(
    `<line x1="${PAD}" y1="${ly - 20}" x2="${BW - PAD}" y2="${ly - 20}" class="s-ink" opacity=".25"/>`,
    `<text x="${PAD}" y="${ly}" font-size="13" class="ink">&gt; ${esc(person.github)}/${esc(m.repo)}</text>`,
  );
  const shape = `<path d="M10.5 .5H${BW - 10.5}Q${BW - 0.5} .5 ${BW - 0.5} 10.5V${Hh - 0.5}L${BW / 2} ${Hh - 16}L.5 ${Hh - 0.5}V10.5Q.5 .5 10.5 .5Z" class="bg s-ink" stroke-opacity=".35"/>`;
  return { need, svg: shape + els.join("\n"), css: em.css, mot: em.mot, H: Hh };
}
async function banners() {
  const H = Math.max(...cfg.missions.map((m, i) => banner(m, i, 0).need));
  for (const [i, m] of cfg.missions.entries()) {
    const b = banner(m, i, H);
    await write(
      `mission-${i + 1}.svg`,
      docInk({
        w: BW, h: H, frame: false, bg: false,
        title: `${m.banner}: ${m.title}`,
        desc: `Banner ${m.banner} with an ASCII emblem. ${m.title}. ${m.description}${m.result ? " " + m.result + "." : ""} Stack: ${m.stack.join(", ")}.`,
        css: b.css, mot: b.mot, body: b.svg,
      }),
    );
  }
}

// ---------- The Citadel: skills as chain links (480 wide) ----------
function citadel() {
  const w = 480, fs = 15, lx = 24, cx0 = 162, right = w - 20;
  const tw_ = emblem(tower(), "ft", 372, 10);
  const els = [`<text x="${lx}" y="36" font-size="15" letter-spacing="2" class="ink b">THE CITADEL</text>`, tw_.svg];
  let y = 64;
  for (const row of cfg.citadel) {
    els.push(`<circle cx="${lx + 4}" cy="${y + 8}" r="3.5" class="rd"/>`);
    els.push(`<text x="${lx + 14}" y="${y + 18}" font-size="15" class="ink b">${esc(row.label)}</text>`);
    let x = cx0, prev = false;
    for (const it of row.items) {
      const iw = Math.round(it.length * fs * CW + 22);
      if (x + iw > right) {
        x = cx0;
        y += 36;
        prev = false;
      }
      if (prev) els.push(`<ellipse cx="${x - 8}" cy="${y + 14}" rx="10" ry="4.5" fill="none" class="s-ink" stroke-width="1.5" opacity=".75"/>`);
      els.push(
        `<rect x="${x + 0.5}" y="${y + 0.5}" width="${iw}" height="28" rx="14" class="bg s-ink" stroke-width="1.5" stroke-opacity=".7"/>`,
        `<text x="${x + 11}" y="${y + 19}" font-size="${fs}" class="ink">${esc(it)}</text>`,
      );
      x += iw + 16;
      prev = true;
    }
    y += 44;
  }
  els.push(strip(72, 24, y + 4, 31));
  const h = y + 22;
  return docInk({
    w, h, round: 8,
    title: "The Citadel",
    desc: "Skills, linked like a maester's chain. " + cfg.citadel.map((r) => `${r.label}: ${r.items.join(", ")}.`).join(" "),
    css: tw_.css, mot: tw_.mot,
    body: els.join("\n"),
  });
}

// ---------- Send a raven (480 wide) ----------
function footer() {
  const w = 480, h = 206;
  const poses = [flyingRaven(0), flyingRaven(1)];
  const fb = flipbook({ id: "fr", frames: 4, period: 2.4, render: (k) => artRows(poses[k % 2].values, 26, 7, 6, 10) });
  const body = `
<text x="24" y="36" font-size="15" letter-spacing="2" class="ink b">SEND A RAVEN</text>
<g transform="translate(300 14)" class="ink" font-size="10" xml:space="preserve">${fb.svg}</g>
<text x="24" y="108" font-size="15" class="mu">PORTFOLIO</text>
<text x="24" y="130" font-size="15" class="ink">${esc(person.portfolio)}</text>
<text x="24" y="162" font-size="15" class="mu">GITHUB</text>
<text x="24" y="184" font-size="15" class="ink">github.com/${esc(person.github)}</text>`;
  return docInk({
    w, h, round: 8,
    title: "Send a raven",
    desc: `A raven in flight carrying a red message. Portfolio: ${person.portfolio}. GitHub: github.com/${person.github}.`,
    css: fb.css, mot: fb.mot,
    body,
  });
}

// ---------- section divider (800 wide, slow drifting dither) ----------
function divider() {
  const w = 800, h = 28, cols = 128;
  const fb = flipbook({
    id: "fd", frames: 6, period: 9,
    render: (k) => dividerRows(cols, 2, 41, k / 6).map((r, i) => rowSvg(r, 16, 12 + i * 10, 6)).join(""),
  });
  return docInk({
    w, h, frame: false, bg: false, // transparent: sits on GitHub's own page colour
    title: "Divider",
    desc: "A thin dithered ASCII ink strip separating sections.",
    css: fb.css, mot: fb.mot,
    body: `<g class="mu" font-size="10" xml:space="preserve">${fb.svg}</g>`,
  });
}

// `--only=header` rebuilds just the hero (used while iterating on the theme).
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
await write("header.svg", heroSvg(person));
if (only === "header") {
  console.log("header built");
  process.exit(0);
}
await write("telemetry.svg", ledger());
await banners();
await write("instruments.svg", citadel());
await write("footer.svg", footer());
await write("divider.svg", divider());
await rm(path.join(out, "typing.svg"), { force: true }); // role line now lives in the hero

// Live-stat SVGs: re-rendered from the last fetched data (assets/live-data.json,
// written by live-stats.mjs) so they follow theme changes; placeholders until then.
let live = {};
try { live = JSON.parse(await readFile(path.join(out, "live-data.json"), "utf8")); } catch {}
await write("streak.svg", streakSvg(live.streak ?? null));
await write("languages.svg", langSvg(live.languages ?? null));
await write("activity.svg", activitySvg(live.activity ?? null));
console.log("assets built");

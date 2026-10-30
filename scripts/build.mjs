// Builds every SVG in assets/ and README.md from profile.config.json.
//
// Minimum text sizes keep real text >= 10px when shown 330px wide (GitHub on a phone):
// 800-wide art -> >= 26px (or a narrow-width layout), 480-wide -> >= 15px.
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { docInk, esc, CW } from "./lib/svg.mjs";
import { artRows, radialPulse, flipbook, dividerRows, rowSvg } from "./lib/ascii.mjs";
import { anvil, flyingRaven } from "./lib/emblems.mjs";
import { realm, chapterWall, chapterRaven, chapterHorn, chapterDragon } from "./lib/chapters.mjs";
import { streakSvg, langSvg, activitySvg } from "./lib/live.mjs";
import { heroSvg } from "./lib/hero.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(await readFile(path.join(root, "profile.config.json"), "utf8"));
const out = path.join(root, "assets");
await mkdir(out, { recursive: true });
const write = (name, svg) => writeFile(path.join(out, name), svg);
const { person, missions } = cfg;
const repoUrl = (m) => `https://github.com/${person.github}/${m.repo}`;
const NUM = ["I", "II", "III", "IV"];

// Static dithered strip (decorative), `cols` cells wide at (x, y).
const strip = (cols, x, y, seed) =>
  `<g class="mu" font-size="10" xml:space="preserve">${dividerRows(cols, 1, seed).map((r) => rowSvg(r, x, y, 6)).join("")}</g>`;

// Which projects use a skill: exact stack match, or a "/"-joined skill naming it.
const usedBy = (skill) =>
  missions.flatMap((m, i) => (m.stack.some((s) => s === skill || skill.split("/").includes(s)) ? [NUM[i]] : []));

// ---------- The Forge: skills, marked with the projects that used them (480 wide) ----------
function forge() {
  const w = 480, fs = 15, lx = 24, cx0 = 162, right = w - 20;
  const a = anvil();
  const pulse = radialPulse({ ...a.center, cw: 6, ch: 10, frames: 6, lambda: 60 });
  const fb = flipbook({ id: "fa", frames: 6, period: 6, render: (k) => artRows(a.values, a.C, a.R, 6, 10, pulse(k)) });
  const els = [
    `<text x="${lx}" y="36" font-size="15" letter-spacing="2" class="ink b">THE FORGE</text>`,
    `<text x="${lx}" y="60" font-size="15" class="mu">numerals: the keeps it was used in</text>`,
    `<g transform="translate(372 10)" class="ink" font-size="10" xml:space="preserve">${fb.svg}</g>`,
  ];
  let y = 92;
  for (const row of cfg.forge) {
    els.push(`<circle cx="${lx + 4}" cy="${y + 9}" r="3.5" class="rd"/>`);
    els.push(`<text x="${lx + 14}" y="${y + 19}" font-size="15" class="ink b">${esc(row.label)}</text>`);
    let x = cx0, prev = false;
    for (const it of row.items) {
      const marks = usedBy(it).join("·");
      const label = marks ? `${it} ${marks}` : it;
      const iw = Math.round(label.length * fs * CW + 22);
      if (x + iw > right) {
        x = cx0;
        y += 36;
        prev = false;
      }
      if (prev) els.push(`<ellipse cx="${x - 8}" cy="${y + 14}" rx="10" ry="4.5" fill="none" class="s-ink" stroke-width="1.5" opacity=".75"/>`);
      els.push(
        `<rect x="${x + 0.5}" y="${y + 0.5}" width="${iw}" height="28" rx="14" class="bg ${marks ? "s-rd" : "s-ink"}" stroke-width="1.5" stroke-opacity="${marks ? 1 : 0.6}"/>`,
        `<text x="${x + 11}" y="${y + 19}" font-size="${fs}" class="ink">${esc(it)}${marks ? `<tspan class="mu" dx="9">${marks}</tspan>` : ""}</text>`,
      );
      x += iw + 16;
      prev = true;
    }
    y += 44;
  }
  els.push(strip(72, 24, y + 4, 31));
  const h = y + 22;
  const forged = cfg.forge.flatMap((r) => r.items).filter((s) => usedBy(s).length);
  return docInk({
    w, h, round: 8,
    title: "The Forge",
    desc:
      "Skills, linked like a chain; links outlined in red were used in the four projects. " +
      cfg.forge.map((r) => `${r.label}: ${r.items.map((s) => (usedBy(s).length ? `${s} (projects ${usedBy(s).join(", ")})` : s)).join(", ")}.`).join(" ") +
      ` Used in projects: ${forged.join(", ")}.`,
    css: fb.css, mot: fb.mot,
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

// ---------- section divider (800 wide, slow drifting dither, transparent) ----------
function divider() {
  const w = 800, h = 28, cols = 128;
  const fb = flipbook({
    id: "fd", frames: 6, period: 9,
    render: (k) => dividerRows(cols, 2, 41, k / 6).map((r, i) => rowSvg(r, 16, 12 + i * 10, 6)).join(""),
  });
  return docInk({
    w, h, frame: false, bg: false,
    title: "Divider",
    desc: "A thin dithered ASCII ink strip separating sections.",
    css: fb.css, mot: fb.mot,
    body: `<g class="mu" font-size="10" xml:space="preserve">${fb.svg}</g>`,
  });
}

// ---------- README.md, generated so its text always matches the art ----------
const htmlEsc = (s) => esc(s).replace(/&quot;/g, '"');
const CHAPTER_ALT = [
  "Chapter I, The Wall: 600 ASCII arrows, one per attacked run, strike a wall and none get through. 0 of 600 attacked runs led to a harmful action; task success 96.5-100%; 5 injection styles, 2 defenses.",
  "Chapter II, The Raven's Eye: a SAR speckle tile and an optical field tile feed a raven's red eye, labelled VQA, visual question answering. Agentic Earth observation.",
  "Chapter III, The Horn: speech waves in Hindi, English and Marwari flow into a sealed scroll, a structured health record, beside 139 tally marks for 139 automated tests. IMNCI triage, source-cited.",
  "Chapter IV, Dragonfire: a dragon caught in an AR viewfinder, five growing streak flames, and the date it was played at a campus event, Oct 22, 2026. Scan posters, catch Lingos.",
];
function readme() {
  const img = (src, alt, width) => `<img src="${src}" alt="${htmlEsc(alt)}" width="${width}">`;
  const div = img("assets/divider.svg", "Dithered ink divider", 800);
  const chapters = missions
    .map((m, i) => {
      const lines = [
        `<a href="${repoUrl(m)}">${img(`assets/chapter-${i + 1}.svg`, CHAPTER_ALT[i], 800)}</a>`,
        "",
        `<p align="center"><a href="${repoUrl(m)}"><b>${htmlEsc(m.title)}</b></a><br>`,
        `${htmlEsc(m.description)}${m.result ? `<br><i>${htmlEsc(m.result.replace(/\.$/, ""))}.</i>` : ""}<br>`,
        `${m.stack.map((s) => `<code>${htmlEsc(s)}</code>`).join(" · ")}</p>`,
      ];
      if (!m.result) lines.push("<!-- TODO: add metric -->");
      return lines.join("\n");
    })
    .join(`\n\n${div}\n\n`);
  return `<!-- Generated by scripts/build.mjs from profile.config.json. Edit the config, then run npm run build. -->
<div align="center">

${img("assets/header.svg", `ASCII-art weirwood heart tree with blood-red leaves and a raven crossing the moon, beside the name ${person.name}, GitHub @${person.github}, and the line: ${person.role}`, 800)}

${img("assets/realm.svg", "The Realm, a dithered ASCII map of four project keeps. I, The Wall: 0 of 600 attacked runs led to a harmful action. II, The Raven's Eye: SAR and optical imagery with visual question answering; a LangGraph road joins them. III, The Horn: 139 automated tests. IV, Dragonfire: played Oct 22, 2026; a TypeScript road joins those two.", 800)}

${div}

${chapters}

${div}

${img("assets/forge.svg", "The Forge: skills linked like a chain, marked with the projects that used them. Languages: Python, Java. ML/DL: PyTorch, scikit-learn. LLMs and agents: LangGraph, LangChain, CrewAI, RAG, vector DBs. Geospatial: Rasterio/GDAL, GeoPandas, Sentinel-1/2, STAC. Web: React, Node.js, Next.js, TypeScript. Tools: Git, Supabase, Vercel, Render, n8n.", 480)}

${div}

${img("assets/streak.svg", "Contribution streak panel: current streak, longest streak and total public contributions over the last 12 months", 800)}

${img("assets/languages.svg", "Top languages by share of code across public repositories", 392)}
${img("assets/activity.svg", "Weekly public contribution activity over the last 26 weeks", 392)}

${div}

${img("assets/footer.svg", `Send a raven: portfolio at ${person.portfolio.replace(/^https:\/\/|\/$/g, "")} and GitHub at github.com/${person.github}`, 480)}

<a href="${person.portfolio}">Portfolio</a> · <a href="https://github.com/${person.github}">GitHub</a>

</div>
`;
}

// `--only=header` rebuilds just the hero (used while iterating on the theme).
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
await write("header.svg", heroSvg(person));
if (only === "header") {
  console.log("header built");
  process.exit(0);
}
const CHAPTERS = { wall: chapterWall, raven: chapterRaven, horn: chapterHorn, dragon: chapterDragon };
await write("realm.svg", realm(cfg));
for (const [i, m] of missions.entries()) await write(`chapter-${i + 1}.svg`, CHAPTERS[m.chapter](m));
await write("forge.svg", forge());
await write("footer.svg", footer());
await write("divider.svg", divider());
// assets from earlier layouts
for (const old of ["typing.svg", "telemetry.svg", "instruments.svg", "mission-1.svg", "mission-2.svg", "mission-3.svg", "mission-4.svg"])
  await rm(path.join(out, old), { force: true });

// Live-stat SVGs: re-rendered from the last fetched data (assets/live-data.json,
// written by live-stats.mjs) so they follow theme changes; placeholders until then.
let live = {};
try { live = JSON.parse(await readFile(path.join(out, "live-data.json"), "utf8")); } catch {}
await write("streak.svg", streakSvg(live.streak ?? null));
await write("languages.svg", langSvg(live.languages ?? null));
await write("activity.svg", activitySvg(live.activity ?? null));

await writeFile(path.join(root, "README.md"), readme());
console.log("assets + README built");

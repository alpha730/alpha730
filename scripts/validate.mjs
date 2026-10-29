// Sanity checks for the README, assets, config and workflow. Exits non-zero on failure.
import { readFile, readdir, stat, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = (m) => errors.push(m);
const exists = (p) => access(p).then(() => true, () => false);

// ---- README ----
const readme = await readFile(path.join(root, "README.md"), "utf8");
if (/<\s*script/i.test(readme)) fail("README.md contains <script>");
if (/<\s*style/i.test(readme)) fail("README.md contains <style>");
if (/\son[a-z]+\s*=/i.test(readme.replace(/<!--[\s\S]*?-->/g, ""))) fail("README.md contains inline event handlers");
if (!readme.includes("<!-- TODO: add metric -->")) fail("README.md is missing the TODO metric comment");

const imgs = [...readme.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
if (!imgs.length) fail("no <img> tags found");
const used = new Set();
for (const t of imgs) {
  const src = /src="([^"]*)"/.exec(t)?.[1];
  const alt = /alt="([^"]*)"/.exec(t)?.[1];
  if (!src) fail(`img without src: ${t.slice(0, 60)}`);
  else {
    used.add(src);
    if (!(await exists(path.join(root, src)))) fail(`image path does not resolve: ${src}`);
  }
  if (!alt || alt.trim().length < 10) fail(`missing or too-short alt text for ${src}`);
}

// ---- assets ----
const HERO_CAP = 150 * 1024, CAP = 60 * 1024;
const dir = path.join(root, "assets");
const svgs = {};
for (const f of await readdir(dir)) {
  if (!f.endsWith(".svg")) continue;
  const p = path.join(dir, f);
  const size = (await stat(p)).size;
  const cap = f === "header.svg" ? HERO_CAP : CAP;
  if (size > cap) fail(`${f} is ${size} bytes (cap ${cap})`);
  const s = await readFile(p, "utf8");
  svgs[f] = s;
  if (/<script/i.test(s)) fail(`${f} contains <script>`);
  const [w] = (/viewBox="0 0 ([\d.]+)/.exec(s) ?? [, 0]).slice(1).map(Number);
  if (!w || w > 800) fail(`${f} width ${w} is missing or >800`);
  if (!/<title id="t">[^<]+/.test(s) || !/<desc id="d">[^<]+/.test(s)) fail(`${f} lacks <title>/<desc>`);
  if (!s.includes("prefers-color-scheme: light")) fail(`${f} lacks a light-mode rule`);
  if (/(?:href|src)="https?:|url\(\s*["']?https?:|@import/i.test(s)) fail(`${f} references an external resource`);

  // every animation must live inside the reduced-motion guard
  const guard = s.indexOf("@media (prefers-reduced-motion: no-preference)");
  const outside = guard < 0 ? s : s.slice(0, guard);
  if (/animation\s*:|@keyframes/.test(outside)) fail(`${f} has animation outside the prefers-reduced-motion guard`);
  if (guard < 0 && /animation/.test(s)) fail(`${f} animates without a reduced-motion rule`);

  // Real text must stay >= 10px at GitHub's phone width (~330px shown). Text in a
  // wide-only (.wd) element or group is hidden below 520px, so it is checked at 521px.
  // ASCII art sets its size on a <g>, so only <text font-size> is checked.
  const PHONE = 330;
  const wideRanges = [];
  for (const g of s.matchAll(/<g class="[^"]*\bwd\b[^"]*">/g)) {
    let depth = 0, i = g.index;
    const re = /<g\b|<\/g>/g;
    re.lastIndex = i;
    for (let t; (t = re.exec(s)); ) {
      depth += t[0] === "</g>" ? -1 : 1;
      if (!depth) { wideRanges.push([i, t.index]); break; }
    }
  }
  for (const m of s.matchAll(/<text\b[^>]*\bfont-size="([\d.]+)"[^>]*>/g)) {
    const wideOnly = /class="[^"]*\bwd\b/.test(m[0]) || wideRanges.some(([a, b]) => m.index > a && m.index < b);
    const shown = wideOnly ? 521 : PHONE;
    const px = (Number(m[1]) * Math.min(shown, w)) / w;
    if (px < 10) {
      fail(`${f}: ${m[1]}px text is ${px.toFixed(1)}px when shown ${shown}px wide`);
      break;
    }
  }
  if (!used.has(`assets/${f}`)) console.warn(`note: assets/${f} is not referenced by README.md`);
}
if (await exists(path.join(dir, "typing.svg"))) fail("assets/typing.svg should be removed (role line lives in the hero)");

// ---- coding-only scope: resume details must be gone ----
// "JECRC" is tolerated only on a line that is the Dragonfire campus-event fact.
const BANNED = [/CGPA/i, /B\.Tech/i, /JECRC/i, /Qualfocus/i, /\bIBM\b/, /Coursera/i, /Certificate/i];
const scoped = { "README.md": readme, "profile.config.json": await readFile(path.join(root, "profile.config.json"), "utf8") };
for (const [f, s] of Object.entries(svgs)) scoped[`assets/${f}`] = s;
for (const [f, s] of Object.entries(scoped))
  for (const line of s.split("\n"))
    for (const re of BANNED) {
      if (!re.test(line)) continue;
      if (re.source === "JECRC" && /campus event/i.test(line)) continue;
      fail(`${f} mentions removed resume detail ${re}: "${line.trim().slice(0, 70)}"`);
    }

// ---- workflow ----
const wf = await readFile(path.join(root, ".github/workflows/update-profile.yml"), "utf8");
if (!wf.includes("[skip ci]")) fail("workflow commit message lacks [skip ci]");
if (!/git add -- assets\//.test(wf)) fail("workflow must stage only assets/");
if (!/cron:/.test(wf) || !/workflow_dispatch/.test(wf)) fail("workflow needs schedule + workflow_dispatch");

// no tokens anywhere in hand-written files
for (const f of ["README.md", "SETUP.md", "profile.config.json", ".github/workflows/update-profile.yml"]) {
  const t = await readFile(path.join(root, f), "utf8");
  if (/gh[pousr]_[A-Za-z0-9]{20,}|github_pat_/.test(t)) fail(`${f} looks like it contains a token`);
}

if (errors.length) {
  console.error("VALIDATION FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}
console.log(
  `validation passed: ${imgs.length} images with alt text, ${Object.keys(svgs).length} SVGs within size caps, ` +
    "motion guarded, text >= 10px at 330px, no resume details, no script/style in README",
);

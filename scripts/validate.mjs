// Sanity checks for the README, assets and workflow. Exits non-zero on failure.
import { readFile, readdir, stat, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = (m) => errors.push(m);
const exists = (p) => access(p).then(() => true, () => false);

const readme = await readFile(path.join(root, "README.md"), "utf8");
if (/<\s*script/i.test(readme)) fail("README.md contains <script>");
if (/<\s*style/i.test(readme)) fail("README.md contains <style>");
if (/\son[a-z]+\s*=/i.test(readme.replace(/<!--[\s\S]*?-->/g, ""))) fail("README.md contains inline event handlers");
if (!readme.includes("<!-- TODO: add metric -->")) fail("README.md is missing the TODO metric comment");

const imgs = [...readme.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
if (!imgs.length) fail("no <img> tags found");
const used = new Set();
for (const tag of imgs) {
  const src = /src="([^"]*)"/.exec(tag)?.[1];
  const alt = /alt="([^"]*)"/.exec(tag)?.[1];
  if (!src) fail(`img without src: ${tag.slice(0, 60)}`);
  else {
    used.add(src);
    if (!(await exists(path.join(root, src)))) fail(`image path does not resolve: ${src}`);
  }
  if (!alt || alt.trim().length < 10) fail(`missing or too-short alt text for ${src}`);
}

const dir = path.join(root, "assets");
for (const f of await readdir(dir)) {
  const p = path.join(dir, f);
  const size = (await stat(p)).size;
  if (size > 200 * 1024) fail(`${f} is ${size} bytes (>200KB)`);
  if (!f.endsWith(".svg")) continue;
  const s = await readFile(p, "utf8");
  if (/<script/i.test(s)) fail(`${f} contains <script>`);
  const w = Number(/viewBox="0 0 (\d+)/.exec(s)?.[1]);
  if (!w || w > 800) fail(`${f} width ${w} is missing or >800`);
  if (!/<title id="t">[^<]+/.test(s) || !/<desc id="d">[^<]+/.test(s)) fail(`${f} lacks <title>/<desc>`);
  if (!s.includes("prefers-color-scheme: light")) fail(`${f} lacks a light-mode rule`);
  if (!s.includes("prefers-reduced-motion")) fail(`${f} lacks a reduced-motion rule`);
  if (/<style[^>]*>[\s\S]*@import|url\(\s*["']?https?:/i.test(s)) fail(`${f} loads an external resource`);
  if (!used.has(`assets/${f}`)) console.warn(`note: assets/${f} is not referenced by README.md`);
}

const wf = await readFile(path.join(root, ".github/workflows/update-profile.yml"), "utf8");
if (!wf.includes("[skip ci]")) fail("workflow commit message lacks [skip ci]");
if (!/git add -- assets\//.test(wf)) fail("workflow must stage only assets/");
if (!/cron:/.test(wf) || !/workflow_dispatch/.test(wf)) fail("workflow needs schedule + workflow_dispatch");

// no tokens anywhere in tracked-looking files
for (const f of ["README.md", "SETUP.md", "profile.config.json", ".github/workflows/update-profile.yml"]) {
  const t = await readFile(path.join(root, f), "utf8");
  if (/gh[pousr]_[A-Za-z0-9]{20,}|github_pat_/.test(t)) fail(`${f} looks like it contains a token`);
}

if (errors.length) {
  console.error("VALIDATION FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}
console.log(`validation passed: ${imgs.length} images, all alt text present, SVGs <=200KB, no script/style in README`);

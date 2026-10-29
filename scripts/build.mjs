// Builds every static SVG in assets/ from profile.config.json.
// Live-stat SVGs are only created here as placeholders if they don't exist yet.
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { doc, esc, wrap, led, chip, globe, orbit, CW } from "./lib/svg.mjs";
import { streakSvg, langSvg, activitySvg } from "./lib/live.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(await readFile(path.join(root, "profile.config.json"), "utf8"));
const out = path.join(root, "assets");
await mkdir(out, { recursive: true });
const write = (name, svg) => writeFile(path.join(out, name), svg);
const { person } = cfg;

// ---------- header (800 x 250) ----------
function header() {
  const w = 800, h = 250, cx = 628, cy = 142;
  const body = `
<text x="24" y="25" font-size="13" letter-spacing="2" class="f-mu">SATELLITE MISSION CONTROL // GND-STN</text>
${led(716, 20, "f-gr", "led", 4)}${led(738, 20, "f-am", "led2", 4)}${led(760, 20, "f-cy", "led3", 4)}
<line x1="0" y1="38" x2="${w}" y2="38" class="s-ln"/>
<text x="30" y="128" font-size="60" class="f-tx b">ARYAN KUMAR</text>
<text x="32" y="168" font-size="26" class="f-am">@${esc(person.github)}</text>
${led(38, 212, "f-gr", "led", 6)}
<text x="56" y="218" font-size="18" letter-spacing="1" class="f-gr">TELEMETRY: NOMINAL</text>
${globe(cx, cy, 38)}
${orbit(cx, cy, 66, "sp1", "f-am", 20)}
${orbit(cx, cy, 98, "sp2", "f-cy", 200)}
<circle cx="${cx}" cy="${cy}" r="3" class="f-gr pulse"/>`;
  return doc({
    w, h, round: 10,
    title: `${person.name} — mission control header`,
    desc: `Satellite mission control banner for ${person.name}, GitHub alpha730, with a globe and two orbit rings and a status line reading telemetry nominal.`,
    body,
  });
}

// ---------- typing line (800 x 56) ----------
function typing() {
  const fs = 23, cw = fs * CW, prefix = "> ";
  const n = prefix.length + person.role.length;
  const D = (n * cw).toFixed(1);
  const roleSvg = person.role
    .split("·")
    .map((p, i, a) => `<tspan class="f-am">${esc(p.trim())}</tspan>${i < a.length - 1 ? '<tspan class="f-cy"> · </tspan>' : ""}`)
    .join("");
  const body = `
<text x="24" y="37" font-size="${fs}" xml:space="preserve"><tspan class="f-gr">&gt; </tspan>${roleSvg}</text>
<rect class="cover tw f-bg" transform="translate(2000 0)" x="24" y="10" width="770" height="36"/>
<g class="tw"><g class="cursor"><rect x="24" y="14" width="${(cw * 0.7).toFixed(1)}" height="28" class="f-gr"/></g></g>`;
  return doc({
    w: 800, h: 56, round: 8,
    title: person.role,
    desc: `Role line typed out as a terminal prompt: ${person.role}.`,
    css: "",
    mot: `
@keyframes type{0%{transform:translateX(0);animation-timing-function:steps(${n},end)}45%{transform:translateX(${D}px)}100%{transform:translateX(${D}px)}}
@keyframes cur{0%,49%{opacity:1}50%,100%{opacity:0}}
.tw{animation:type 9s infinite}.cursor{opacity:1;animation:cur .9s infinite}`,
    body,
  });
}

// ---------- telemetry strip (800 x 172) ----------
function telemetry() {
  let body = "";
  cfg.telemetry.forEach((t, i) => {
    const x = 12 + i * 194;
    body += `
<rect x="${x}" y="14" width="182" height="144" rx="6" class="f-pn s-ln"/>
${led(x + 164, 32, "f-gr", ["led", "led2", "led3", "led"][i])}
<text x="${x + 14}" y="74" font-size="44" class="f-${t.tone} b">${esc(t.value)}</text>
<text x="${x + 14}" y="102" font-size="19" class="f-tx">${esc(t.label[0])}</text>
<text x="${x + 14}" y="124" font-size="19" class="f-tx">${esc(t.label[1])}</text>
<path d="M${x + 16} 142 h24 l6 -8 l8 14 l8 -10 l6 4 h${182 - 16 - 24 - 6 - 8 - 8 - 6 - 8 - 16 + 8}" fill="none" class="s-${t.tone} march" stroke-width="1.6" stroke-dasharray="18 4" opacity=".8"/>`;
  });
  return doc({
    w: 800, h: 172, round: 8,
    title: "Telemetry strip",
    desc: "Key numbers: 660 evaluation runs, 0 of 600 attacked runs led to a harmful action, 139 automated tests, CGPA 8.3 out of 10.",
    body,
  });
}

// ---------- mission cards (392 wide) ----------
const CARD_W = 392, PAD = 18;
function card(m, i, H) {
  const els = [];
  let y = 30;
  els.push(`<text x="${PAD}" y="${y}" font-size="12" letter-spacing="1.5" class="f-am b">MISSION ${String(i + 1).padStart(2, "0")}</text>`);
  els.push(led(CARD_W - 24, y - 4, "f-gr", ["led", "led2", "led3", "led"][i], 4.5));
  els.push(`<line x1="${PAD}" y1="42" x2="${CARD_W - PAD}" y2="42" class="s-ln"/>`);
  y = 68;
  for (const l of wrap(m.title, Math.floor((CARD_W - 2 * PAD) / (16 * CW)))) {
    els.push(`<text x="${PAD}" y="${y}" font-size="16" class="f-tx b">${esc(l)}</text>`);
    y += 21;
  }
  y += 3;
  for (const l of wrap(m.description, Math.floor((CARD_W - 2 * PAD) / (13 * CW)))) {
    els.push(`<text x="${PAD}" y="${y}" font-size="13" class="f-mu">${esc(l)}</text>`);
    y += 19;
  }
  y += 5;
  if (m.result) {
    const lines = wrap(m.result.text, Math.floor((CARD_W - 2 * PAD - 26) / (13 * CW)));
    const bh = lines.length * 18 + 14;
    els.push(`<rect x="${PAD}" y="${y}" width="${CARD_W - 2 * PAD}" height="${bh}" rx="4" class="f-bg s-${m.result.tone}" stroke-width="1"/>`);
    lines.forEach((l, k) => els.push(`<text x="${PAD + 12}" y="${y + 20 + k * 18}" font-size="13" class="f-${m.result.tone}">${esc(l)}</text>`));
    y += bh + 14;
  }
  let x = PAD;
  for (const s of m.stack) {
    const c = chip(x, y, s, 12);
    if (x + c.w > CARD_W - PAD) {
      x = PAD;
      y += 28;
      els.push(chip(x, y, s, 12).svg);
      x += c.w + 6;
    } else {
      els.push(c.svg);
      x += c.w + 6;
    }
  }
  y += 22 + 18;
  const need = y + 38;
  const ly = Math.max(H, need) - 18;
  const link = m.repo
    ? `<text x="${PAD}" y="${ly}" font-size="13" class="f-cy">&gt; open ${esc(person.github)}/${esc(m.repo)}</text>`
    : `<text x="${PAD}" y="${ly}" font-size="13" class="f-am">&gt; repo link: TODO</text>`;
  els.push(`<line x1="${PAD}" y1="${ly - 20}" x2="${CARD_W - PAD}" y2="${ly - 20}" class="s-ln"/>`, link);
  return { need, els };
}
function missions() {
  const H = Math.max(...cfg.missions.map((m, i) => card(m, i, 0).need));
  cfg.missions.forEach((m, i) => {
    const { els } = card(m, i, H);
    const svg = doc({
      w: CARD_W, h: H, round: 10,
      title: `Mission ${i + 1}: ${m.title}`,
      desc: `${m.title}. ${m.description}${m.result ? " " + m.result.text : ""} Stack: ${m.stack.join(", ")}.`,
      body: `<rect x="1" y="1" width="${CARD_W - 2}" height="${H - 2}" rx="10" class="f-pn"/>` + els.join("\n"),
    });
    writeFile(path.join(out, `mission-${i + 1}.svg`), svg);
  });
}

// ---------- instrument panel + flight log (480 wide, stacked for phones) ----------
function instruments() {
  const w = 480, fs = 14, inner = w - 48;
  const els = [];
  els.push(`<text x="24" y="30" font-size="13" letter-spacing="2" class="f-am b">INSTRUMENT PANEL</text>`);
  els.push(`<line x1="0" y1="42" x2="${w}" y2="42" class="s-ln"/>`);
  let y = 66;
  cfg.instruments.forEach((row, i) => {
    els.push(led(30, y - 5, "f-gr", ["led", "led2", "led3"][i % 3], 4));
    els.push(`<text x="42" y="${y}" font-size="15" class="f-tx b">${esc(row.label)}</text>`);
    y += 10;
    let x = 24;
    for (const it of row.items) {
      const c = chip(x, y, it, fs);
      if (x + c.w > w - 24) { x = 24; y += c.h + 6; els.push(chip(x, y, it, fs).svg); }
      else els.push(c.svg);
      x += c.w + 6;
    }
    y += 24 + 28;
  });
  els.push(`<line x1="0" y1="${y - 10}" x2="${w}" y2="${y - 10}" class="s-ln"/>`);
  y += 18;
  els.push(`<text x="24" y="${y}" font-size="13" letter-spacing="2" class="f-am b">FLIGHT LOG</text>`);
  y += 26;
  for (const [tag, text] of [["EDU", cfg.education], ["EXP", cfg.experience], ["CERT", cfg.certification]]) {
    els.push(`<text x="24" y="${y}" font-size="${fs}" class="f-cy b">${tag}</text>`);
    y += 20;
    for (const l of wrap(text, Math.floor(inner / (fs * CW)))) {
      els.push(`<text x="24" y="${y}" font-size="${fs}" class="f-tx">${esc(l)}</text>`);
      y += 20;
    }
    y += 10;
  }
  const h = y + 4;
  return doc({
    w, h, round: 8,
    title: "Instrument panel",
    desc:
      "Skills by category. " + cfg.instruments.map((r) => `${r.label}: ${r.items.join(", ")}.`).join(" ") +
      ` Flight log: ${cfg.education}. ${cfg.experience}. ${cfg.certification}.`,
    body: els.join("\n"),
  });
}

// ---------- footer (480 x 200) ----------
function footer() {
  const w = 480, h = 200;
  const body = `
<text x="24" y="30" font-size="13" letter-spacing="2" class="f-am b">CONTACT // LINKS</text>
<line x1="0" y1="42" x2="${w}" y2="42" class="s-ln"/>
<text x="24" y="72" font-size="14" class="f-mu">PORTFOLIO</text>
<text x="24" y="94" font-size="14" class="f-cy">${esc(person.portfolio)}</text>
<text x="24" y="124" font-size="14" class="f-mu">GITHUB</text>
<text x="24" y="146" font-size="14" class="f-cy">github.com/${esc(person.github)}</text>
${led(30, 177, "f-gr", "led", 5)}
<text x="44" y="182" font-size="14" letter-spacing="2" class="f-gr">END OF TRANSMISSION</text>
${globe(404, 140, 24)}
${orbit(404, 140, 42, "sp3", "f-am", 300)}`;
  return doc({
    w, h, round: 8,
    title: "Contact and links",
    desc: `Contact panel: portfolio at ${person.portfolio} and GitHub at github.com/${person.github}. End of transmission.`,
    body,
  });
}

await write("header.svg", header());
await write("typing.svg", typing());
await write("telemetry.svg", telemetry());
missions();
await write("instruments.svg", instruments());
await write("footer.svg", footer());

// placeholders for the live-stat SVGs, never overwriting real ones
for (const [name, fn] of [["streak.svg", streakSvg], ["languages.svg", langSvg], ["activity.svg", activitySvg]]) {
  const p = path.join(out, name);
  try { await access(p); } catch { await writeFile(p, fn(null)); }
}
console.log("assets built");

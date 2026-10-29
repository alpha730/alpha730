// Renderers for the three live-stat SVGs, in the ink/dither theme. Pass `null` for a placeholder.
import { docInk, esc, tilesPanel } from "./svg.mjs";
import { ditherRows, rowSvg } from "./ascii.mjs";

const NOTE = "PUBLIC CONTRIBUTIONS ONLY";
const WAIT = "AWAITING THE FIRST RAVEN";

// 800 wide -> text >= 22px.
export function streakSvg(d) {
  const w = 800, h = 266;
  const body = tilesPanel({
    title: "THE UNBROKEN WATCH",
    tiles: [
      { label: "CURRENT STREAK", value: d ? `${d.current}d` : "--", key: !!d },
      { label: "LONGEST STREAK", value: d ? `${d.longest}d` : "--" },
      { label: "CONTRIBUTIONS", value: d ? String(d.total) : "--" },
    ],
    // the longest streak and the total both cover the API's 12-month window
    footnote: d ? [`LAST 12 MONTHS · ${NOTE}`, d.date] : [WAIT, NOTE],
  });
  return docInk({
    w, h, round: 8,
    title: "Contribution streak",
    desc: d
      ? `Current streak ${d.current} days, longest streak in the last 12 months ${d.longest} days, ${d.total} public contributions in the last 12 months.`
      : "Contribution streak panel, waiting for the first scheduled data refresh.",
    body,
  });
}

// 392 wide -> text >= 13px. Bars are dithered ASCII; the top language is red.
export function langSvg(d) {
  const w = 392, h = 292, cols = 26;
  let body = `<text x="18" y="32" font-size="13" letter-spacing="1.5" class="ink b">LANGUAGES · PUBLIC REPOS</text>`;
  const rows = d ? d.rows : [];
  if (!rows.length) body += `<text x="18" y="110" font-size="13" class="mu">${WAIT}</text>`;
  rows.forEach((r, i) => {
    const y = 66 + i * 32;
    const fill = (r.pct / rows[0].pct) * cols;
    const values = Array.from({ length: cols }, (_, c) => ({ v: c < Math.floor(fill) ? 0.86 : c < fill ? 0.5 : 0.1, red: i === 0 }));
    body += `<text x="18" y="${y + 10}" font-size="13" class="ink">${esc(r.name.slice(0, 13))}</text>
<g class="ink" font-size="10" xml:space="preserve">${rowSvg(ditherRows(values, cols, 1)[0], 130, y + 9, 6)}</g>
<text x="${w - 18}" y="${y + 10}" font-size="13" text-anchor="end" class="mu">${r.pct < 0.1 ? "&lt;0.1" : r.pct.toFixed(1)}%</text>`;
  });
  body += `<text x="18" y="${h - 16}" font-size="13" class="mu">${d ? `BY BYTES · ${d.date}` : NOTE}</text>`;
  return docInk({
    w, h, round: 8,
    title: "Top languages",
    desc: d && rows.length
      ? "Top languages by share of code across public repositories: " + rows.map((r) => `${r.name} ${r.pct.toFixed(1)}%`).join(", ") + "."
      : "Top languages panel, waiting for the first scheduled data refresh.",
    body,
  });
}

// 392 wide. One dithered ASCII column per week; the busiest week is red.
export function activitySvg(d) {
  const w = 392, h = 292, R = 13, ch = 10;
  const weeks = d ? d.weeks : new Array(26).fill(0);
  const C = weeks.length, cw = 356 / C;
  const max = Math.max(1, ...weeks);
  const values = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      const hgt = (weeks[c] / max) * R; // bar height in rows
      const fromBottom = R - 1 - r;
      values.push({ v: Math.max(0, Math.min(1, hgt - fromBottom)) * 0.9, red: !!d && weeks[c] === max });
    }
  const x0 = +(18 + cw * 0.3).toFixed(1);
  const art = ditherRows(values, C, R).map((row, r) => rowSvg(row, x0, 60 + (r + 1) * ch - 2, cw)).join("");
  const base = rowSvg({ chars: ".".repeat(C), red: new Array(C).fill(false) }, x0, 198, cw);
  const body = `<text x="18" y="32" font-size="13" letter-spacing="1.5" class="ink b">ACTIVITY · 26 WEEKS</text>
<g class="ink" font-size="10" xml:space="preserve">${art}</g>
<g class="mu" font-size="10" xml:space="preserve">${base}</g>
<text x="18" y="226" font-size="13" class="mu">26 WEEKS AGO</text>
<text x="${w - 18}" y="226" font-size="13" text-anchor="end" class="mu">NOW</text>
<text x="18" y="${h - 16}" font-size="13" class="mu">${d ? `TOTAL ${d.total} · PEAK ${max} · ${d.date}` : WAIT}</text>`;
  return docInk({
    w, h, round: 8,
    title: "Recent activity",
    desc: d
      ? `Weekly public contributions over the last 26 weeks: ${d.total} in total, busiest week ${max}.`
      : "Weekly activity chart, waiting for the first scheduled data refresh.",
    body,
  });
}

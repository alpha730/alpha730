// Renderers for the three live-stat SVGs. Pass `null` for a placeholder.
import { doc, esc, led } from "./svg.mjs";

const NOTE = "PUBLIC CONTRIBUTIONS ONLY";

export function streakSvg(d) {
  const w = 800, h = 172;
  const tiles = [
    [["CURRENT", "STREAK"], d ? `${d.current}d` : "--", "gr"],
    [["LONGEST STREAK", "LAST 12 MONTHS"], d ? `${d.longest}d` : "--", "am"],
    [["CONTRIBUTIONS", "LAST 12 MONTHS"], d ? String(d.total) : "--", "cy"],
  ];
  let body = "";
  tiles.forEach(([label, value, tone], i) => {
    const x = 13 + i * 262;
    body += `<rect x="${x}" y="14" width="250" height="122" rx="6" class="f-pn s-ln"/>
${led(x + 232, 32, "f-gr", ["led", "led2", "led3"][i])}
<text x="${x + 16}" y="70" font-size="44" class="f-${tone} b">${esc(value)}</text>
<text x="${x + 16}" y="98" font-size="18" class="f-tx">${esc(label[0])}</text>
<text x="${x + 16}" y="120" font-size="18" class="f-tx">${esc(label[1])}</text>`;
  });
  body += `<text x="16" y="159" font-size="14" class="f-mu">${d ? `${NOTE} · UPDATED ${d.date}` : "AWAITING FIRST UPLINK · " + NOTE}</text>`;
  return doc({
    w, h, round: 8,
    title: "Contribution streak",
    desc: d
      ? `Current streak ${d.current} days, longest streak in the last 12 months ${d.longest} days, ${d.total} public contributions in the last 12 months.`
      : "Contribution streak panel, waiting for the first scheduled data refresh.",
    body,
  });
}

export function langSvg(d) {
  const w = 392, h = 260;
  let body = `<text x="18" y="30" font-size="12" letter-spacing="1.5" class="f-am b">LANGUAGES // PUBLIC REPOS</text>
<line x1="18" y1="42" x2="${w - 18}" y2="42" class="s-ln"/>`;
  const rows = d ? d.rows : [];
  if (!rows.length) body += `<text x="18" y="100" font-size="14" class="f-mu">AWAITING FIRST UPLINK</text>`;
  rows.forEach((r, i) => {
    const y = 66 + i * 30;
    const bw = Math.max(3, Math.round((r.pct / rows[0].pct) * 170));
    body += `<text x="18" y="${y + 10}" font-size="13" class="f-tx">${esc(r.name.slice(0, 14))}</text>
<rect x="136" y="${y}" width="170" height="11" rx="3" class="f-ln"/>
<rect x="136" y="${y}" width="${bw}" height="11" rx="3" class="${i === 0 ? "f-gr" : "f-cy"}"/>
<text x="${w - 18}" y="${y + 10}" font-size="13" text-anchor="end" class="f-mu">${r.pct.toFixed(1)}%</text>`;
  });
  body += `<text x="18" y="${h - 14}" font-size="12" class="f-mu">${d ? `BY BYTES · UPDATED ${d.date}` : NOTE}</text>`;
  return doc({
    w, h, round: 10,
    title: "Top languages",
    desc: d && rows.length
      ? "Top languages by share of code across public repositories: " + rows.map((r) => `${r.name} ${r.pct.toFixed(1)}%`).join(", ") + "."
      : "Top languages panel, waiting for the first scheduled data refresh.",
    body,
  });
}

export function activitySvg(d) {
  const w = 392, h = 260;
  let body = `<text x="18" y="30" font-size="12" letter-spacing="1.5" class="f-am b">ACTIVITY // 26 WEEKS</text>
<line x1="18" y1="42" x2="${w - 18}" y2="42" class="s-ln"/>`;
  const weeks = d ? d.weeks : new Array(26).fill(0);
  const max = Math.max(1, ...weeks);
  const bw = 356 / weeks.length;
  weeks.forEach((v, i) => {
    const bh = Math.max(2, Math.round((v / max) * 120));
    body += `<rect x="${(18 + i * bw).toFixed(1)}" y="${196 - bh}" width="${(bw - 3.5).toFixed(1)}" height="${bh}" rx="1.5" class="${v === max && d ? "f-gr" : "f-cy"}"${v ? "" : ' opacity=".35"'}/>`;
  });
  body += `<line x1="18" y1="198" x2="${w - 18}" y2="198" class="s-mu" opacity=".5"/>
<text x="18" y="218" font-size="12" class="f-mu">26 WEEKS AGO</text>
<text x="${w - 18}" y="218" font-size="12" text-anchor="end" class="f-mu">NOW</text>
<text x="18" y="${h - 14}" font-size="12" class="f-mu">${d ? `TOTAL ${d.total} · PEAK WEEK ${max} · ${d.date}` : "AWAITING FIRST UPLINK · " + NOTE}</text>`;
  return doc({
    w, h, round: 10,
    title: "Recent activity",
    desc: d
      ? `Weekly public contributions over the last 26 weeks: ${d.total} in total, busiest week ${max}.`
      : "Weekly activity chart, waiting for the first scheduled data refresh.",
    body,
  });
}

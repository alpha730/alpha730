// Live-stat panels in the comic style. Rendered by live-stats.mjs (GitHub Action) and
// by build.mjs from assets/live-data.json. Pass `null` data for a placeholder.
// Dependency-free: text comes from the baked glyph atlas via Type.
import { Type } from "./type.mjs";
import { C, docComic, panelBack, panelBorder } from "./comic.mjs";

const WAIT = "Awaiting the first raven: the daily refresh fills this in.";
const FLICK_CSS = `.fl{transform-box:fill-box;transform-origin:bottom}`;
const FLICK_MOT = `@keyframes flick{50%{transform:scaleY(.75)}}.fl{animation:flick 1.6s ease-in-out infinite}`;

const titleBadge = (T, s, x, y, size) => {
  const w = Math.ceil(T.width("bangers", s, size, 1.5) + 24);
  const h = Math.round(size * 1.38);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.yellow}" stroke="${C.ink}" stroke-width="3"/>` +
    T.text("bangers", s, { x: x + 12, y: y + h * 0.77, size, ls: 1.5 });
};
const bigNumber = (T, s, x, y, anchor = "end") =>
  T.text("bangers", s, { x: x + 4, y: y + 4, size: 64, ls: 2, anchor, fill: C.red, stroke: C.red, sw: 4 }) +
  T.text("bangers", s, { x, y, size: 64, ls: 2, anchor, fill: C.yellow, stroke: C.ink, sw: 4 });

// ---------- THE LONG WATCH (800 wide): total + 52 weekly torches on a brick wall ----------
// d: { total, weeks: [52 weekly counts], date } | null
export function watchSvg(d) {
  const T = new Type();
  const X0 = 4, W = 786, top = 4, ph = 316;
  const weeks = d?.weeks?.length ? d.weeks.slice(-52) : null;
  const total = d?.total != null ? String(d.total) : "--";

  // torches (shared by both layouts)
  const wallY = 196, n = 52, x0 = 34, step = (W - 2 * 30 - 8) / (n - 1);
  let torches = "";
  for (let i = 0; i < n; i++) {
    const cx = +(x0 + i * step).toFixed(1);
    const lit = weeks ? weeks[weeks.length - n + i] > 0 : false;
    torches += `<rect x="${cx - 1.5}" y="${wallY - 22}" width="3" height="22" fill="${C.ink}"/>`;
    if (lit) torches += `<ellipse class="fl" style="animation-delay:${((i * 0.37) % 1.6).toFixed(2)}s" cx="${cx}" cy="${wallY - 29}" rx="4.2" ry="7" fill="${C.yellow}" stroke="${C.ink}" stroke-width="2"/>`;
  }
  let wall = `<rect x="${X0 + 22}" y="${wallY}" width="${W - 44}" height="36" fill="${C.paper}" stroke="${C.ink}" stroke-width="3"/><path d="M${X0 + 22} ${wallY + 18}H${X0 + W - 22}`;
  for (let x = X0 + 22 + 34; x < X0 + W - 22; x += 34) wall += `M${x} ${wallY}V${wallY + 18}M${x - 17} ${wallY + 18}V${wallY + 36}`;
  wall += `" stroke="${C.ink}" stroke-width="2" fill="none"/>`;

  const note = weeks ? ["One torch per week, lit on weeks with commits.", "Public contributions only."] : [WAIT, "Public contributions only."];
  const wide =
    titleBadge(T, "THE LONG WATCH", X0 + 22, top + 20, 24) +
    bigNumber(T, total, X0 + W - 22 - T.width("comic", "contributions, last 12 months", 16) - 14, top + 84) +
    T.text("comic", "contributions, last 12 months", { x: X0 + W - 22, y: top + 78, size: 16, anchor: "end" }) +
    T.text("comic", note.join(" "), { x: X0 + 22, y: top + 270, size: 14, fill: C.muted });
  const narrow =
    titleBadge(T, "THE LONG WATCH", X0 + 22, top + 18, 34) +
    bigNumber(T, total, X0 + W - 24, top + 80) +
    T.text("comic", "contributions, last 12 months", { x: X0 + W - 24, y: top + 124, size: 26, anchor: "end" }) +
    T.text("comic", note[0], { x: X0 + 22, y: top + 270, size: 25, fill: C.muted }) +
    T.text("comic", note[1], { x: X0 + 22, y: top + 302, size: 25, fill: C.muted });

  const body = panelBack(X0, top, W, ph) + `<g class="wd">${wide}</g><g class="nw">${narrow}</g>` + torches + wall + panelBorder(X0, top, W, ph);
  return docComic({
    w: 800, h: top + ph + 6 + 4, type: T,
    title: "The Long Watch",
    desc: weeks
      ? `${total} public contributions in the last 12 months. 52 torches on a brick wall, one per week, ${weeks.filter((v) => v > 0).length} of them lit for weeks with commits. Public contributions only.`
      : `The Long Watch: ${total} public contributions in the last 12 months. The weekly torches are waiting for the first daily refresh. Public contributions only.`,
    css: FLICK_CSS, mot: FLICK_MOT, body,
  });
}

// ---------- 392-wide panels (+6 shadow): text >= 13px, so >= 10px at 330px ----------
const PW = 392, PH = 300;
const small = (T, s, x, y, extra = {}) => T.text("comic", s, { x, y, size: 13, fill: C.muted, ...extra });

// d: { rows: [{ name, pct }], date } | null
export function langSvg(d) {
  const T = new Type();
  const rows = d?.rows ?? [];
  let body = panelBack(0, 0, PW, PH) + titleBadge(T, "LANGUAGES", 14, 14, 22);
  if (!rows.length) body += T.text("comic", "Awaiting the first raven.", { x: 18, y: 120, size: 16 });
  rows.forEach((r, i) => {
    const y = 74 + i * 34;
    const bw = Math.max(4, Math.round((r.pct / rows[0].pct) * 160));
    body +=
      T.text("comic", r.name.slice(0, 13), { x: 18, y: y + 13, size: 16 }) +
      `<rect x="138" y="${y}" width="160" height="16" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>` +
      `<rect x="138" y="${y}" width="${bw}" height="16" fill="${i === 0 ? C.red : C.yellow}" stroke="${C.ink}" stroke-width="2"/>` +
      T.text("comic", `${r.pct < 0.1 ? "<0.1" : r.pct.toFixed(1)}%`, { x: PW - 18, y: y + 13, size: 15, anchor: "end" });
  });
  body += small(T, d ? `By bytes · public repos · ${d.date}` : "Public repos, by bytes", 18, PH - 18) + panelBorder(0, 0, PW, PH);
  return docComic({
    w: PW + 6, h: PH + 6, type: T, page: false,
    title: "Top languages",
    desc: rows.length
      ? "Top languages by share of code across public repositories: " + rows.map((r) => `${r.name} ${r.pct.toFixed(1)}%`).join(", ") + "."
      : "Top languages panel, waiting for the first daily refresh.",
    body,
  });
}

// d: { weeks: [26 weekly counts], total, date } | null
export function activitySvg(d) {
  const T = new Type();
  const weeks = d?.weeks ?? new Array(26).fill(0);
  const max = Math.max(1, ...weeks);
  const n = weeks.length, x0 = 18, span = PW - 36, step = span / n, base = 220;
  let body = panelBack(0, 0, PW, PH) + titleBadge(T, "26 WEEKS", 14, 14, 22);
  weeks.forEach((v, i) => {
    const h = v ? Math.max(5, Math.round((v / max) * 132)) : 2;
    body += `<rect x="${(x0 + i * step + 1.5).toFixed(1)}" y="${base - h}" width="${(step - 3).toFixed(1)}" height="${h}" fill="${d && v === max ? C.red : C.yellow}" stroke="${C.ink}" stroke-width="${v ? 2 : 1}"/>`;
  });
  body +=
    `<rect x="${x0}" y="${base}" width="${span}" height="3" fill="${C.ink}"/>` +
    small(T, "26 weeks ago", x0, base + 22) + small(T, "now", PW - 18, base + 22, { anchor: "end" }) +
    small(T, d ? `Total ${d.total} · peak ${max} · ${d.date}` : "Awaiting the first raven.", 18, PH - 18) +
    panelBorder(0, 0, PW, PH);
  return docComic({
    w: PW + 6, h: PH + 6, type: T, page: false,
    title: "Recent activity",
    desc: d ? `Weekly public contributions over the last 26 weeks: ${d.total} in total, busiest week ${max}.` : "Weekly activity chart, waiting for the first daily refresh.",
    body,
  });
}

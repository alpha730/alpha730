// Shared SVG helpers for the "Ink Garden x Godswood" theme. Plain strings, no
// dependencies, so the GitHub Action can run the live-stats script without `npm install`.

export const FONT = 'ui-monospace,"SF Mono",Menlo,Consolas,monospace';
export const CW = 0.6; // monospace advance width per 1px of font size

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function wrap(text, maxChars) {
  const out = [];
  let line = "";
  for (const w of String(text).split(/\s+/)) {
    if (!line) line = w;
    else if ((line + " " + w).length <= maxChars) line += " " + w;
    else {
      out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  return out;
}

// Ink black / bone / one blood-red accent; parchment + ink in light mode.
// Red (#b3202a) is reserved for art, large numbers and status dots: on ink black it
// is ~3:1, enough for large text only, so small labels stay bone or muted.
const INK_BASE = `
text{font-family:${FONT}}
.b{font-weight:700}
.bg{fill:#0a0a0a}.ink{fill:#e8e2d0}.mu{fill:#a39e8c}.rd{fill:#b3202a}
.s-ink{stroke:#e8e2d0}.s-rd{stroke:#b3202a}
.nw{display:none}
`;
const INK_LIGHT = `
.bg{fill:#efe8d6}.ink{fill:#14110f}.mu{fill:#5a5247}.rd{fill:#b3202a}
.s-ink{stroke:#14110f}.s-rd{stroke:#b3202a}
`;
// Narrow display (an <img> SVG's media queries see its rendered width): swap
// `.wd` (wide-only) for `.nw` (narrow-only) elements.
const NARROW = `.wd{display:none}.nw{display:inline}`;

export function docInk({ w, h, title, desc, body, css = "", mot = "", round = 0, frame = true, bg = true }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>${INK_BASE}${css}/*LIGHT*/@media (prefers-color-scheme: light){${INK_LIGHT}}/*ENDLIGHT*/
/*NARROW*/@media (max-width: 520px){${NARROW}}/*ENDNARROW*/
@media (prefers-reduced-motion: no-preference){@keyframes blink{0%,55%{opacity:1}70%,100%{opacity:.25}}.led{animation:blink 2.6s infinite}${mot}}</style>
${bg ? `<rect width="${w}" height="${h}" rx="${round}" class="bg"/>` : ""}
${body}
${frame ? `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${round}" fill="none" class="s-ink" opacity=".22"/>` : ""}
</svg>
`;
}

// 800-wide panel of three number tiles (Ledger, streak). Wide: three tiles in a row.
// Narrow (<= 520px shown): three stacked rows at 28px+, so text stays >= 10px at 330px.
// tiles: [{ value, label, key }] -- key values are drawn in red (large text only).
// footnote: array of parts; wide joins them on one line, narrow gives each its own line.
export function tilesPanel({ title, tiles, footnote = [], extra = "" }) {
  const tw = 248;
  let wide = `<text x="24" y="42" font-size="22" letter-spacing="2" class="ink b">${esc(title)}</text>`;
  let narrow = `<text x="24" y="46" font-size="30" letter-spacing="1" class="ink b">${esc(title)}</text>`;
  tiles.forEach((t, i) => {
    const x = 12 + i * (tw + 16);
    const cls = t.key ? "rd" : "ink";
    wide += `
<rect x="${x + 0.5}" y="62.5" width="${tw}" height="116" rx="4" fill="none" class="s-ink" opacity=".3"/>
<text x="${x + 18}" y="126" font-size="50" class="${cls} b">${esc(t.value)}</text>
<text x="${x + 18}" y="162" font-size="22" class="mu">${esc(t.label)}</text>`;
    const y = 96 + i * 44;
    narrow += `
<text x="24" y="${y}" font-size="42" class="${cls} b">${esc(t.value)}</text>
<text x="232" y="${y}" font-size="28" class="mu">${esc(t.label)}</text>`;
  });
  if (footnote.length) {
    wide += `<text x="24" y="226" font-size="22" class="mu">${esc(footnote.join(" · "))}</text>`;
    footnote.forEach((line, i) => (narrow += `<text x="24" y="${226 + i * 30}" font-size="26" class="mu">${esc(line)}</text>`));
  }
  return `<g class="wd">${wide}${extra}</g><g class="nw">${narrow}</g>${dot(772, 34, 6)}`;
}

export const dot =(x, y, r = 5, blink = true) => `<circle cx="${x}" cy="${y}" r="${r}" class="rd${blink ? " led" : ""}"/>`;

// Outlined tag, used for stacks on the banners.
export function tag(x, y, text, fs = 13) {
  const w = Math.round(text.length * fs * CW + 16);
  const h = fs + 11;
  return {
    w,
    h,
    svg: `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w}" height="${h}" rx="3" fill="none" class="s-ink" opacity=".45"/><text x="${x + 8.5}" y="${y + h - 7}" font-size="${fs}" class="ink">${esc(text)}</text>`,
  };
}

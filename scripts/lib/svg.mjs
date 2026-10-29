// Shared SVG helpers. Output is plain strings: no dependencies, so the
// GitHub Action can run the live-stats script without `npm install`.

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

// Colour roles. Dark is the default; light is applied through the media block.
const BASE = `
text{font-family:${FONT}}
.b{font-weight:700}
.f-bg{fill:#0b1020}.f-pn{fill:#121a38}.f-ln{fill:#1c2850}
.f-tx{fill:#d6e2ff}.f-mu{fill:#8a99c4}
.f-gr{fill:#39ff88}.f-am{fill:#ffb020}.f-cy{fill:#4cc9f0}
.s-ln{stroke:#26335f}.s-mu{stroke:#8a99c4}
.s-gr{stroke:#39ff88}.s-am{stroke:#ffb020}.s-cy{stroke:#4cc9f0}
.scan{display:none}
.cursor{opacity:0}
`;

const LIGHT = `
.f-bg{fill:#f3f6ff}.f-pn{fill:#ffffff}.f-ln{fill:#e4eafb}
.f-tx{fill:#0f1a3a}.f-mu{fill:#475687}
.f-gr{fill:#007a38}.f-am{fill:#955700}.f-cy{fill:#0a6890}
.s-ln{stroke:#c3cfee}.s-mu{stroke:#475687}
.s-gr{stroke:#007a38}.s-am{stroke:#955700}.s-cy{stroke:#0a6890}
`;

// Everything animated lives here so prefers-reduced-motion users get a still image.
const motion = (h) => `
@keyframes blink{0%,55%{opacity:1}70%,100%{opacity:.2}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes march{to{stroke-dashoffset:-36}}
@keyframes scan{from{transform:translateY(-4px)}to{transform:translateY(${h}px)}}
@keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}
.led{animation:blink 2.2s infinite}.led2{animation:blink 2.2s .7s infinite}.led3{animation:blink 2.2s 1.4s infinite}
.sp1{animation:spin 30s linear infinite}.sp2{animation:spin 48s linear infinite reverse}.sp3{animation:spin 20s linear infinite}
.march{animation:march 2.4s linear infinite}
.scan{display:block;animation:scan 7s linear infinite}
.pulse{animation:pulse 3s ease-in-out infinite}
`;

export function doc({ w, h, title, desc, defs = "", body, css = "", mot = "", round = 0 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>${BASE}${css}/*LIGHT*/@media (prefers-color-scheme: light){${LIGHT}}/*ENDLIGHT*/@media (prefers-reduced-motion: no-preference){${motion(h)}${mot}}</style>
<defs><pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" class="f-tx" opacity=".045"/></pattern>${defs}</defs>
<rect width="${w}" height="${h}" rx="${round}" class="f-bg"/>
${body}
<rect width="${w}" height="${h}" rx="${round}" fill="url(#sl)"/>
<rect class="scan f-cy" width="${w}" height="2" opacity=".18"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${round}" fill="none" class="s-ln"/>
</svg>
`;
}

export const led = (x, y, cls = "f-gr", blink = "led", r = 5) =>
  `<circle cx="${x}" cy="${y}" r="${r}" class="${cls} ${blink}"/>`;

export function chip(x, y, text, fs = 13) {
  const w = Math.round(text.length * fs * CW + 18);
  const h = fs + 10;
  return {
    w,
    h,
    svg: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="f-ln"/><text x="${x + 9}" y="${y + h - 7}" font-size="${fs}" class="f-tx">${esc(text)}</text>`,
  };
}

export function globe(cx, cy, r) {
  const k = 0.866 * r;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" class="f-pn s-cy" stroke-width="1.5"/>
<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.42}" ry="${r}" fill="none" class="s-cy" opacity=".5"/>
<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.8}" ry="${r}" fill="none" class="s-cy" opacity=".3"/>
<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" class="s-cy" opacity=".5"/>
<line x1="${cx - k}" y1="${cy - r / 2}" x2="${cx + k}" y2="${cy - r / 2}" class="s-cy" opacity=".3"/>
<line x1="${cx - k}" y1="${cy + r / 2}" x2="${cx + k}" y2="${cy + r / 2}" class="s-cy" opacity=".3"/>`;
}

export function orbit(cx, cy, R, spin, dotCls, angle = 0) {
  const a = (angle * Math.PI) / 180;
  const dx = (cx + R * Math.cos(a)).toFixed(1);
  const dy = (cy + R * Math.sin(a)).toFixed(1);
  return `<g class="${spin}" style="transform-origin:${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" class="s-mu" stroke-dasharray="3 7" opacity=".55"/><circle cx="${dx}" cy="${dy}" r="5" class="${dotCls}"/></g>`;
}

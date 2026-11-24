// Motion primitives. Components are HTML strings built at their real point size; Film.jsx zooms them.
// Rules baked in: no opacity, masked reveals, exits that finish (ex), springs from timeline.js.
import React from 'react';
import { spr } from './timeline.js';

export const lerp = (a, b, p) => a + (b - a) * p;
export const c01 = (v) => Math.min(Math.max(v, 0), 1);
// Exits reach exactly 1 (~0.3 s). A spring that only approaches 1 leaves slivers at cuts.
export const ex = (dt) => c01(spr(dt, 'exit') * 1.04);

const hex = (c) => {
  const h = c.replace('#', '');
  const n = h.length === 6 ? h + 'ff' : h;
  return [0, 2, 4, 6].map((i) => parseInt(n.slice(i, i + 2), 16));
};
// Only interpolate between colors of similar lightness; dark↔light passes through grey — use a wipe (Shell `over`).
export const mixC = (a, b, p) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], c01(p))).toString(16).padStart(2, '0')).join('');
};

const NUM = ['x', 'y', 'w', 'h', 'r', 'sh', 'sc', 'bw', 'rx', 'ry'];
// Keyframed shape. Each key springs (preset `e`) from wherever earlier keys left it → chains stay continuous.
export const track = (t, keys) => {
  let s = { x: 0, y: 0, w: 0, h: 0, r: 0, sh: 0, sc: 1, bw: 0, rx: 0, ry: 0, bg: '#ffffff', bd: '#ffffff00', ...keys[0] };
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t < k.at) break;
    const p = spr(t - k.at, k.e || 'smooth');
    const n = { ...s };
    NUM.forEach((q) => q in k && (n[q] = lerp(s[q], k[q], p)));
    ['bg', 'bd'].forEach((q) => q in k && (n[q] = mixC(s[q], k[q], p)));
    s = n;
  }
  return s;
};

/* ---------- element motion (return HTML / CSS strings) ---------- */
const mask = 'display:inline-block;overflow:hidden;vertical-align:top;padding:0.06em 0.05em 0.16em;margin:-0.06em -0.05em -0.16em';
// Each word rises out of its own baseline mask and exits upward. Stagger ~0.055 s.
export const words = (t, text, at, out = 99, gap = 0.055, style = '') =>
  text.split(' ').map((w, i) => {
    const p = spr(t - at - i * gap, 'text'), q = ex(t - out - i * gap * 0.5);
    return `<span style="${mask}"><span style="display:inline-block;transform:translateY(${(1 - p) * 108 - q * 125}%);${style}">${w}</span></span>`;
  }).join(' ');
export const chars = (t, text, at, out = 99, gap = 0.045) =>
  [...text].map((ch, i) => {
    const p = spr(t - at - i * gap, 'text'), q = ex(t - out - i * gap * 0.5);
    return `<span style="${mask}"><span style="display:inline-block;transform:translateY(${(1 - p) * 108 - q * 125}%)">${ch === ' ' ? '&nbsp;' : ch}</span></span>`;
  }).join('');
// A block rises while a mask opens from its top edge.
export const rise = (t, at, out = 99, d = 18) => {
  const p = spr(t - at, 'text'), q = ex(t - out);
  return `transform:translateY(${(1 - p) * d - q * d}px);clip-path:inset(${q * 100}% -30% ${(1 - c01(p)) * 100}% -30%);`;
};
// Scale from zero. Use 'bouncy' only for meaningful moments.
export const pop = (t, at, out = 99, preset = 'smooth') => `transform:scale(${Math.max(spr(t - at, preset) * (1 - ex(t - out)), 0)});`;
// Slot roll between two strings (digits, labels).
export const roll = (t, a, b, at) => {
  const p = spr(t - at, 'snappy');
  if (p <= 0) return a;
  if (p >= 0.999) return b;
  return `<span style="display:inline-grid;overflow:hidden;vertical-align:top"><span style="grid-area:1/1;transform:translateY(${-p * 110}%)">${a}</span><span style="grid-area:1/1;transform:translateY(${(1 - p) * 110}%)">${b}</span></span>`;
};
// A live mm:ss timer whose changing digits roll each second.
export const timer = (t, start, base = 0) => {
  const s = Math.max(0, t - start) + base;
  const fmt = (v) => { v = Math.floor(v); return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; };
  const cur = fmt(s), prev = fmt(s - 1), since = s % 1;
  return [...cur].map((ch, i) => (ch !== prev[i] && t > start + 0.3 ? roll(t, prev[i], ch, t - since) : ch)).join('');
};
export const seq = (t, start, n, every) => Array.from({ length: n }, (_, i) => spr(t - start - i * every, 'smooth'));

/* ---------- layout (formats) ---------- */
// The 1920×1080 stage is scaled by k and centered; vertical offsets spread by fy; text wraps at mw; stack = narrow.
export const LAYOUT = {
  '16x9': { W: 1920, H: 1080, k: 1, fy: 1, mw: 1800, stack: false, off: 1 },
  '9x16': { W: 1080, H: 1920, k: 0.9, fy: 1.35, mw: 1100, stack: true, off: 1.7 },
  '1x1': { W: 1080, H: 1080, k: 0.9, fy: 1.1, mw: 1120, stack: true, off: 1.7 },
};
let FY = 1, MW = 1800;
export const setLayout = (ly) => { FY = ly.fy; MW = ly.mw; };

/* ---------- stage components ---------- */
// A shape (card / island / icon). `over` = hard-edged color wipe rising from the bottom; `q` = masked exit.
export const Shell = ({ s, children, over, q = 0 }) =>
  s.w < 0.5 || s.h < 0.5 || s.sc <= 0.001 || q >= 0.999 ? null : (
    <div style={{ position: 'absolute', left: 960 + s.x - s.w / 2, top: 540 + s.y * FY - s.h / 2, width: s.w, height: s.h, borderRadius: s.r, overflow: 'hidden',
      background: s.bg, transform: `perspective(2400px) rotateX(${s.rx}deg) rotateY(${s.ry}deg) scale(${s.sc})`, clipPath: q > 0 ? `inset(${q * 100}% 0 0 0)` : undefined,
      boxShadow: `inset 0 0 0 ${s.bw}px ${s.bd}, 0 ${18 * s.sh}px ${50 * s.sh}px rgba(0,0,0,${0.13 * s.sh}), 0 ${2 * s.sh}px ${6 * s.sh}px rgba(0,0,0,${0.06 * s.sh})` }}>
      {over && <div style={{ position: 'absolute', inset: 0, background: over.c, clipPath: `inset(${(1 - c01(over.p)) * 100}% 0 0 0)` }} />}
      {children}
    </div>
  );
// Component HTML at its natural point size, zoomed, centered in its shell; dy for carousels.
export const Content = ({ html, zoom = 1, size, scale = 1, dy = 0 }) => {
  const w = size[0] * zoom, h = size[1] * zoom;
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, transform: `translateY(${dy}px) scale(${scale})` }}>
      <div style={{ zoom }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};
// A centered line of type at stage y (spread by the format's fy unless abs).
export const Line = ({ html, y, x = 0, size = 64, kind, color, abs }) => (
  <div style={{ position: 'absolute', left: 960 + x - MW / 2, width: MW, top: abs ? y : 540 + (y - 540) * FY, transform: 'translateY(-50%)', textAlign: 'center', textWrap: 'balance', fontSize: size, lineHeight: 1.22,
    fontWeight: kind === 'head' ? 700 : kind === 'eyebrow' ? 600 : 500, letterSpacing: kind === 'head' ? '-0.04em' : kind === 'eyebrow' ? '0.14em' : '-0.01em', color }}
    dangerouslySetInnerHTML={{ __html: html }} />
);
// Free-positioned HTML at an offset from center.
export const Abs = ({ x = 0, y = 0, html, style }) => (
  <div style={{ position: 'absolute', left: 960 + x, top: 540 + y * FY, transform: 'translate(-50%,-50%)', ...style }} dangerouslySetInnerHTML={{ __html: html }} />
);

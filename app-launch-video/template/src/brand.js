// Everything app-specific lives here: name, palette, logo geometry and the recreated components.
// Replace these with the real app's values — read its theme file and components; don't guess.
import { c01, lerp, mixC, pop, rise, roll, seq, timer, words } from './motion.js';
import { spr, T } from './timeline.js';

export const BRAND = {
  name: 'Brand',
  tagline: 'Your tagline goes here.',
  storeSubtitle: 'Your App Subtitle',
  accent: '#168A2D', accentSoft: '#EAF7ED', accentOnDark: '#5CD978',
  gradient: ['#17B880', '#007A43'], // logo fill, top-left → bottom-right
  surface: '#FFFFFF', border: '#86BC8D', text: '#1A1A1A', text2: '#4B5563',
  paper: '#F3EBD8', // a warm system-surface color for the dark acts
};

// Logo geometry in the format scripts/trace_logo.py writes (logo.json): { W, H, transform, d: [paths] }.
// Placeholder: a rounded mark. Replace with the traced real logo.
export const LOGO = {
  W: 100, H: 100, transform: '',
  d: ['M50 6C74 6 94 26 94 50S74 94 50 94 6 74 6 50 26 6 50 6Zm0 22c-12 0-22 10-22 22s10 22 22 22 22-10 22-22-10-22-22-22Z'],
};
const AR = LOGO.W / LOGO.H;
export const markSvg = (h, fill = 'url(#brandgrad)') =>
  `<svg viewBox="0 0 ${LOGO.W} ${LOGO.H}" style="height:${h}px;width:${h * AR}px;display:block;overflow:visible;fill:${fill}"><g transform="${LOGO.transform}">${LOGO.d.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;
// Outline draws itself (stroke-dasharray, pathLength=1), then the fill rises from the bottom.
export const markReveal = (h, draw, fill) => {
  const sw = (3 * LOGO.H) / h; // 3 px stroke at any size
  return `<div style="position:relative;height:${h}px;width:${h * AR}px"><svg viewBox="0 0 ${LOGO.W} ${LOGO.H}" style="position:absolute;inset:0;overflow:visible"><g transform="${LOGO.transform}" fill="none" stroke="url(#brandgrad)" stroke-width="${sw}" stroke-linejoin="round">${LOGO.d.map((d) => `<path d="${d}" pathLength="1" stroke-dasharray="${draw} 1.01"/>`).join('')}</g></svg><div style="position:absolute;inset:0;clip-path:inset(${(1 - fill) * 100}% -3% -3% -3%)">${markSvg(h)}</div></div>`;
};
// userSpaceOnUse so stroke and fill share one gradient across the mark.
export const DEFS = `<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="brandgrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${LOGO.W}" y2="${LOGO.H}"><stop offset="0" stop-color="${BRAND.gradient[0]}"/><stop offset="1" stop-color="${BRAND.gradient[1]}"/></linearGradient></defs></svg>`;
// Optical centering: asymmetric marks look off when geometrically centered. trace_logo.py reports a suggested nudge.
export const ICON_NUDGE_X = 0; // percent of mark width, e.g. 3
export const appicon = (s) => `<div style="width:${s}px;height:${s}px;border-radius:22.37%;background:#fff;display:grid;place-items:center;box-shadow:0 0 0 .5px rgba(0,0,0,.08),0 10px 30px rgba(0,0,0,.10)"><div style="transform:translateX(${ICON_NUDGE_X}%)">${markSvg((s * 0.56) / AR)}</div></div>`;

/* ---------- generic third-party UI (unbranded on purpose) ---------- */
const GLYPH = {
  bubble: '<path d="M12 4.5c-4.4 0-8 2.8-8 6.3 0 2 1.2 3.8 3 4.9L6.3 19l3.5-1.8c.7.2 1.4.3 2.2.3 4.4 0 8-2.8 8-6.3s-3.6-6.7-8-6.7z" fill="#fff"/>',
  mail: '<rect x="4" y="6.5" width="16" height="11" rx="2" fill="#fff"/><path d="M4.6 7.3 12 12.6l7.4-5.3" stroke="#0A84FF" stroke-width="1.5" fill="none"/>',
  news: '<rect x="5" y="5" width="14" height="14" rx="2.2" fill="#fff"/><rect x="7.5" y="8" width="9" height="2.2" rx=".6" fill="#FF3B30"/><rect x="7.5" y="12" width="9" height="1.4" rx=".7" fill="#FF3B30"/>',
};
export const NOTIFS = [
  { c: '#34C759', g: 'bubble', t: 'Group Chat', b: 'Alex: are you up?' },
  { c: '#0A84FF', g: 'mail', t: 'Inbox', b: '23 unread messages' },
  { c: '#FF3B30', g: 'news', t: 'Top Stories', b: 'Markets open lower this morning' },
];
export const NOTIF_SIZE = [360, 64];
export const notifUI = (n) => `<div style="width:360px;border-radius:22px;padding:12px 14px;display:grid;grid-template-columns:38px 1fr;gap:12px;align-items:center;background:rgba(255,255,255,.92);box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 10px 30px rgba(0,0,0,.10);text-align:left"><div style="width:38px;height:38px;border-radius:9px;background:${n.c};display:grid;place-items:center"><svg viewBox="0 0 24 24" width="26" height="26">${GLYPH[n.g]}</svg></div><div style="min-width:0"><div style="display:flex;justify-content:space-between;gap:8px"><span style="font-size:15px;font-weight:600;color:#1D1D1F">${n.t}</span><span style="font-size:13px;color:#8E8E93">now</span></div><div style="font-size:15px;line-height:20px;color:#1D1D1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.b}</div></div></div>`;

/* ---------- the app's components (REPLACE with real ones, at point sizes) ---------- */
// Each returns HTML at 1× point size; declare its size so shapes can morph to it exactly.
const card = 'box-sizing:border-box;padding:18px;display:grid;gap:16px;text-align:left;font-family:Inter,system-ui,sans-serif';
const ring = (on, p = 1) => `<span style="width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex:none;background:${mixC('#ffffff00', BRAND.accent, on ? c01(p) : 0)};box-shadow:inset 0 0 0 ${on && p > 0.5 ? 0 : 1.6}px #6B7280;transform:scale(${1 + Math.sin(c01(on ? p : 0) * Math.PI) * 0.2})"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="${on ? c01(p) : 0} 2"/></svg></span>`;

export const SIZE = { cardA: [362, 168], cardB: [362, 198], row: [416, 100], live: [370, 129] };

export const cardA = (t, at, out = 99) => {
  const done = spr(t - T.check, 'bouncy');
  return `<div style="${card};width:362px;height:168px"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:22px;font-weight:800;color:${BRAND.text};letter-spacing:-.5px;${rise(t, at, out)}">${roll(t, '2', '3', T.check)} of 3 done</div><div style="font-size:14px;color:${BRAND.text2}">${words(t, 'Today’s small wins', at + 0.08, out, 0.04)}</div></div><div style="width:44px;height:44px;border-radius:22px;background:${BRAND.accentSoft};${pop(t, at + 0.12, out)}"></div></div><div style="display:grid;gap:10px">${['Morning walk', 'Read 10 pages', 'Call home'].map((x, i) => `<div style="display:flex;gap:10px;align-items:center;font-size:15px;font-weight:600;color:${BRAND.text};${rise(t, at + 0.18 + i * 0.07, out)}">${ring(i < 2 || t > T.check, i < 2 ? 1 : done)}${x}</div>`).join('')}</div></div>`;
};
export const cardB = (t, at, out = 99) =>
  `<div style="${card};width:362px;height:198px"><div style="font-size:18px;font-weight:800;color:${BRAND.text};${rise(t, at, out)}">${words(t, 'This week', at, out)}</div><div style="display:flex;align-items:flex-end;gap:14px;height:110px">${seq(t, at + 0.2, 7, 0.06).map((p, i) => `<div style="flex:1;border-radius:8px;background:${i === 6 ? BRAND.accent : BRAND.accentSoft};height:${[40, 62, 48, 80, 70, 92, 100][i] * p}%"></div>`).join('')}</div><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;letter-spacing:1px;color:${BRAND.text2}">${'MTWTFSS'.split('').map((d) => `<span>${d}</span>`).join('')}</div></div>`;

const getButton = (t) => {
  const toRing = spr(t - T.ring, 'snappy'), toOpen = spr(t - T.open, 'bouncy');
  const press = Math.sin(c01((t - T.press) / 0.18) * Math.PI) * 0.1;
  const w = lerp(lerp(74, 30, c01(toRing)), 74, toOpen);
  const prog = c01(spr(t - T.ring - 0.1, 'camera') * 1.25), ringP = c01(toRing) * (1 - c01(toOpen));
  return `<div style="width:${w}px;height:30px;border-radius:15px;margin:0 ${(74 - w) / 2}px;position:relative;background:${mixC('#78788024', '#78788000', ringP)};transform:scale(${1 - press});display:grid;place-items:center;overflow:hidden"><span style="color:#007AFF;font-size:15px;font-weight:700;transform:scale(${Math.max(1 - ringP * 1.4, 0)})">${t < T.open ? 'GET' : 'OPEN'}</span>${ringP > 0.02 ? `<svg viewBox="0 0 30 30" width="30" height="30" style="position:absolute;transform:scale(${ringP})"><circle cx="15" cy="15" r="13" stroke="#E5E5EA" stroke-width="2.5" fill="none"/><circle cx="15" cy="15" r="13" stroke="#007AFF" stroke-width="2.5" fill="none" stroke-dasharray="${prog * 81.7} 82" stroke-linecap="round" transform="rotate(-90 15 15)"/><rect x="11" y="11" width="8" height="8" rx="1.8" fill="#007AFF"/></svg>` : ''}</div>`;
};
export const storeRow = (t, at, out) => `<div style="width:416px;height:100px;display:grid;place-items:center"><div style="width:380px;display:grid;grid-template-columns:64px 1fr auto;gap:14px;align-items:center;text-align:left"><div style="${pop(t, at, T.store)}">${appicon(64)}</div><div><div style="font-size:17px;font-weight:600;color:#1D1D1F">${words(t, BRAND.name, at + 0.08, out)}</div><div style="font-size:13px;color:#6E6E73">${words(t, BRAND.storeSubtitle, at + 0.14, out, 0.03)}</div></div><div style="${pop(t, at + 0.22)};visibility:${t >= T.store ? 'hidden' : 'visible'}">${getButton(t)}</div></div></div>`;

// A "coming soon" system surface (e.g. a Live Activity). Fixed frame; state changes carousel the whole content.
export const liveCard = (t, o) => `<div style="width:370px;height:129px;box-sizing:border-box;padding:14px;display:grid;gap:8px;text-align:left;color:#2A2418;font-family:Inter,system-ui,sans-serif"><div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:${BRAND.accent}">${markSvg(18, BRAND.accent)}<span>${o.label}</span><span style="margin-left:auto;font-size:20px;font-weight:800;font-variant-numeric:tabular-nums">${o.tm}</span></div><div style="font-family:Georgia,serif;font-style:italic;font-size:19px;line-height:23px">${o.line}</div><div style="font-size:12.5px;color:#6B5F48">${o.sub}</div></div>`;
export const liveState = (t) => ({ label: 'Focus session', tm: timer(t, T.feature, 512), line: '“One thing at a time.”', sub: 'Session 2 of 4' });

// Placeholder badge. REPLACE with the official store badge artwork (marketing guidelines require it).
export const BADGE_SIZE = [141, 51];
export const badge = () => `<div style="display:inline-flex;align-items:center;white-space:nowrap;width:max-content;background:#000;color:#fff;border-radius:11px;padding:7px 16px;box-shadow:inset 0 0 0 1px #A6A6A6;text-align:left;font-family:Inter,system-ui,sans-serif"><div><small style="display:block;font-size:11px;line-height:1.3">Download on the</small><b style="display:block;font-size:19px;font-weight:600;letter-spacing:-.02em;line-height:1.2">App Store</b></div></div>`;

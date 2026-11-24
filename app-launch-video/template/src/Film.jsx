// Example film: problem → logo → two real cards → store launch → dark cut → "coming soon" chapter → end card.
// Replace brand.js components with the app's real ones and retime src/timeline.js. Keep the patterns.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { Abs, c01, Content, ex, lerp, LAYOUT, Line, mixC, Shell, setLayout, track, chars, words } from './motion.js';
import { appicon, badge, BADGE_SIZE, BRAND, cardA, cardB, DEFS, liveCard, liveState, markReveal, markSvg, NOTIFS, notifUI, SIZE, storeRow } from './brand.js';
import { GAP, spr, T, TEXTS } from './timeline.js';

loadFont('normal', { weights: ['400', '500', '600', '700', '800'] });

export const FPS = 60;
export const DURATION = Math.round(T.end * FPS);
const CZ = 2.6; // card zoom (points → stage px)
const LZ = 2.4; // system-surface zoom

export const Film = ({ fmt = '16x9' }) => {
  const LY = LAYOUT[fmt];
  setLayout(LY);
  const t = useCurrentFrame() / FPS;
  const black = t < 1 || t >= T.out;
  const dk = t >= T.dark;
  const ICY = LY.stack ? -205 : -170, BDY = LY.stack ? 255 : 190;
  const L = [];
  const add = (n) => L.push(React.cloneElement(n, { key: L.length }));

  /* Act 1 — the problem: generic notifications drop into a stack, then one swipe clears them. */
  if (t >= 1 && t < T.dismiss + 1.2) {
    T.n.forEach((a, i) => {
      if (t < a) return;
      const drop = spr(t - a, 'island');
      let depth = 0;
      T.n.forEach((b, j) => j > i && t >= b && (depth += spr(t - b, 'smooth')));
      const sw = spr(t - T.dismiss - (T.n.length - 1 - i) * 0.05, 'snappy');
      const y = lerp(-460 * LY.off, 0, drop) + Math.min(depth, 2.6) * 30;
      add(<Abs x={sw * 1600} y={y + 40} style={{ zIndex: 10 + i, transform: `translate(-50%,-50%) rotate(${sw * 5}deg) scale(${Math.max(1 - depth * 0.05, 0.8)})` }} html={`<div style="zoom:2.2">${notifUI(NOTIFS[i])}</div>`} />);
    });
  }

  /* Act 2 — the mark draws itself and fills; an icon forms around it. */
  const icon = track(t, [
    { at: 0, w: 0, h: 0, r: 0, sh: 0, bg: '#FFFFFF' },
    { at: T.icon, w: 180, h: 180, r: 40.3, sh: 1 },
    { at: T.iconUp, w: 150, h: 150, r: 33.6, y: -71 },
    { at: T.cardA, w: SIZE.cardA[0] * CZ, h: SIZE.cardA[1] * CZ, r: 22 * CZ, y: 0, sh: 0.35, bw: 2, bd: BRAND.border, rx: 8, ry: -10, e: 'snappy' },
    { at: T.cardA + 0.15, rx: 0, ry: 0, e: 'text' },
    { at: T.cardB, h: SIZE.cardB[1] * CZ },
    { at: T.row, w: SIZE.row[0] * CZ, h: SIZE.row[1] * CZ, r: 28 * CZ, bd: '#E5E5EA' },
    { at: T.store, w: 200, h: 200, r: 44.7, y: ICY, sh: 1, bw: 0 },
    { at: T.storeOut + 0.1, y: ICY - 80, e: 'exit' },
  ]);
  if (t >= T.logo && t < T.cardA + 0.6) {
    const draw = c01(spr(t - T.logo, 'camera') * 1.12), fill = c01(spr(t - T.fillAt, 'text'));
    const inIcon = spr(t - T.icon, 'smooth'), away = spr(t - T.cardA, 'snappy');
    const h = lerp(200, 180 * 0.56, inIcon) * (1 - c01(away * 1.15));
    if (h > 0.5) add(<Abs y={icon.y * (1 - away)} style={{ zIndex: 5 }} html={t < T.icon ? markReveal(h, draw, fill) : markSvg(h)} />);
  }
  if (t >= T.icon && t < T.dark) {
    // Card → card: one shape morphs; content carousels (new enters directly below the old — never overlapping).
    const push = (at, ho, hn) => { const p = spr(t - at, 'snappy'), D = ((ho + hn) / 2) * CZ + 40; return { out: -p * D, in: (1 - p) * D }; };
    const a = push(T.cardB, SIZE.cardA[1], SIZE.cardB[1]), b = push(T.row, SIZE.cardB[1], SIZE.row[1]);
    add(
      <Shell s={icon} q={ex(t - T.storeOut - 0.1)}>
        {t >= T.cardA && t < T.cardB + 0.6 && <Content html={cardA(t, T.cardAIn)} zoom={CZ} size={SIZE.cardA} dy={t >= T.cardB ? a.out : 0} />}
        {t >= T.cardB && t < T.row + 0.6 && <Content html={cardB(t, T.cardBIn)} zoom={CZ} size={SIZE.cardB} dy={t >= T.row ? b.out : a.in} />}
        {t >= T.row && t < T.store + 0.5 && <Content html={storeRow(t, T.rowIn, T.store - 0.05)} zoom={CZ} size={SIZE.row} dy={b.in} />}
      </Shell>,
    );
    if (t >= T.store) {
      // Shared elements: the row's icon mark settles into the big icon; the OPEN button grows into the badge.
      const p = spr(t - T.store, 'smooth'), q = ex(t - T.storeOut - 0.1);
      const h = lerp(64 * CZ * 0.56, 200 * 0.56, p);
      const x0 = (18 + 32 - 208) * CZ;
      if (q < 0.999) add(<Abs x={lerp(x0, 0, p)} y={ICY * c01(p) - 80 * q} style={{ zIndex: 6, clipPath: `inset(${q * 100}% 0 0 0)` }} html={markSvg(h)} />);
      const bx = lerp(153 * CZ, 0, p), by = lerp(0, BDY, p) * LY.fy, bw = lerp(74 * CZ, BADGE_SIZE[0] * 2.4, p), bh = lerp(30 * CZ, BADGE_SIZE[1] * 2.4, p);
      const bq = ex(t - T.storeOut);
      if (bq < 0.999)
        add(
          <div style={{ position: 'absolute', left: 960 + bx - bw / 2, top: 540 + by - bh / 2 + bq * 40, width: bw, height: bh, borderRadius: lerp(15 * CZ, 26, p), background: mixC('#EEEEF1', '#000000', p), overflow: 'hidden', zIndex: 7, display: 'grid', placeItems: 'center', clipPath: `inset(0 0 ${bq * 100}% 0)` }}>
            <div style={{ gridArea: '1/1', color: '#007AFF', fontWeight: 700, fontSize: 15 * CZ, transform: `scale(${Math.max(1 - p * 2.2, 0)})` }}>OPEN</div>
            <div style={{ gridArea: '1/1', zoom: 2.4, transform: `scale(${Math.max(spr(t - T.store - 0.3, 'smooth'), 0)})` }} dangerouslySetInnerHTML={{ __html: badge() }} />
          </div>,
        );
    }
  }

  /* Act 4 (dark stage, hard cut on an empty frame) — a "coming soon" surface rises in and leaves fully. */
  const lv = track(t, [
    { at: 0, w: SIZE.live[0] * LZ, h: SIZE.live[1] * LZ, r: 24 * LZ, y: 780 * LY.off, bg: BRAND.paper, sh: 0.8 },
    { at: T.feature, y: 60 },
    { at: T.featureOut, y: 820 * LY.off, e: 'snappy' },
  ]);
  if (t >= T.feature && t < T.featureOut + 1) add(<Shell s={lv}><Content zoom={LZ} size={SIZE.live} html={liveCard(t, liveState(t))} /></Shell>);

  /* End card: icon, name, badge, one line. The icon RISES in through a mask — scaling from zero shows a dot first. */
  if (t >= T.endIcon) {
    const p = spr(t - T.endIcon, 'text');
    add(<Abs y={-178} html={`<div style="transform:translateY(${(1 - p) * 60}px);clip-path:inset(0 -40px ${(1 - c01(p)) * 100}% -40px)">${appicon(200)}</div>`} />);
  }
  if (t >= 31.0) add(<Abs y={150} html={`<div style="zoom:2.4;transform:translateY(${(1 - spr(t - 31.0, 'text')) * 20}px);clip-path:inset(0 0 ${(1 - c01(spr(t - 31.0, 'text'))) * 100}% 0)">${badge()}</div>`} />);

  /* Type — every line comes from TEXTS in timeline.js (which also drives its sounds). */
  TEXTS.forEach((l) => {
    if (t < l.at - 0.01 || t > l.out + 0.7) return;
    if (l.at < T.dark && t >= T.dark) return;
    const color = l.kind === 'eyebrow' ? (dk ? BRAND.accentOnDark : BRAND.accent) : l.kind === 'head' ? (dk ? '#F5F5F7' : '#1D1D1F') : dk ? '#A1A1A6' : '#6E6E73';
    const html = l.chars ? chars(t, l.text, l.at, l.out, GAP(l)) : words(t, l.text, l.at, l.out, GAP(l));
    add(<Line html={html} y={l.y} x={l.x || 0} size={l.size} kind={l.kind} color={color} />);
  });

  // Camera: slow push-ins only (close-ups disabled in narrow formats so nothing gets cropped).
  const cam = track(t, [{ at: 0, sc: 1 }, { at: 1, sc: 1.04, e: 'camera' }, { at: T.q, sc: 1, e: 'camera' }, { at: T.logo, sc: 1.05, e: 'camera' }, { at: T.cardA, sc: 1 }, { at: T.store + 0.3, sc: 1.03, e: 'camera' }, { at: T.dark, sc: 1, e: 'exit' }, { at: T.feature, sc: 1.03, e: 'camera' }, { at: T.endIcon, sc: 1.0 }]);
  const camT = LY.stack ? `scale(${1 + (cam.sc - 1) * 0.25})` : `scale(${cam.sc})`;
  const glow = spr(t - T.logo + 0.3, 'camera');

  return (
    <AbsoluteFill style={{ background: black ? '#000' : dk ? 'radial-gradient(1100px 700px at 50% 46%,#1C1C1F 0%,#0B0B0D 60%,#050506 100%)' : 'radial-gradient(1100px 700px at 50% 46%,#FFFFFF 0%,#F7F7F9 45%,#ECECEF 100%)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div dangerouslySetInnerHTML={{ __html: DEFS }} />
      {!black && !dk && t > T.logo - 0.3 && <AbsoluteFill style={{ background: 'radial-gradient(760px 480px at 50% 50%, rgba(23,184,128,0.10), rgba(23,184,128,0) 70%)', transform: `scale(${Math.max(glow, 0.001)})` }} />}
      {!black && (
        <div style={{ position: 'absolute', left: LY.W / 2 - 960, top: LY.H / 2 - 540, width: 1920, height: 1080, transform: `scale(${LY.k})` }}>
          <div style={{ position: 'absolute', inset: 0, transform: camT }}>{L}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

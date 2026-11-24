// Single source of truth for timing. Film.jsx animates from T and TEXTS; export-cues.js hands CUES and SCORE to
// audio.py. Change a time here and both picture and sound move together. Never hard-code times elsewhere.

/* Apple's WWDC23 spring model: duration + bounce → stiffness (2π/d)², damping (1 − bounce)·4π/d, mass 1. */
export const PRESET = {
  smooth: [0.5, 0], // shapes settling, frames, carousels
  text: [0.7, 0], // type reveals
  snappy: [0.42, 0.12], // decisive morphs
  bouncy: [0.5, 0.3], // meaningful pops only
  island: [0.55, 0.24], // system-surface resizes, notification drops
  exit: [0.32, 0], // leaving (always via ex() so it finishes)
  camera: [2.6, 0], // slow push-ins
};

export function spr(dt, preset = 'smooth') {
  if (dt <= 0) return 0;
  const [d, b] = PRESET[preset];
  const w0 = (2 * Math.PI) / d;
  const z = 1 - b;
  if (z >= 0.999) return 1 - Math.exp(-w0 * dt) * (1 + w0 * dt);
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * dt) * (Math.cos(wd * dt) + ((z * w0) / wd) * Math.sin(wd * dt));
}
// Seconds until a spring first reaches its target — where a landing sound belongs.
export function impact(preset, level = 0.97) {
  for (let t = 0; t < 3; t += 1 / 240) if (spr(t, preset) >= level) return t;
  return 0;
}

/* Beats (seconds). Section starts sit on 2-second bars (120 BPM) so music and cuts agree. */
export const T = {
  n: [1.0, 1.5, 2.0], dismiss: 4.6, q: 5.2, qOut: 7.6,
  logo: 8.0, fillAt: 8.9, icon: 9.6, iconUp: 10.6, act3: 13.0,
  cardA: 13.2, cardAIn: 13.4, check: 14.6, cardB: 15.8, cardBIn: 16.0,
  row: 18.0, rowIn: 18.2, press: 19.4, ring: 19.55, open: 20.6, store: 21.2, storeOut: 24.2,
  dark: 25.0, feature: 27.6, featureIn: 27.8, featureOut: 30.0, endIcon: 30.3, out: 34.0, end: 34.5,
};

// Every line of type. kind: head | sub | eyebrow. x shifts a line's center (stage px).
export const TEXTS = [
  { text: 'Your phone gets the first five minutes.', at: 2.2, out: T.dismiss, y: 300, size: 48, kind: 'head' },
  { text: 'What if they were yours again?', at: 5.2, out: T.qOut, y: 540, size: 64, kind: 'head' },
  { text: 'Brand', at: 10.8, out: T.act3, y: 598, size: 64, kind: 'head', chars: true },
  { text: 'Your tagline goes here.', at: 11.2, out: T.act3 + 0.05, y: 669, size: 28, kind: 'sub' },
  { text: 'Show the first real feature.', at: 13.6, out: T.cardB, y: 250, size: 40, kind: 'sub' },
  { text: 'Then the second.', at: 16.2, out: T.row, y: 250, size: 40, kind: 'sub' },
  { text: 'Brand. Now on the App Store.', at: 21.6, out: T.storeOut, y: 565, size: 88, kind: 'head' },
  { text: 'COMING SOON', at: 25.2, out: 27.3, y: 425, size: 22, kind: 'eyebrow' },
  { text: 'Next Feature.', at: 25.35, out: 27.3, y: 525, size: 96, kind: 'head' },
  { text: 'One sentence about why it matters.', at: 25.7, out: 27.35, y: 628, size: 36, kind: 'sub' },
  { text: 'ON THE LOCK SCREEN', at: 27.6, out: T.featureOut, y: 300, size: 22, kind: 'eyebrow' },
  { text: 'Brand', at: 30.6, out: 99, y: 545, size: 88, kind: 'head', chars: true },
  { text: 'Next Feature coming soon.', at: 31.2, out: 99, y: 797, size: 32, kind: 'sub' },
];
export const GAP = (l) => (l.chars ? 0.045 : l.kind === 'eyebrow' ? 0.06 : 0.055);

// Music plan: [bar start, chord (I ii iii IV V Vsus vi IVmaj7), intensity 0..3]; resolve = end-card chord.
export const SCORE = {
  key: 'D', bpm: 120, resolve: 30.6,
  plan: [[1, 'IV', 0], [3, 'I', 0], [5, 'Vsus', 0], [7, 'vi', 0], [8, 'I', 1], [10, 'V', 1], [12, 'vi', 2], [14, 'IV', 2],
    [16, 'I', 2], [18, 'V', 2], [20, 'I', 3], [22, 'IV', 3], [24, 'V', 1], [25, 'ii', 0], [27, 'I', 1], [29, 'IV', 2]],
};

const I = (p) => impact(p);
const textCues = TEXTS.flatMap((l) => {
  // Headlines: up to 5 tuned plucks spread over the words as they land. Subs: one air rise. Eyebrows: one pluck.
  const pan = (l.x || 0) / 960;
  if (l.kind === 'eyebrow') return [{ t: l.at + 0.05, s: 'eyebrow', pan }];
  if (l.kind === 'sub') return [{ t: l.at, s: 'textin', pan, v: 0.7 }];
  const parts = l.chars ? [...l.text] : l.text.split(' ');
  const width = l.size * 0.52 * l.text.length;
  const k = Math.min(5, parts.length);
  return Array.from({ length: k }, (_, j) => {
    const i = k === 1 ? 0 : Math.round((j * (parts.length - 1)) / (k - 1));
    const x = (l.x || 0) + (parts.length > 1 ? (i / (parts.length - 1) - 0.5) * width : 0);
    return { t: l.at + i * GAP(l) + 0.06, s: 'type', step: j, pan: Math.max(-0.8, Math.min(0.8, x / 900)), v: l.size >= 80 ? 0.9 : 0.7 };
  });
});

// Landings on the spring's impact; gestures on their first visible frame (+~40 ms).
export const CUES = [
  ...textCues,
  ...T.n.map((t, i) => ({ t: t + 0.04, s: 'glass', pan: [0, -0.45, 0.4][i], v: 0.85 - i * 0.07 })),
  { t: T.dismiss + 0.02, s: 'swish', pan: 0, to: 1, v: 0.55 },
  { t: T.logo - 1.0, s: 'preswell', pan: 0 },
  { t: T.logo + 0.02, s: 'draw', pan: -0.3, to: 0.3, dur: 1.0 },
  { t: T.fillAt + 0.6, s: 'brand', pan: 0 },
  { t: T.fillAt + 0.75, s: 'sparkle', pan: 0.25 },
  { t: T.icon + I('smooth') * 0.55, s: 'tock', pan: 0 },
  { t: T.cardA + 0.04, s: 'air', pan: -0.25, to: 0.25 },
  { t: T.check + 0.03, s: 'tap', pan: 0.5 },
  { t: T.check + 0.12, s: 'plink', step: 1, pan: 0.5 },
  { t: T.cardB + 0.04, s: 'push', pan: 0 },
  { t: T.row + 0.04, s: 'push', pan: 0 },
  { t: T.press + 0.02, s: 'tap', pan: 0.45, v: 1.2 },
  { t: T.ring + 0.05, s: 'risetone', pan: 0.45, dur: 1.0 },
  { t: T.open + 0.04, s: 'confirm', pan: 0.45 },
  { t: T.store + 0.04, s: 'air', pan: 0.4, to: 0 },
  { t: T.dark, s: 'sub', pan: 0, v: 0.6 },
  { t: T.feature + 0.3, s: 'slide', pan: 0 },
  { t: T.featureOut + 0.03, s: 'swish', pan: 0, v: 0.45 },
  { t: T.endIcon + 0.3, s: 'knock', pan: 0 },
  { t: T.out, s: 'sub', pan: 0 },
];

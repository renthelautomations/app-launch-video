"""Soundtrack renderer for an app launch film. Output: out/audio.wav (48 kHz, stereo, 24-bit).

Reads out/cues.json (written by `node src/export-cues.js`), which carries the duration, the score plan and every
sound cue — all derived from src/timeline.js, the same file the picture animates from.

  python audio.py [hrtf/kemar.sofa]        # STEMS=1 also writes out/stem_sfx.npy + out/stem_music.npy

Pieces:
  score   warm major-key piano + string pad + light pulse, humanized; or a licensed track at public/music.*
  sfx     three families — tuned plucks (in the current chord), paper/foley with body, warm air moves —
          plus optional recorded CC0 samples in sfx/kenney/ (scripts/fetch_kenney.sh); falls back to synthesis
  space   binaural HRTF (SOFA file, e.g. MIT KEMAR via scripts/fetch_hrtf.sh) or equal-power pan + ITD
  mix     music ducks ~3 dB under key moments; SFX top/harsh band tamed; room reverb; peak −1 dBFS
Loudness to −16 LUFS happens at delivery (scripts/deliver.sh, two-pass loudnorm).
"""
import glob
import json
import os
import subprocess
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter, resample_poly, sosfilt

CFG = json.load(open('out/cues.json'))
SR = 48000
DUR = float(CFG['duration'])
N = int(SR * DUR)
rng = np.random.default_rng(11)
SOFA = sys.argv[1] if len(sys.argv) > 1 else 'hrtf/kemar.sofa'


# ---------------------------------------------------------------- helpers
def filt(x, kind, f):
    return sosfilt(butter(2, f, btype=kind, fs=SR, output='sos'), x)


def noise(n):
    return rng.standard_normal(n)


def pink(n):
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    x = lfilter(b, a, noise(n + 2000))[2000:]
    return x / (np.abs(x).max() + 1e-9)


def adsr(n, a, d, s):
    t = np.arange(n) / SR
    return np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))


def hz(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def mixs(*xs):
    xs = [x for x in xs if len(x)]
    n = max(len(x) for x in xs)
    return sum(np.pad(x, (0, n - len(x))) for x in xs)


# ---------------------------------------------------------------- spatial placement
HRTF = None
if os.path.exists(SOFA):
    import h5py

    f = h5py.File(SOFA, 'r')
    pos, irs = f['SourcePosition'][:], f['Data.IR'][:]
    fs = int(np.array(f['Data.SamplingRate']).ravel()[0])
    sel = np.abs(pos[:, 1]) < 1  # horizontal plane
    az, h = pos[sel, 0], irs[sel]
    if fs != SR:
        from math import gcd

        g = gcd(SR, fs)
        h = resample_poly(h, SR // g, fs // g, axis=2)
    o = np.argsort(az)
    HRTF = (az[o], h[o] / np.abs(h).max())
else:
    print(f'(no SOFA at {SOFA}: using equal-power pan + ITD)')


def hrir(a):
    AZ, H = HRTF
    a %= 360
    i = np.searchsorted(AZ, a) % len(AZ)
    j = (i - 1) % len(AZ)
    span = (AZ[i] - AZ[j]) % 360 or 5
    w = ((a - AZ[j]) % 360) / span
    return H[j] * (1 - w) + H[i] * w


bus = np.zeros((N + SR, 2))
room_send = np.zeros((N + SR, 2))


def place(sig, at, pan0=0.0, pan1=None, gain=1.0, dist=1.0):
    """Put a mono sound on the timeline, moving from pan0 to pan1 (−1 left … +1 right). dist>1 = farther."""
    pan1 = pan0 if pan1 is None else pan1
    sig = sig * gain * rng.uniform(0.88, 1.08) / dist
    if dist > 1.2:
        sig = filt(sig, 'low', 9000 / dist)
    n = len(sig)
    ease = lambda u: u * u * (3 - 2 * u)
    if HRTF:
        B, hop = 1024, 512
        win = np.hanning(B + 1)[:B]
        out = np.zeros((n + B + 1200, 2))
        for s0 in range(0, n, hop):
            seg = sig[s0:s0 + B] * win[: len(sig[s0:s0 + B])]
            p = pan0 + (pan1 - pan0) * ease(min(max((s0 + B / 2) / max(n, 1), 0), 1))
            h = hrir((-p * 75) % 360)  # SOFA azimuth is counter-clockwise (+90 = left)
            m = len(seg) + h.shape[1] - 1
            out[s0:s0 + m, 0] += fftconvolve(seg, h[0])
            out[s0:s0 + m, 1] += fftconvolve(seg, h[1])
        out *= 2.2
    else:
        p = np.linspace(pan0, pan1, n)
        th = (p + 1) * np.pi / 4
        itd = (np.abs(p) * 0.00065 * SR).astype(int)
        idx = np.arange(n)
        late = sig[np.clip(idx - itd, 0, n - 1)] * (idx >= itd)
        out = np.stack([np.where(p > 0, late, sig) * np.cos(th), np.where(p < 0, late, sig) * np.sin(th)], axis=1)
    i0 = max(int(at * SR), 0)
    m = min(len(out), len(bus) - i0)
    bus[i0:i0 + m] += out[:m]
    room_send[i0:i0 + m] += out[:m] * 0.18 * dist


# ---------------------------------------------------------------- score
music = np.zeros((N + SR, 2))


def piano(note, vel=0.7, dur=3.0):
    f0, n = hz(note), int(dur * SR)
    t = np.arange(n) / SR
    tau = 2.2 * (261.6 / f0) ** 0.45
    x = np.zeros(n)
    for k in range(1, 11):
        fk = k * f0 * np.sqrt(1 + 0.00035 * k * k)
        if fk > 12000:
            break
        amp, tk = (1 / k ** 1.15) * (0.55 + 0.45 * vel) ** (k * 0.35), tau / (1 + 0.32 * k)
        for det in (-0.18, 0.18):
            x += amp * np.sin(2 * np.pi * (fk + det * k) * t + rng.uniform(0, 6.28)) * (0.6 * np.exp(-t / (tk * 0.35)) + 0.4 * np.exp(-t / tk))
    x *= adsr(n, 0.003, 0.05, 1.0)
    ham = filt(noise(int(0.012 * SR)), 'band', [800, 5000]) * np.linspace(1, 0, int(0.012 * SR))
    x[: len(ham)] += ham * 0.08
    return x * np.minimum(1, (n - np.arange(n)) / (0.25 * SR)) * vel * 0.16


def pad(notes, start, end, gain=0.03, bright=1800):
    n = int((end - start) * SR)
    t = np.arange(n) / SR
    L, R = np.zeros(n), np.zeros(n)
    for i, nt in enumerate(notes):
        vib = 1 + 0.0025 * np.sin(2 * np.pi * (4.8 + 0.3 * i) * t + i)
        for det, wl, wr in ((-0.006, 1.0, 0.45), (0.0, 0.7, 0.7), (0.006, 0.45, 1.0)):
            v = 2 * ((np.cumsum(hz(nt) * (1 + det) * vib / SR) + rng.uniform()) % 1) - 1
            L += v * wl
            R += v * wr
    sh = np.minimum(np.clip(t / 1.6, 0, 1), np.clip((end - start - t) / 1.4, 0, 1)) ** 1.5
    i0 = int(start * SR)
    music[i0:i0 + n, 0] += filt(L, 'low', bright) * sh * gain / len(notes)
    music[i0:i0 + n, 1] += filt(R, 'low', bright) * sh * gain / len(notes)


def kick(vel=0.5):
    t = np.arange(int(0.35 * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(48 + 70 * np.exp(-t * 28)) / SR) * np.exp(-t * 11) * vel * 0.5


def shaker(vel=0.3):
    n = int(0.09 * SR)
    return filt(noise(n), 'high', 6000) * adsr(n, 0.012, 0.025, 0.0) * vel * 0.09


def mput(x, at, pan=0.0, g=1.0):
    at = max(at + rng.normal(0, 0.006), 0)  # human timing
    i0 = int(at * SR)
    m = min(len(x), len(music) - i0)
    th = (pan + 1) * np.pi / 4
    music[i0:i0 + m, 0] += x[:m] * np.cos(th) * g
    music[i0:i0 + m, 1] += x[:m] * np.sin(th) * g


# Chords as (bass, voicing) in D major; the score's `key` transposes everything.
KEYS = {'C': -2, 'Db': -1, 'D': 0, 'Eb': 1, 'E': 2, 'F': 3, 'Gb': 4, 'G': 5, 'Ab': -6, 'A': -5, 'Bb': -4, 'B': -3}
CH = {'I': (38, [62, 66, 69, 74]), 'ii': (40, [59, 64, 67, 71]), 'iii': (42, [61, 66, 69, 73]), 'IV': (43, [62, 67, 71, 74]),
      'V': (45, [61, 64, 69, 73]), 'Vsus': (45, [62, 64, 69, 74]), 'vi': (47, [62, 66, 69, 71]), 'IVmaj7': (43, [62, 66, 71, 74])}
S = CFG['score']
TR = KEYS.get(S.get('key', 'D'), 0)
PLAN = [(st, (CH[c][0] + TR, [v + TR for v in CH[c][1]]), lvl) for st, c, lvl in S['plan']]


def chord_at(t):
    cur = PLAN[0][1]
    for st, ch, _ in PLAN:
        if st <= t:
            cur = ch
    return cur[1]


tracks = sorted(glob.glob('public/music.*'))
if tracks:  # licensed track replaces the score; loaded before SFX so ducking applies
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', tracks[0], '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(float)
    m = min(len(x), len(music))
    music[:m] = x[:m] * 10 ** (-6 / 20)
    print('using licensed track', tracks[0])
else:
    ends = [p[0] for p in PLAN[1:]] + [S['resolve']]
    for (st, (bass, voc), lvl), en in zip(PLAN, ends):
        bar = en - st
        mput(piano(bass + 12, 0.55 + 0.05 * lvl, bar + 1.2), st, -0.25)
        step, k, tt = [1.0, 0.5, 0.5, 0.25][lvl], 0, st + (0.5 if lvl == 0 else 0)
        while tt < en - 0.01:
            nt = voc[[0, 1, 2, 3, 2, 1][k % 6]] + (12 if lvl >= 2 and k % 4 == 3 else 0)
            mput(piano(nt, rng.uniform(0.42, 0.6) + 0.04 * lvl, 2.2), tt, 0.15 + 0.15 * np.sin(k), g=0.9)
            k, tt = k + 1, tt + step
        if lvl >= 1:
            pad([v - 12 for v in voc] + [voc[2]], st - 0.2, en + 0.6, gain=0.022 + 0.006 * lvl, bright=1400 + 400 * lvl)
        if lvl >= 2:
            for b in range(int(round(bar / 0.5))):
                mput(shaker(0.25 + 0.15 * (b % 2) + rng.uniform(0, 0.1)), st + b * 0.5 + 0.25, 0.35)
                if b % 2 == 0:
                    mput(kick(0.35 if lvl == 2 else 0.5), st + b * 0.5, 0)
    r0 = S['resolve']
    bass, voc = PLAN[0][1]
    for i, nt in enumerate([bass, bass + 12, voc[2] - 12, voc[0], voc[0] + 2, voc[1], voc[2], voc[3], voc[3] + 4]):
        mput(piano(nt, 0.62, 4.0), r0 + i * 0.045, -0.4 + i * 0.1)
    pad([bass + 12, voc[2] - 12, voc[0], voc[1], voc[2]], r0 - 0.3, DUR - 0.3, gain=0.03, bright=2200)
    fade0 = int((DUR - 0.45) * SR)
    music[fade0:] *= np.linspace(1, 0, len(music) - fade0)[:, None] ** 6


# ---------------------------------------------------------------- SFX generators
def pluck(note, vel=0.6, dur=0.9, bright=1.0):
    """Kalimba-like tine: fundamental + inharmonic 2.76x partial + a little wood click."""
    t = np.arange(int(dur * SR)) / SR
    f0 = hz(note)
    x = np.sin(2 * np.pi * f0 * t) * np.exp(-t * 5.5) + 0.22 * bright * np.sin(2 * np.pi * f0 * 2.76 * t) * np.exp(-t * 16)
    x += filt(noise(len(t)), 'band', [600, 2500]) * np.exp(-t * 260) * 0.12
    return filt(x * (1 - np.exp(-t * 900)), 'low', 6000) * vel * 0.26


def chord_pluck(t, step, octv=12, vel=0.5):
    voc = sorted(chord_at(t))
    return pluck(voc[step % len(voc)] + octv + (12 if step >= len(voc) else 0), vel)


def whoosh(dur=0.6, lo=180, hi=1400, rise=0.5):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    x = pink(n)
    a, b = filt(x, 'band', [lo, lo * 3]), filt(x, 'band', [hi / 2.5, hi])
    sweep = np.clip(t / rise, 0, 1)
    env = np.where(t < rise, (t / rise) ** 2, ((1 - t) / (1 - rise)) ** 1.5)
    return (a * (1 - sweep) + b * sweep) * env * 0.5


def paper(dur=0.35, body=1.0):
    n = int(dur * SR)
    grains = (rng.random(n) < 0.006) * rng.uniform(0.3, 1, n)
    crinkle = fftconvolve(grains, np.exp(-np.arange(260) / 40))[:n] * noise(n)
    x = filt(crinkle, 'band', [700, 4000]) * 0.5 + filt(pink(n), 'band', [200, 900]) * 0.35 * body
    return x * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.8 * 0.55


def pencil(dur=1.2):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    grains = (rng.random(n) < 0.03) * rng.uniform(0.2, 1, n)
    x = filt(fftconvolve(grains, np.exp(-np.arange(60) / 9))[:n] * noise(n), 'band', [900, 4500]) + filt(pink(n), 'band', [250, 900]) * 0.4
    return x * np.sin(np.pi * t) ** 0.5 * (0.85 + 0.15 * np.sin(2 * np.pi * 7 * t)) * 0.32


def thud():
    t = np.arange(int(0.5 * SR)) / SR
    body = np.sin(2 * np.pi * (62 + 50 * np.exp(-t * 35)) * t) * np.exp(-t * 12)
    return body * 0.55 + paper(0.5, 0.2) * np.exp(-t * 8) * 0.5


def swell_rev(dur=1.0):
    bass, voc = PLAN[0][1]
    x = sum(piano(n0, 0.5, dur) for n0 in (bass + 12, voc[2] - 12, voc[0], voc[1]))[: int(dur * SR)]
    return mixs(x[::-1] * np.linspace(0, 1, len(x)) ** 1.5 * 1.6, whoosh(dur, 200, 1600, 0.98) * 0.25)


def brand_chord(t0):
    """The logo lands: rolled add9 chord over a deep soft sub bloom and faint bell air."""
    n = int(3.2 * SR)
    t = np.arange(n) / SR
    bass, voc = PLAN[0][1]
    out = np.zeros(n)
    for i, nt in enumerate([bass, bass + 12, voc[2] - 12, voc[0], voc[0] + 2, voc[1], voc[2]]):
        d = int(i * 0.035 * SR)
        out[d:] += piano(nt, 0.6, 3.2)[: n - d] * 1.2
    out += np.sin(2 * np.pi * hz(bass - 12) * t) * (1 - np.exp(-t * 20)) * np.exp(-t * 1.8) * 0.3
    return out


def risetone(dur=1.1):
    t = np.linspace(0, 1, int(dur * SR))
    f = hz(chord_at(0)[2]) * 2 ** ((5 / 12) * t ** 1.4)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR)) * np.sin(np.pi * t) ** 1.2 * 0.08


def bloop(pitch=1.0):
    t = np.arange(int(0.4 * SR)) / SR
    ph = 2 * np.pi * np.cumsum((120 + 150 * (1 - np.exp(-t * 22))) * pitch) / SR
    return (np.sin(ph) + 0.35 * np.sin(2 * ph)) * np.exp(-t * 9) * (1 - np.exp(-t * 250)) * 0.32


def marker(dur=0.9):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    return filt(pink(n), 'band', [500, 2600]) * (0.75 + 0.25 * np.sin(2 * np.pi * 22 * t)) * np.sin(np.pi * t) ** 0.7 * 0.28


def nib():
    n = int(0.14 * SR)
    return filt(pink(n), 'band', [800, 3500]) * np.sin(np.pi * np.linspace(0, 1, n)) * 0.18


def tock():
    t = np.arange(int(0.3 * SR)) / SR
    f0 = rng.uniform(520, 560)
    return (np.sin(2 * np.pi * f0 * t) * np.exp(-t * 28) + 0.4 * np.sin(2 * np.pi * f0 * 2.3 * t) * np.exp(-t * 45)) * 0.28


def sub():
    t = np.arange(int(0.9 * SR)) / SR
    return np.sin(2 * np.pi * 49 * t) * np.exp(-t * 4) * (1 - np.exp(-t * 400)) * 0.6


_SC = {}


def smp(name, semis=0.0, lp=None, gain=1.0):
    """Recorded sample sfx/kenney/<name>.ogg (onset-trimmed, peak-normalised). Empty if missing → synth only."""
    path = f'sfx/kenney/{name}.ogg'
    if not os.path.exists(path):
        return np.zeros(0)
    if name not in _SC:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
        x = np.frombuffer(raw, dtype=np.float32).astype(float)
        x = x[max(int(np.argmax(np.abs(x) > 0.03 * np.abs(x).max())) - 48, 0):]
        _SC[name] = x / (np.abs(x).max() + 1e-9)
    x = _SC[name]
    if semis:
        x = np.interp(np.arange(0, len(x) - 1, 2 ** (semis / 12)), np.arange(len(x)), x)
    if lp:
        x = filt(x, 'low', lp)
    x = x.copy()
    f = min(len(x), int(0.01 * SR))
    x[-f:] *= np.linspace(1, 0, f)
    return x * gain * 0.32


ALERT = [12, 14, 16, 19, 21]  # alerts climb (semitones above the tonic) as they pile up
GEN = {
    'glass': lambda c, i: mixs(smp(['glass_001', 'glass_002', 'glass_003'][i % 3], semis=i, lp=7000), pluck(PLAN[0][1][1][0] + ALERT[i % 5], 0.25 if smp('glass_001').size else 0.55, 0.9, 1.3)),
    'swish': lambda c, i: mixs(smp(['cloth1', 'cloth3'][i % 2], lp=6000, gain=0.8), whoosh(0.42, 300, 2200, 0.35) * 0.4),
    'preswell': lambda c, i: swell_rev(1.0),
    'draw': lambda c, i: pencil(c.get('dur', 1.2)),
    'brand': lambda c, i: brand_chord(c['t']),
    'bloom': lambda c, i: mixs(bloop(0.85), whoosh(0.6, 150, 900, 0.3) * 0.6),
    'sparkle': lambda c, i: mixs(*[np.pad(chord_pluck(c['t'], k, 24, 0.25), (int(k * 0.07 * SR), 0)) for k in range(3)]),
    'tock': lambda c, i: mixs(smp('drop_002', lp=6000), tock() * 0.4),
    'air': lambda c, i: whoosh(0.65, 160, 1200, 0.45),
    'push': lambda c, i: mixs(smp(['card-slide-2', 'card-slide-3', 'card-slide-4'][i % 3], lp=6500, gain=0.8), whoosh(0.5, 200, 1300, 0.4) * 0.5),
    'plink': lambda c, i: mixs(chord_pluck(c['t'], c.get('step', i), 12, 0.5), smp(['drop_001', 'drop_003'][i % 2], lp=6000, gain=0.35)),
    'confirm': lambda c, i: mixs(chord_pluck(c['t'], 2, 12, 0.5), np.pad(chord_pluck(c['t'], 3, 12, 0.5), (int(0.12 * SR), 0)), smp('confirmation_004', lp=6000, gain=0.35)),
    'tap': lambda c, i: mixs(smp(['select_001', 'click_001'][i % 2], lp=7000, gain=0.7), tock() * (0 if smp('select_001').size else 0.8)),
    'marker': lambda c, i: marker(c.get('dur', 0.9)),
    'risetone': lambda c, i: risetone(c.get('dur', 1.1)),
    'bloop': lambda c, i: mixs(bloop(c.get('pitch', 1.0)), smp('minimize_001' if c.get('pitch', 1.0) < 1 else 'maximize_001', lp=5000, gain=0.35)),
    'nib': lambda c, i: mixs(smp(['scratch_001', 'scratch_002', 'scratch_004'][i % 3], semis=-5, lp=4500, gain=0.45), nib() * (0 if smp('scratch_001').size else 1)),
    'slide': lambda c, i: mixs(smp(['card-slide-4', 'card-shove-2'][i % 2], lp=6000, gain=0.8), whoosh(0.5, 200, 1000, 0.6) * 0.4),
    'paper': lambda c, i: mixs(smp(['card-place-4', 'bookFlip3'][i % 2], lp=6500, gain=0.8), paper(0.4) * (0 if smp('card-place-4').size else 1)),
    'thud': lambda c, i: mixs(smp(['bookPlace2', 'bookPlace1'][i % 2], lp=6000), thud() * (0.35 if smp('bookPlace2').size else 1)),
    'sub': lambda c, i: sub(),
    'knock': lambda c, i: mixs(chord_pluck(c['t'], 0, 0, 0.6), smp('drop_004', lp=5000, gain=0.6)),
    'type': lambda c, i: chord_pluck(c['t'], c.get('step', 0), 12, 0.32),
    'eyebrow': lambda c, i: mixs(chord_pluck(c['t'], 3, 24, 0.12), smp('tick_004', lp=6000, gain=0.25)),
    'textin': lambda c, i: whoosh(0.5, 180, 1100, 0.55) * 0.35,
}
# Gain staging: see references/sound.md (bed −19…−13, UI −15…−9, moments −8…−1 dB vs. music).
GAIN = {'type': 0.55, 'eyebrow': 0.3, 'textin': 2.2, 'glass': 0.55, 'air': 2.2, 'push': 0.9, 'swish': 0.8, 'draw': 1.3,
        'preswell': 3.5, 'brand': 0.7, 'sparkle': 0.2, 'tock': 0.5, 'risetone': 2.6, 'marker': 1.3, 'thud': 1.4, 'paper': 0.55, 'nib': 1.6}
KEY = {'brand', 'thud', 'risetone', 'sparkle', 'draw'}  # music ducks under these
EARLY = {'air', 'push', 'swish', 'slide', 'textin'}  # air is heard as a shape starts and peaks with its motion

counts, duck = {}, np.ones(len(music))
for c in CFG['cues']:
    k = c['s']
    if k not in GEN:
        print('unknown cue type', k)
        continue
    counts[k] = counts.get(k, 0) + 1
    sig = GEN[k](c, counts[k] - 1)
    at = c['t'] - (len(sig) / SR if k == 'preswell' else 0) - (0.08 if k in EARLY else 0)
    place(sig, at, c.get('pan', 0), c.get('to'), gain=c.get('v', 1.0) * GAIN.get(k, 1.0), dist=1.0 + abs(c.get('pan', 0)) * 0.25)
    if k in KEY:
        i0, n = int(c['t'] * SR), int(1.2 * SR)
        w = np.minimum(np.linspace(0, 1, n) * 6, 1) * np.minimum(np.linspace(1, 0, n) * 2.5, 1)
        seg = duck[i0:i0 + n]
        duck[i0:i0 + n] = np.minimum(seg, 1 - 0.3 * w[: len(seg)])
music *= duck[:, None]
for ch in range(2):  # tame the 2.5–5 kHz bite and the extreme top
    bus[:, ch] = filt(bus[:, ch], 'low', 10000) - 0.3 * filt(bus[:, ch], 'band', [2500, 5000])

# ---------------------------------------------------------------- mix + room
irn = int(2.0 * SR)
tt = np.arange(irn) / SR
ir = noise(irn * 2).reshape(irn, 2) * np.exp(-tt * 3.2)[:, None]
for ch in range(2):
    ir[:, ch] = filt(ir[:, ch], 'low', 5000)
ir /= np.sqrt((ir ** 2).sum(axis=0))
send = room_send + music * 0.35
wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[: len(send)] for ch in range(2)], axis=1)
os.makedirs('out', exist_ok=True)
if os.environ.get('STEMS'):
    np.save('out/stem_sfx.npy', (bus * 0.3)[:N].astype(np.float32))
    np.save('out/stem_music.npy', music[:N].astype(np.float32))
mix = (bus * 0.3 + music + wet * 0.45)[:N]
silent_head = float(CFG.get('silentHead', 0))
mix[: int(silent_head * SR)] *= 0
pk = np.abs(mix).max() + 1e-9
mix = mix / pk * 1.6
mix = np.where(np.abs(mix) > 0.8, np.sign(mix) * (0.8 + 0.2 * np.tanh((np.abs(mix) - 0.8) / 0.2)), mix)  # soft knee
mix *= 10 ** (-1 / 20) / (np.abs(mix).max() + 1e-9)
pcm = (mix * (2 ** 23 - 1)).astype(np.int32)
b = np.zeros((N, 2, 3), dtype=np.uint8)
for k in range(3):
    b[:, :, k] = (pcm >> (8 * k)) & 0xFF
with wave.open('out/audio.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(b.tobytes())
print('wrote out/audio.wav', f'({DUR:.1f} s, {len(CFG["cues"])} cues, {"HRTF" if HRTF else "pan"})')

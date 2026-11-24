"""Per-cue SFX report from stems (run audio.py with STEMS=1 first).
  python sfx_report.py out/cues.json
Columns: count, SFX level vs. music at the cue (dB), spectral centroid (Hz), share of energy in 2–5 kHz (harsh band).
Targets: bed −19…−13 dB, UI −15…−9, moments −8…−1; centroid ~1–2.5 kHz; 2–5 kHz share mostly < 0.6; ≤ 8 cues/s.
"""
import json
import sys
from collections import defaultdict

import numpy as np

SR = 48000
sfx = np.load('out/stem_sfx.npy').mean(1)
mus = np.load('out/stem_music.npy').mean(1)
cfg = json.load(open(sys.argv[1]))
cues = cfg['cues'] if isinstance(cfg, dict) else cfg
db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
st = defaultdict(list)
for c in cues:
    i = int(c['t'] * SR)
    seg, m = sfx[i:i + int(0.3 * SR)], mus[i:i + int(0.3 * SR)]
    if len(seg) < 100:
        continue
    sp = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
    f = np.fft.rfftfreq(len(seg), 1 / SR)
    st[c['s']].append((db(seg) - db(m), (sp * f).sum() / (sp.sum() + 1e-9), (sp[(f > 2000) & (f < 5000)] ** 2).sum() / ((sp ** 2).sum() + 1e-9)))
print(f"{'sound':10s} {'n':>3s}  vs-music  centroid  2-5k")
for k, v in sorted(st.items(), key=lambda kv: np.mean([x[0] for x in kv[1]])):
    a = np.array(v)
    print(f'{k:10s} {len(v):3d}   {a[:, 0].mean():+6.1f}   {a[:, 1].mean():7.0f}   {a[:, 2].mean():.2f}')
ts = np.array([c['t'] for c in cues])
print('max cues per second:', int(np.histogram(ts, bins=np.arange(0, ts.max() + 2, 1))[0].max()))

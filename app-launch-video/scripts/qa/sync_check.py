"""Compare sound cues with picture motion. For each cue, find the motion peak within ±0.3 s.
  python sync_check.py video.mp4 out/cues.json
Flags cues more than ±0.17 s from the nearest motion peak. Landings should sit on the settle frame, gestures on
the first visible frame — read the flagged ones with judgment (a sound on a still frame is the real bug).
  --all also checks text cues (type/textin/eyebrow), which are usually noisy because several words move at once.
"""
import json
import sys

import numpy as np
from _video import frames

d, fps = frames(sys.argv[1], scale_w=192, gray=True)
m = np.abs(np.diff(d.astype(float), axis=0)).mean(axis=(1, 2))
m = np.convolve(m, np.ones(3) / 3, 'same')
cfg = json.load(open(sys.argv[2]))
cues = cfg['cues'] if isinstance(cfg, dict) else cfg
bad = 0
TEXT = {'type', 'textin', 'eyebrow', 'tick', 'textout'}
checked = [c for c in cues if '--all' in sys.argv or c['s'] not in TEXT]
for c in checked:
    f = int(c['t'] * fps)
    lo, hi = max(f - int(0.3 * fps), 0), min(f + int(0.3 * fps), len(m) - 1)
    if hi <= lo:
        continue
    k = lo + int(np.argmax(m[lo:hi]))
    off = (k - f) / fps
    still = m[lo:hi].max() < 0.02  # small UI (a button) moves little at preview size
    if abs(off) > 0.17 or still:
        bad += 1
        print(f"{c['t']:6.2f}s {c['s']:9s} motion-peak offset {off:+.2f}s{'  (no motion here!)' if still else ''}")
print(f'{bad} cue(s) flagged of {len(checked)} checked')

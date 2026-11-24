"""Track a steady element's bounding box per frame to catch shaking, resizing or drift.
  python bbox_track.py video.mp4 --from 46.8 --to 57 --rgb 243,235,216 --tol 30 [--ymin 300]
Prints every frame where the box moves/resizes by > 1 px. After the element settles, expect none.
"""
import argparse

import numpy as np
from _video import frames

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('--from', dest='t0', type=float, required=True); ap.add_argument('--to', dest='t1', type=float, required=True)
ap.add_argument('--rgb', required=True, help='element color, e.g. 243,235,216'); ap.add_argument('--tol', type=int, default=30); ap.add_argument('--ymin', type=int, default=0)
a = ap.parse_args()
col = np.array(list(map(int, a.rgb.split(','))))
arr, fps = frames(a.video, start=a.t0, dur=a.t1 - a.t0)
prev, n = None, 0
for i, f in enumerate(arr):
    m = (np.abs(f.astype(int) - col).max(axis=2) < a.tol)[a.ymin:]
    ys, xs = np.nonzero(m)
    if len(xs) < 300:
        prev = None; continue
    b = np.array([xs.min(), xs.max(), ys.min() + a.ymin, ys.max() + a.ymin])
    if prev is not None and (np.abs(b - prev) > 1).any():
        n += 1
        print(f'{a.t0 + i / fps:6.2f}s box {b.tolist()} Δ {(b - prev).tolist()}')
    prev = b
print(f'{n} frame(s) with movement > 1 px')

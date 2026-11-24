"""Leftover pixels after exits (slivers, hairlines, half glyphs).
  python residue_scan.py video.mp4 --at 6.45,34.9,57.25
Sample ~0.4 s after each exit. Expect 0 px (a hit right when the NEXT element starts entering is fine).
"""
import argparse

import numpy as np
from scipy.ndimage import uniform_filter
from _video import frame_at

ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('--at', required=True); ap.add_argument('--thr', type=int, default=14)
a = ap.parse_args()
for t in map(float, a.at.split(',')):
    x = frame_at(a.video, t).astype(float)
    d = np.abs(x - uniform_filter(x, 41)) > a.thr
    ys, xs = np.nonzero(d)
    print(f'{t:6.2f}s residue {d.sum():6d} px' + (f'  bbox x{xs.min()}-{xs.max()} y{ys.min()}-{ys.max()}' if d.sum() else ''))

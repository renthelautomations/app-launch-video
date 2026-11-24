"""Find single-frame jumps (pops). Motion should ramp; only intentional hard cuts may appear.
  python pop_scan.py video.mp4
"""
import sys

import numpy as np
from _video import frames

d, fps = frames(sys.argv[1], scale_w=192, gray=True)
d = d.astype(float)
df = np.abs(np.diff(d, axis=0)).mean(axis=(1, 2))
med = np.array([np.median(df[max(0, i - 6):i + 7]) for i in range(len(df))])
hits = np.where((df > 1.2) & (df > 4 * med + 0.3))[0]
for i in hits:
    print(f'POP t={(i + 1) / fps:6.2f}s diff={df[i]:.2f} local={med[i]:.2f}')
print(f'{len(hits)} pop(s). Expected only at intentional hard cuts.')

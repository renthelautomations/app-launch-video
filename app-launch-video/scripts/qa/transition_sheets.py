"""Contact strips across transitions: 8 frames per window, one row each, 8 rows per sheet.
  python transition_sheets.py video.mp4 out_dir --windows 13.9-15.2,16.9-18.0,...
Look for: empty shapes, overlapping content, cut text, grey color mid-states, leftovers, awkward mid-poses.
"""
import argparse
import os

from PIL import Image, ImageDraw
from _video import frames

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('out'); ap.add_argument('--windows', required=True); ap.add_argument('--k', type=int, default=8)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
wins = [tuple(map(float, w.split('-'))) for w in a.windows.split(',')]
rows = []
for s, e in wins:
    arr, _ = frames(a.video, scale_w=256, start=s, dur=e - s + 0.05, fps=30)
    W, H = arr.shape[2], arr.shape[1]
    r = Image.new('RGB', (a.k * (W + 4), H + 18), 'white')
    d = ImageDraw.Draw(r)
    for k in range(a.k):
        i = min(int(round(k / (a.k - 1) * (len(arr) - 1))), len(arr) - 1)
        r.paste(Image.fromarray(arr[i]), (k * (W + 4), 18))
        d.text((k * (W + 4) + 3, 3), f'{s + i / 30:.2f}s', fill='red')
    rows.append(r)
for n in range(0, len(rows), 8):
    part = rows[n:n + 8]
    sh = Image.new('RGB', (part[0].width, sum(p.height for p in part)), 'white')
    y = 0
    for p in part:
        sh.paste(p, (0, y)); y += p.height
    path = os.path.join(a.out, f'sheet{n // 8}.png')
    sh.save(path)
    print(path)

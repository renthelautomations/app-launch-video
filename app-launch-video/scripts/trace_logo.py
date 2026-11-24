"""Trace a raster logo (ideally a monochrome/transparent PNG, ≥1024 px) into vector paths for the film.

  python trace_logo.py logo.png out/          # needs: potrace, pip install pillow numpy scipy

Writes out/logo.json ({W, H, transform, d:[paths]} — paste into src/brand.js LOGO) and out/logo.svg, and prints
an optical-centering suggestion: the offset between the mark's bounding-box center and its mass centroid.
Asymmetric marks (a flat side vs. a round side) look off-center when geometrically centered in an icon;
nudge toward the lighter side by about that amount (a D-shaped mark needed ~3% of its width).
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGBA')
im = im.resize((2048, int(2048 * im.height / im.width)), Image.LANCZOS)
a = np.array(im)
alpha = a[:, :, 3]
mask = alpha > 128 if alpha.min() < 250 else a[:, :, :3].mean(axis=2) < 128  # transparent PNG or dark-on-light
ys, xs = np.nonzero(mask)
mask = mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
H, W = mask.shape
pbm = os.path.join(out, 'logo.pbm')
Image.fromarray(np.where(mask, 0, 255).astype('uint8')).save(pbm)
svg_path = os.path.join(out, 'logo.svg')
subprocess.run(['potrace', pbm, '-s', '-o', svg_path, '-t', '4', '-a', '1.0', '-O', '0.2'], check=True)
svg = open(svg_path).read()
transform = re.search(r'<g transform="([^"]+)"', svg).group(1)
paths = [' '.join(d.split()) for d in re.findall(r'<path d="([^"]+)"', svg, re.S)]
json.dump({'W': W, 'H': H, 'transform': transform, 'd': paths}, open(os.path.join(out, 'logo.json'), 'w'))
yy, xx = np.nonzero(mask)
dx = (xx.mean() - (W - 1) / 2) / W * 100
dy = (yy.mean() - (H - 1) / 2) / H * 100
print(f'logo.json: {W}x{H}, {len(paths)} path(s)')
print(f'mass centroid vs bbox center: dx {dx:+.1f}% dy {dy:+.1f}% of size')
print(f'suggested ICON_NUDGE_X ≈ {-dx * 2:+.1f}% (shift toward the visually lighter side; judge by eye)')

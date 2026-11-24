"""Shared helpers: read frames from a video with ffmpeg into numpy."""
import json
import subprocess

import numpy as np


def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height,r_frame_rate',
                        '-of', 'json', path], capture_output=True, check=True)
    s = json.loads(r.stdout)['streams'][0]
    n, d = s['r_frame_rate'].split('/')
    return s['width'], s['height'], float(n) / float(d)


def frames(path, scale_w=None, gray=False, start=None, dur=None, fps=None):
    w, h, f = probe(path)
    vf = []
    if fps:
        vf.append(f'fps={fps}')
    if scale_w:
        h = int(round(h * scale_w / w / 2) * 2)
        w = scale_w
        vf.append(f'scale={w}:{h}')
    cmd = ['ffmpeg', '-v', 'error']
    if start is not None:
        cmd += ['-ss', str(start)]
    if dur is not None:
        cmd += ['-t', str(dur)]
    cmd += ['-i', path]
    if vf:
        cmd += ['-vf', ','.join(vf)]
    cmd += ['-f', 'rawvideo', '-pix_fmt', 'gray' if gray else 'rgb24', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    c = 1 if gray else 3
    arr = np.frombuffer(raw, np.uint8).reshape(-1, h, w, c) if c == 3 else np.frombuffer(raw, np.uint8).reshape(-1, h, w)
    return arr, (fps or f)


def frame_at(path, t, gray=True):
    a, _ = frames(path, gray=gray, start=t, dur=0.02)
    return a[0]

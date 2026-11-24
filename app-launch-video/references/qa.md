# QA kit

Run on a half-res preview (`npx remotion render src/index.js <Comp> out/preview.mp4 --scale=0.5`) before every
review. All scripts need Python 3 with numpy (+ Pillow, scipy where noted) and ffmpeg on PATH.
Always look at the contact sheets yourself — the scripts find classes of bugs, your eyes find taste problems.

| script | finds | read it as |
|---|---|---|
| `transition_sheets.py video.mp4 --windows 13.9-15.2,16.9-18 ...` | empty shapes, overlaps, cut text, awkward mid-states | 8 frames per transition, one row each |
| `pop_scan.py video.mp4` | single-frame jumps | should list only intentional hard cuts |
| `residue_scan.py video.mp4 --at 6.45,34.9,...` | leftovers after exits (slivers, hairlines) | 0 px expected 0.4 s after an exit |
| `bbox_track.py video.mp4 --from 46.8 --to 57 --color paper` | jitter, resizing, drift of a "steady" element | after settling: 0 px change |
| `sync_check.py video.mp4 out/cues.json` | sounds early/late vs. motion | flags cues > ±0.17 s off the motion peak |
| `sfx_report.py` (from `audio.py` with `STEMS=1`) | levels vs. music, brightness, harsh share, density | see sound.md table |
| loudness | `ffmpeg -i f -af ebur128=peak=true -f null -` | −16 LUFS, peak ≤ −1.5 |

## Storyboard QA (in `assets/storyboard-template.html`)
On load, each frame (true 1920×1080) is checked for: text/art overlap (text measured with Range rects, not
element boxes), clipped text, out of frame, outside 5% title-safe, type < 20 px, hero > 1% off center.
In-between frames skip the overlap check. Results print per frame and in a summary; `#qa-json` lets a headless
run (`chrome --headless --dump-dom`) read them.

## Things that the eyes caught (scripts didn't)
- A reveal that is technically smooth but conceptually wrong (logo assembling, blob).
- Too much happening at once in one component.
- Unreadable pace.
- A color mid-state (grey/taupe) during a light/dark change.
- Badge text wrapping because a zoomed element sat in a too-narrow container.

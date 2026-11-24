# Formats & delivery

One project, three compositions sharing the timeline: `16x9` (1920×1080), `9x16` (1080×1920), `1x1` (1080×1080).
The 1920×1080 stage is scaled by `k` and centered; vertical offsets spread by `fy`; text wraps at `mw`;
`stack` switches to vertical layouts.

| fmt | k | fy | mw | notes |
|---|---|---|---|---|
| 16x9 | 1 | 1 | 1800 | the master |
| 9x16 | 0.9 | 1.35 | 1100 | stack wide rows; widen gaps |
| 1x1 | 0.9 | 1.1 | 1120 | stack wide rows |

Narrow-format rules learned the hard way:
- Wrap headlines **on purpose** at a meaningful break ("Deevo." / "Now on the App Store.") instead of wherever
  `text-wrap: balance` lands, and re-space neighbors (icon up, badge down).
- Every off-screen start/exit offset × ~1.7 (the frame is taller; things "parked" off-screen became visible).
- Rows wider than ~1200 stage px (e.g. a three-widget row) stack: wide item on top, two below; labels follow.
- Disable close-up camera moves (keep a ≤1.06 push): they crop cards in narrow frames.
- Any absolutely positioned overlay must use the same `fy` as the shapes it aligns with.

## Specs
- Master: ProRes 422 HQ, 60 fps, PCM 24-bit 48 kHz.
- Web/social: H.264 High, CRF 14, yuv420p, `+faststart`, AAC 320k, −16 LUFS / −1.5 dBTP.
- Social feeds autoplay muted: the story must read from on-screen text alone.

## Store rules
- App Store previews must show the shipping app's actual functionality (captured footage); "coming soon"
  features will be rejected. Make a separate preview from simulator captures if needed.
- Use the official "Download on the App Store" / "Get it on Google Play" badge artwork; don't redraw it.

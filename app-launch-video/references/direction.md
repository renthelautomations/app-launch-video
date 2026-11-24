# Visual direction

The target is an Apple product reveal: one object, a quiet stage, light that seems to come from the product,
short declarative type. Below are the decisions that held up under review, with the reason for each.

## Stage
- **Light acts** (problem, brand, app proof, launch): radial `#FFFFFF → #F7F7F9 → #ECECEF`. Feels like
  apple.com; components with white surfaces read as physical objects.
- **Dark acts** (system-level features: Dynamic Island, Lock Screen, widgets, end card): radial
  `#1C1C1F → #0B0B0D → #050506`. System UI reads as hardware on black. Give pure-black shapes a hairline rim
  (`inset 0 0 0 1.5px #FFFFFF2E`) so they don't vanish.
- Switch light→dark with a **hard cut on an empty frame** (all exits finished), on a music downbeat. Never fade.
- A soft brand-tinted glow behind the hero (`radial rgba(brand,0.10)`) can *scale in* with the logo reveal;
  don't fade it.

## Layout
- Hero centered at (960, 540) in a 1920×1080 stage. Type 120–260 px above or below it.
- Hero ≤ ~⅓ of the frame. Logo reveal mark ~200 px tall at 1080p; icons 150–200 px.
- Title-safe 5% (96 px / 54 px). Nothing important outside it.

## Type
- System-like sans (Inter is a good free stand-in for SF Pro) with tight tracking for headlines
  (−0.04em), regular tracking for subs, wide tracking (+0.14em) for uppercase eyebrows.
- Three sizes on stage: headline 64–96, sub 28–40, eyebrow 22. Minimum 20 px at 1080p.
- One sentence per beat. Use the app's real copy inside components.
- Chapter title card for each "coming soon" feature: eyebrow `COMING SOON`, title (96), one-line explanation.
- Eyebrow labels that say *where* we are: `ON THE DYNAMIC ISLAND`, `ON THE LOCK SCREEN`, `HOME SCREEN WIDGETS`;
  names under each widget.

## Components (the product)
- Recreate from source at **point sizes**: same radii, padding, font sizes, colors, real strings. Build each as an
  HTML string at 1× and wrap in `zoom: k` (2–2.8 for cards, ~2.15 for widgets, 2.4–2.8 for system surfaces).
- Measure every component's natural size once in a headless browser and store it (`sizes.json`) — shape
  morphs need exact target sizes.
- Prefer the app's light theme on light acts and its dark/system variants on dark acts.
- Third-party UI (notifications etc.) must be generic: plain colored squircle icons with simple glyphs, neutral
  app names ("Inbox", "Delivery", "Calendar"), plausible copy. No real brands.
- Use the store's **official** badge artwork in finals (download from the store's marketing site).

## Logo
- Get a vector. If only raster: threshold the monochrome PNG, run potrace (`scripts/trace_logo.py`).
- **Optical centering inside the icon squircle**: geometric centering often looks off for asymmetric marks
  (flat side + round side). Compute the mass centroid vs. bbox center and nudge (≈3% toward the light side was
  right for a D-shaped mark). Say so explicitly; users notice.
- Reveal that worked: **outline draws itself, then the fill rises from the bottom** (stroke-dasharray with
  `pathLength=1`, then a clip that opens upward). Use a userSpace gradient so stroke and fill match.
- Reveals that were rejected: dot growing into a blob, carving a cross out of a solid shape (looked broken),
  pieces flying in and locking together (looked like a logo being assembled), anything blurred.

## Lighting/acts template (reuse)
| Act | Stage | Content |
|---|---|---|
| Problem | light | generic notifications stack, one line of copy, swipe away |
| Answer | light + glow | question line → logo draw → icon → name + tagline |
| Proof | light | 2–4 real cards morphing one into the next |
| Launch | light | store listing row → GET → ring → OPEN → icon + headline + official badge |
| Problem two | dark (hard cut) | one line |
| Coming soon ×N | dark | chapter title card → feature shown with eyebrow labels |
| End | dark | icon, name, badge, one line |

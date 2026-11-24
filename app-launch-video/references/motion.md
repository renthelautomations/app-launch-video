# Motion system

## Springs, not easing curves
Use Apple's WWDC23 spring model (duration + bounce). Convert to physics with mass 1:
`stiffness = (2π / duration)²`, `damping = (1 − bounce) · 4π / duration`. `template/src/timeline.js` implements
the closed-form solution (`spr(dt, preset)`) so picture and sound can both compute it.

| preset | duration, bounce | use |
|---|---|---|
| smooth | 0.5, 0 | shapes settling, frames, content carousels |
| text | 0.7, 0 | type reveals (long gentle tail) |
| snappy | 0.42, 0.12 | decisive morphs, carousel pushes |
| bouncy | 0.5, 0.3 | meaningful pops only: a check, a filled day, a seal |
| island | 0.55, 0.24 | Dynamic-Island-like resizes, notification drops |
| exit | 0.32, 0 | leaving — always through `ex()` (finite) |
| camera | 2.6, 0 | slow push-ins |

A film that "feels linear" usually means: every motion uses the same spring, nothing is staggered, and
durations were stretched. Vary presets by role and stagger related elements 30–60 ms.

`ex(dt) = clamp01(spr(dt,'exit') * 1.04)` — exits must reach exactly 1, or slivers remain at cuts.

## Patterns that survived review
- **Keyframed shapes (`track`)**: a shape is `{x,y,w,h,r,bg,shadow,rx,ry,sc}`; each key springs from wherever
  the previous keys left it, so chains stay continuous even when a key starts before the last one settled.
- **Masked word rise**: each word is `overflow:hidden` and its inner span translates from +108% to 0; exit to
  −125%. Stagger 0.045–0.06 s per word (chars: 0.035–0.045 s). Never animate opacity.
- **Block rise**: `translateY(18px→0)` + `clip-path: inset(top 0 bottom)` opening from the top edge.
- **Shape morph with content carried**: the container springs to the next component's measured size while the
  old content slides out and the new slides in (carousel), so the shape is never empty.
- **Carousel without overlap**: old content `dy = −p·D`, new `dy = (1−p)·D` with `D = (h_old + h_new)/2 + gap`.
  With a smaller D the two overlap mid-slide (reported as messy).
- **State change inside a fixed frame** (e.g. a Live Activity going Running → Saved → Next): keep the frame size
  constant and carousel the *whole* content as one unit. Rolling each label/timer/text separately + popping art
  + resizing the frame + a "stamp shake" + a camera close-up at once was reported as shaking.
- **Shared element**: the thing that becomes the next thing actually travels (the row's icon mark flies into
  the big icon; the OPEN button grows into the App Store badge).
- **Hard-edged color wipe** for dark↔light surface changes (`clip-path` rising from the bottom). Interpolating
  black→cream passes through ugly grey/taupe; interpolating between two light colors is fine.
- **Island / system surfaces**: capsule appears (scale-x), widens to compact, springs to expanded; reveal content
  *while* it grows. Leave by collapsing to the capsule, then moving off the top of the frame.
- **Off-screen entries**: start beyond the frame edge for every format (taller formats need ~1.7× offsets).
- **Digits**: roll changing digits (slot) for timers/counters; keep it small.
- **3D**: a light tilt (≤ 8–10°) settling to 0 as a card arrives adds depth. Avoid flips unless the flip *is*
  the idea; two flips in a row read as gimmicky.
- **Camera**: slow push-ins between acts (≤ 1.05). Close-ups ≤ 1.25 and must keep the subject in frame; disable
  them in narrow formats.

## Anti-patterns (each was flagged in review)
- Crossfades; blur+zoom content swaps; opacity ramps of any kind.
- Empty shapes waiting for content (even 0.2 s reads as a placeholder).
- Everything animating at once inside a component; bouncy pops on tiny icons (jittery).
- Exits that leave a 1-px line or half a glyph before a cut.
- Text on screen < 2 s.
- Logo assembly / carving / dot-to-blob reveals.
- Grey mid-colors from black→light color interpolation.
- Shakes, wobbles, decaying oscillations as "impact" — use a scale pop + sound instead.
- Phone mockups.

## Timing skeleton (≈70 s, 60 fps)
problem 1–9 s · logo 10–16 · proof cards 16.5–27 · launch 27.5–34.5 · hard cut 35 · problem two 35–38.6 ·
chapter 1 title 39–41.3 · feature 1 41.6–57 · chapter 2 title 57–59 · feature 2 59–66 · end card 66–70.
Section starts on 2-second bars (120 BPM) so the music lands with the cuts.

---
name: app-launch-video
description: Produce Apple-keynote-style launch, promo and feature-announcement films for any app (iOS, Android, web, desktop, SaaS) using the app's REAL UI components recreated in code and animated with Remotion, spring-physics morphs, synced spatial sound design and multi-format export (16:9, 9:16, 1:1). Covers the whole pipeline: story, storyboard with automated QA, motion system, sound, frame-level QA, loudness and delivery. Use this whenever the user wants a promo video, launch video, app trailer, product reveal, "coming soon" teaser, App Store / social ad, motion storyboard, or wants to animate their app's screens, cards, widgets, Live Activities or icon — even if they never say "Remotion" or "video".
---

# App Launch Video

Make a short, premium product film for an app: a problem, the app as the answer, proof through its real
components, the launch moment, what's coming next, and a clean end card. The look is an Apple product reveal —
one object at center, generous space, short lines of type, physical motion, considered sound.

This skill was distilled from a long real production that went through many rounds of picky feedback. Most of
what's written here exists because a viewer noticed something cheap, awkward, unreadable or out of sync. Treat
the rules as "known failure modes", not taste.

## What you deliver

- An HTML storyboard (true 1920×1080 frames, real components, built-in QA) for approval **before** building.
- A Remotion project (separate worktree or folder) whose timing lives in one file.
- `master.mov` (ProRes HQ, 24-bit audio) + `16x9.mp4`, `9x16.mp4`, `1x1.mp4` at −16 LUFS, ≤ −1 dBTP.
- An honest critique with prioritized recommendations after every render.

## Rules (and why they exist)

1. **Real components, never device mockups.** Recreate the app's own components at their true point sizes from
   source (theme tokens, radii, padding, fonts, copy) and float them on a stage. Phone frames read as stock
   templates and shrink the product. Read the app's theme/components first; measure, don't guess.
2. **No crossfades, no opacity swaps, no zoom-blur swaps.** Things change by morphing (shape springs from size
   A to B), masked reveals (text rises out of its own baseline), carousels (old content slides out while new
   slides in, never overlapping), scale-from-zero pops, hard-edged color wipes, or a hard cut on an empty frame.
   A blur+zoom "content swap" was explicitly called cheap.
3. **Center is sacred.** The hero sits on the frame center. Type sits above/below it, never beside. The camera
   only pushes in/out (and gentle close-ups that never crop the subject).
4. **One meaningful motion at a time.** When five things animate at once (rolls, pops, wipes, flips, bounces)
   it reads as messy. Components enter as one unit; inside, only the thing that matters moves (a check draws, a
   day fills, a seal stamps). Bounce only where it means something.
5. **Exits must finish.** Every exit reaches 100% in finite time (≈0.3 s). Springs that only *approach* 1 leave
   1-px slivers when a scene is cut or an element unmounts.
6. **Readable pacing.** Hold every line ≥ 2.2 s (headlines ~3 s). If it feels fast, it is — lengthen the film
   rather than compress it. ~60–75 s for a launch + "coming soon" film.
7. **Say what things are.** Chapter titles ("Live Activities.", "Widgets.") and small eyebrow labels
   ("ON THE LOCK SCREEN", widget names). Viewers don't know your feature names.
8. **Minimal and small.** Hero ≤ ~⅓ of the frame, three type sizes, lots of air. A big logo is not premium.
9. **No empty placeholders.** A shape must never sit empty while its content waits. Start revealing content
   while the shape is still growing; carry content through morphs.
10. **Sound follows picture from one timeline.** Picture and sound read the same timing file; sounds land on the
    first visible frame of a gesture or the spring's measured impact.
11. **Honest and legal.** Generic, unbranded third-party UI (notifications etc.). Use the store's official badge
    artwork. Don't present unreleased features in an App Store preview (store rules); "coming soon" is fine for
    social/web. Only use assets with clear licenses (record them in the repo).
12. **Isolate the work.** Build in a git worktree or a sibling folder so the app's build is untouched.

## Workflow

Work in phases. Show the user something reviewable at the end of each phase and wait for their reaction before
investing in the next one — the expensive rework in practice came from building before the direction was agreed.

### Phase 0 — Understand the app (read, don't assume)
- Find the design system: theme/colors file, fonts, spacing, radii, icon set, real copy. Find the components
  worth showing (home cards, key flows, widgets, notifications, Live Activities, paywall...). Note dark/light.
- Find the logo source (vector or a high-res monochrome PNG). If raster only, trace it:
  `python scripts/trace_logo.py <png> <out-dir>` → SVG paths + optical-center offset (see references/direction.md).
- Ask only what you can't find: what launched, what's "coming soon", target channels, length, any music license.

### Phase 1 — Story
Default arc (adapt it): **problem → answer (logo reveal) → proof (2–4 real components) → launch moment
(store listing → GET → OPEN → badge) → second problem → "coming soon" chapters → end card.** A launch film
without a problem feels like a feature list. Write the copy as one short sentence per beat.

### Phase 2 — Storyboard (approval gate)
Build `assets/storyboard-template.html` into a shot list: every frame is a real 1920×1080 stage rendering the
recreated components, plus "In-between" frames that show the midpoint of each morph. Its QA engine checks text
overlap, clipping, frame bounds, title-safe, minimum type size (20 px at 1080p) and hero centering on load.
Publish it as a page/artifact if you can. Iterate here — it's 100× cheaper than iterating on renders.
Expect to go through several versions (layout, minimalism, background, more frames).

### Phase 3 — Build
Copy `template/` into the worktree, `bun install` (or npm). Then:
- `src/timeline.js` — the single source of truth: spring presets, beat times `T`, every line of type `TEXTS`,
  and the sound `CUES` derived from them. Never hard-code a time anywhere else.
- `src/motion.js` — primitives: `track` (keyframed spring shapes), `words/chars` (masked rise),
  `rise`, `pop`, `roll`, `timer`, `ex` (finite exit), `Shell`, `Content`, `Line`, `Abs`, `LAYOUT`.
- `src/Film.jsx` — the scenes. Components are HTML strings built at **point size** and zoomed as one unit.
- Read references/motion.md before writing transitions; it lists the patterns that survived review.

### Phase 4 — QA every render (do this before showing anyone)
Render a half-res preview (`--scale=0.5`, ~30–60 s) and run the QA kit in `scripts/qa/`:
- `transition_sheets.py` — contact strips across every transition (look at them yourself).
- `pop_scan.py` — single-frame jumps (should only hit intentional hard cuts).
- `residue_scan.py` — leftover pixels after exits.
- `bbox_track.py` — per-frame position/size of a steady element (finds "it shakes").
- `sync_check.py` — motion energy vs. sound cues.
- `sfx_report.py` — per-cue level vs. music, spectral centroid, harsh-band share, cue density.
Fix what they find, re-render, then show the user the preview plus a short honest critique.
See references/qa.md for thresholds and how to read each report.

### Phase 5 — Sound
`template/audio.py` renders a cue-driven soundtrack: tuned plucks in the score's key, organic paper/air foley,
recorded CC0 samples where they're better, binaural HRTF placement, ducking under key moments, optional licensed
music (`public/music.*`). Read references/sound.md — it has the level table and the mistakes that made
earlier mixes sound robotic, eerie or harsh. Fetch assets with `scripts/fetch_hrtf.sh` and `scripts/fetch_kenney.sh`.

### Phase 6 — Deliver
`scripts/deliver.sh` renders 16:9 ProRes master + MP4s for 16:9, 9:16 and 1:1, two-pass loudnorms the audio to
−16 LUFS / −1.5 dBTP and muxes. Narrow formats need layout overrides (wrapping, stacking, intentional line
breaks, larger off-screen offsets, no cropping close-ups) — see references/formats.md.

### Phase 7 — Review and recommend
After each deliverable, critique it honestly before the user asks: worst problems first, each with the cause
you measured and the fix. Use the checklist in references/review.md. Offer the remaining upgrades (licensed
music, official badge, cutdowns, App Store preview caveat) once, briefly.

## Working style that matters here
- **Measure, then claim.** Back statements with numbers from the QA scripts ("banner moved 0 px from 47.9 to
  56.8 s"), and say when something was judged from data rather than watched/listened to.
- **Admit what's weak.** The user can see the video. Calling a rough cut "polished" burns trust; naming its
  flaws first earns it.
- **Keep the user posted** with one line per phase during long renders; run renders in the background.
- **Don't re-render what didn't change.** Audio-only changes → re-mux onto the existing video.

## References
- references/direction.md — visual language: stage, color, type scale, logo handling, lighting by act, layout.
- references/motion.md — spring presets (Apple duration+bounce), patterns that work, anti-patterns.
- references/sound.md — sound families, text sounds, HRTF, levels, ducking, loudness, licensing, libraries.
- references/qa.md — the QA kit, thresholds, how to read results.
- references/formats.md — 16:9 / 9:16 / 1:1 layout rules, store-preview rules, delivery specs.
- references/review.md — critique checklist and the lessons log (symptom → cause → fix).

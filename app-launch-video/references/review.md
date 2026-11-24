# Review checklist & lessons log

## Before showing any render, check (worst first)
1. Any shape empty or holding half-faded content? Any placeholder look?
2. Any frame where two things overlap that shouldn't (carousel, text over card, badge over line)?
3. Any element visible after its exit / before its entrance (slivers, parked off-screen items in tall formats)?
4. Is every line readable at normal speed (≥ 2.2 s)? Does the viewer know what each feature is (labels)?
5. Is more than one thing moving inside a component? Any bounce on tiny elements?
6. Does the camera crop the subject anywhere?
7. Color: any grey/taupe mid-state? Contrast on dark stage?
8. Sound: any cue on nothing? any key moment silent? text sounds too dense? SFX louder than music where they
   shouldn't be? harsh/hissy? loudness −16 LUFS?
9. Sync: sounds early/late vs. motion (sync_check)?
10. Legal: generic third-party UI, official badges, licenses recorded, no unreleased features in store previews.

## How to critique
Name the problem, the timecode, the measured cause, the fix. Then offer the remaining upgrades once:
licensed music, official badge artwork, 9:16/1:1 cuts, 15–30 s cutdowns (launch / teaser), store-preview caveat,
listen on phone speakers and headphones, watch muted.

## Lessons log (symptom → cause → fix)
- *"Looks like a template"* → phone mockups → float real components on a stage.
- *"Too big, not minimal"* → hero > ⅓ frame, big logo → shrink, more air, three type sizes.
- *"Awkward zoom-blur fade transitions, cheap"* → content swapped by blur+scale+mask → shape morph + carousel.
- *"Not smooth, feels linear"* → one spring for everything, no stagger, stretched durations → Apple presets by
  role, 30–60 ms staggers.
- *"Flat, everything just shows"* → whole components appear at once → per-element entrances (type rises, rows
  rise in order, icons pop) — but only on entrance; inside a live component change one thing at a time.
- *"Messy" Live Activity/widgets* → flips + rolls + pops + wipes simultaneously, no labels → one motion per state
  change, chapter titles + eyebrow labels.
- *"Too fast, can't read"* → 52 s film with 1.5 s lines → 70 s, ≥ 2.2 s holds.
- *"It shakes"* (steady banner) → close-up camera move + stamp shake + frame height changes + per-field rolls →
  fixed frame, carousel the whole content, no shake, no close-up. Verified with bbox_track (0 px).
- *"Dot at the end"/slivers* → exit springs never reach 1, cut happens at 98% → finite `ex()`.
- *"Ugly logo animation"* (×3) → dot-blob, carving, assembling pieces → outline draw + fill from bottom.
- *Logo looks off-center in its icon* → geometric centering of an asymmetric mark → optical offset.
- *Muddy grey during color change* → black→cream interpolation → hard-edged wipe.
- *Carousel overlap* → slide distance < half the sum of heights → D = (h1+h2)/2 + gap.
- *Badge text wraps/clipped* → zoomed element inside narrow container → `inline-flex; white-space:nowrap;
  width:max-content` and a wider wrapper.
- *Audio "eerie / horror"* → detuned low drones, minor/sus pads → warm major score, no drones.
- *Audio "robotic"* → synthetic beeps, identical repeats, per-word ticks → tuned plucks, varied samples, fewer cues.
- *Sounds out of sync* → cues at spring settle → cues at first visible frame / measured impact, from one timeline.
- *Mix too quiet after adding samples* → one transient sets the peak → two-pass loudnorm.
- *Vertical cut: elements parked off-screen are visible, cards cropped, headline collides with badge* →
  format-aware offsets, no close-ups, intentional breaks.

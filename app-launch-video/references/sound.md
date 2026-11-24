# Sound

## One timeline
`src/timeline.js` exports `CUES` derived from the same `T` and `TEXTS` the picture uses; `src/export-cues.js`
writes `out/cues.json`; `audio.py` renders from it. Landing sounds sit on the spring's measured impact
(`impact(preset)`), gesture sounds on the first visible frame + ~40 ms, air/whooshes ~80 ms *before* so they peak
with the motion. Swells are built to peak at their end and placed ending on the moment.

## Three families (so it sounds like one product)
1. **Tonal UI** — soft kalimba/wood plucks *tuned to the chord playing at that moment* (`chord_at(t)`):
   pops, confirmations, text, widget landings. Never generic sine beeps.
2. **Paper / foley with body** — 200 Hz–4 kHz, never just hiss: paper, pencil, stamps, letters, cards.
3. **Air** — warm pink-noise moves (180–1400 Hz sweep) for transitions; low and soft.
Recorded CC0 samples beat synthesis for foley (card slides = paper, book placed = stamp, cloth = swipe,
glass pings = alerts). Keep synthesized tonal sounds where pitch must match the score.

## Text sounds
Headlines: up to 5 soft plucks rising in the current chord as the words land, panned with the words.
Subheads: one soft air rise. Eyebrows: one tiny pluck. Exits: silent. (A tick per word + whoosh per entrance and
exit = 230 cues and 14 sounds/second — called robotic.)

## Spatial
Binaural via HRTF convolution (MIT KEMAR SOFA, horizontal plane, block convolution along a moving azimuth),
plus distance = level, air absorption (low-pass) and room send. Pan follows the on-screen x of the object.
Fallback without SOFA: equal-power pan + ITD.

## Logo signature
Reversed piano swell into the moment → audible pencil while the outline draws → on fill complete a rolled
major-add9 chord (piano) over a deep soft sub bloom, music ducked 3 dB.

## Levels (dB relative to music RMS at the cue)
| group | level | examples |
|---|---|---|
| bed textures | −19 … −13 | text air, word plucks, small taps |
| UI | −15 … −9 | plucks, swishes, pushes, island pops, alerts |
| moments | −8 … −1 | logo pencil, stamp thud, brand chord, sparkle |
Duck music ~3 dB (≈0.3 linear) under key moments with ~0.2 s ramps. Low-pass SFX at ~10 kHz and pull the
2.5–5 kHz band down a little — that band is where "harsh" lives. Check with `scripts/qa/sfx_report.py`:
typical SFX spectral centroid should be ~1–2.5 kHz, not 4 kHz+.

## Music
- Generated score (fallback): warm major key, 120 BPM (bar = 2 s), felt piano with humanized timing/velocity,
  soft string pad, light shaker/kick in the busy acts, hushed for "problem" beats, resolve chord on the end card.
  Avoid low detuned drones and sus/minor beds — read as horror.
- A licensed track is the single biggest upgrade. Drop it at `public/music.(wav|mp3|m4a|aif|flac)`; it's loaded
  *before* the SFX pass so ducking applies; −6 dB headroom applied.

## Loudness / delivery
Render 24-bit 48 kHz, then **two-pass** `loudnorm` to −16 LUFS integrated, −1.5 dBTP, `linear=true`
(`scripts/deliver.sh`). Single-pass dynamic loudnorm or a hard limiter on a mix whose peak is set by one
sample transient gives −21 LUFS or squashed audio.

## Libraries (verify licenses yourself before publishing)
- Kenney (kenney.nl) — CC0; downloads via JS on the site; OpenGameArt hosts direct zips (`scripts/fetch_kenney.sh`).
- Sonniss GDC Game Audio Bundle — royalty-free, commercial, no attribution; best whooshes/foley; manual download.
- Freesound — has an API (needs the user's free API key); filter to CC0.
- Pixabay / Mixkit — free licenses, curate carefully.
- Avoid: BBC Sound Effects (non-commercial), Zapsplat free tier (attribution), Apple/iOS system sounds.
Record every sample's license in `sfx/README.txt`.

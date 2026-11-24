# Contributing

Thanks for helping make launch films better. This project is a Claude skill, so contributions are as much
about **knowledge** (rules, patterns, checks) as about code.

## Good contributions

- **A lesson from a real production.** Something a viewer flagged, its measured cause and the fix. Add it to
  `app-launch-video/references/review.md` (lessons log) and, if it's general, to the relevant reference file.
- **A QA check** that catches a class of problem automatically (`app-launch-video/scripts/qa/`).
- **A motion pattern** that survived review, with its spring presets and an example in the template.
- **Format support** (e.g. 4:5, 21:9) with layout rules in `references/formats.md` and `LAYOUT` in `motion.js`.
- **Sound** generators or sample mappings with clear licenses.

## Ground rules

- Keep `SKILL.md` under ~500 lines; put depth in `references/` and point to it.
- Explain *why* next to every rule. Claude follows reasons better than commands.
- No brand-specific content in the skill or template. Use generic examples.
- Every downloaded asset needs a clear license recorded next to it. No non-commercial or attribution-only
  assets in default fetch scripts.
- Never weaken the core rules (no crossfades, exits finish, real components, one timeline) without
  evidence from a review.

## Development

```bash
cp -R app-launch-video/template /tmp/film && cd /tmp/film && npm install
node src/export-cues.js && python3 audio.py
npx remotion render src/index.js Film16x9 out/preview.mp4 --scale=0.5
python3 ../path/to/app-launch-video/scripts/qa/pop_scan.py out/preview.mp4
```

CI checks the template bundles, cues export, the soundtrack renders, Python compiles, shell scripts pass
shellcheck and `SKILL.md` frontmatter is valid. Please run the relevant parts locally before opening a PR.

## Pull requests

1. Fork and branch from `main`.
2. Keep changes focused; update `CHANGELOG.md` under *Unreleased*.
3. If you changed motion or sound, attach a short preview (GIF/MP4) or a QA sheet.
4. Fill in the PR template.

By contributing you agree your work is licensed under the MIT License and that you follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

#!/usr/bin/env bash
# Renders all formats and muxes the soundtrack normalised to -16 LUFS / -1.5 dBTP (two-pass, linear).
# Run from the project root (where package.json lives) after: node src/export-cues.js && python3 audio.py hrtf/kemar.sofa
set -euo pipefail
NAME=${1:-launch}
REM="npx remotion"; command -v bunx >/dev/null && REM="bunx remotion"
J=$(ffmpeg -hide_banner -i out/audio.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -loglevel error -y -i out/audio.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 -c:a pcm_s24le out/audio-norm.wav
$REM render src/index.js Film16x9 out/v169.mov --codec=prores --prores-profile=hq --log=error
ffmpeg -loglevel error -y -i out/v169.mov -i out/audio-norm.wav -map 0:v -map 1:a -c:v copy -c:a pcm_s24le -shortest "out/$NAME-16x9-master.mov"
ffmpeg -loglevel error -y -i out/v169.mov -i out/audio-norm.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -profile:v high -movflags +faststart -c:a aac -b:a 320k -shortest "out/$NAME-16x9.mp4"
rm out/v169.mov
for f in 9x16 1x1; do
  $REM render src/index.js Film$f "out/v$f.mp4" --codec=h264 --crf=14 --log=error
  ffmpeg -loglevel error -y -i "out/v$f.mp4" -i out/audio-norm.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -movflags +faststart -shortest "out/$NAME-$f.mp4"
  rm "out/v$f.mp4"
done
for f in out/"$NAME"-*.mp4; do echo "$f: $(ffmpeg -hide_banner -i "$f" -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+(I|Peak):' | tail -2 | tr -s ' ' | tr '\n' ' ')"; done

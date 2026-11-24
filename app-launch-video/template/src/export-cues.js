// Writes out/cues.json for audio.py: duration, score plan and every sound cue (all from timeline.js).
import fs from 'node:fs';
import { CUES, SCORE, T } from './timeline.js';

fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/cues.json', JSON.stringify({ duration: T.end, silentHead: 1.0, score: SCORE, cues: [...CUES].sort((a, b) => a.t - b.t) }));
console.log(`out/cues.json: ${CUES.length} cues, ${T.end}s`);

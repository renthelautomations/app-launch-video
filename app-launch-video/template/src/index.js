import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Film, FPS, DURATION } from './Film.jsx';
import { LAYOUT } from './motion.js';

const Root = () => (
  <>
    {Object.entries(LAYOUT).map(([fmt, L]) => (
      <Composition key={fmt} id={`Film${fmt.replace('x', 'x')}`} component={Film} durationInFrames={DURATION} fps={FPS} width={L.W} height={L.H} defaultProps={{ fmt }} />
    ))}
  </>
);
registerRoot(Root);

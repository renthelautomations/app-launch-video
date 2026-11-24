#!/usr/bin/env bash
# Downloads the MIT KEMAR HRTF (SOFA) used by audio.py for binaural placement.
# Source: sofacoustics.org (MIT Media Lab KEMAR measurements). Check its terms before redistributing.
set -euo pipefail
mkdir -p hrtf
curl -fL -o hrtf/kemar.sofa https://sofacoustics.org/data/database/mit/mit_kemar_normal_pinna.sofa
echo "hrtf/kemar.sofa ready (pip install h5py scipy numpy)"

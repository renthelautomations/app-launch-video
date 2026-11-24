#!/usr/bin/env bash
# Downloads Kenney's CC0 sound packs (Interface, RPG, Casino) from OpenGameArt mirrors and copies the
# samples audio.py knows about into sfx/kenney/ with their licenses. CC0: free for commercial use, no credit needed.
# kenney.nl itself downloads through JavaScript, so the OpenGameArt zips are used.
set -euo pipefail
tmp=$(mktemp -d)
get() { curl -fsSL -m 120 -o "$tmp/$1.zip" "$2" && (cd "$tmp" && mkdir -p "$1" && unzip -oq "$1.zip" -d "$1"); }
get iface https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip
get rpg https://opengameart.org/sites/default/files/RPGsounds_Kenney.zip
get casino https://opengameart.org/sites/default/files/kenney_casino-audio.zip
mkdir -p sfx/kenney
for n in glass_001 glass_002 glass_003 click_001 select_001 drop_001 drop_002 drop_003 drop_004 confirmation_004 scratch_001 scratch_002 scratch_004 maximize_001 minimize_001 tick_004 \
         bookPlace1 bookPlace2 cloth1 cloth3 bookFlip3 card-slide-2 card-slide-3 card-slide-4 card-shove-2 card-place-4 cards-pack-open-2; do
  f=$(find "$tmp" -name "$n.ogg" | head -1)
  [ -n "$f" ] && cp "$f" sfx/kenney/ || echo "missing $n"
done
find "$tmp" -iname 'license*' | while read -r l; do cp "$l" "sfx/kenney/LICENSE-$(basename "$(dirname "$l")").txt"; done
printf 'Sound effects by Kenney (www.kenney.nl), CC0 1.0. Packs: Interface Sounds, RPG Audio, Casino Audio.\n' > sfx/kenney/README.txt
rm -rf "$tmp"
echo "sfx/kenney: $(find sfx/kenney -name "*.ogg" | wc -l | tr -d " ") samples"

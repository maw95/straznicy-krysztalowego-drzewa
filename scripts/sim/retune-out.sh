#!/bin/bash
# Re-tunes only the cells left out of band ((OUT) in the report) of every .tmp/sim/auto-<tag>.json, keeping the others (SIM_ONLY_OUT, 26.11.2026).
# Usage (from the repo root, nothing else may edit src/ meanwhile): nohup scripts/sim/retune-out.sh > .tmp/sim/retune-out.log 2>&1 &
# Afterwards: node --import tsx scripts/sim/tuneMerge.ts
export PATH=$HOME/.local/node/bin:$PATH
cd "$(dirname "$0")/../.."
export SIM_TABLES=pvp1,pvp2
for f in .tmp/sim/auto-*.json; do
  tag=$(basename "$f" .json); tag=${tag#auto-}
  [[ "$tag" == zero-legacy ]] && continue
  grep -q '(OUT)' "$f" || continue
  rest=$tag; SIZES=""; ONLY=""
  [[ "$rest" =~ -only-([a-z]+)$ ]] && { ONLY=${BASH_REMATCH[1]}; rest=${rest%-only-*}; }
  [[ "$rest" == *-xl ]] && { SIZES=huge,giant; rest=${rest%-xl}; }
  G=${rest##*-g}; rest=${rest%-g*}; OBJ=${rest##*-}; rest=${rest%-*}
  S=${rest%%-*}; M=""; [[ "$rest" == *-* ]] && M=${rest#*-}
  echo "=== $(date +%H:%M:%S) $tag"
  env SIM_SHAPE=$S ${M:+SIM_MAP=$M} ${ONLY:+SIM_ONLY=$ONLY} ${SIZES:+SIM_SIZES=$SIZES} SIM_ONLY_OUT=1 node --import tsx scripts/sim/tuneLevels.ts $OBJ $G 120 8 2>&1 | grep -E "out of band|ok\)|edge\)|OUT\)|Error" | grep -v "(kept)"
done
echo "=== done $(date +%H:%M:%S)"

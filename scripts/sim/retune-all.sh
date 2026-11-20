#!/bin/bash
# Re-tunes every digital goal / map shape / hero growth setting for the pvp tables (after the Horde's +1 Ż and +1 A, 20.11.2026).
# Resumable: a run whose result file .tmp/sim/auto-<tag>.json already exists is skipped, so after an interruption just start it again.
# (To tune from scratch, delete .tmp/sim/auto-*.json except auto-zero-legacy.json first.) Afterwards: node --import tsx scripts/sim/tuneMerge.ts
# Usage (from the repo root, nothing else may edit src/ meanwhile): nohup scripts/sim/retune-all.sh > .tmp/sim/retune-all.log 2>&1 &
export PATH=$HOME/.local/node/bin:$PATH
cd "$(dirname "$0")/../.."
export SIM_TABLES=pvp1,pvp2
run() { # args: objective growth shape map only sizes
  local OBJ=$1 G=$2 S=$3 M=$4 ONLY=$5 SIZES=$6
  local tag="$S${M:+-$M}-$OBJ-g$G${SIZES:+-xl}${ONLY:+-only-$ONLY}"
  if [[ -f ".tmp/sim/auto-$tag.json" ]]; then echo "=== skip $tag (done)"; return; fi
  echo "=== $(date +%H:%M:%S) $tag"
  env SIM_SHAPE=$S ${M:+SIM_MAP=$M} ${ONLY:+SIM_ONLY=$ONLY} ${SIZES:+SIM_SIZES=$SIZES} node --import tsx scripts/sim/tuneLevels.ts $OBJ $G 120 8 2>&1 | grep -E "out of band|\(OUT\)|\(edge\)|Error"
}
for OBJ in crystals control survival boss artifact; do
  for SHAPE in triangle rectangle ring islands custom:ciesnina custom:dolina; do
    S=${SHAPE%%:*}; M=""; [[ "$SHAPE" == *:* ]] && M=${SHAPE#*:}
    for G in 0 1; do
      run $OBJ $G $S "$M" "" ""
      run $OBJ $G $S "$M" kids ""
      if [[ -z "$M" && ( "$G" == 1 || ( "$OBJ" == crystals && "$S" == triangle ) ) ]]; then run $OBJ $G $S "" "" huge,giant; fi
    done
  done
done
echo "=== done $(date +%H:%M:%S)"

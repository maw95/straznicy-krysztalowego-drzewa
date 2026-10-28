// Setting up units before a battle: the faction that deploys picks a unit, then a gold cell in its column.

import { useEffect, useState } from 'react';
import type { FactionId } from '../engine/data';
import { deployCells } from '../engine/battle';
import type { HexKey } from '../engine/hex';
import type { BattleState, BattleUnit } from '../engine/types';

export type Deployment = ReturnType<typeof useDeployment>;

/** `walk` holds the cells of units shown mid-walk; other units stand where the state (or the new setup) puts them. */
export function useDeployment(b: BattleState, canAct: boolean, walk: Record<string, HexKey>) {
  const deploySide: FactionId | null = b.stage === 'deploy' && canAct ? b.needsDeploy[0] ?? null : null;
  const [placing, setPlacing] = useState<Record<string, HexKey>>({});
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    // Start from the current (default) placement each time a faction gets to deploy.
    if (!deploySide) return;
    const init: Record<string, HexKey> = {};
    for (const u of Object.values(b.units)) if (u.side === deploySide && u.pos) init[u.id] = u.pos;
    setPlacing(init);
    setPicked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deploySide, b.needsDeploy.length]);
  const deployable = new Set(deploySide ? deployCells(b, deploySide) : []);
  const posOf = (u: BattleUnit): HexKey | null => (deploySide && u.side === deploySide ? placing[u.id] ?? u.pos : walk[u.id] ?? u.pos);

  function placeAt(k: HexKey) {
    if (!picked || !deployable.has(k)) return;
    const occupant = Object.keys(placing).find((id) => placing[id] === k);
    const next = { ...placing, [picked]: k };
    if (occupant && occupant !== picked) next[occupant] = placing[picked];
    setPlacing(next);
    setPicked(null);
  }

  return { deploySide, placing, picked, setPicked, deployable, posOf, placeAt };
}

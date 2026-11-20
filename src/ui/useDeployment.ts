// Setting up units before a battle: the faction that deploys picks a unit, then a gold cell in its column.

import { useEffect, useState } from 'react';
import type { TeamId } from '../engine/data';
import { deployCellOf, deployCells, trapZone } from '../engine/battle';
import type { HexKey } from '../engine/hex';
import type { BattleState, BattleUnit } from '../engine/types';

export type Deployment = ReturnType<typeof useDeployment>;

/**
 * `walk` holds the cells of units shown mid-walk; other units stand where the state (or the new setup) puts them.
 * `posOf` is the cell a unit is shown on; while deploying, a large unit's deploy cell is its tail (the head lies one column further).
 */
export function useDeployment(b: BattleState, canAct: boolean, walk: Record<string, HexKey>, slots = 0) {
  const deploySide: TeamId | null = b.stage === 'deploy' && canAct ? b.needsDeploy[0] ?? null : null;
  const [placing, setPlacing] = useState<Record<string, HexKey>>({});
  const [picked, setPicked] = useState<string | null>(null);
  /** The Free Companies: the cells chosen for hidden traps (at most `slots`; the rest are laid for the faction), and whether a click on the arena picks one. */
  const [traps, setTraps] = useState<HexKey[]>([]);
  const [trapMode, setTrapMode] = useState(false);
  useEffect(() => {
    // Start from the current (default) placement each time a faction gets to deploy.
    if (!deploySide) return;
    const init: Record<string, HexKey> = {};
    for (const u of Object.values(b.units)) {
      const cell = deployCellOf(u);
      if (u.side === deploySide && cell) init[u.id] = cell;
    }
    setPlacing(init);
    setPicked(null);
    setTraps([]);
    setTrapMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deploySide, b.needsDeploy.length]);
  const deployable = new Set(deploySide ? deployCells(b, deploySide) : []);
  const trapCells = new Set<HexKey>(deploySide && trapMode ? trapZone(b, deploySide) : []);
  const posOf = (u: BattleUnit): HexKey | null => (deploySide && u.side === deploySide ? placing[u.id] ?? deployCellOf(u) : walk[u.id] ?? u.pos);

  function placeAt(k: HexKey) {
    if (!picked || !deployable.has(k)) return;
    const occupant = Object.keys(placing).find((id) => placing[id] === k);
    const next = { ...placing, [picked]: k };
    if (occupant && occupant !== picked) next[occupant] = placing[picked];
    setPlacing(next);
    setPicked(null);
  }

  /** A click on a cell in trap mode: lays a trap there or takes it back. */
  function trapAt(k: HexKey) {
    if (!trapCells.has(k)) return;
    setTraps((t) => (t.includes(k) ? t.filter((x) => x !== k) : t.length < slots ? [...t, k] : t));
  }

  return { deploySide, placing, picked, setPicked, deployable, posOf, placeAt, slots, traps, trapMode, setTrapMode, trapCells, trapAt };
}

// Setting up units before a battle: the faction that deploys picks a unit, then a gold cell in its column.

import { useEffect, useState } from 'react';
import type { TeamId } from '../engine/data';
import { ambushCells, buriesAtDeploy, deployCellOf, deployCells, mirageCandidates, mirageSlots, trapZone } from '../engine/battle';
import type { HexKey } from '../engine/hex';
import type { BattleState, BattleUnit, GameState } from '../engine/types';

export type Deployment = ReturnType<typeof useDeployment>;

/**
 * `walk` holds the cells of units shown mid-walk; other units stand where the state (or the new setup) puts them.
 * `posOf` is the cell a unit is shown on; while deploying, a large unit's deploy cell is its tail (the head lies one column further).
 */
export function useDeployment(b: BattleState, canAct: boolean, walk: Record<string, HexKey>, slots = 0, state?: GameState) {
  const deploySide: TeamId | null = b.stage === 'deploy' && canAct ? b.needsDeploy[0] ?? null : null;
  const [placing, setPlacing] = useState<Record<string, HexKey>>({});
  const [picked, setPicked] = useState<string | null>(null);
  /** The Free Companies: the cells chosen for hidden traps (at most `slots`; the rest are laid for the faction), and whether a click on the arena picks one. */
  const [traps, setTraps] = useState<HexKey[]>([]);
  const [trapMode, setTrapMode] = useState(false);
  /** Pałac Mirażu: how many mirages the side has, the units picked to get one, and whether a click on a unit picks it (instead of moving it). */
  const mirageSlotsNow = deploySide && state && !b.rearrange ? mirageSlots(state, deploySide) : 0;
  const mirageNow = Object.values(b.units).filter((u) => u.side === deploySide && u.status.mirage).map((u) => u.status.mirage!.of);
  const mirageKey = mirageNow.join();
  const [mirageChoice, setMirageChoice] = useState<string[]>([]);
  const [mirageMode, setMirageMode] = useState(false);
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
    setMirageChoice(mirageNow);
    setMirageMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deploySide, b.needsDeploy.length, mirageKey]);
  const deployable = new Set(deploySide ? deployCells(b, deploySide) : []);
  // Zasadzka Spod Piasku: the picked Queen may lie anywhere on her half.
  const pickedUnit = picked ? b.units[picked] : undefined;
  if (deploySide && state && pickedUnit && buriesAtDeploy(state, pickedUnit)) for (const k of ambushCells(b, deploySide)) if (!Object.values(b.units).some((u) => u.side !== deploySide && (u.pos === k || u.tail === k))) deployable.add(k);
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

  /** A click on a unit in mirage mode: it gets a mirage or loses it (at most `mirageSlotsNow`). */
  function mirageAt(clicked: string) {
    // A click on a mirage stands for its unit; with every mirage taken the oldest pick gives way.
    const id = b.units[clicked]?.status.mirage?.of ?? clicked;
    if (!deploySide || !mirageCandidates(b, deploySide).some((u) => u.id === id)) return;
    setMirageChoice((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-mirageSlotsNow)));
  }

  return { mirageSlots: mirageSlotsNow, mirageChoice, mirageMode, setMirageMode, mirageAt, mirageChanged: mirageChoice.slice().sort().join() !== mirageNow.slice().sort().join(), deploySide, placing, picked, setPicked, deployable, posOf, placeAt, slots, traps, trapMode, setTrapMode, trapCells, trapAt };
}

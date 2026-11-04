// "Impact" notes: the sprite layer says when an attack animation reaches its blow, so the screen can show the damage then
// (see useImpactHold and useEndHold). A tiny event bus; ids are battle unit ids.

type Listener = (unitId: string) => void;
const listeners = new Set<Listener>();

export function emitImpact(unitId: string) {
  for (const l of [...listeners]) l(unitId);
}

export function onImpact(l: Listener): () => void {
  listeners.add(l);
  return () => void listeners.delete(l);
}

/** Longest wait for an impact note before the damage is shown anyway (a sprite that never loaded, a hidden tab). */
export const IMPACT_TIMEOUT_MS = 6000;

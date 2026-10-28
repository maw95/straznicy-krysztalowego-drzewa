import { useCallback, useSyncExternalStore } from 'react';
import type { OnlineSession, OnlineState } from './api';

/** The session's latest state (null without a session); re-renders on every message from the server. */
export function useOnline(session: OnlineSession): OnlineState;
export function useOnline(session: OnlineSession | null): OnlineState | null;
export function useOnline(session: OnlineSession | null): OnlineState | null {
  return useSyncExternalStore(
    // A stable subscribe: a new function on every render would unsubscribe and subscribe again each time.
    useCallback((listener: () => void) => (session ? session.subscribe(listener) : () => undefined), [session]),
    () => session?.state ?? null,
  );
}

// Shared set-up for the jsdom UI tests: browser shims, a clean start in local play, button lookups, dialogs.

import { act, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, vi } from 'vitest';

/**
 * Registers the hooks every UI test file needs: jsdom shims, then `cleanup` and real timers after each test.
 * With `localPlay`, each test also starts from a fresh local profile that goes straight to the setup screen.
 */
export function setupUiTests({ localPlay = true }: { localPlay?: boolean } = {}) {
  beforeAll(() => {
    (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
    // jsdom has no PointerEvent: a MouseEvent (it carries the button and position) with the pointer type is enough.
    (globalThis as any).PointerEvent ??= class extends MouseEvent {
      pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerType = init.pointerType ?? 'mouse';
      }
    };
  });
  if (localPlay) {
    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem('skd-tutorial', JSON.stringify({ enabled: false, seen: [] }));
      localStorage.setItem('skd-intro', 'seen');
      // These tests play locally: "Graj bez konta" starts at the setup screen (the online menu needs a server).
      localStorage.setItem('skd-play-offline', '1');
      // No "Nowa wersja — co nowego" window in the way (it has its own test).
      localStorage.setItem('skd-last-version', '999.0.0');
      sessionStorage.setItem('skd-title-done', 'done');
    });
  }
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });
}

export const buttons = (c: ParentNode) => [...c.querySelectorAll('button')] as HTMLButtonElement[];

/** The first button whose text contains `t`. */
export const byText = (c: ParentNode, t: string) => buttons(c).find((b) => b.textContent?.includes(t));

/** The first button whose whole (trimmed) text is `t`. */
export const button = (c: ParentNode, t: string) => buttons(c).find((b) => b.textContent?.trim() === t);

/** Accepts confirmation dialogs and dismisses summaries so the scripted player keeps going. */
export async function clearDialogs(c: HTMLElement) {
  const ready = byText(c, 'Gotowe — do bitwy');
  if (ready) await act(async () => fireEvent.click(ready));
  for (let i = 0; i < 3; i++) {
    const btn = [...c.querySelectorAll<HTMLButtonElement>('.overlay button.prim')].find((b) => /Zakończ turę|Do walki|Dalej|Do ekwipunku/.test(b.textContent ?? ''));
    if (!btn) return;
    await act(async () => fireEvent.click(btn));
  }
}

// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { arenaCell, makeBattleUnit } from '../src/engine/battle';
import { applyAction, createGame } from '../src/engine/game';
import type { Action } from '../src/engine/types';
import { DEFAULT_RULES, type BattleState, type GameState } from '../src/engine/types';
import { BattleView } from '../src/ui/BattleView';

beforeAll(() => {
  (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
  // jsdom has no PointerEvent: a MouseEvent (it carries the position) with the pointer type is enough here.
  (globalThis as any).PointerEvent ??= class extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? 'mouse';
    }
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** An arena fight with the listed units at [col, half] (even columns use even halves); the first one acts. */
function fight(units: Array<[string, 'dawn' | 'horde', number, number]>, obstacles: Array<[number, number]> = []): GameState {
  const s = createGame({
    mode: 'pvp',
    mapSize: 'short',
    battleMode: 'arena',
    seed: 1,
    rules: { ...DEFAULT_RULES },
    seats: [
      { name: 'A', faction: 'dawn', controller: 'human', heroId: 'goldDragon' },
      { name: 'B', faction: 'horde', controller: 'human', heroId: 'blackDragon' },
    ],
  });
  s.phase = 'battle';
  const all: BattleState['units'] = {};
  for (const [id, side, col, half] of units) {
    const u = makeBattleUnit(id, side);
    u.pos = arenaCell(col, half);
    all[id] = u;
  }
  s.battle = {
    kind: 'heroes', duel: false, mapHex: Object.keys(s.tiles)[0], arena: 'dawn', attacker: 'horde', defender: 'dawn', attackerHero: 'blackDragon', attackerFrom: Object.keys(s.tiles)[0], defenderHero: 'goldDragon', neutralId: null,
    stage: 'fight', needsDeploy: [], needsSelection: [], obstacles: obstacles.map(([c, h]) => arenaCell(c, h)), units: all, round: 1, order: units.map((u) => u[0]), index: 0,
    activation: { unitId: units[0][0], moved: false, movedDistance: 0, attacked: false, acted: false, moveOnly: false, hop: 0, armedAbility: false },
    extra: [], winner: null, damageBy: {},
  };
  return s;
}

/** The cursor class on each unit token, by the portrait's unit id. */
function cursors(state: GameState): Record<string, string> {
  const { container } = render(<BattleView state={state} canAct onAction={() => {}} onShowCard={() => {}} footer={null} />);
  const out: Record<string, string> = {};
  for (const token of container.querySelectorAll('button.token')) {
    const id = token.querySelector('img')!.getAttribute('src')!.match(/([A-Za-z]+)\.(png|jpg)$/)![1];
    out[id] = token.className.match(/cur-\w+/)?.[0] ?? '';
  }
  return out;
}

describe('cursors over units in battle', () => {
  it('a ranged unit: an arrow over a clear shot, a crossed-out arrow when an obstacle is in the way', () => {
    const c = cursors(fight([['elfDruid', 'dawn', 4, 4], ['goblinShaman', 'horde', 4, 8], ['caveSpider', 'horde', 8, 4]], [[4, 6]]));
    expect(c.goblinShaman).toBe('cur-blocked');
    expect(c.caveSpider).toBe('cur-ranged');
    expect(c.elfDruid).toBe('');
  });

  it('a ranged unit next to an enemy still shoots it (arrow); the others are out of reach, not hidden', () => {
    const c = cursors(fight([['elfDruid', 'dawn', 4, 4], ['caveSpider', 'horde', 4, 6], ['goblinShaman', 'horde', 4, 10]]));
    expect(c.caveSpider).toBe('cur-ranged');
    expect(c.goblinShaman).toBe('');
  });

  it('a melee unit: a sword over a neighbouring enemy', () => {
    const c = cursors(fight([['goldDragon', 'dawn', 4, 4], ['caveSpider', 'horde', 4, 6]]));
    expect(c.caveSpider).toBe('cur-melee');
  });
});

describe('one click: walk up to an enemy and attack it', () => {
  const tokenOf = (c: HTMLElement, id: string) => [...c.querySelectorAll('button.token')].find((b) => b.querySelector('img')!.getAttribute('src')!.includes(`/${id}.`)) as HTMLElement;

  it('walks to the side the pointer aims at, then attacks once the walk is over', async () => {
    vi.useFakeTimers();
    let state = fight([['goldDragon', 'dawn', 4, 4], ['caveSpider', 'horde', 4, 10]]);
    const actions: Action[] = [];
    const view = (s: GameState) => <BattleView state={s} canAct onAction={(a) => actions.push(a)} onShowCard={() => {}} footer={null} />;
    const { container, rerender } = render(view(state));
    const spider = tokenOf(container, 'caveSpider');
    expect(spider.className).toContain('cur-melee');

    // jsdom boxes sit at 0,0: a pointer straight above the enemy aims at the cell above it.
    await act(async () => fireEvent.pointerMove(spider, { clientX: 0, clientY: -40, pointerType: 'mouse' }));
    expect(container.textContent).toMatch(/−\d+ (→ \d+|· pokona)/);
    await act(async () => fireEvent.click(spider));
    expect(actions).toEqual([{ type: 'battleMove', to: arenaCell(4, 8) }]);

    state = applyAction(state, actions[0]);
    rerender(view(state));
    await act(async () => vi.advanceTimersByTime(2000));
    expect(actions[1]).toEqual({ type: 'battleAttack', targetId: 'caveSpider', useAbility: false });
  });

  it('aims at another side when the pointer comes from below', async () => {
    const actions: Action[] = [];
    const { container } = render(<BattleView state={fight([['goldDragon', 'dawn', 4, 4], ['caveSpider', 'horde', 4, 8]])} canAct onAction={(a) => actions.push(a)} onShowCard={() => {}} footer={null} />);
    const spider = tokenOf(container, 'caveSpider');
    await act(async () => fireEvent.pointerMove(spider, { clientX: 0, clientY: 40, pointerType: 'mouse' }));
    await act(async () => fireEvent.click(spider));
    expect(actions).toEqual([{ type: 'battleMove', to: arenaCell(4, 10) }]);
  });

  it('on a touch screen the first tap shows the cell, the second attacks', async () => {
    const actions: Action[] = [];
    const { container } = render(<BattleView state={fight([['goldDragon', 'dawn', 4, 4], ['caveSpider', 'horde', 4, 10]])} canAct onAction={(a) => actions.push(a)} onShowCard={() => {}} footer={null} />);
    const spider = tokenOf(container, 'caveSpider');
    await act(async () => fireEvent.click(spider));
    expect(actions).toEqual([]);
    await act(async () => fireEvent.click(spider));
    expect(actions).toEqual([{ type: 'battleMove', to: arenaCell(4, 8) }]);
  });
});

describe('Ctrl over a unit shows its reach', () => {
  const reachCells = (c: HTMLElement) => ({
    walk: [...c.querySelectorAll('polygon')].filter((p) => p.getAttribute('stroke') === 'rgba(190,240,255,0.8)').length,
    hit: [...c.querySelectorAll('polygon')].filter((p) => p.getAttribute('stroke') === 'rgba(240,100,80,0.85)').length,
  });

  it('appears while Ctrl is held over an enemy, and goes when Ctrl is let go', () => {
    const { container } = render(<BattleView state={fight([['elfDruid', 'dawn', 4, 4], ['caveSpider', 'horde', 8, 8]])} canAct onAction={() => {}} onShowCard={() => {}} footer={null} />);
    const spider = [...container.querySelectorAll('button.token')].find((t) => t.querySelector('img')?.getAttribute('src')?.includes('caveSpider'))!;
    fireEvent.mouseEnter(spider);
    expect(reachCells(container)).toEqual({ walk: 0, hit: 0 });
    act(() => void fireEvent.keyDown(window, { key: 'Control', ctrlKey: true }));
    const shown = reachCells(container);
    expect(shown.walk).toBeGreaterThan(0);
    expect(shown.hit).toBeGreaterThan(0);
    act(() => void fireEvent.keyUp(window, { key: 'Control', ctrlKey: false }));
    expect(reachCells(container)).toEqual({ walk: 0, hit: 0 });
  });
});

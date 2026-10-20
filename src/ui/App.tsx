import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chooseAction } from '../engine/ai';
import { FACTION_NAMES, UNITS, type FactionId, type ItemKind } from '../engine/data';
import { applyAction, createGame, currentActor, legalHeroMoves } from '../engine/game';
import type { HexKey } from '../engine/hex';
import { DEFAULT_RULES, type Action, type GameState, type LogEntry, type SetupOptions } from '../engine/types';
import { AdventureView } from './AdventureView';
import { BattleView } from './BattleView';
import { DuelView } from './DuelView';
import { Frame, Medal, Modal, Portrait, Ribbon, SIDE_RING, SvgDefs, asset } from './common';
import { SetupScreen } from './SetupScreen';
import { music, type Theme } from './music';
import { UnitCard } from './UnitCard';
import { TreasureCard } from './TreasureCard';
import { readAutosave, replay, writeAutosave, type BugReport, type SaveFile } from './saves';
import { BugReportDialog } from './BugReportDialog';
import { RulesDialog } from './RulesDialog';
import { BattleSummary } from './BattleSummary';
import { HoverCardLayer } from './hover';
import { Tutorial } from './Tutorial';
import { TreasureReveal } from './CardBack';

const SPEEDS = { wolno: 900, normalnie: 450, szybko: 120 } as const;
type Speed = keyof typeof SPEEDS;

export function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [steps, setSteps] = useState<HexKey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [speed, setSpeed] = useState<Speed>('normalnie');
  const [autoplay, setAutoplay] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [confirmedFaction, setConfirmedFaction] = useState<FactionId | null>(null);
  const history = useRef<Action[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [showReport, setShowReport] = useState(false);
  /** Bug reports written in this game; saved and exported with it. */
  const reports = useRef<BugReport[]>([]);
  const saveFile = (g: GameState): SaveFile => ({ setup: g.setup, actions: [...history.current], reports: reports.current });
  const [confirm, setConfirm] = useState<{ text: string; yes: string; onYes: () => void } | null>(null);
  const [summary, setSummary] = useState<number | null>(null);
  /** States before each undoable hero step in the current turn. */
  const undoStack = useRef<Array<{ state: GameState; historyLength: number }>>([]);
  const [, setUndoTick] = useState(0);

  // Music follows the situation on the table; audio starts on the first gesture.
  const [, setMusicTick] = useState(0);
  useEffect(() => music.subscribe(() => setMusicTick((t) => t + 1)), []);
  useEffect(() => {
    const unlock = () => music.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  const theme: Theme = !game
    ? 'menu'
    : game.phase === 'over'
      ? game.winner === 'dawn'
        ? 'dawnVictory'
        : 'hordeVictory'
      : game.phase === 'battle' && (game.battle?.stage === 'fight' || game.battle?.stage === 'deploy')
        ? game.battle.kind === 'neutral'
          ? 'guardian'
          : 'battle'
        : game.ritual > 0
          ? 'ritual'
          : 'adventure';
  useEffect(() => music.play(theme), [theme]);

  // Test hook: ?seed=12&steps=40&mode=pvp starts a bot game and fast-forwards it.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.has('steps')) return;
    // Effects run twice in development: start the log afresh each time.
    history.current = [];
    const mode = q.get('mode') === 'pvp' ? 'pvp' : 'coop';
    const human = q.get('human') !== '0';
    let s = createGame({
      mode,
      mapSize: (q.get('size') as SetupOptions['mapSize']) ?? 'short',
      battleMode: q.get('battle') === 'board' ? 'board' : 'arena',
      seed: Number(q.get('seed') ?? 1),
      // ?abilities=0&treasures=0&dice=0 switch the simplifications on.
      rules: { ...DEFAULT_RULES, abilities: q.get('abilities') !== '0', treasures: q.get('treasures') !== '0', useDice: q.get('dice') !== '0' },
      seats:
        mode === 'coop'
          ? [{ name: 'Gracz 1', faction: 'dawn' as const, controller: human ? ('human' as const) : ('bot' as const), heroId: q.get('hero') ?? 'goldDragon' }, { name: 'Gracz 2', faction: 'dawn' as const, controller: 'bot' as const, heroId: 'unicornKing' }].slice(0, Number(q.get('players') ?? 2))
          : [{ name: 'Ala', faction: 'dawn', controller: 'human', heroId: 'ancientBear' }, { name: 'Bartek', faction: 'horde', controller: 'human', heroId: 'werewolfLord' }],
    });
    for (let i = 0; i < Number(q.get('steps')) && s.phase !== 'over'; i++) {
      const a = chooseAction(s);
      if (!a) break;
      s = applyAction(s, a);
      history.current.push(a);
      if (q.get('until') === 'battle' && s.phase === 'battle' && s.battle?.stage === 'fight') break;
    }
    setGame(s);
  }, []);

  if (import.meta.env?.MODE === 'test') Object.assign(window, { __game: game, __history: history });
  const actor = game ? currentActor(game) : { kind: 'none' as const };
  const humanTurn = actor.kind === 'human' && !autoplay;
  const humanTurnRef = useRef(humanTurn);
  humanTurnRef.current = humanTurn;
  const pvp = game?.setup.mode === 'pvp';
  const humans = game?.players.filter((p) => p.controller === 'human') ?? [];
  // Hand-off screen only between human players of different factions, and never mid-battle.
  const needsHandoff = Boolean(game && humanTurn && pvp && game.phase === 'adventure' && actor.kind === 'human' && actor.faction !== confirmedFaction && humans.some((p) => p.faction !== actor.faction));
  const viewer: FactionId | null = actor.kind === 'human' ? actor.faction : humans[0]?.faction ?? (game?.setup.mode === 'coop' ? 'dawn' : null);

  // The latest state lives in a ref so every action is applied and recorded exactly once
  // (state updater functions may run twice in React's development mode).
  const gameRef = useRef<GameState | null>(game);
  gameRef.current = game;
  const dispatch = useCallback((a: Action) => {
    const g = gameRef.current;
    if (!g) return;
    try {
      const next = applyAction(g, a);
      // A plain step that revealed nothing new can be taken back (the hero just walked).
      const harmless =
        a.type === 'moveHero' &&
        currentActor(g).kind === 'human' &&
        next.phase === 'adventure' &&
        next.log.slice(g.log.length).every((l) => l.kind === 'move' && !l.text.includes('odkryto'));
      if (harmless) undoStack.current.push({ state: g, historyLength: history.current.length });
      else undoStack.current = [];
      setUndoTick((t) => t + 1);
      history.current.push(a);
      gameRef.current = next;
      setGame(next);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setSteps([]);
    }
  }, []);

  // Bots, the coop automaton and autoplay act on a timer.
  useEffect(() => {
    if (!game || game.phase === 'over' || needsHandoff) return;
    const machine = actor.kind === 'bot' || actor.kind === 'automaton' || (actor.kind === 'human' && autoplay);
    if (!machine) return;
    const t = window.setTimeout(() => {
      const a = chooseAction(game);
      if (a) dispatch(a);
    }, SPEEDS[speed]);
    return () => window.clearTimeout(t);
  }, [game, actor.kind, autoplay, speed, dispatch, needsHandoff]);

  // Multi-hex moves are played one step at a time.
  useEffect(() => {
    if (!steps.length || !game) return;
    if (!humanTurn || game.phase !== 'adventure') {
      setSteps([]);
      return;
    }
    const t = window.setTimeout(() => {
      dispatch({ type: 'moveHero', to: steps[0] });
      setSteps((s) => s.slice(1));
    }, 330);
    return () => window.clearTimeout(t);
  }, [steps, game, humanTurn, dispatch]);

  const start = (setup: SetupOptions) => {
    history.current = [];
    reports.current = [];
    undoStack.current = [];
    setConfirmedFaction(null);
    setGame(createGame(setup));
  };

  const load = (save: SaveFile) => {
    try {
      const g = replay(save);
      history.current = [...save.actions];
      reports.current = [...(save.reports ?? [])];
      undoStack.current = [];
      setConfirmedFaction(null);
      setGame(g);
    } catch (e) {
      setError(`Nie udało się wczytać zapisu: ${(e as Error).message}`);
    }
  };

  // Autosave after every action; a finished game clears the slot.
  useEffect(() => {
    if (!game) return;
    writeAutosave(game.phase === 'over' ? null : saveFile(game));
  }, [game]);

  const undo = useCallback(() => {
    const last = undoStack.current.pop();
    if (!last) return;
    history.current.length = last.historyLength;
    gameRef.current = last.state;
    setSteps([]);
    setGame(last.state);
    setUndoTick((t) => t + 1);
  }, []);

  /** Lets bots and the automaton finish their moves at once. */
  const fastForward = useCallback(() => {
    let g = gameRef.current;
    if (!g) return;
    for (let i = 0; i < 3000 && g.phase !== 'over'; i++) {
      const who = currentActor(g);
      if (who.kind !== 'bot' && who.kind !== 'automaton') break;
      const a = chooseAction(g);
      if (!a) break;
      g = applyAction(g, a);
      history.current.push(a);
    }
    undoStack.current = [];
    gameRef.current = g;
    setGame(g);
  }, []);

  /** Human actions that deserve a second thought get a confirmation first. */
  const humanAction = useCallback(
    (a: Action) => {
      const g = gameRef.current;
      if (g && a.type === 'endTurn' && g.movePoints > 0 && legalHeroMoves(g).some((m) => m.kind === 'move')) {
        setConfirm({ text: `Masz jeszcze ${g.movePoints} punkt(y) ruchu. Zakończyć turę?`, yes: 'Zakończ turę', onYes: () => dispatch(a) });
        return;
      }
      dispatch(a);
    },
    [dispatch],
  );

  const walk = useCallback((path: HexKey[], hostile: boolean) => {
    if (!hostile) {
      setSteps(path);
      return;
    }
    const g = gameRef.current!;
    const target = path[path.length - 1];
    const guarded = Object.values(g.crystals).find((c) => c.at === target && c.guardian);
    const text = guarded ? `Wejście na to pole rozpocznie walkę ze strażnikiem: ${UNITS[guarded.guardian!].name}.` : 'Wejście na to pole rozpocznie bitwę z wrogim bohaterem.';
    setConfirm({ text, yes: 'Do walki!', onYes: () => setSteps(path) });
  }, []);

  // A freshly found treasure of the viewing faction turns over in front of the player.
  const [found, setFound] = useState<ItemKind | null>(null);
  const knownItems = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!game) return;
    const humanSides = new Set(game.players.filter((p) => p.controller === 'human').map((p) => p.faction));
    const owned = Object.values(game.items).filter((it) => it.owner && humanSides.has(it.owner));
    if (knownItems.current) {
      const fresh = owned.find((it) => !knownItems.current!.has(it.id));
      if (fresh && game.phase === 'adventure') setFound(fresh.kind);
    }
    knownItems.current = new Set(owned.map((it) => it.id));
  }, [game]);

  // After-battle summary for battles a human faction fought in.
  const lastBattleId = game?.lastBattle?.id ?? null;
  useEffect(() => {
    if (!game?.lastBattle) return;
    const lb = game.lastBattle;
    const humanSides = new Set(game.players.filter((p) => p.controller === 'human').map((p) => p.faction));
    if (humanSides.has(lb.attacker as FactionId) || humanSides.has(lb.defender as FactionId)) setSummary(lb.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastBattleId]);

  // Keyboard shortcuts (battle-specific keys live in BattleView).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'Escape') {
        if (confirm) setConfirm(null);
        else if (card) setCard(null);
        else if (showLog) setShowLog(false);
        else if (showDebug) setShowDebug(false);
        else if (showRules) setShowRules(false);
        else if (showReport) setShowReport(false);
        else if (summary) setSummary(null);
        return;
      }
      if (confirm || card || showLog || showDebug || showRules || showReport || summary) return;
      const k = e.key.toLowerCase();
      if (k === 'd') setShowLog(true);
      else if (k === 'o') setShowDebug(true);
      else if (k === 'r' || k === '?') setShowRules(true);
      else if (k === 'b' && gameRef.current) setShowReport(true);
      else if ((k === 'z' && (e.ctrlKey || e.metaKey)) || k === 'u') undo();
      else if (k === 'f') fastForward();
      else if ((k === ' ' || k === 'e') && gameRef.current?.phase === 'adventure' && humanTurnRef.current) {
        e.preventDefault();
        humanAction({ type: 'endTurn' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm, card, showLog, showDebug, showRules, showReport, summary, undo, fastForward, humanAction]);

  const visibleLog = useMemo(() => (game ? game.log.filter((l) => !l.privateTo || l.privateTo === viewer) : []), [game, viewer]);

  // "Since your last turn": with bots at the table a lot happens off-screen
  // (a teammate drinks the shared elixir, a hero falls...), so summarise it.
  const seenLog = useRef<Record<string, number>>({});
  const [digest, setDigest] = useState<LogEntry[] | null>(null);
  const turnKey = game && actor.kind === 'human' && game.phase === 'adventure' && !needsHandoff ? `${actor.playerId}:${game.round}:${game.turnIndex}` : null;
  useEffect(() => {
    if (!turnKey || !game || actor.kind !== 'human') return;
    const from = seenLog.current[actor.playerId];
    seenLog.current[actor.playerId] = game.log.length;
    if (from === undefined) return;
    const important = game.log
      .slice(from)
      .filter((l) => (!l.privateTo || l.privateTo === actor.faction) && ['battle', 'death', 'item', 'crystal'].includes(l.kind) && !l.text.startsWith('Bitwa się rozpoczyna'));
    if (important.length) setDigest(important);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey]);

  if (!game) {
    return (
      <>
        <SvgDefs />
        <SetupScreen onStart={start} onLoad={load} autosave={readAutosave()} onRules={() => setShowRules(true)} />
        <Modal open={showRules} onClose={() => setShowRules(false)}>
          <RulesDialog onClose={() => setShowRules(false)} />
        </Modal>
        <HoverCardLayer />
        {error && (
          <div className="plate parch" role="alert" style={{ position: 'fixed', left: '50%', top: 18, transform: 'translateX(-50%)', padding: '8px 16px', zIndex: 80, fontWeight: 700, color: '#8A1A1A' }} onClick={() => setError(null)}>
            {error}
          </div>
        )}
      <button
        className="btn plate parch music-btn"
        title={music.muted ? 'Włącz muzykę' : 'Wycisz muzykę'}
        aria-label={music.muted ? 'Włącz muzykę' : 'Wycisz muzykę'}
        onClick={() => {
          music.unlock();
          music.toggleMute();
        }}
      >
        {music.muted ? '🔇' : '♪'}
      </button>
      </>
    );
  }

  const footer = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <div className="plate parch hide-mobile" style={{ flex: 1, minWidth: 0, padding: '6px 12px', fontSize: 15, lineHeight: 1.25, overflow: 'hidden' }}>
        {visibleLog.slice(-2).map((l, i) => (
          <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: i === 1 ? 700 : 500, color: i === 1 ? '#2B1D10' : '#6B5233' }}>{l.text}</div>
        ))}
      </div>
      {undoStack.current.length > 0 && humanTurn && (
        <button className="btn plate parch" title="Cofnij ostatni krok (U)" style={{ padding: '6px 12px', fontSize: 15 }} onClick={undo}>
          ↶ Cofnij
        </button>
      )}
      {(actor.kind === 'bot' || actor.kind === 'automaton') && (
        <button className="btn plate parch" title="Przewiń ruchy botów (F)" style={{ padding: '6px 12px', fontSize: 15 }} onClick={fastForward}>
          ⏩ Przewiń
        </button>
      )}
      <button className="btn plate parch" title="Dziennik (D)" style={{ padding: '6px 12px', fontSize: 15 }} onClick={() => setShowLog(true)}>Dziennik</button>
      <button className="btn plate parch hide-mobile" title="Zasady i karty (R)" style={{ padding: '6px 12px', fontSize: 15 }} onClick={() => setShowRules(true)}>Zasady</button>
      <button className="btn plate parch" title="Opcje (O)" style={{ padding: '6px 12px', fontSize: 15 }} onClick={() => setShowDebug(true)}>Opcje</button>
      <button className="btn plate parch" title="Opisz błąd — zapisze się razem z partią (B)" style={{ padding: '6px 12px', fontSize: 15 }} onClick={() => setShowReport(true)}>Zgłoś błąd</button>
    </div>
  );

  const adventureFooter = (
    <Frame className="bar sticky-mobile" style={{ height: 70 }} innerStyle={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 18px' }}>
      <button className="btn prim show-mobile" disabled={!(humanTurn && game.phase === 'adventure' && !steps.length)} style={{ height: 44, padding: '0 16px', alignItems: 'center', gap: 8, fontSize: 18 }} onClick={() => humanAction({ type: 'endTurn' })}>
        <Medal fill="mGreen" glyph="gHourglass" size={28} />
        Zakończ turę
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}>
        <img src={asset('ui/ico_krysztal.png')} alt="" style={{ width: 'min(32px, 94vw)' }} /> Kryształy <b style={{ color: '#F3D27A' }}>{game.factions.dawn.delivered}/{game.crystalsNeeded}</b>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}>
        <Medal fill="mGreen" glyph="gHourglass" size={32} /> Runda <b style={{ color: '#F3D27A' }}>{game.round}/{game.roundLimit}</b>
      </div>
      <div className="hide-mobile" style={{ fontSize: 16, color: 'var(--muted)', fontStyle: 'italic', width: 240 }}>{turnLabel(game, actor)}</div>
      <div className="footer-slot" style={{ flex: 1, minWidth: 0 }}>{footer}</div>
    </Frame>
  );

  const b = game.battle;
  const selecting = b && b.stage === 'select' && humanTurn && actor.kind === 'human' ? actor.faction : null;

  return (
    <>
      <SvgDefs />
      <button
        className="btn plate parch music-btn"
        title={music.muted ? 'Włącz muzykę' : 'Wycisz muzykę'}
        aria-label={music.muted ? 'Włącz muzykę' : 'Wycisz muzykę'}
        onClick={() => {
          music.unlock();
          music.toggleMute();
        }}
      >
        {music.muted ? '🔇' : '♪'}
      </button>
      {game.phase === 'battle' && b?.duel && b.stage !== 'select' && <DuelView state={game} canAct={humanTurn} onAction={dispatch} footer={footer} />}
      {game.phase === 'battle' && b && !b.duel && b.stage !== 'select' ? (
        <BattleView state={game} canAct={humanTurn} onAction={dispatch} onShowCard={setCard} footer={footer} />
      ) : (
        <AdventureView state={game} viewer={viewer} canAct={humanTurn && game.phase === 'adventure' && !steps.length} onAction={humanAction} onPath={walk} onShowCard={setCard} footer={adventureFooter} />
      )}

      <Modal open={Boolean(selecting)}>{selecting && <SupportSelect state={game} faction={selecting} onPick={(ids) => dispatch({ type: 'selectSupports', faction: selecting, supportIds: ids })} />}</Modal>

      {needsHandoff && actor.kind === 'human' && (
        <Handoff state={game} playerId={actor.playerId} onConfirm={() => setConfirmedFaction(actor.faction)} />
      )}

      {game.phase === 'over' && game.winner === 'dawn' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 49, pointerEvents: 'none', overflow: 'hidden' }}>
          <div className="victory-rays" />
          {Array.from({ length: 26 }, (_, i) => (
            <span key={i} className="petal" style={{ left: `${(i * 37) % 100}%`, ['--px' as string]: `${((i * 23) % 120) - 60}px`, ['--pr' as string]: `${200 + i * 30}deg`, ['--pd' as string]: `${6 + (i % 5)}s`, ['--pdl' as string]: `${-(i * 0.6)}s` } as React.CSSProperties} />
          ))}
        </div>
      )}
      {game.phase === 'over' && game.winner === 'horde' && <div className="defeat-fog" style={{ zIndex: 49 }} />}
      <Modal open={Boolean(found) && !digest && !summary}>
        {found && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }} onClick={() => setFound(null)}>
            <Ribbon style={{ width: 'min(360px, 90vw)' }}>Znaleziono skarb!</Ribbon>
            <TreasureReveal kind={found} width={Math.min(300, window.innerWidth - 60)} />
            <button className="btn prim" autoFocus style={{ padding: '6px 26px', fontSize: 18 }} onClick={() => setFound(null)}>
              Do ekwipunku
            </button>
          </div>
        )}
      </Modal>

      <Modal open={game.phase === 'over'}>
        <GameOver state={game} onNew={() => setGame(null)} onLog={() => setShowLog(true)} />
      </Modal>

      <Modal open={Boolean(card)} onClose={() => setCard(null)}>
        {card && (
        <div onClick={() => setCard(null)}>
          {card.startsWith('item:') ? (
            <TreasureCard kind={card.slice(5) as ItemKind} width={Math.min(360, window.innerWidth - 40)} />
          ) : (
            <UnitCard unitId={card} width={Math.min(360, window.innerWidth - 40)} />
          )}
        </div>
        )}
      </Modal>

      {error && (
        <div className="plate parch" role="alert" style={{ position: 'absolute', left: '50%', top: 18, transform: 'translateX(-50%)', padding: '8px 16px', zIndex: 80, fontWeight: 700, color: '#8A1A1A' }} onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <Modal open={Boolean(confirm)} onClose={() => setConfirm(null)}>
        {confirm && (
          <Frame crest style={{ width: 'min(480px, 94vw)' }} innerStyle={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 20, lineHeight: 1.35 }}>{confirm.text}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn plate parch" style={{ padding: '8px 18px', fontSize: 18 }} onClick={() => setConfirm(null)}>Anuluj</button>
              <button
                className="btn prim"
                autoFocus
                style={{ padding: '8px 22px', fontSize: 19 }}
                onClick={() => {
                  const go = confirm.onYes;
                  setConfirm(null);
                  go();
                }}
              >
                {confirm.yes}
              </button>
            </div>
          </Frame>
        )}
      </Modal>

      <Modal open={summary !== null && game.lastBattle?.id === summary} onClose={() => setSummary(null)}>
        {game.lastBattle && <BattleSummary report={game.lastBattle} onClose={() => setSummary(null)} />}
      </Modal>

      <Modal open={showRules} onClose={() => setShowRules(false)}>
        <RulesDialog onClose={() => setShowRules(false)} />
      </Modal>

      <HoverCardLayer />
      <Tutorial state={game} active={humanTurn && !needsHandoff && !digest && !summary && !confirm} />

      <Modal open={showLog} onClose={() => setShowLog(false)}>
        <LogDialog entries={visibleLog} />
      </Modal>

      <Modal open={Boolean(digest) && !needsHandoff}>
        {digest && (
        <div>
          <Frame crest style={{ width: 'min(620px, 94vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Ribbon>Od Twojej ostatniej tury</Ribbon>
            <div className="scroll" style={{ maxHeight: 360 }}>
              {digest.map((l, i) => (
                <div key={i} className={`log-line ${l.kind}`} style={{ fontSize: 17 }}>
                  <span style={{ color: '#9FB8BC', marginRight: 6 }}>[{l.round}]</span>
                  {l.text}
                </div>
              ))}
            </div>
            <button className="btn prim" style={{ alignSelf: 'center', padding: '6px 26px', fontSize: 19 }} onClick={() => setDigest(null)}>
              Dalej
            </button>
          </Frame>
        </div>
        )}
      </Modal>

      <Modal open={showReport} onClose={() => setShowReport(false)}>
        {showReport && (
          <BugReportDialog
            game={game}
            save={saveFile(game)}
            onSaved={(r) => {
              reports.current = [...reports.current, r];
              writeAutosave(game.phase === 'over' ? null : saveFile(game));
            }}
            onClose={() => setShowReport(false)}
            download={download}
          />
        )}
      </Modal>

      <Modal open={showDebug} onClose={() => setShowDebug(false)}>
        <div>
          <Frame crest style={{ width: 'min(560px, 94vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 17 }}>
            <Ribbon>Opcje i narzędzia testowe</Ribbon>
            <label>
              Tempo botów{' '}
              <select value={speed} onChange={(e) => setSpeed(e.target.value as Speed)}>
                {Object.keys(SPEEDS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label><input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} /> Autoplay — boty grają także za ludzi</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              Muzyka
              <input type="range" min={0} max={1} step={0.05} value={music.volume} onChange={(e) => music.setVolume(Number(e.target.value))} style={{ flex: 1 }} />
              <input type="checkbox" checked={!music.muted} onChange={() => music.toggleMute()} /> włączona
            </label>
            <div>Ziarno partii: <b>{game.setup.seed}</b> · akcji: {game.actionCount} · gra zapisuje się automatycznie</div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>Skróty: Spacja — koniec tury/aktywacji · U — cofnij · F — przewiń boty · D — dziennik · R — zasady · Z — zdolność · S — skarby · T — zasięg wrogów · Esc — zamknij</div>
            <button className="btn plate parch" style={{ padding: '6px 14px', alignSelf: 'flex-start' }} onClick={() => { setShowDebug(false); setShowRules(true); }}>Zasady i karty</button>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn prim" style={{ padding: '6px 14px' }} onClick={() => download(`partia-${game.setup.seed}.json`, JSON.stringify(saveFile(game), null, 1))}>Eksport partii (JSON)</button>
              <button className="btn prim" style={{ padding: '6px 14px' }} onClick={() => download(`dziennik-${game.setup.seed}.txt`, game.log.map((l) => `[${l.round}] ${l.text}`).join('\n'))}>Eksport dziennika</button>
              <button className="btn prim r" style={{ padding: '6px 14px' }} onClick={() => { setShowDebug(false); setGame(null); }}>Nowa gra</button>
            </div>
            <button className="btn plate parch" style={{ padding: '6px 14px', alignSelf: 'flex-end' }} onClick={() => setShowDebug(false)}>Zamknij</button>
          </Frame>
        </div>
      </Modal>
    </>
  );
}

function turnLabel(game: GameState, actor: ReturnType<typeof currentActor>): string {
  if (actor.kind === 'none') return 'Koniec gry';
  if (actor.kind === 'automaton') return 'Ruch automatu zła…';
  const p = game.players.find((x) => x.id === actor.playerId);
  return `${p?.name ?? ''}${actor.kind === 'bot' ? ' (bot)' : ''} — ${FACTION_NAMES[actor.faction]}`;
}

function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function SupportSelect({ state, faction, onPick }: { state: GameState; faction: FactionId; onPick: (ids: string[]) => void }) {
  const pool = state.factions[faction].supportsAlive;
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id].slice(-2));
  return (
    <div>
      <Frame crest style={{ width: 'min(760px, 94vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Ribbon side={faction} style={{ width: 'min(420px, 94vw)' }}>Wybierz dwóch pomocników</Ribbon>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {pool.map((id) => (
            <button key={id} className="btn" onClick={() => toggle(id)} style={{ background: 'none', border: 0, padding: 4, borderRadius: 12, boxShadow: picked.includes(id) ? '0 0 0 3px #9EE4FF, 0 0 16px 4px rgba(158,228,255,0.6)' : 'none' }}>
              <UnitCard unitId={id} width={Math.min(200, (window.innerWidth - 120) / 2)} />
            </button>
          ))}
        </div>
        <button className="btn prim" disabled={picked.length !== 2} style={{ height: 50, padding: '0 30px', fontSize: 21 }} onClick={() => onPick(picked)}>
          Do bitwy!
        </button>
      </Frame>
    </div>
  );
}

function Handoff({ state, playerId, onConfirm }: { state: GameState; playerId: string; onConfirm: () => void }) {
  const player = state.players.find((p) => p.id === playerId)!;
  const hero = Object.values(state.heroes).find((h) => h.playerId === playerId && h.alive) ?? Object.values(state.heroes).find((h) => h.playerId === playerId)!;
  return (
    <div className="overlay slate" style={{ background: undefined }}>
      <img src={asset('ui/landscape.jpg')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 220px 80px rgba(4,8,10,0.92)' }} />
      {[-1, 1].map((d) => (
        <svg key={d} className="hide-mobile" aria-hidden="true" width="120" height="120" viewBox="0 0 60 60" style={{ position: 'absolute', top: -6, left: `calc(50% + ${d * 360}px - 48px)`, filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.7))' }}>
          <image href={asset(`cards/crests/${player.faction}.png`)} x="0" y="0" width="60" height="60" />
        </svg>
      ))}
      <Frame crest style={{ width: 'min(480px, 94vw)' }} innerStyle={{ padding: '26px 30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
        <div className="lbl">Runda {state.round}</div>
        <Ribbon side={player.faction} style={{ width: 340, height: 48 }}>Przekaż urządzenie</Ribbon>
        <Portrait unitId={hero.id} size={124} ring={SIDE_RING[player.faction]} glow="0 0 0 2px #1E1204, 0 0 34px 10px rgba(158,228,255,0.28)" />
        <div>
          <div style={{ fontSize: 18, color: 'var(--muted)' }}>Teraz tura</div>
          <div style={{ fontWeight: 800, fontSize: 28, color: '#F3D27A', textShadow: '0 2px 0 #1E1204' }}>{player.name} — {UNITS[hero.id].name}</div>
        </div>
        <div style={{ fontSize: 18, lineHeight: 1.35, maxWidth: 360 }}>Pozostali gracze, odwróćcie wzrok. Na ekranie pojawią się ukryte skarby frakcji: {FACTION_NAMES[player.faction]}.</div>
        <button className="btn prim" style={{ height: 54, padding: '0 26px', fontSize: 20, marginTop: 6 }} onClick={onConfirm}>
          Jestem {player.name} — pokaż turę
        </button>
      </Frame>
    </div>
  );
}

function GameOver({ state, onNew, onLog }: { state: GameState; onNew: () => void; onLog: () => void }) {
  const s = state.stats;
  return (
    <div className={state.winner === 'horde' ? 'quake' : undefined}>
      <Frame crest style={{ width: 'min(620px, 94vw)' }} innerStyle={{ padding: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <Ribbon side={state.winner ?? 'dawn'} style={{ width: 460, height: 50 }}>Wygrywa: {state.winner ? FACTION_NAMES[state.winner] : '—'}</Ribbon>
        <div style={{ fontSize: 20 }}>{state.endReason}</div>
        <div className="well" style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px 24px', fontSize: 17, textAlign: 'left', width: '100%' }}>
          <span>Rundy</span><b>{state.round}</b>
          <span>Bitwy (w tym ze strażnikami)</span><b>{s.battles} ({s.neutralBattles})</b>
          <span>Polegli bohaterowie Świtu / Hordy</span><b>{s.heroDeaths.dawn} / {s.heroDeaths.horde}</b>
          <span>Polegli pomocnicy Świtu / Hordy</span><b>{s.supportDeaths.dawn} / {s.supportDeaths.horde}</b>
          <span>Znalezione skarby Świtu / Hordy</span><b>{s.treasuresCollected.dawn} / {s.treasuresCollected.horde}</b>
          <span>Kryształy przy Drzewie</span><b>{state.factions.dawn.delivered} / {state.crystalsNeeded}</b>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn plate parch" style={{ padding: '8px 18px', fontSize: 18 }} onClick={onLog}>Dziennik</button>
          <button className="btn prim" style={{ padding: '8px 22px', fontSize: 20 }} onClick={onNew}>Nowa gra</button>
        </div>
      </Frame>
    </div>
  );
}

const LOG_ICON: Record<LogEntry['kind'], [string, string]> = {
  info: ['mBrown', 'gScroll'],
  move: ['mBrown', 'gBoot'],
  battle: ['mRed', 'gSwords'],
  damage: ['mRed', 'gSwords'],
  death: ['mPurple', 'gHelm'],
  item: ['mBrown', 'gChest'],
  crystal: ['mBlue', 'gCrystal'],
  round: ['mGreen', 'gHourglass'],
  victory: ['mGreen', 'gFlag'],
  ability: ['mPurple', 'gStar'],
};

function LogDialog({ entries }: { entries: LogEntry[] }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView(), []);
  return (
    <div>
      <Frame style={{ width: 'min(720px, 94vw)', height: '80vh' }} innerStyle={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Ribbon>Dziennik zdarzeń</Ribbon>
        <div className="scroll" style={{ flex: 1 }}>
          {entries.map((l, i) => (
            <div key={i} className={`log-line ${l.kind}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '2px 0' }}>
              <Medal fill={LOG_ICON[l.kind][0]} glyph={LOG_ICON[l.kind][1]} size={20} />
              <span style={{ color: '#9FB8BC', flex: 'none' }}>[{l.round}]</span>
              <span>{l.text}</span>
            </div>
          ))}
          <div ref={end} />
        </div>
      </Frame>
    </div>
  );
}

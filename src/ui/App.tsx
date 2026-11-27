import { assignSlots, raceOf, seatTable, sideName, teamsOf } from '../engine/teams';
import { StatText } from './markers';
import { scenarioOf } from '../engine/campaign';
import { CampaignOver } from './CampaignScreen';
import { TRAININGS, trainingAllows, trainingIndex, trainingOf, trainingSetup } from '../engine/training';
import { TrainingOver, WelcomeDialog } from './TrainingScreen';
import { TrainingCoach } from './TrainingCoach';
import { markTrained, markWelcomeSeen, welcomeSeen } from './trainingProgress';
import { ExpeditionOver } from './ExpeditionScreen';
import { markDone } from './campaignProgress';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { heroLabel } from '../engine/realm';
import { chooseAction } from '../engine/ai';
import { describeAction } from './hint';
import { FACTION_HEROES, FACTION_NAMES, UNITS, type FactionId, type TeamId, type ItemKind } from '../engine/data';
import { activeHero, applyAction, createGame, currentActor, legalHeroMoves } from '../engine/game';
import { fogView, redactHidden } from '../engine/hidden';
import { logVisibleTo } from '../engine/log';
import { hideOwnTraps, trapSecrecyOn, trapVeilFor } from './trapVeil';
import { movePath } from '../engine/battle';
import { neighborKeys, type HexKey } from '../engine/hex';
import { seeHex, tileCost } from '../engine/map';
import { controlCounts, objectiveOf, OBJECTIVES } from '../engine/objectives';
import { arenaSetup, DEFAULT_RULES, isDigital, type Level, type Mode, type Action, type GameState, type LogEntry, type LogEvent, type SetupOptions } from '../engine/types';
import { AdventureView, GoldBox, type LootFloat } from './AdventureView';
import { BattleView, WALK_STEP_MS } from './BattleView';
import { usePresentation } from './usePresentation';
import { ArtifactFound, xpNote, XpIcon } from './growthUi';
import { ARTIFACT_BY_ID } from '../engine/sites';
import type { SkillId } from '../engine/growth';
import { sfx } from './sfx';
import { withTransition } from './motion';
import { animationWait, ATTACK_SHOW_MS, holdFor, resetAnimLock } from './animLock';
import { scaledMs } from './animSpeed';
import { DuelView } from './DuelView';
import { Frame, Medal, Modal, FACTION_RING, Portrait, Ribbon, asset, teamFaction, useMedia } from './common';
import { SetupScreen } from './SetupScreen';
import { music, type Theme } from './music';
import { AppChrome, CardDialog, ConfirmDialog, FoundTreasure, musicTheme, LeaveDialog, OptionsDialog, SkillDialog, TreasureDialog, VictoryEffects, type Confirmation } from './gameDialogs';
import { fightLevelAt } from './fightBadges';
import { ArenaCardsContext, DigitalCardsContext, UnitCard } from './UnitCard';
import { DigitalContext, HeroLevelsContext, HpScaleContext, StatScaleContext } from './statScale';
import { autopilotAction, supportSlots } from '../engine/kingdom';
import { finishRun, saveBattle } from './expeditionRun';
import { runOf } from '../engine/expedition';
import { readAutosave, replay, saveNamed, writeAutosave, type BugReport, type SaveFile } from './saves';
import { BugReportDialog } from './BugReportDialog';
import { TesterDialog } from './TesterDialog';
import { isTestRun, recordGame } from './journal';
import { BattleSummary } from './BattleSummary';
import { useEndHold } from './useEndHold';
import { roundWarning, roundWarningSound } from './roundWarning';
import { Tutorial } from './Tutorial';
import { Intro, introSeen } from './Intro';
import { TitleScreen, titlePending } from './TitleScreen';
import { StatsDialog } from './StatsDialog';
import { ChangelogDialog } from './ChangelogDialog';
import { CreditsDialog } from './CreditsDialog';
import { markNewsSeen, pendingNews, WhatsNew } from './WhatsNew';
import { ArenaPrep, DraftDialog, GearDialog, SpellPickDialog } from './ArenaPrep';
import { DEV_TOOLS_ALLOWED, DevPanel } from './DevPanel';
import { useAutoFullscreen } from './fullscreen';
import { ChatBox, OnlineOverlay, OnlineScreen } from './OnlineScreen';
import { figuresOn, setFiguresEdition, setFiguresOn } from './FigureLayer';
import { savedToken, submitDaily, submitResult, type BotSpeed, type Invitation, type OnlineSession, type OnlineState } from '../online/api';
import { useOnline } from '../online/useOnline';

/** Milliseconds between two bot moves at each pace. */
const SPEEDS: Record<BotSpeed, number> = { wolno: 900, normalnie: 450, szybko: 120 };

/** Test hook: ?races=herds,horde (with mode=pvp, human seats) puts these races at the table, e.g. to look at the graphics of a new faction. */
function racesSeats(q: URLSearchParams) {
  const races = (q.get('races') ?? '').split(',').filter((r) => r in FACTION_HEROES);
  if (q.get('mode') !== 'pvp' || races.length < 2) return null;
  const slots = assignSlots(races as never);
  return races.map((race, i) => ({ name: `G${i + 1}`, faction: slots[i], race, controller: 'human' as const, heroId: (i === 0 && q.get('hero')) || (FACTION_HEROES as Record<string, string[]>)[race][0] })) as never;
}

export function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [steps, setSteps] = useState<HexKey[]>([]);
  /** Family mode: the hint on screen (see showHint). */
  const [hint, setHint] = useState<{ text: string; hex: HexKey | null; at: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [speed, setSpeed] = useState<BotSpeed>('normalnie');
  const botSpeedRef = useRef(speed);
  botSpeedRef.current = speed;
  const [autoplay, setAutoplay] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [confirmedFaction, setConfirmedFaction] = useState<TeamId | null>(null);
  const history = useRef<Action[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [showTesters, setShowTesters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  /** Arena draft at one screen: the side whose cards were last uncovered. */
  const [draftRevealed, setDraftRevealed] = useState<TeamId | null>(null);
  /** The Free Companies at a shared screen: the side that uncovered the deployment (its Sidła) and whether its own traps are peeked at now. */
  const [trapsUncovered, setTrapsUncovered] = useState<TeamId | null>(null);
  const [peekTraps, setPeekTraps] = useState(false);
  // The intro plays on the first launch (never in the ?steps= test games).
  const [showIntro, setShowIntro] = useState(() => !introSeen() && !isTestRun());
  // The title screen opens each visit (its START is the click that allows full screen and music).
  // The first launch also offers the short training (once; never in the ?steps= test games).
  const [showWelcome, setShowWelcome] = useState(() => !welcomeSeen() && !isTestRun());
  const closeWelcome = () => {
    markWelcomeSeen();
    setShowWelcome(false);
  };
  const [showTitle, setShowTitle] = useState(() => titlePending() && !isTestRun());
  const [showReport, setShowReport] = useState(false);
  /** "Nowa wersja — co nowego": the releases since the version this player last saw (never in ?steps= test games). */
  const [news, setNews] = useState(() => (isTestRun() ? null : pendingNews()));
  useEffect(() => {
    if (!news) markNewsSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const closeNews = () => {
    markNewsSeen();
    setNews(null);
  };
  /** Bug reports written in this game; saved and exported with it. */
  const reports = useRef<BugReport[]>([]);
  const saveFile = (g: GameState): SaveFile => ({ setup: g.setup, actions: [...history.current], reports: reports.current });
  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const [summary, setSummary] = useState<number | null>(null);
  // The finished battle stays on screen for a moment so the last death animation can be seen.
  const held = useEndHold(game);
  // A freshly found treasure, story pages and artifacts (filled further down) wait in line with the battle summary.
  const [found, setFound] = useState<ItemKind | null>(null);
  const [storyNews, setStoryNews] = useState<Array<Extract<LogEvent, { type: 'story' }>>>([]);
  const [artifactNews, setArtifactNews] = useState<Array<Extract<LogEvent, { type: 'artifact' }>>>([]);
  // One window at a time: the battle result, then a found treasure, a story page, an artifact; only then the hero's offers and the end of the game.
  const reportPending = (summary !== null && game?.lastBattle?.id === summary) || Boolean(found) || storyNews.length > 0 || artifactNews.length > 0;
  /**
   * The start screen: the online menu (or, logged out, the choice to log in or play without an account),
   * unless the player chose to play without an account; then the local setup screen, as before.
   * The session (once logged in) outlives the screen during a game.
   */
  const [onlineIntent, setOnlineIntent] = useState<'new' | 'load'>('new');
  /** The mode and edition picked in the menu before "Przez internet": the online table's wizard goes on from them. */
  const [onlinePreset, setOnlinePreset] = useState<{ mode: Mode; digital: boolean } | undefined>(undefined);
  const [onlineScreen, setOnlineScreen] = useState(() => !playsOffline());
  const [session, setSession] = useState<OnlineSession | null>(null);
  const online = useOnline(session);
  const [showChat, setShowChat] = useState(false);
  /** "Figurki 3D" in the options (kept in the browser; here so that switching redraws the board). */
  const [figures, setFigures] = useState(figuresOn);
  /** Chat messages read so far: the rest is the number on the "Czat" button. */
  const [chatRead, setChatRead] = useState(0);
  /** States before each undoable hero step in the current turn. */
  const undoStack = useRef<Array<{ state: GameState; historyLength: number }>>([]);
  const [, setUndoTick] = useState(0);

  // Music follows the situation on the table; audio starts on the first gesture.
  const [, setMusicTick] = useState(0);
  useEffect(() => music.subscribe(() => setMusicTick((t) => t + 1)), []);
  useEffect(() => sfx.subscribe(() => setMusicTick((t) => t + 1)), []);
  // A soft click on every button (the sound belongs to the press, not to what the button does).
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const b = (e.target as HTMLElement | null)?.closest?.('button');
      if (b && !(b as HTMLButtonElement).disabled) sfx.play('ui_click');
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, []);
  useEffect(() => {
    const unlock = () => music.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  /** The faction whose settlement window is open (reported by the map): its music plays in the town. */
  const [townRace, setTownRace] = useState<FactionId | null>(null);
  // The victory music waits for the end screen: not while the last battle is still shown.
  const wantedTheme = game?.phase === 'over' && (held || reportPending) ? 'none' : musicTheme(game, townRace);
  // Crossing from one land to another must not make the music flicker: between the map and the land themes it waits a moment for the hero to settle.
  const [theme, setTheme] = useState<Theme>(wantedTheme);
  useEffect(() => {
    const onMap = (t: Theme) => t === 'adventure' || t.startsWith('faction:');
    if (!onMap(wantedTheme) || !onMap(theme)) return setTheme(wantedTheme);
    const id = window.setTimeout(() => setTheme(wantedTheme), 1500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedTheme]);
  useEffect(() => music.play(theme), [theme]);

  // Full screen on the first click or key press, unless switched off in the menu (never in ?steps= test games).
  useAutoFullscreen(!isTestRun());

  // Test hook: ?seed=12&steps=40&mode=pvp starts a bot game and fast-forwards it.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.has('steps')) return;
    // Effects run twice in development: start the log afresh each time.
    history.current = [];
    // ?sides=3 or 4 (rivalry) adds bot sides of the placeholder factions (the next factions do not exist yet), on a rectangle map of size medium or more.
    const mode = q.get('mode') === 'pvp' ? 'pvp' : 'coop';
    const human = q.get('human') !== '0';
    const digital = q.get('ruleset') !== 'board';
    // ?mode=arena starts an arena duel (?hero= for Przymierze), e.g. ?mode=arena&ruleset=digital&steps=60&until=battle.
    const arena = q.get('mode') === 'arena' ? arenaSetup(seatTable([{ name: 'Gracz 1', faction: 'dawn', race: (q.get('race') ?? 'dawn') as FactionId, controller: human ? 'human' : 'bot', heroId: q.get('hero') ?? (q.get('race') ? FACTION_HEROES[q.get('race') as FactionId][0] : 'goldDragon') }, { name: 'Gracz 2', faction: 'horde', race: (q.get('foerace') ?? 'horde') as FactionId, controller: 'bot', heroId: q.get('foe') ?? (q.get('foerace') ? FACTION_HEROES[q.get('foerace') as FactionId][0] : 'werewolfLord') }]), Number(q.get('seed') ?? 1), (q.get('level') as Level | null) ?? 'normal', q.get('size') === '6' ? 6 : 3) : null;
    let s = createGame(arena ? { ...arena, rules: { ...arena.rules, ...(digital ? { ruleset: 'digital' as const } : {}) } } : {
      mode,
      mapSize: (q.get('size') as SetupOptions['mapSize']) ?? 'short',
      ...(['rectangle', 'ring', 'islands', 'custom'].includes(q.get('shape') ?? '') ? { mapShape: q.get('shape') as 'rectangle' | 'ring' | 'islands' | 'custom', customMapId: q.get('map') ?? undefined } : {}),
      battleMode: q.get('battle') === 'board' ? 'board' : 'arena',
      seed: Number(q.get('seed') ?? 1),
      // ?abilities=0&treasures=0 switch simplifications on, ?dice=1 the die, ?objective=control the control points goal.
      rules: { ...DEFAULT_RULES, abilities: q.get('abilities') !== '0', treasures: q.get('treasures') !== '0', useDice: q.get('dice') === '1', ...(['growth', 'kingdom', 'economy', 'realm', 'empire'].some((k) => q.get(k) === '1') ? { heroGrowth: true } : {}), ...(['kingdom', 'economy', 'realm', 'empire'].some((k) => q.get(k) === '1') ? { kingdom: true } : {}), ...(q.get('economy') === '1' || q.get('realm') === '1' || q.get('empire') === '1' ? { economy: true } : {}), ...(q.get('realm') === '1' || q.get('empire') === '1' ? { realm: true } : {}), ...(q.get('empire') === '1' ? { empire: true } : {}), ...(q.get('ruleset') !== 'board' ? { ruleset: 'digital' as const } : {}), ...(['control', 'survival', 'boss', 'artifact', 'conquest', 'relic'].includes(q.get('objective') ?? '') ? { objective: q.get('objective') as 'control' | 'survival' | 'boss' | 'artifact' | 'conquest' | 'relic' } : {}) },
      seats: racesSeats(q) ??
        (mode === 'coop'
          ? [{ name: 'Gracz 1', faction: 'dawn' as const, controller: human ? ('human' as const) : ('bot' as const), heroId: q.get('hero') ?? 'goldDragon', ...(q.get('child') === '1' ? { child: true } : {}) }, { name: 'Gracz 2', faction: 'dawn' as const, controller: 'bot' as const, heroId: 'unicornKing' }].slice(0, Number(q.get('players') ?? 2))
          : [{ name: 'Ala', faction: 'dawn', controller: 'human', heroId: 'ancientBear' }, { name: 'Bartek', faction: 'horde', controller: 'human', heroId: 'werewolfLord' }, ...(Number(q.get('sides')) >= 3 ? [{ name: 'Bot 3', faction: 'third' as const, controller: 'bot' as const, heroId: 'unicornKing' }] : []), ...(Number(q.get('sides')) >= 4 ? [{ name: 'Bot 4', faction: 'fourth' as const, controller: 'bot' as const, heroId: 'blackDragon' }] : [])]),
    });
    // ?skills=treasureHunter,treasureHunter gives every hero those skills from the start (for looking at their dialogs).
    if (q.get('skills')) for (const h of Object.values(s.heroes)) h.skills = q.get('skills')!.split(',') as SkillId[];
    if (q.get('pack')) for (const h of Object.values(s.heroes)) h.pack = q.get('pack')!.split(',').filter((id) => ARTIFACT_BY_ID[id]);
    if (q.get('gear')) for (const h of Object.values(s.heroes)) h.gear = Object.fromEntries(q.get('gear')!.split(',').filter((id) => ARTIFACT_BY_ID[id]).map((id) => [ARTIFACT_BY_ID[id].slot, id]));
    // ?kingdom=1 (level 3): ?gold=20 gives the factions that much gold.
    if (s.kingdom && q.get('gold')) for (const f of ['dawn', 'horde'] as const) s.kingdom.gold[f] = Number(q.get('gold'));
    // ?economy=1 (level 4): ?res=9 gives the factions that much of every resource.
    // ?built=barracks,market puts these buildings (level 1) in the settlements of both factions, for checks that need a ready tree.
    if (s.kingdom && q.get('built')) for (const st of Object.values(s.kingdom.settlements)) for (const b of q.get('built')!.split(',')) st.buildings[b as keyof typeof st.buildings] = 1;
    if (s.kingdom?.res && q.get('res')) for (const f of ['dawn', 'horde'] as const) s.kingdom.res[f] = { wood: Number(q.get('res')), ore: Number(q.get('res')), dust: Number(q.get('res')) };
    // ?economy=1&near=hut|mill|well|store stands the active hero next to the first such place (to walk in by a click).
    if (s.kingdom && q.get('near')) {
      const want = q.get('near')!;
      const hex = want === 'hut' ? Object.keys(s.kingdom.huts ?? {})[0] : want === 'mine' ? Object.keys(s.kingdom.mines)[0] : Object.entries(s.kingdom.objects ?? {}).find(([, o]) => o.kind === want)?.[0];
      const hero = activeHero(s);
      const next = hex && hero ? neighborKeys(hex).find((k) => s.tiles[k] && tileCost(s.tiles[k]) !== null && !s.tiles[k].crystalId && !s.tiles[k].place) : null;
      if (hex && hero && next) {
        hero.pos = next;
        seeHex(s, hex);
        seeHex(s, next);
        s.movePoints = 3;
      }
    }
    // ?economy=1&mode=pvp&siege=2 (walls level 0-2, &garrison=2 units): the first hero storms the enemy's home settlement held by a garrison.
    if (s.kingdom && q.get('siege') !== null) {
      const hero = activeHero(s);
      const foe = hero ? Object.values(s.heroes).find((h) => h.faction !== hero.faction) : undefined;
      const home = hero ? Object.values(s.kingdom.settlements).find((x) => x.owner && x.owner !== hero.faction) : undefined;
      const next = home ? neighborKeys(home.at).find((k) => s.tiles[k] && tileCost(s.tiles[k]) !== null && !s.tiles[k].crystalId) : null;
      if (hero && home && next) {
        const fs = s.factions[home.owner!];
        home.garrison = fs.supportsAlive.splice(0, Number(q.get('garrison') ?? 2));
        home.buildings.walls = Number(q.get('siege'));
        if (foe && q.get('defender') !== '1') foe.pos = Object.values(s.tiles).find((t) => t.home === hero.faction)!.key;
        hero.pos = next;
        seeHex(s, home.at);
        seeHex(s, next);
        s.movePoints = 3;
        if (q.get('adjacent') !== '1') {
          s = applyAction(s, { type: 'moveHero', to: home.at });
          history.current.push({ type: 'moveHero', to: home.at });
        }
      }
    }
    // ?level=9 puts every hero on that level (for looking at the milestones on the cards).
    if (q.get('level')) for (const h of Object.values(s.heroes)) h.level = Number(q.get('level'));
    if (q.get('reveal') === '1') for (const k of Object.keys(s.tiles)) seeHex(s, k);
    // ?encounter=2 (with growth=1) walks the active hero into the first neutral encounter of that tier (0 common, 1 rare, 2 legendary), for looking at the new units.
    if (q.get('encounter')) {
      const enc = Object.values(s.crystals).find((c) => c.encounter && c.tier === Number(q.get('encounter'))) ?? (q.get('adjacent') === '1' ? Object.values(s.crystals).find((c) => c.guardian) : undefined);
      const hero = activeHero(s);
      const next = enc && hero ? neighborKeys(enc.at).find((k) => s.tiles[k] && tileCost(s.tiles[k]) !== null && !s.tiles[k].crystalId) : null;
      if (enc && hero && next) {
        hero.pos = next;
        seeHex(s, enc.at);
        s.movePoints = 3;
        // ?adjacent=1 only stands next to the encounter (to look at the fight note and the confirmation).
        if (q.get('adjacent') !== '1') {
          s = applyAction(s, { type: 'moveHero', to: enc.at });
          history.current.push({ type: 'moveHero', to: enc.at });
        }
      }
    }
    for (let i = 0; i < Number(q.get('steps')) && s.phase !== 'over'; i++) {
      let a = chooseAction(s);
      if (!a) break;
      // ?supports=pegasus,shadowBat makes the bots take these supports into a battle (for looking at their sprites).
      if (a.type === 'selectSupports' && q.get('supports')) {
        const alive = s.factions[a.faction].supportsAlive;
        const wanted = q.get('supports')!.split(',').filter((id) => alive.includes(id));
        a = { ...a, supportIds: [...wanted, ...a.supportIds.filter((id) => !wanted.includes(id))].slice(0, a.supportIds.length) };
      }
      s = applyAction(s, a);
      history.current.push(a);
      if (q.get('until') === 'battle' && s.phase === 'battle' && s.battle?.stage === 'fight') break;
      // ?until=deploy stops where a person sets up the units for a battle.
      if (q.get('until') === 'deploy' && s.phase === 'battle' && s.battle?.stage === 'deploy' && currentActor(s).kind === 'human') break;
      // ?until=select stops where the player picks the supports for a battle.
      if (q.get('until') === 'select' && s.phase === 'battle' && s.battle?.stage === 'select') break;
      // ?until=offer stops when a hero has skills to choose from (for looking at the skill cards).
      if (q.get('until') === 'treasure' && Object.values(s.heroes).some((h) => h.treasurePick)) break;
      if (q.get('until') === 'offer' && Object.values(s.heroes).some((h) => h.offer?.length)) break;
    }
    setGame(s);
  }, []);

  // Online the server holds the game: every state it sends replaces ours.
  const onlineRoom = online?.room ?? null;
  const onlineGame = onlineRoom && onlineRoom.status !== 'lobby' ? online!.game : null;
  // The states are shown one by one, each after the animations of the one before (usePresentation).
  usePresentation(session ?? null, onlineGame, (g) => {
    gameRef.current = g;
    setGame(g);
  });
  useEffect(() => {
    if (!online?.error || !onlineGame) return;
    setError(online.error);
    setSteps([]);
    session!.clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online?.error]);
  /** Online: the players (p1, p2…) whose seats this browser holds and plays itself. */
  const mySeats = useMemo(
    () => new Set(onlineRoom?.seats.flatMap((s, i) => (s.player?.id === online!.user.id && !s.botTakeover ? [`p${i + 1}`] : [])) ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onlineRoom],
  );
  const isOnline = Boolean(session && onlineGame);
  // The developer panel: ?dev=1 or Ctrl+Shift+D, in the development build and never in an online game.
  const [devOpen, setDevOpen] = useState(() => DEV_TOOLS_ALLOWED && new URLSearchParams(window.location.search).get('dev') === '1');
  useEffect(() => {
    if (!DEV_TOOLS_ALLOWED) return;
    const onKey = (e: KeyboardEvent) => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') { e.preventDefault(); setDevOpen((o) => !o); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const isOnlineOwner = Boolean(isOnline && onlineRoom && onlineRoom.ownerId === online?.user.id);
  const defaultSaveName = game ? `Partia ${new Date().toLocaleDateString('pl-PL')}, runda ${game.round}` : 'Zapis';
  // Messages count as read while the chat is open, and in the lobby, where it is always on screen.
  const unread = online && !showChat ? online.chatReceived - chatRead : 0;
  useEffect(() => {
    if (online && (showChat || !isOnline)) setChatRead(online.chatReceived);
  }, [showChat, isOnline, online?.chatReceived]);
  /** People playing at this screen: every human seat locally, only this browser's seats online. */
  const atThisScreen = (p: { id: string; controller: string }) => (isOnline ? mySeats.has(p.id) : p.controller === 'human');

  if (import.meta.env?.MODE === 'test') Object.assign(window, { __game: game, __history: history });
  const actor = game ? currentActor(game) : { kind: 'none' as const };
  const humanTurn = actor.kind === 'human' && (isOnline ? mySeats.has(actor.playerId) : !autoplay);
  const humanTurnRef = useRef(humanTurn);
  humanTurnRef.current = humanTurn;
  const pvp = game?.setup.mode === 'pvp';
  const humans = game?.players.filter(atThisScreen) ?? [];
  // Hand-off screen only between human players of different factions, and never mid-battle.
  const needsHandoff = Boolean(game && humanTurn && pvp && game.phase === 'adventure' && actor.kind === 'human' && actor.faction !== confirmedFaction && humans.some((p) => p.faction !== actor.faction));
  const viewer: TeamId | null = actor.kind === 'human' ? actor.faction : humans[0]?.faction ?? (game?.setup.mode === 'coop' ? 'dawn' : null);

  // Hidden information (the Free Companies' traps and veiled units): the screen shows what its viewers may see: online the seats of this browser, at one computer whoever acts now.
  // The slate panels take the colour of the faction at the screen (backlog 62a); outside a game (menu, setup) they stay the old green and blue.
  const slateRace = game && viewer ? raceOf(game, viewer) : null;
  /** False until the first colours are set: the first look needs no melting. */
  const themeApplied = useRef(false);
  useEffect(() => {
    const root = document.documentElement;
    // The colours of the interface melt into the next faction's (or the menu's) instead of jumping.
    const apply = () => {
      if (slateRace) {
        // Absolute: a relative url() in a custom property is resolved against the stylesheet that uses it, which in the build lives in assets/.
        root.style.setProperty('--slate-img', `url('${new URL(asset(`ui/slate_${slateRace}.jpg`), document.baseURI).href}')`);
        root.dataset.faction = slateRace;
      } else {
        root.style.removeProperty('--slate-img');
        delete root.dataset.faction;
      }
    };
    if (themeApplied.current) {
      root.dataset.vt = 'theme';
      withTransition(apply, 420);
      window.setTimeout(() => { if (root.dataset.vt === 'theme') delete root.dataset.vt; }, 600);
    } else apply();
    themeApplied.current = true;
  }, [slateRace]);
  // Only leaving the game for good clears the colours (between two factions they stay, so the old look can melt into the new one).
  useEffect(() => () => {
    document.documentElement.style.removeProperty('--slate-img');
    delete document.documentElement.dataset.faction;
  }, []);
  const viewers = useMemo<TeamId[] | null>(() => (isOnline ? humans.map((p) => p.faction) : viewer ? [viewer] : null), [isOnline, viewer, humans.map((p) => p.faction).join()]);
  const battleSource = held ? held.view : game;
  // Two people at one screen and one of them plays the Free Companies: even their own traps stay out of sight until "Podejrzyj" (the other player may be looking).
  const trapSecrecy = trapSecrecyOn(game, humans, isOnline);
  const battleShown = useMemo(() => {
    if (!battleSource) return battleSource;
    const shown = redactHidden(battleSource, viewers);
    // While the side deploys behind the "pass the device" screen it sees its own mirages (it picks and places them).
    const ownDeploy = battleSource.battle?.stage === 'deploy' && viewer !== null && battleSource.battle.needsDeploy[0] === viewer && trapsUncovered === viewer;
    return trapSecrecy && !peekTraps && viewer && !ownDeploy ? hideOwnTraps(shown, viewer) : shown;
  }, [battleSource, viewers, trapSecrecy, peekTraps, viewer, trapsUncovered]) as GameState;
  // The fog of war (digital edition): the map shows what the viewers' factions have uncovered; enemy heroes on hexes they have not seen are not on it.
  const mapShown = useMemo(() => (game ? fogView(game, viewers) : game), [game, viewers]);
  const peekKey = game?.battle ? `${game.battle.stage}:${game.battle.round}:${game.battle.index}:${actor.kind === 'human' ? actor.faction : ''}` : '';
  useEffect(() => { setPeekTraps(false); }, [peekKey]);
  // The deployment of a side with traps is covered until that side says the other player is not looking.
  const deployingSide = game?.battle?.stage === 'deploy' && actor.kind === 'human' ? game.battle.needsDeploy[0] : null;
  const trapVeil = Boolean(game && trapSecrecy && humanTurn && actor.kind === 'human' && trapVeilFor(game, actor.faction) && trapsUncovered !== actor.faction);
  useEffect(() => { if (!deployingSide) setTrapsUncovered(null); }, [deployingSide]);

  // The latest state lives in a ref so every action is applied and recorded exactly once
  // (state updater functions may run twice in React's development mode).
  const gameRef = useRef<GameState | null>(game);
  gameRef.current = game;
  const sessionRef = useRef<OnlineSession | null>(null);
  sessionRef.current = isOnline ? session : null;
  // The training (training.ts): the step the coach is on, a bump when the player tried something else, and whether the guidance was switched off.
  const trainIdx = useRef(0);
  const [coachShake, setCoachShake] = useState(0);
  const [coachOff, setCoachOff] = useState(false);
  const coachOffRef = useRef(false);
  coachOffRef.current = coachOff;
  const dispatch = useCallback((a: Action) => {
    const g = gameRef.current;
    if (!g) return;
    // A guided game holds the player's actions the current step does not ask for.
    const training = trainingOf(g.setup);
    if (training && !coachOffRef.current) {
      trainIdx.current = trainingIndex(training, g, trainIdx.current);
      if (!trainingAllows(training, g, trainIdx.current, a)) {
        setCoachShake((n) => n + 1);
        return;
      }
    }
    // Online the server checks and applies the move, then sends the new state to everyone.
    if (sessionRef.current) {
      sessionRef.current.send({ type: 'action', action: a });
      return;
    }
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
      // A unit walking along its path on the arena: let the next machine action wait for it.
      const mover = a.type === 'battleMove' && g.battle?.activation ? g.battle.units[g.battle.activation.unitId] : null;
      if (mover && a.type === 'battleMove') holdFor((movePath(g, mover, a.to).length - 1) * WALK_STEP_MS);
      // A blow, an item or an ability takes time to show: the next machine action waits for it (a fast bot speed shortens the wait).
      if (a.type === 'battleAttack' || a.type === 'battleItem') holdFor(botSpeedRef.current === 'szybko' ? ATTACK_SHOW_MS * 0.4 : ATTACK_SHOW_MS);
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
    if (!game || game.phase === 'over' || needsHandoff || isOnline) return;
    const machine = actor.kind === 'bot' || actor.kind === 'automaton' || (actor.kind === 'human' && autoplay);
    if (!machine) return;
    let t = 0;
    // Acts when the arena has finished showing the last action (animLock); asks again while it has not.
    const tick = () => {
      const wait = animationWait();
      if (wait > 0) {
        t = window.setTimeout(tick, wait);
        return;
      }
      const a = chooseAction(game);
      if (a) dispatch(a);
    };
    t = window.setTimeout(tick, SPEEDS[speed]);
    return () => window.clearTimeout(t);
  }, [game, actor.kind, autoplay, speed, dispatch, needsHandoff, isOnline]);

  // Levels 3 and 4, family mode: the autopilot runs the layers above walking and fighting for a child (kingdom.ts `autopilotAction`).
  useEffect(() => {
    if (!game || !humanTurn || game.phase !== 'adventure' || !game.kingdom || actor.kind !== 'human') return;
    if (!game.players.some((p) => p.id === actor.playerId && p.child)) return;
    const hero = activeHero(game);
    const a = hero ? autopilotAction(game, hero) : null;
    if (!a) return;
    const t = window.setTimeout(() => dispatch(a), 700);
    return () => window.clearTimeout(t);
  }, [game, humanTurn, actor, dispatch]);

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
    trainIdx.current = 0;
    setCoachOff(false);
    setCoachShake(0);
    resetAnimLock();
    history.current = [];
    reports.current = [];
    undoStack.current = [];
    setConfirmedFaction(null);
    forgetSeen();
    setGame(createGame(setup));
  };

  const load = (save: SaveFile) => {
    resetAnimLock();
    try {
      const g = replay(save);
      history.current = [...save.actions];
      reports.current = [...(save.reports ?? [])];
      undoStack.current = [];
      setConfirmedFaction(null);
      forgetSeen();
      setGame(g);
    } catch (e) {
      setError(`Nie udało się wczytać zapisu: ${(e as Error).message}`);
    }
  };

  // Autosave after every action; a finished game clears the slot. Online games are kept by the server.
  // The journal holds every game ever played, so rewriting it is dearer: at the start, when the phase
  // changes, every 10 actions, at the end, and when the page is hidden or closed.
  const journaled = useRef<{ game: GameState | null; actions: number; phase: string }>({ game: null, actions: -1, phase: '' });
  useEffect(() => {
    if (!game) {
      // Back in the menu: the game left behind gets its last actions in the journal.
      const left = journaled.current.game;
      if (left && history.current.length !== journaled.current.actions) recordGame(saveFile(left), left);
      journaled.current = { game: null, actions: -1, phase: '' };
      return;
    }
    if (isOnline) return;
    const save = saveFile(game);
    writeAutosave(game.phase === 'over' ? null : save);
    if (game.setup.expedition) saveBattle(game.phase === 'over' ? null : save);
    const last = journaled.current;
    const fresh = last.game?.setup.seed !== game.setup.seed;
    if (fresh || game.phase !== last.phase || game.phase === 'over' || save.actions.length - last.actions >= 10 || save.actions.length < last.actions) {
      recordGame(save, game);
      journaled.current = { game, actions: save.actions.length, phase: game.phase };
    } else journaled.current = { ...last, game };
  }, [game]);
  useEffect(() => {
    const flush = () => {
      const g = journaled.current.game;
      if (g && !isOnline && document.visibilityState === 'hidden') recordGame(saveFile(g), g);
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [isOnline]);

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
    const text = guarded?.encounter ? `Wejście na to pole rozpocznie walkę ze strażnikami: ${guarded.encounter.map((id) => UNITS[id].name).join(', ')}.` : guarded ? `Wejście na to pole rozpocznie walkę ze strażnikiem: ${UNITS[guarded.guardian!].name}.` : 'Wejście na to pole rozpocznie bitwę z wrogim bohaterem.';
    setConfirm({ text, level: fightLevelAt(g, target), yes: 'Do walki!', onYes: () => setSteps(path) });
  }, []);

  // A freshly found treasure of the viewing faction turns over in front of the player.
  const knownItems = useRef<{ seed: number; ids: Set<string> } | null>(null);
  useEffect(() => {
    if (!game) return;
    // Item ids repeat in every game (it1, it2…): what this screen knows belongs to one game only.
    if (knownItems.current?.seed !== game.setup.seed) knownItems.current = null;
    const humanSides = new Set(game.players.filter(atThisScreen).map((p) => p.faction));
    const owned = Object.values(game.items).filter((it) => it.owner && humanSides.has(it.owner));
    if (knownItems.current) {
      const fresh = owned.find((it) => !knownItems.current!.ids.has(it.id));
      if (fresh && game.phase === 'adventure') (setFound(fresh.kind), sfx.play('treasure_found'));
    }
    knownItems.current = { seed: game.setup.seed, ids: new Set(owned.map((it) => it.id)) };
  }, [game]);

  // Adventure map sounds, taken from the log so bots, hotseat and online players are all heard: a hero's step, a crystal picked up
  // or given to the Tree. Only entries added since the last look count, and a burst of steps is played as one.
  const soundedLog = useRef<{ seed: number; n: number } | null>(null);
  useEffect(() => {
    if (!game) return;
    const prev = soundedLog.current;
    soundedLog.current = { seed: game.setup.seed, n: game.log.length };
    if (!prev || prev.seed !== game.setup.seed) return;
    // The fog of war: what the viewers may not read is not heard either (an enemy's step, find or spell somewhere in the dark).
    const fresh = game.log.slice(prev.n).filter((l) => logVisibleTo(l, viewers));
    // Siege: a tower's shot and the moat are heard wherever they happen (they have no animation of their own).
    if (fresh.some((l) => l.kind === 'damage' && l.text.startsWith('Wieżyczka →'))) sfx.play('tower_shot');
    if (fresh.some((l) => l.kind === 'damage' && l.text.startsWith('Fosa →'))) sfx.play('moat');
    if (fresh.some((l) => l.kind === 'crystal' && /wznosi w osadzie/.test(l.text))) sfx.play('spark');
    if (game.phase !== 'adventure') return;
    if (fresh.some((l) => l.kind === 'crystal' && l.text.includes('Odłam'))) return void sfx.play('shard_pickup');
    if (fresh.some((l) => l.kind === 'crystal' && l.text.includes('oddaje'))) sfx.play('tree_deliver');
    else if (fresh.some((l) => l.kind === 'crystal' && l.text.includes('podnosi'))) sfx.play('crystal_pickup');
    else if (fresh.some((l) => l.kind === 'move' && /wchodzi na pole|wkracza na pole/.test(l.text))) sfx.play('hero_step');
  }, [game]);

  // Hero growth: experience gained and artifacts found by the heroes at this screen. A note on the map for experience; the artifact
  // gets a card (what it is, where it came from), because it used to go unnoticed.
  const newsSeen = useRef<{ seed: number; n: number } | null>(null);
  const [xpNotes, setXpNotes] = useState<Array<{ key: number; text: string }>>([]);
  const [lootFloats, setLootFloats] = useState<LootFloat[]>([]);
  const [mapFxs, setMapFxs] = useState<Array<{ key: number; kind: string; hex: string }>>([]);
  useEffect(() => {
    if (!game) {
      newsSeen.current = null;
      return;
    }
    const seen = newsSeen.current;
    const total = game.log.length;
    newsSeen.current = { seed: game.setup.seed, n: total };
    // A new, loaded or taken-back game: nothing is announced for what was already in it.
    if (!seen || seen.seed !== game.setup.seed || seen.n > total) {
      // A story note for the very start of a fresh game opens with it (a loaded game does not repeat its notes).
      if (game.actionCount === 0) {
        const opening = game.log.flatMap((l) => (l.event?.type === 'story' ? [l.event] : []));
        if (opening.length) setStoryNews(opening);
      }
      return;
    }
    const sides = new Set(game.players.filter(atThisScreen).map((p) => p.faction));
    const events = game.log.slice(seen.n).flatMap((l) => (l.event && logVisibleTo(l, viewers) ? [l.event] : []));
    const fresh = events.flatMap((ev) => (ev.type !== 'story' && ev.type !== 'fx' && sides.has(game.heroes[ev.heroId]?.faction) ? [ev] : []));
    // Map light effects (spells, shards, the Iskra) play for everybody who may read the line, whatever their side.
    const mapFx: Array<{ key: number; kind: string; hex: string }> = events.flatMap((ev) => (ev.type === 'fx' ? [{ key: Math.random(), kind: ev.kind, hex: ev.hex }] : []));
    if (mapFx.length) {
      setMapFxs((l) => [...l, ...mapFx].slice(-4));
      sfx.play(mapFx[0].kind === 'mapa_portal' ? 'portal' : mapFx[0].kind === 'odlamek' ? 'shard_pickup' : mapFx[0].kind === 'iskra' ? 'spark' : 'magic_cast');
      window.setTimeout(() => setMapFxs((l) => l.filter((x) => !mapFx.includes(x))), 1900);
    }
    const stories = events.flatMap((ev) => (ev.type === 'story' ? [ev] : []));
    if (stories.length) setStoryNews((n) => [...n, ...stories]);
    const notes = fresh.flatMap((ev) => (ev.type === 'xp' ? [{ key: Math.random(), text: xpNote(ev) }] : []));
    // The arena's artifact was chosen by the player a moment ago: no "Artefakt!" notice for it.
    const arts = game.setup.mode === 'arena' ? [] : fresh.flatMap((ev) => (ev.type === 'artifact' ? [ev] : []));
    if (notes.length) {
      setXpNotes((n) => [...n, ...notes].slice(-4));
      window.setTimeout(() => setXpNotes((n) => n.filter((x) => !notes.includes(x))), 4500);
    }
    if (arts.length) setArtifactNews((a) => [...a, ...arts]);
    // Gold and resources taken from the map float over the hero for a moment, with the coins sound.
    const loots: LootFloat[] = fresh.flatMap<LootFloat>((ev) => (ev.type === 'loot' ? [{ key: Math.random(), heroId: ev.heroId, gold: ev.gold, res: ev.res }] : ev.type === 'xp' ? [{ key: Math.random(), heroId: ev.heroId, xp: ev.amount }] : []));
    if (loots.length) {
      setLootFloats((l) => [...l, ...loots].slice(-4));
      if (loots.some((f) => !f.xp)) sfx.play('coins_buy');
      window.setTimeout(() => setLootFloats((l) => l.filter((x) => !loots.includes(x))), 2500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  // The end of a game sounds like a win or a loss for the people at this screen; a level-up sounds when the skills are offered.
  // A won scenario of the campaign opens the next one.
  useEffect(() => {
    const run = game ? scenarioOf(game.setup) : null;
    if (game?.phase === 'over' && run && game.winner === 'dawn') markDone(run.campaign.id, run.scenario.id);
    const training = game ? trainingOf(game.setup) : null;
    if (game?.phase === 'over' && training && game.winner === 'dawn') markTrained(training.id);
  }, [game?.phase, game?.winner]);
  const endSound = useRef<string | null>(null);
  useEffect(() => {
    if (!game || game.phase !== 'over' || held || reportPending) return;
    const key = `${game.setup.seed}:${game.actionCount}`;
    if (endSound.current === key) return;
    endSound.current = key;
    // The end screen has its music (musicTheme); with the music switched off a short fanfare marks the end instead, whoever won.
    if (music.muted || !music.volume) sfx.play('victory');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, held, reportPending]);
  // The round limit is near: a sound as the first person's turn of that round begins (after the hand-over screen, never for a bot).
  const warnedRound = useRef<string | null>(null);
  useEffect(() => {
    if (!game) return void (warnedRound.current = null);
    if (!humanTurn || needsHandoff || held || game.phase !== 'adventure') return;
    const sound = roundWarningSound(game.round, game.roundLimit);
    const key = `${game.setup.seed}:${game.round}`;
    if (!sound || warnedRound.current === key) return;
    warnedRound.current = key;
    sfx.play(sound);
  }, [game, humanTurn, needsHandoff, held]);
  // Not while the finished battle is still on screen (the engine is already on the map, the arena shows the last blow).
  const offering = game && humanTurn && !held && game.phase === 'adventure' && !steps.length ? activeHero(game) : null;
  const offerKey = offering?.offer?.length ? `${offering.id}:${offering.level ?? 1}` : null;
  useEffect(() => {
    if (offerKey) sfx.play('level_up');
  }, [offerKey]);

  // After-battle summary for battles a human faction fought in.
  const lastBattleId = game?.lastBattle?.id ?? null;
  useEffect(() => {
    if (!game?.lastBattle) return;
    const lb = game.lastBattle;
    const humanSides = new Set(game.players.filter(atThisScreen).map((p) => p.faction));
    if (humanSides.has(lb.attacker as TeamId) || humanSides.has(lb.defender as TeamId)) setSummary(lb.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastBattleId]);

  const heroLevels = useMemo(() => (game?.rules.heroGrowth ? Object.fromEntries(Object.values(game.heroes).map((h) => [h.id, h.level ?? 1])) : {}), [game]);
  const visibleLog = useMemo(() => (game ? game.log.filter((l) => logVisibleTo(l, viewers)) : []), [game, viewers]);

  /** A new, loaded or left game: no "found treasure" carried over from the last one. */
  function forgetSeen() {
    knownItems.current = null;
  }

  // A local game finished while logged in goes to the ranking: the server replays it and scores it.
  const [rankingNote, setRankingNote] = useState<string | null>(null);
  const scored = useRef<string | null>(null);
  useEffect(() => {
    if (!game || isOnline || game.setup.expedition || game.phase !== 'over' || !savedToken() || isTestRun()) return;
    const key = `${game.setup.seed}:${history.current.length}`;
    if (scored.current === key) return;
    scored.current = key;
    setRankingNote('Ranking: zapisywanie wyniku…');
    submitResult(game.setup, history.current)
      .then((r) => setRankingNote(r.counted ? (r.won ? `Ranking: wygrana, +${r.points} pkt.` : 'Ranking: przegrana zapisana (0 pkt).') : `Ranking: ${r.reason}`))
      .catch((e: Error) => setRankingNote(`Ranking: ${e.message}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.phase, isOnline]);
  useEffect(() => {
    if (game?.phase !== 'over') setRankingNote(null);
  }, [game?.phase]);

  /** "Dołącz" on an invitation: a local game in progress is put aside (it stays in the autosave). */
  const acceptInvitation = (invitation: Invitation) => {
    if (game && !isOnline) setGame(null);
    setOnlineScreen(true);
    session?.answerInvitation(invitation, true);
  };
  // Read once each time the menu opens, not on every render of the setup screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const menuAutosave = useMemo(() => (game ? null : readAutosave()), [game === null]);
  const overlay = session && <OnlineOverlay session={session} onAccept={acceptInvitation} />;

  // Autoplay closes the report windows (a battle summary, a found treasure, a story page, an artifact) by itself after a short while, one at a time;
  // windows that ask for a decision and the end of the game stay for the player.
  const autoClose: (() => void) | null = held || isOnline || !autoplay || !game || game.phase === 'over' ? null
    : summary !== null && game.lastBattle?.id === summary ? () => setSummary(null)
        : found ? () => setFound(null)
          : storyNews.length ? () => setStoryNews((a) => a.slice(1))
            : artifactNews.length ? () => setArtifactNews((a) => a.slice(1))
              : null;
  const autoCloseKey = autoClose ? `${summary !== null ? 's' : found ? 'f' : storyNews.length ? `n${storyNews.length}` : `a${artifactNews.length}`}` : '';
  useEffect(() => {
    if (!autoClose) return;
    const t = window.setTimeout(autoClose, scaledMs(2800));
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCloseKey]);

  // Keyboard shortcuts (battle-specific keys live in BattleView). One listener for the whole game;
  // it reads the open dialogs through a ref.
  const keys = useRef({ closeTop: (): boolean => false, anyOpen: false, undo, fastForward, humanAction });
  keys.current = {
    // Esc closes the dialog on top, one at a time.
    closeTop: () => {
      const open: Array<[unknown, () => void]> = [
        [confirm, () => setConfirm(null)],
        [card, () => setCard(null)],
        [found, () => setFound(null)],
        [storyNews.length ? storyNews : null, () => setStoryNews((a) => a.slice(1))],
        [artifactNews.length ? artifactNews : null, () => setArtifactNews((a) => a.slice(1))],
        [showLog, () => setShowLog(false)],
        [showDebug, () => setShowDebug(false)],
        [showRules, () => setShowRules(false)],
        [showReport, () => setShowReport(false)],
        [summary, () => setSummary(null)],
        [showStats, () => setShowStats(false)],
        [showChangelog, () => setShowChangelog(false)],
        [showCredits, () => setShowCredits(false)],
        [showTesters, () => setShowTesters(false)],
        [showChat, () => setShowChat(false)],
      ];
      const top = open.find(([isOpen]) => isOpen !== null && isOpen !== false);
      top?.[1]();
      return Boolean(top);
    },
    anyOpen: Boolean(confirm || card || found || storyNews.length || artifactNews.length || showLog || showDebug || showRules || showReport || summary !== null || showStats || showChangelog || showCredits || showTesters || showChat),
    undo,
    fastForward,
    humanAction,
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
      const ks = keys.current;
      if (e.key === 'Escape') {
        ks.closeTop();
        return;
      }
      if (ks.anyOpen) return;
      const k = e.key.toLowerCase();
      if (k === 'd') setShowLog(true);
      else if (k === 'o') setShowDebug(true);
      else if (k === 'r' || k === '?') setShowRules(true);
      else if (k === 'b' && gameRef.current) setShowReport(true);
      else if ((k === 'z' && (e.ctrlKey || e.metaKey)) || k === 'u') ks.undo();
      else if (k === 'f') ks.fastForward();
      else if ((k === ' ' || k === 'e') && gameRef.current?.phase === 'adventure' && humanTurnRef.current) {
        e.preventDefault();
        ks.humanAction({ type: 'endTurn' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /** "Nowa gra": online it also leaves the room (the game goes on for the others, a bot takes the seats). */
  const leaveGame = () => {
    // Leaving a battle of the run of the day ends the run (one life, one ranking result); an ordinary run keeps its battle to go back to.
    if (game?.setup.expedition?.daily && game.phase !== 'over') {
      const run = runOf(game.setup);
      if (run) {
        finishRun(run);
        if (savedToken()) submitDaily(run.daily!, run.cleared).catch(() => undefined);
      }
      writeAutosave(null);
    }
    if (isOnline) session!.send({ type: 'leaveRoom' });
    forgetSeen();
    setGame(null);
  };

  if (!game) {
    return (
      <>
        {onlineScreen ? (
          <OnlineScreen
            intent={onlineIntent}
            preset={onlinePreset}
            session={session}
            onSession={setSession}
            onLocalGame={() => setOnlineScreen(false)}
            onOffline={() => {
              setPlaysOffline(true);
              setOnlineScreen(false);
            }}
            links={{ onRules: () => setShowRules(true), onIntro: () => setShowIntro(true), onChangelog: () => setShowChangelog(true), onCredits: () => setShowCredits(true), onTesters: () => setShowTesters(true) }}
          />
        ) : (
        <SetupScreen
          session={Boolean(session)}
          online={session ? { label: '← Menu online', title: 'Wróć do menu gry online' } : { label: 'Zaloguj się, żeby grać ze znajomymi', title: 'Gra online i ranking wymagają konta' }}
          onOnline={(intent, preset) => {
            setOnlineIntent(intent);
            setOnlinePreset(intent === 'new' ? preset : undefined);
            setPlaysOffline(false);
            setOnlineScreen(true);
          }}
          onStart={start} onLoad={load} autosave={menuAutosave} onRules={() => setShowRules(true)} onTesters={() => setShowTesters(true)} onStats={() => setShowStats(true)} onIntro={() => setShowIntro(true)} onChangelog={() => setShowChangelog(true)} onCredits={() => setShowCredits(true)} />
        )}
        {overlay}
        <Modal open={showTesters} onClose={() => setShowTesters(false)}>
          {showTesters && <TesterDialog onClose={() => setShowTesters(false)} download={download} />}
        </Modal>
        <Modal open={showStats} onClose={() => setShowStats(false)}>
          {showStats && <StatsDialog onClose={() => setShowStats(false)} />}
        </Modal>
        <Modal open={showCredits} onClose={() => setShowCredits(false)}>
          {showCredits && <CreditsDialog onClose={() => setShowCredits(false)} />}
        </Modal>
        <Modal open={showChangelog} onClose={() => setShowChangelog(false)}>
          {showChangelog && <ChangelogDialog onClose={() => setShowChangelog(false)} />}
        </Modal>
        <Modal open={Boolean(news) && !showTitle && !showIntro} onClose={closeNews}>
          {news && (
            <WhatsNew
              releases={news}
              onClose={closeNews}
              onHistory={() => {
                closeNews();
                setShowChangelog(true);
              }}
            />
          )}
        </Modal>
        <Modal open={showWelcome && !showTitle && !showIntro && !news} onClose={closeWelcome}>
          {showWelcome && <WelcomeDialog onTraining={() => { closeWelcome(); start(trainingSetup(TRAININGS[0], Math.floor(Math.random() * 1e6))); }} onClose={closeWelcome} />}
        </Modal>
        {showIntro && !showTitle && <Intro onClose={() => setShowIntro(false)} />}
        {showTitle && <TitleScreen onStart={() => setShowTitle(false)} />}
        <AppChrome showLang error={error} onDismissError={() => setError(null)} showRules={showRules} onCloseRules={() => setShowRules(false)} />
      </>
    );
  }

  /** Family mode: what the bot would do now, shown as a sentence and (on the map) as a pulsing hex until the next action. */
  const showHint = () => {
    const g = gameRef.current;
    if (!g) return;
    const a = chooseAction(g);
    setHint({ text: describeAction(g, a), hex: a?.type === 'moveHero' ? a.to : null, at: g.actionCount });
  };
  const hintNow = hint && game && hint.at === game.actionCount ? hint : null;

  const footer = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
        {game?.kingdom && viewer && game.phase !== 'battle' && <GoldBox state={game} faction={viewer} />}
      </div>
      {trapSecrecy && humanTurn && game.battle?.stage === 'fight' && viewer && (game.battle.ground ?? []).some((g) => g.hidden && g.owner === viewer) && (
        <button className="btn plate parch btn-bar" data-peek-traps aria-pressed={peekTraps} title="Własne Sidła widać tylko w twojej turze, po kliknięciu: inni gracze niech nie patrzą" onClick={() => setPeekTraps((v) => !v)}>
          {peekTraps ? 'Ukryj Sidła' : 'Podejrzyj Sidła'}
        </button>
      )}
      {trapSecrecy && humanTurn && game.battle?.stage === 'fight' && viewer && Object.values(game.battle.units).some((u) => u.side === viewer && u.status.mirage) && (
        <button className="btn plate parch btn-bar" data-peek-mirages aria-pressed={peekTraps} title="Własne miraże widać tylko w twojej turze, po kliknięciu: inni gracze niech nie patrzą" onClick={() => setPeekTraps((v) => !v)}>
          {peekTraps ? 'Ukryj miraże' : 'Podejrzyj miraże'}
        </button>
      )}
      {humanTurn && game.players.some((p) => p.child) && (
        <button className="btn plate parch btn-bar" title="Podpowiedź: co zrobiłby komputer" onClick={showHint}>
          💡 Podpowiedź
        </button>
      )}
      {undoStack.current.length > 0 && humanTurn && (
        <button className="btn plate parch btn-bar" title="Cofnij ostatni krok (U)" onClick={undo}>
          ↶ Cofnij
        </button>
      )}
      {isOnline && (
        <button className="btn plate parch" title={unread ? `Czat z graczami — nowe wiadomości: ${unread}` : 'Czat z graczami'} style={{ padding: '6px 12px', fontSize: 15, position: 'relative' }} onClick={() => setShowChat(true)}>
          Czat
          {unread > 0 && (
            <span aria-label={`nowe wiadomości: ${unread}`} style={{ position: 'absolute', top: -8, right: -8, minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10, background: '#B0262B', color: '#FFF', fontSize: 13, fontWeight: 800, lineHeight: '20px', boxShadow: '0 0 0 2px #1E1204' }}>
              {unread}
            </span>
          )}
        </button>
      )}
      {!isOnline && (actor.kind === 'bot' || actor.kind === 'automaton') && (
        <button className="btn plate parch btn-bar" title="Przewiń ruchy botów (F)" onClick={fastForward}>
          ⏩ Przewiń
        </button>
      )}
      <button className="btn plate parch hide-mobile btn-bar" title="Zasady i karty (R)" onClick={() => setShowRules(true)}>Zasady</button>
      <button className="btn plate parch btn-bar" title="Opcje (O)" onClick={() => setShowDebug(true)}>Opcje</button>
      <button className="btn plate parch btn-bar" title="Opisz błąd — zapisze się razem z partią (B)" onClick={() => setShowReport(true)}>Zgłoś błąd</button>
    </div>
  );

  const adventureFooter = (
    <Frame className="bar adv-bar sticky-mobile" style={{ height: 70 }} innerStyle={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 18px' }}>
      <button className="btn prim show-mobile" disabled={!(humanTurn && game.phase === 'adventure' && !steps.length)} style={{ height: 44, padding: '0 16px', alignItems: 'center', gap: 8, fontSize: 18 }} onClick={() => humanAction({ type: 'endTurn' })}>
        <Medal fill="mGreen" glyph="gHourglass" size={28} />
        Zakończ turę
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}>
        {game.control ? (
          <>Punkty <b style={{ color: '#F3D27A' }}>{controlCounts(game).dawn}</b>:<b style={{ color: '#F08A7A' }}>{controlCounts(game).horde}</b></>
        ) : game.survival ? (
          <>Przetrwane rundy <b style={{ color: '#F3D27A' }}>{Math.min(game.round - 1, game.survival.rounds)}/{game.survival.rounds}</b></>
        ) : objectiveOf(game) !== 'crystals' ? (
          <>{OBJECTIVES[objectiveOf(game)].progress(game)[0]?.label} <b style={{ color: '#F3D27A' }}>{OBJECTIVES[objectiveOf(game)].progress(game)[0]?.value}</b></>
        ) : (
          <><img src={asset('ui/ico_krysztal.png')} alt="" style={{ width: 'min(32px, 94vw)' }} /> Kryształy <b style={{ color: '#F3D27A' }}>{game.factions.dawn.delivered}/{game.crystalsNeeded}</b></>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}>
        <Medal fill="mGreen" glyph="gHourglass" size={32} /> Runda <b style={{ color: roundWarning(game.round, game.roundLimit)?.color ?? '#F3D27A' }}>{game.round}/{game.roundLimit}</b>
        {/* Phones have no round track on the map: the warning stands by this counter. */}
        {roundWarning(game.round, game.roundLimit) && <b className="show-mobile" style={{ color: roundWarning(game.round, game.roundLimit)!.color }}>{roundWarning(game.round, game.roundLimit)!.text}</b>}
      </div>
      <div className="hide-mobile" data-turn-label style={{ display: 'flex', flexDirection: 'column', width: 240, lineHeight: 1.15, minWidth: 0 }}>{turnBanner(game, actor)}</div>
      <div className="footer-slot" style={{ flex: 1, minWidth: 0 }}>{footer}</div>
    </Frame>
  );

  const b = game.battle;
  const selecting = b && b.stage === 'select' && humanTurn && actor.kind === 'human' ? actor.faction : null;
  const gearing = b && b.stage === 'gear' && game.draft?.gear && humanTurn && actor.kind === 'human' ? actor.faction : null;
  const spelling = b && b.stage === 'spells' && game.draft?.spells && humanTurn && actor.kind === 'human' ? actor.faction : null;
  const drafting = b && b.stage === 'draft' && game.draft && humanTurn && actor.kind === 'human' ? actor.faction : null;
  // Two people at one screen: each side's cards stay covered until that side uncovers them.
  const bothHuman = game.setup.mode === 'arena' && game.players.every(atThisScreen);
  const campaignRun = scenarioOf(game.setup);
  const trainingRun = trainingOf(game.setup);
  const coachIndex = trainingRun ? (trainIdx.current = trainingIndex(trainingRun, game, trainIdx.current)) : 0;
  const coachTarget = trainingRun && !coachOff && !held && humanTurn ? (trainingRun.steps[coachIndex]?.target?.(game) ?? null) : null;
  const summaryOpen = summary !== null && game.lastBattle?.id === summary;
  const arenaPrep = !held && game.setup.mode === 'arena' && (game.phase === 'over' || (b && (b.stage === 'gear' || b.stage === 'spells' || b.stage === 'select' || b.stage === 'draft')));

  // 3D figures only exist in the board edition: the views below ask `figureFor` while they render.
  setFiguresEdition(!isDigital(game.rules));
  return (
    <DigitalCardsContext.Provider value={isDigital(game.rules)}>
    <ArenaCardsContext.Provider value={game.setup.mode === 'arena' ? (game.rules.arenaSize === 6 ? 6 : 3) : false}>
    <DigitalContext.Provider value={isDigital(game.rules)}>
    <StatScaleContext.Provider value={game.rules.statScale ?? 1}>
    <HpScaleContext.Provider value={game.rules.hpScale ?? null}>
    <HeroLevelsContext.Provider value={heroLevels}>
      <AppChrome error={error} onDismissError={() => setError(null)} showRules={showRules} onCloseRules={() => setShowRules(false)} />
      {overlay}
      {DEV_TOOLS_ALLOWED && devOpen && game && !isOnline && (
        <DevPanel game={game} onClose={() => setDevOpen(false)} onChange={(g) => { gameRef.current = g; setGame(g); }} />
      )}
      {isOnline && onlineRoom?.waiting && <WaitingBanner room={onlineRoom} canHand={mySeats.size > 0} onHand={(seat) => session!.send({ type: 'handToBot', seat })} />}
      {isOnline && online?.reconnecting && (
        <div className="plate parch" role="status" style={{ position: 'fixed', left: '50%', top: 18, transform: 'translateX(-50%)', padding: '8px 16px', zIndex: 81, fontWeight: 700 }}>
          Utracono połączenie z serwerem — łączę ponownie…
        </div>
      )}
      <Modal open={showChat && isOnline} onClose={() => setShowChat(false)}>
        {showChat && online && session && (
          <Frame crest style={{ width: 'min(460px, 94vw)' }} innerStyle={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ChatBox title="Czat pokoju" messages={online.chat} onSend={(text) => session.send({ type: 'chat', text })} />
            <button className="btn plate parch" data-enter style={{ padding: '6px 16px', alignSelf: 'flex-end' }} onClick={() => setShowChat(false)}>Zamknij</button>
          </Frame>
        )}
      </Modal>
      {game.phase === 'battle' && b?.duel && b.stage !== 'select' && <DuelView state={game} canAct={humanTurn} onAction={dispatch} footer={footer} />}
      {arenaPrep ? (
        <ArenaPrep state={game} />
      ) : held || (game.phase === 'battle' && b && !b.duel && b.stage !== 'select') ? (
        <BattleView state={battleShown} attack={held?.attack ?? null} canAct={humanTurn && !held} onAction={dispatch} onShowCard={setCard} footer={footer} />
      ) : (
        <AdventureView state={mapShown!} loot={lootFloats} mapFx={mapFxs} hintHex={hintNow?.hex ?? (coachTarget && 'hex' in coachTarget ? coachTarget.hex : null)} viewer={viewer} canAct={humanTurn && game.phase === 'adventure' && !steps.length && !reportPending} onAction={humanAction} onPath={walk} onShowCard={setCard} onSettlementRace={setTownRace} footer={adventureFooter} />
      )}

      <Modal open={Boolean(selecting)}>{selecting && <SupportSelect state={game} faction={selecting} onPick={(ids) => dispatch({ type: 'selectSupports', faction: selecting, supportIds: ids })} />}</Modal>
      <Modal open={Boolean(gearing)}>{gearing && <GearDialog key={`${gearing}-${game.draft!.gear!.order.length}`} state={game} faction={gearing} onPick={(artifactId) => dispatch({ type: 'pickGear', faction: gearing, artifactId })} />}</Modal>
      <Modal open={Boolean(spelling)}>{spelling && <SpellPickDialog state={game} key={`${spelling}-${game.draft!.spells!.order.length}`} faction={spelling} onPick={(spells) => dispatch({ type: 'pickSpells', faction: spelling, spells })} />}</Modal>
      <Modal open={Boolean(drafting)}>
        {drafting && (
          <DraftDialog
            key={`${drafting}-${game.draft!.order.length}`}
            state={game}
            faction={drafting}
            covered={bothHuman && draftRevealed !== drafting}
            onReveal={() => setDraftRevealed(drafting)}
            onPick={(kind) => dispatch({ type: 'draftPick', faction: drafting, kind })}
          />
        )}
      </Modal>

      {needsHandoff && actor.kind === 'human' && (
        <Handoff state={game} playerId={actor.playerId} onConfirm={() => setConfirmedFaction(actor.faction)} />
      )}
      {trapVeil && actor.kind === 'human' && (
        <Handoff state={game} playerId={actor.playerId} note={raceOf(game, actor.faction) === 'sands' ? `Pozostali gracze, odwróćcie wzrok. Na ekranie pojawi się ustawianie mirażów i zakopanej Królowej: ${FACTION_NAMES[raceOf(game, actor.faction)]}.` : `Pozostali gracze, odwróćcie wzrok. Na ekranie pojawi się ustawianie ukrytych Sideł: ${FACTION_NAMES[raceOf(game, actor.faction)]}.`} onConfirm={() => setTrapsUncovered(actor.faction)} />
      )}

      <TreasureDialog hero={humanTurn && !held && !reportPending && game.phase === 'adventure' && !steps.length && !activeHero(game)?.offer ? activeHero(game) : null} onChoose={(kind) => dispatch({ type: 'chooseTreasure', kind })} />
      <SkillDialog hero={humanTurn && !held && !reportPending && game.phase === 'adventure' && !steps.length ? activeHero(game) : null} earned={game.log.flatMap((e) => (e.event?.type === 'xp' && e.event.heroId === activeHero(game)?.id ? [`+${e.event.amount} PD (${e.event.reason})`] : [])).slice(-4)} onChoose={(skill) => dispatch({ type: 'chooseSkill', skill })} />
      {hintNow && (
        <div className="plate parch" role="status" style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 50, padding: '8px 16px', fontSize: 18, maxWidth: 'min(640px, 92vw)', cursor: 'pointer' }} onClick={() => setHint(null)}>
          💡 <StatText text={hintNow.text} />
        </div>
      )}
      {trainingRun && !coachOff && game.phase !== 'over' && !held && <TrainingCoach training={trainingRun} index={coachIndex} shake={coachShake} onSkip={() => setCoachOff(true)} />}
      <VictoryEffects game={game} show={!held && !reportPending} />
      <RotatePrompt />
      <FoundTreasure kind={found} open={Boolean(found) && !summary && !held} onClose={() => setFound(null)} />

      <div className="xp-toasts" aria-live="polite">
        {xpNotes.map((n) => (
          <div key={n.key} className="xp-toast">{n.text.includes(' PD') ? <>{n.text.split(' PD')[0]}<XpIcon size={22} />{n.text.split(' PD').slice(1).join(' PD')}</> : <StatText text={n.text} />}</div>
        ))}
      </div>
      <Modal open={storyNews.length > 0 && !summary && !held && !found} onClose={() => setStoryNews((a) => a.slice(1))}>
        {storyNews[0] && (
          <Frame crest style={{ width: 'min(560px, 94vw)' }} innerStyle={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {storyNews[0].title && <Ribbon style={{ width: 'min(420px, 90vw)' }}>{storyNews[0].title}</Ribbon>}
            <div data-story style={{ fontSize: 19, lineHeight: 1.45, whiteSpace: 'pre-line' }}>{storyNews[0].text}</div>
            <button className="btn prim" data-enter style={{ padding: '6px 28px', fontSize: 20 }} onClick={() => setStoryNews((a) => a.slice(1))}>Dalej</button>
          </Frame>
        )}
      </Modal>
      <Modal open={artifactNews.length > 0 && !summary && !held && !found} onClose={() => setArtifactNews((a) => a.slice(1))}>
        {artifactNews[0] && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Ribbon style={{ width: 'min(380px, 90vw)' }}>Artefakt!</Ribbon>
            <ArtifactFound event={artifactNews[0]} faction={raceOf(game, game.heroes[artifactNews[0].heroId]?.faction ?? 'dawn')} />
            <button className="btn prim" style={{ padding: '6px 28px', fontSize: 20 }} onClick={() => setArtifactNews((a) => a.slice(1))}>Rozumiem</button>
          </div>
        )}
      </Modal>

      <Modal open={game.phase === 'over' && !held && !reportPending}>
        {campaignRun ? <CampaignOver state={game} onStart={start} onMenu={leaveGame} /> : trainingRun ? <TrainingOver state={game} onStart={start} onMenu={leaveGame} onList={leaveGame} /> : game.setup.expedition ? <ExpeditionOver state={game} onStart={start} onMenu={leaveGame} /> : <GameOver state={game} online={isOnline} rankingNote={rankingNote} onNew={leaveGame} onLog={() => setShowLog(true)} />}
      </Modal>

      <CardDialog card={card} onClose={() => setCard(null)} />

      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      {game && (
        <LeaveDialog
          open={showLeave}
          canSave={(!isOnline || isOnlineOwner) && !game.setup.expedition}
          note={game.setup.expedition && game.phase !== 'over' ? (game.setup.expedition.daily ? 'Wyjście z wyprawy dnia kończy ją: liczą się etapy przebyte do tej pory.' : 'Bitwa Ekspedycji zapisuje się sama: wrócisz do niej z ekranu wyprawy.') : undefined}
          defaultName={defaultSaveName}
          onClose={() => setShowLeave(false)}
          onLeave={() => {
            setShowLeave(false);
            leaveGame();
          }}
          onSaveAndLeave={(name) => {
            if (isOnline) session!.send({ type: 'saveGame', name });
            else saveNamed(name, saveFile(game));
            setShowLeave(false);
            leaveGame();
          }}
        />
      )}

      <Modal open={summaryOpen && !held} onClose={() => setSummary(null)}>
        {game.lastBattle && <BattleSummary report={game.lastBattle} name={(s) => sideName(game, s)} faction={(s) => teamFaction(game, s)} onClose={() => setSummary(null)} />}
      </Modal>

      <Tutorial state={game} active={humanTurn && !needsHandoff && !summary && !confirm && !held && !trainingRun} />

      <Modal open={showLog} onClose={() => setShowLog(false)}>
        <LogDialog entries={visibleLog} />
      </Modal>


      <Modal open={showReport} onClose={() => setShowReport(false)}>
        {showReport && (
          <BugReportDialog
            game={game}
            save={saveFile(game)}
            onSaved={(r) => {
              reports.current = [...reports.current, r];
              // An online game lives on the server: no local save of it (it would replace the local game's).
              if (isOnline) return;
              writeAutosave(game.phase === 'over' ? null : saveFile(game));
              recordGame(saveFile(game), game);
            }}
            onClose={() => setShowReport(false)}
            roomCode={isOnline ? onlineRoom?.code : undefined}
          />
        )}
      </Modal>

      <OptionsDialog
        open={showDebug}
        onClose={() => setShowDebug(false)}
        game={game}
        room={isOnline ? onlineRoom ?? null : null}
        isOwner={Boolean(isOnline && onlineRoom && onlineRoom.ownerId === online?.user.id)}
        onRoomSpeed={(s) => session!.send({ type: 'botSpeed', speed: s })}
        speed={speed}
        onSpeed={setSpeed}
        autoplay={autoplay}
        onAutoplay={setAutoplay}
        figures={figures}
        onFigures={(on) => {
          setFiguresOn(on);
          setFigures(on);
        }}
        onRules={() => {
          setShowDebug(false);
          setShowRules(true);
        }}
        onLog={() => {
          setShowDebug(false);
          setShowLog(true);
        }}
        defaultSaveName={defaultSaveName}
        onSaveGame={isOnline ? (isOnlineOwner ? (name) => session!.send({ type: 'saveGame', name }) : undefined) : game.setup.expedition ? undefined : (name) => saveNamed(name, saveFile(game))}
        onLeave={() => {
          setShowDebug(false);
          setShowLeave(true);
        }}
      />
    </HeroLevelsContext.Provider>
    </HpScaleContext.Provider>
    </StatScaleContext.Provider>
    </DigitalContext.Provider>
    </ArenaCardsContext.Provider>
    </DigitalCardsContext.Provider>
  );
}

/** "Tura: Gracz 1" in the colour of the side and the faction under it, big enough to read from across the table. */
function turnBanner(game: GameState, actor: ReturnType<typeof currentActor>) {
  if (actor.kind === 'none' || actor.kind === 'automaton') return <span style={{ fontSize: 16, color: 'var(--muted)', fontStyle: 'italic' }}>{turnLabel(game, actor)}</span>;
  const p = game.players.find((x) => x.id === actor.playerId);
  const color = ({ dawn: '#9AE0A8', horde: '#F08A7A', third: '#E8B04A', fourth: '#B58CE8' } as Record<string, string>)[actor.faction] ?? '#F3D27A';
  return (
    <>
      <span style={{ fontSize: 19, fontWeight: 800, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p?.name}>Tura: {p?.name ?? ''}{actor.kind === 'bot' ? ' (bot)' : ''}</span>
      <span style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>{sideName(game, actor.faction)}</span>
    </>
  );
}

function turnLabel(game: GameState, actor: ReturnType<typeof currentActor>): string {
  if (actor.kind === 'none') return 'Koniec gry';
  if (actor.kind === 'automaton') return 'Ruch automatu zła…';
  const p = game.players.find((x) => x.id === actor.playerId);
  return `${p?.name ?? ''}${actor.kind === 'bot' ? ' (bot)' : ''} — ${sideName(game, actor.faction)}`;
}

function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function SupportSelect({ state, faction, onPick }: { state: GameState; faction: TeamId; onPick: (ids: string[]) => void }) {
  const pool = state.factions[faction].supportsAlive;
  const [picked, setPicked] = useState<string[]>([]);
  // Two supports in the other levels; the team's places in level 3.
  const n = Math.min(supportSlots(state, faction), pool.length);
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id].slice(-n));
  // A phone held sideways is lower than the cards: they shrink to the height that is left under the title and above the button (a card is about 1.5 times as tall as wide).
  const low = useMedia('(max-height: 560px)');
  const cardW = low ? Math.max(90, Math.min(200, (window.innerHeight - 175) / 1.5)) : Math.min(200, (window.innerWidth - 120) / 2);
  return (
    <div>
      <Frame crest={!low} style={{ width: 'min(760px, 94vw)' }} innerStyle={{ padding: low ? '8px 18px' : 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: low ? 8 : 14 }}>
        <Ribbon side={teamFaction(state, faction)} style={{ width: 'min(420px, 94vw)' }}>{n === 2 ? 'Wybierz dwóch pomocników' : `Wybierz pomocników do bitwy (${n})`}</Ribbon>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {pool.map((id) => (
            <button key={id} className="btn" onClick={() => toggle(id)} style={{ background: 'none', border: 0, padding: 4, borderRadius: 12, boxShadow: picked.includes(id) ? '0 0 0 3px #9EE4FF, 0 0 16px 4px rgba(158,228,255,0.6)' : 'none' }}>
              <UnitCard unitId={id} width={cardW} />
            </button>
          ))}
        </div>
        <button className="btn prim btn-big" data-enter disabled={picked.length !== n} onClick={() => onPick(picked)}>
          Do bitwy!
        </button>
      </Frame>
    </div>
  );
}

function Handoff({ state, playerId, note, onConfirm }: { state: GameState; playerId: string; note?: string; onConfirm: () => void }) {
  const player = state.players.find((p) => p.id === playerId)!;
  const hero = Object.values(state.heroes).find((h) => h.playerId === playerId && h.alive) ?? Object.values(state.heroes).find((h) => h.playerId === playerId)!;
  return (
    <div className="overlay slate" style={{ background: undefined }}>
      <img src={asset('ui/landscape.jpg')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 220px 80px rgba(4,8,10,0.92)' }} />
      {[-1, 1].map((d) => (
        <svg key={d} className="hide-mobile" aria-hidden="true" width="120" height="120" viewBox="0 0 60 60" style={{ position: 'absolute', top: -6, left: `calc(50% + ${d * 360}px - 48px)`, filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.7))' }}>
          <image href={asset(`cards/crests/${raceOf(state, player.faction)}.png`)} x="0" y="0" width="60" height="60" />
        </svg>
      ))}
      <Frame crest style={{ width: 'min(480px, 94vw)' }} innerStyle={{ padding: '26px 30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
        <div className="lbl">Runda {state.round}</div>
        <Ribbon side={teamFaction(state, player.faction)} style={{ width: 340, height: 48 }}>Przekaż urządzenie</Ribbon>
        <Portrait unitId={hero.id} size={124} ring={FACTION_RING[raceOf(state, player.faction)]} glow="0 0 0 2px #1E1204, 0 0 34px 10px rgba(158,228,255,0.28)" />
        <div>
          <div style={{ fontSize: 18, color: 'var(--muted)' }}>Teraz tura</div>
          <div style={{ fontWeight: 800, fontSize: 28, color: '#F3D27A', textShadow: '0 2px 0 #1E1204' }}>{player.name} — {heroLabel(hero)}</div>
        </div>
        <div style={{ fontSize: 18, lineHeight: 1.35, maxWidth: 360 }}>{note ?? `Pozostali gracze, odwróćcie wzrok. Na ekranie pojawią się ukryte skarby frakcji: ${FACTION_NAMES[raceOf(state, player.faction)]}.`}</div>
        <button className="btn prim" style={{ height: 54, padding: '0 26px', fontSize: 20, marginTop: 6 }} onClick={onConfirm}>
          Jestem {player.name} — pokaż turę
        </button>
      </Frame>
    </div>
  );
}

/** The name of a side: its race, numbered for the third and fourth side so two sides of one race can be told apart. */
const teamLabel = (state: GameState, t: TeamId) => `${FACTION_NAMES[raceOf(state, t)]}${t === 'third' ? ' (3)' : t === 'fourth' ? ' (4)' : ''}`;

function GameOver({ state, online, rankingNote, onNew, onLog }: { state: GameState; online: boolean; rankingNote: string | null; onNew: () => void; onLog: () => void }) {
  const s = state.stats;
  /** With more than two sides the figures are given in the order of the sides; with two it is "Świtu / Hordy" as before. */
  const many = teamsOf(state).length > 2;
  return (
    <div className={state.winner === 'horde' ? 'quake' : undefined}>
      <Frame crest style={{ width: 'min(620px, 94vw)' }} innerStyle={{ padding: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        {state.winner && (
          <img data-winner-crest={state.winner} src={asset(`cards/crests/${state.winner === 'neutral' ? 'neutral' : raceOf(state, state.winner)}.png`)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }}
            style={{ display: 'block', width: 'min(150px, 22vh)', height: 'min(150px, 22vh)', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))', marginBottom: -4 }} />
        )}
        <Ribbon side={teamFaction(state, state.winner)} style={{ width: 460, height: 50 }}>{state.winner ? `Wygrywa: ${state.winner === 'neutral' ? FACTION_NAMES.neutral : teamLabel(state, state.winner)}` : 'Remis'}</Ribbon>
        <div style={{ fontSize: 20 }}>{state.endReason}</div>
        {state.setup.mode === 'arena' ? (
          <div className="well" style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px 24px', fontSize: 17, textAlign: 'left', width: '100%' }}>
            <span>Rundy bitwy</span><b>{state.lastBattle?.rounds ?? 0}</b>
            {(['dawn', 'horde'] as TeamId[]).map((f) => (
              <Fragment key={f}>
                <span>Ocaleli: {FACTION_NAMES[raceOf(state, f)]}</span>
                <b>{state.lastBattle ? state.lastBattle.units.filter((u) => u.side === f && u.alive).map((u) => UNITS[u.defId].name).join(', ') || '—' : '—'}</b>
              </Fragment>
            ))}
          </div>
        ) : (
        <div className="well" style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px 24px', fontSize: 17, textAlign: 'left', width: '100%' }}>
          <span>Rundy</span><b>{state.round}</b>
          <span>Bitwy (w tym ze strażnikami)</span><b>{s.battles} ({s.neutralBattles})</b>
          <span>{many ? 'Polegli bohaterowie (strony po kolei)' : 'Polegli bohaterowie Świtu / Hordy'}</span><b>{teamsOf(state).map((t) => s.heroDeaths[t]).join(' / ')}</b>
          <span>{many ? 'Polegli pomocnicy (strony po kolei)' : 'Polegli pomocnicy Świtu / Hordy'}</span><b>{teamsOf(state).map((t) => s.supportDeaths[t]).join(' / ')}</b>
          <span>{many ? 'Znalezione skarby (strony po kolei)' : 'Znalezione skarby Świtu / Hordy'}</span><b>{teamsOf(state).map((t) => s.treasuresCollected[t]).join(' / ')}</b>
          {state.control ? <><span>{many ? 'Punkty kontrolne (strony po kolei)' : 'Punkty kontrolne (Świt / Horda)'}</span><b>{teamsOf(state).map((t) => controlCounts(state)[t]).join(' / ')}</b></> : objectiveOf(state) !== 'crystals' ? <><span>{OBJECTIVES[objectiveOf(state)].progress(state)[0]?.label}</span><b>{OBJECTIVES[objectiveOf(state)].progress(state)[0]?.value}</b></> : <><span>Kryształy przy Drzewie</span><b>{state.factions.dawn.delivered} / {state.crystalsNeeded}</b></>}
        </div>
        )}
        {rankingNote && <div style={{ fontSize: 17, color: '#F3D27A' }}>{rankingNote}</div>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn plate parch btn-wide" onClick={onLog}>Dziennik</button>
          <button className="btn prim" style={{ padding: '8px 22px', fontSize: 20 }} onClick={onNew}>{online ? 'Wyjdź z pokoju' : 'Nowa gra'}</button>
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
  // A block body on purpose: newer Chromium returns a Promise from scrollIntoView(), and an effect
  // must return nothing or a cleanup function (React would call the Promise and crash on close).
  useEffect(() => {
    end.current?.scrollIntoView();
  }, []);
  return (
    <div>
      <Frame style={{ width: 'min(720px, 94vw)', height: '80vh' }} innerStyle={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Ribbon>Dziennik zdarzeń</Ribbon>
        <div className="scroll" style={{ flex: 1 }}>
          {entries.map((l, i) => (
            <div key={i} className={`log-line ${l.kind}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '2px 0' }}>
              <Medal fill={LOG_ICON[l.kind][0]} glyph={LOG_ICON[l.kind][1]} size={20} />
              <span style={{ color: '#9FB8BC', flex: 'none' }}>[{l.round}]</span>
              <span><StatText text={l.text} /></span>
            </div>
          ))}
          <div ref={end} />
        </div>
      </Frame>
    </div>
  );
}

/** The online session's state, re-rendered on every server message (null when not logged in). */
/** A disconnected player whose turn it is: the countdown to the bot taking over, and "Oddaj botowi". */
function WaitingBanner({ room, canHand, onHand }: { room: NonNullable<OnlineState['room']>; canHand: boolean; onHand: (seat: number) => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const waiting = room.waiting!;
  const left = Math.max(0, Math.ceil((waiting.until - now) / 1000));
  const nick = room.seats[waiting.seat]?.player?.nick ?? 'gracza';
  return (
    <div className="plate parch" role="status" style={{ position: 'fixed', left: '50%', top: 18, transform: 'translateX(-50%)', padding: '8px 16px', zIndex: 80, display: 'flex', gap: 14, alignItems: 'center', fontSize: 17 }}>
      <span>
        Czekamy na <b>{nick}</b> — bot przejmie za {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </span>
      {canHand && (
        <button className="btn prim" style={{ padding: '4px 14px', fontSize: 16 }} onClick={() => onHand(waiting.seat)}>
          Oddaj botowi
        </button>
      )}
    </div>
  );
}

const OFFLINE_KEY = 'skd-play-offline';

/** The player chose "Graj bez konta": the game starts at the local setup screen, without asking again. */
function playsOffline(): boolean {
  try {
    return localStorage.getItem(OFFLINE_KEY) === '1';
  } catch {
    return false;
  }
}

function setPlaysOffline(on: boolean) {
  try {
    if (on) localStorage.setItem(OFFLINE_KEY, '1');
    else localStorage.removeItem(OFFLINE_KEY);
  } catch {
    // No storage: the choice holds for this visit only.
  }
}

/** A phone held upright in a game: asks to turn it sideways (the map, the arena and the panels need the width). A small link plays on anyway. */
function RotatePrompt() {
  const upright = useMedia('(orientation: portrait) and (pointer: coarse) and (max-width: 700px)');
  const [ignored, setIgnored] = useState(false);
  // Where the browser allows it (Android in full screen), keep the screen sideways while the game is on.
  useEffect(() => {
    try {
      void (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape')?.catch(() => {});
    } catch {
      /* not supported: the prompt below does the job */
    }
    return () => {
      try { screen.orientation?.unlock?.(); } catch { /* ignore */ }
    };
  }, []);
  if (!upright || ignored) return null;
  return (
    <div className="rotate-prompt" role="alert" data-rotate-prompt>
      <svg aria-hidden="true" width="96" height="96" viewBox="0 0 96 96" className="rotate-icon">
        <rect x="30" y="12" width="36" height="64" rx="7" fill="none" stroke="#F3D27A" strokeWidth="4" />
        <circle cx="48" cy="68" r="3" fill="#F3D27A" />
        <path d="M70 30c10 6 14 16 12 26M82 56l-2-9m2 9l8-5" fill="none" stroke="#9EE4FF" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#F3D27A' }}>Obróć telefon poziomo</div>
      <div style={{ fontSize: 17 }}>Mapa i plansza bitwy potrzebują szerokiego ekranu: wszystko zmieści się bez przewijania.</div>
      <button className="btn plate parch" style={{ padding: '6px 16px', fontSize: 16 }} onClick={() => setIgnored(true)}>Graj w pionie</button>
    </div>
  );
}

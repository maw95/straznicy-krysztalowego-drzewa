// Diagnosis of the faction mechanics (no engine change): plays bot games like scripts/sim/nowe-frakcje.ts and, from the log, the battle state and
// counterfactual damage predictions on a cloned state, counts how often every intended mechanic fires and whether the bots use it.
// Usage: npx tsx scripts/sim/diagnoza.ts [games per cell = 200] [goals = control,conquest] [pairs = all | herds:dawn,... ] [out = .tmp/diagnoza.json]
//        npx tsx scripts/sim/diagnoza.ts --report .tmp/diagnoza.json     (prints the tables as markdown)
// Counter keys: `<class>|<race>|<metric>` per battle class (pvp = hero vs hero, siege = settlement garrison, neutral = guardians) and `g|<race>|...` per game.
// Env SIM_TIMEOUT_S (default 170) stops a shard politely; SIM_OVERRIDE is inherited (see override.ts).
import { fork } from 'node:child_process';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import './override';
import { createGame, applyActionInPlace } from '../../src/engine/game';
import { chooseAction } from '../../src/engine/ai';
import { FACTION_HEROES, UNITS } from '../../src/engine/data';
import { assignSlots, raceOf } from '../../src/engine/teams';
import { DEFAULT_RULES, type SetupOptions } from '../../src/engine/types';
import { abilityOf, inFormation, plannedPush, predictDamage, shieldLevel, UNLIMITED_ABILITIES } from '../../src/engine/battle';
import { mechanicLevel } from '../../src/engine/empire';
import { manaOf } from '../../src/engine/magic';
import { FACTION_PACKS } from '../../src/engine/factions';
import { distance, parseKey } from '../../src/engine/hex';

type Race = 'dawn' | 'horde' | 'herds' | 'undead' | 'clans' | 'frost' | 'free';
const RACES: Race[] = ['dawn', 'horde', 'herds', 'undead', 'clans', 'frost', 'free'];
const allPairs = (): string[] => RACES.flatMap((a, i) => RACES.slice(i + 1).map((b) => `${a}:${b}`));
const MECH_BUILDING: Record<string, string> = { dawn: 'shrine', horde: 'bloodPit', herds: 'hoofStone', undead: 'barrow', clans: 'shieldHall', frost: 'frostPalace', free: 'trapWorkshop' };

const mk = (races: Race[], objective: any, seed: number, size: any, shape: any): SetupOptions => {
  const slots = assignSlots(races as any);
  return { mode: 'pvp', mapSize: size, battleMode: 'arena', seed, mapShape: shape, seats: races.map((race, i) => ({ name: race + i, faction: slots[i], race: race as any, controller: 'bot' as const, heroId: (FACTION_HEROES as any)[race][seed % 3] })), rules: { ...DEFAULT_RULES, ruleset: 'digital', heroGrowth: true, kingdom: true, economy: true, realm: true, empire: true, objective } };
};

// ---------------------------------------------------------------- one game with counters
const NAME_RACE = new Map<string, string>();
for (const d of Object.values(UNITS) as any[]) NAME_RACE.set(d.name, NAME_RACE.has(d.name) && NAME_RACE.get(d.name) !== d.side ? '?' : d.side);

type Counters = Record<string, number>;
const rsd = (s: any, side: string) => (side === 'neutral' ? 'neutral' : String(raceOf(s, side as any)));

function playGame(s: any, C: Counters) {
  const add = (k: string, n = 1) => { C[k] = (C[k] ?? 0) + n; };
  let li = s.log.length;
  let tr: null | { b: any; cls: string; races: string[]; started: boolean; limit: boolean; actKey: string; trapsAtStart: number; ice: number } = null;
  const firstSeen: Record<string, number> = {};
  const t0 = Date.now();
  let actions = 0;

  const ownerOf = (_cls: string, targetRace: string): string | null => {
    const o = tr!.races.filter((r) => r !== targetRace && r !== 'neutral');
    return o.length ? o[0] : null;
  };
  const K = (race: string | null, m: string) => `${tr!.cls}|${race}|${m}`;

  function handleLine(text: string) {
    let m: RegExpMatchArray | null;
    const races = tr!.races;
    const has = (r: string) => races.includes(r);
    // Przymierze: Blask Świtu
    if ((m = text.match(/^(.+) odzyskuje (\d+) Ż \(Blask Świtu\)\.$/))) { add(K('dawn', 'heal'), +m[2]); add(K('dawn', 'healEvents')); return; }
    if (/^Żądza Krwi:/.test(text)) { add(K('horde', 'bloodlustFires')); return; }
    // Szron
    if ((m = text.match(/^(.+) dostaje szron \((\d+)\/(\d+)\)\.$/))) { const o = ownerOf(tr!.cls, NAME_RACE.get(m[1]) ?? '?'); if (o) { add(K(o, 'frostPut')); add(K(o, `frostThr${m[3]}`)); } return; }
    if ((m = text.match(/^(.+) zamarza i traci następną aktywację\.$/))) { const o = ownerOf(tr!.cls, NAME_RACE.get(m[1]) ?? '?'); if (o) add(K(o, 'freezes')); return; }
    if (/^Lód na .+ pęka\.$/.test(text)) { add(K('frost', 'brittleBreaks')); return; }
    if (/ wznosi ścianę z lodu /.test(text)) { add(K('frost', 'iceWalls')); return; }
    if (/ zostaje uniesiony i postawiony /.test(text)) { add(K('frost', 'abductions')); return; }
    if (/ zapada długa noc\./.test(text)) { add(K('frost', 'longNight')); return; }
    if ((m = text.match(/^(.+) jest ogłuszony i traci aktywację\.$/))) { const r = NAME_RACE.get(m[1]) ?? '?'; add(K(r, 'lostActivationStun')); return; }
    // Stada: pushes and collisions
    if ((m = text.match(/^(.+) zostaje odepchnięty \(pól: (\d+); (.+)\)\.$/))) { const o = ownerOf(tr!.cls, NAME_RACE.get(m[1]) ?? '?'); if (o) { add(K(o, 'pushes')); add(K(o, `push:${m[3]}`)); add(K(o, 'pushCells'), +m[2]); } return; }
    if ((m = text.match(/^(.+) uderza (w krawędź areny|w głaz|w jednostkę .*): zderzenie \((.+)\)\.$/))) { const o = ownerOf(tr!.cls, NAME_RACE.get(m[1]) ?? '?'); if (o) { add(K(o, 'collisions')); add(K(o, `collisionInto:${m[2].startsWith('w jednostkę') ? 'unit' : m[2]}`)); } return; }
    if ((m = text.match(/^(.+) stoi niewzruszenie \((.+)\)\.$/))) { const r = NAME_RACE.get(m[1]) ?? '?'; add(K(r, 'pushAvoided')); add(K(r, `pushAvoided:${m[2]}`)); return; }
    // Umarli
    if ((m = text.match(/^(.+) wstaje \(Ż \d+\/\d+; (.+)\)\.$/))) { const r = NAME_RACE.get(m[1]) ?? '?'; add(K(r, m[2] === 'Wieczna Warta' ? 'wardRises' : 'otherRises')); return; }
    if ((m = text.match(/\(wróg traci (\d+) many\)/))) { add(K('undead', 'manaDrained'), +m[1]); add(K('undead', 'manaDrainEvents')); return; }
    if ((m = text.match(/^Bohater wroga traci (\d+) many/))) { add(K('undead', 'manaDrainedOther'), +m[1]); return; }
    // Kompanie
    if ((m = text.match(/^(.+) wpada w sidła!$/))) {
      const victimRace = NAME_RACE.get(m[1]) ?? '?'; const o = ownerOf(tr!.cls, victimRace) ?? 'free';
      add(K(o, 'trapHits')); const d: any = Object.values(UNITS).find((x: any) => x.name === m![1]);
      if (d) { add(K(o, `trapHit:${d.kind}`)); add(K(o, `trapHit:${d.attackType}`)); }
      add(K(o, `trapHitRound${Math.min(tr!.b.round, 5)}`)); return;
    }
    if (/\(sidła\)\.$/.test(text)) { add(K('free', 'trapHolds')); return; }
    if (/jest oznaczony do końca rundy/.test(text)) { add(K('free', 'marks')); return; }
    if (/odsłania ukryte ślady/.test(text)) { add(K('free', 'reveals')); return; }
    if (/wychodzi z ukrycia/.test(text)) { add(K('free', 'unveils')); return; }
    if (/podkrada \d+ zł/.test(text)) { add(K('free', 'pickpocket')); return; }
    if (/wieżyczka strzela/.test(text)) { add(K('free', 'towerShots')); return; }
    // damage lines with a named source
    if ((m = text.match(/^(.+) → (.+): (\d+) obrażeń \(Ż/))) {
      const src = m[1], dmg = +m[3], victim = m[2];
      if (src === 'Sidła') { add(K('free', 'trapDamage'), dmg); return; }
      if (/^Zderzenie \(/.test(src)) { const vr = NAME_RACE.get(victim) ?? '?'; if (has('herds')) { add(K('herds', 'collisionDamage'), dmg); if (vr === 'herds') add(K('herds', 'collisionSelfDamage'), dmg); } return; }
      if (/^Mur Tarcz \(/.test(src)) { add(K('clans', 'thornsDamage'), dmg); return; }
      if (/^Riposta \(/.test(src)) { add(K('free', 'riposteDamage'), dmg); add(K('free', 'ripostes')); return; }
      if (/^Kolce \(/.test(src)) { add(K('?', 'quills'), dmg); return; }
    }
  }

  function startFight() {
    const b = tr!.b;
    tr!.started = true;
    for (const side of [b.attacker, b.defender] as string[]) {
      const r = rsd(s, side);
      if (r === 'neutral') continue;
      add(K(r, 'battles'));
      const lvl = mechanicLevel(s, side as any);
      add(K(r, `mechLvl${lvl}`));
      add(K(r, 'mechLvlSum'), lvl);
      const mine = Object.values(b.units).filter((u: any) => u.side === side) as any[];
      add(K(r, 'unitsStart'), mine.length);
      // traps laid by the Warsztat and the Iskra before the fight (the Fortel ones come later: `trapsLaidAll`)
      const traps = (b.ground ?? []).filter((x: any) => x.kind === 'trap' && x.owner === side);
      if (traps.length) add(K(r, 'trapsLaid'), traps.length);
      add(K(r, 'veiledStart'), mine.filter((u) => u.status?.veiled).length);
    }
  }

  function finalize() {
    const b = tr!.b;
    add(`${tr!.cls}|*|battles`);
    add(`${tr!.cls}|*|rounds`, b.round);
    if (b.round >= 2) add(`${tr!.cls}|*|roundsGE2`);
    add(`${tr!.cls}|*|end:${tr!.limit ? 'limit' : 'wipe'}`);
    const winnerRace = b.winner && b.winner !== 'draw' ? rsd(s, b.winner) : null;
    for (const side of [b.attacker, b.defender] as string[]) {
      const r = rsd(s, side);
      if (r === 'neutral') continue;
      if (winnerRace !== null && b.winner === side) add(K(r, 'bwin'));
      const dead = (Object.values(b.units) as any[]).filter((u) => u.side === side && !u.alive && !u.swappedOut).length;
      add(K(r, 'unitsLost'), dead);
      const left = (b.ground ?? []).filter((g: any) => g.kind === 'trap' && g.owner === side).length;
      if (left) add(K(r, 'trapsUnspent'), left);
      if (b.ward?.[side]) add(K(r, 'wardCount'), b.ward[side]);
      add(K(r, 'dmgDealt'), (Object.entries(b.damageBy ?? {}) as Array<[string, number]>).filter(([id]) => b.units[id]?.side === side).reduce((a, [, v]) => a + v, 0));
    }
    if (b.bloodlust) add(K('horde', 'bloodlustCount'), b.bloodlust);
    // bot ability use (once-per-battle abilities): present vs used
    for (const u of Object.values(b.units) as any[]) {
      if (u.swappedOut) continue;
      const def = UNITS[u.defId] as any;
      if (!def || def.side === 'neutral') continue;
      const once = !UNLIMITED_ABILITIES.includes(abilityOf(u));
      add(`ab|${tr!.cls}|${u.defId}|present`);
      if (once && u.abilityUsed) add(`ab|${tr!.cls}|${u.defId}|used`);
      if (u.alive) add(`ab|${tr!.cls}|${u.defId}|alive`);
    }
    tr = null;
  }

  function newActivation() {
    const b = tr!.b;
    if (b.stage !== 'fight' || !b.activation) return;
    const key = `${b.round}:${b.index}:${b.activation.unitId}`;
    if (key === tr!.actKey) return;
    tr!.actKey = key;
    const u = b.units[b.activation.unitId];
    if (!u) return;
    const r = rsd(s, u.side);
    if (r === 'clans') {
      const lvl = shieldLevel(s, u.side);
      if (lvl >= 1) { add(K('clans', 'activations')); if (inFormation(s, u)) add(K('clans', 'activationsInFormation')); }
    }
    if (r === 'herds' && UNITS[u.defId].attackType === 'melee') add(K('herds', 'meleeActivations'));
  }

  const logAndTrack = () => {
    // 1) lines belong to the battle that is tracked (also the one that has just ended)
    if (tr) for (; li < s.log.length; li++) { const e = s.log[li]; if (e.text.startsWith('Bitwa trwa zbyt długo')) tr.limit = true; handleLine(e.text); }
    else li = s.log.length;
  };

  // every trap object that ever lies on the arena counts once (laid at the deployment, by Fortel, Warsztat, Iskra); position at the moment it is first seen
  const seenTraps = new WeakSet<object>();
  function trapTrack() {
    const b = tr!.b;
    for (const g of (b.ground ?? []) as any[]) {
      if (g.kind !== 'trap' || seenTraps.has(g)) continue;
      seenTraps.add(g);
      const r = rsd(s, g.owner);
      add(K(r, 'trapsLaidAll'));
      const foes = (Object.values(b.units) as any[]).filter((u) => u.alive && u.pos && u.side !== g.owner);
      if (foes.length && b.round <= 1) { const h = parseKey(g.cell); const d = Math.min(...foes.map((u) => distance(parseKey(u.pos), h))); add(K(r, 'trapDistEnemySum'), d); add(K(r, 'trapDistN')); if (d <= 3) add(K(r, 'trapNearEnemy')); }
    }
  }
  function iceTrack() { const b = tr!.b; const n = (b.ice ?? []).length; if (n > tr!.ice) add(K('frost', 'iceCells'), n - tr!.ice); tr!.ice = n; }

  function levels() {
    if (s.phase === 'over' || !s.kingdom) return;
    for (const p of s.players as any[]) {
      const f = p.faction ?? p.id; const r = rsd(s, f); if (r === 'neutral') continue;
      const lvl = mechanicLevel(s, f);
      for (let L = 1; L <= lvl; L++) { const k = `${f}:${L}`; if (firstSeen[k] === undefined) { firstSeen[k] = s.round; add(`g|${r}|first${L}Sum`, s.round); add(`g|${r}|reached${L}`); } }
    }
  }

  for (let i = 0; i < 20000 && s.phase !== 'over'; i++) {
    const a: any = chooseAction(s);
    if (!a) break;
    // ---- pre-action measurements (battle)
    if (tr && tr.started && s.battle === tr.b && tr.b.activation && a.type === 'battleAttack') {
      try {
        const b = tr.b; const act = b.activation; const u = b.units[act.unitId]; const t = b.units[a.targetId];
        const ur = rsd(s, u.side), tr2 = rsd(s, t.side);
        const moved = act.movedDistance ?? 0;
        if (ur === 'herds' && UNITS[u.defId].attackType === 'melee') {
          const lvl = mechanicLevel(s, u.side);
          add(K('herds', 'meleeAttacks')); add(K('herds', 'runSum'), moved);
          if (moved >= 1) add(K('herds', 'attacksAfterMove'));
          if (lvl >= 1) { add(K('herds', 'meleeAttacksWithStone')); if (moved >= (lvl >= 3 ? 2 : 3)) add(K('herds', 'runQualified')); }
          const pp = plannedPush(s, u, !!a.useAbility, moved);
          if (pp) add(K('herds', `plannedPush:${pp.label}`));
        }
        if (ur === 'herds') add(K('herds', 'attacksAll'));
        if (tr2 === 'clans' && shieldLevel(s, t.side) >= 1) {
          add(K('clans', 'attacksOnClans'));
          if (inFormation(s, t)) {
            add(K('clans', 'attacksOnFormation'));
            const c: any = structuredClone(s);
            const cu = c.battle.units[u.id], ct = c.battle.units[t.id];
            const real = predictDamage(c, cu, ct, { useAbility: !!a.useAbility, movedDistance: moved, die: 0 }).damage;
            for (const st of Object.values(c.kingdom.settlements) as any[]) st.buildings.shieldHall = 0;
            const without = predictDamage(c, cu, ct, { useAbility: !!a.useAbility, movedDistance: moved, die: 0 }).damage;
            if (without > real) { add(K('clans', 'absorbedHits')); add(K('clans', 'absorbedDmg'), without - real); }
          }
        }
        if (abilityOf(u) === 'manaReap') {
          add(K('undead', 'lichHits'));
          const eh = (s.heroes as any)[(u.side === b.attacker ? b.defenderHero : b.attackerHero) ?? ''];
          if (eh && manaOf(eh) > 0) add(K('undead', 'lichHitsEnemyHasMana'));
        }
        if (abilityOf(u) === 'armorPierce') {
          add(K('undead', 'pierceShots'));
          const c: any = structuredClone(s);
          const cu = c.battle.units[u.id], ct = c.battle.units[t.id];
          const real = predictDamage(c, cu, ct, { useAbility: !!a.useAbility, movedDistance: moved, die: 0 }).damage;
          cu.ability = 'veiled';
          const without = predictDamage(c, cu, ct, { useAbility: !!a.useAbility, movedDistance: moved, die: 0 }).damage;
          if (real > without) { add(K('undead', 'pierceBonusHits')); add(K('undead', 'pierceBonusDmg'), real - without); }
        }
      } catch (e) { add('err|pre'); }
    }
    applyActionInPlace(s, a);
    actions++;
    // ---- post-action bookkeeping
    if (tr && s.battle !== tr.b) { logAndTrack(); finalize(); }
    if (s.battle && !tr) {
      const b: any = s.battle;
      if (!b.duel) {
        const cls = b.kind === 'neutral' ? 'neutral' : b.garrison ? 'siege' : 'pvp';
        tr = { b, cls, races: [rsd(s, b.attacker), rsd(s, b.defender)], started: false, limit: false, actKey: '', trapsAtStart: 0, ice: 0 };
      }
    }
    if (tr) {
      if (!tr.started && tr.b.stage === 'fight') startFight();
      logAndTrack();
      if (tr.started) { newActivation(); iceTrack(); trapTrack(); }
    } else li = s.log.length;
    if (actions % 3 === 0) levels();
  }
  if (tr) { logAndTrack(); finalize(); }
  // ---- game end
  add('g|*|games'); add('g|*|rounds', s.round); add('g|*|actions', actions); add('g|*|ms', Date.now() - t0);
  if (s.round >= s.roundLimit) add('g|*|roundLimitHit');
  if (s.winner === null || s.winner === 'draw') add('g|*|draws');
  add('g|*|battles', s.stats?.battles ?? 0);
  for (const p of s.players as any[]) {
    const f = p.faction ?? p.id; const r = rsd(s, f); if (r === 'neutral') continue;
    add(`g|${r}|games`);
    const sets = Object.values(s.kingdom?.settlements ?? {}).filter((x: any) => x.owner === f) as any[];
    add(`g|${r}|settlements`, sets.length);
    const lvl = mechanicLevel(s, f);
    add(`g|${r}|mechEnd${lvl}`);
    for (const bid of (FACTION_PACKS as any)[r].buildings as string[]) { const L = Math.max(0, ...sets.map((x) => x.buildings[bid] ?? 0)); add(`g|${r}|bld:${bid}`, L); if (L > 0) add(`g|${r}|bldHas:${bid}`); }
    add(`g|${r}|heroDeaths`, s.stats?.heroDeaths?.[f] ?? 0);
    add(`g|${r}|supportDeaths`, s.stats?.supportDeaths?.[f] ?? 0);
  }
}

if (process.argv[2] === '--shard') {
  const [, , , a, b, objective, from, to, size, shape] = process.argv;
  const deadline = Date.now() + Number(process.env.SIM_TIMEOUT_S ?? 170) * 1000;
  const C: Counters = {};
  let wa = 0, wb = 0, draws = 0, done = 0;
  for (let seed = Number(from); seed <= Number(to) && Date.now() < deadline; seed++) {
    // Seats: the legacy rule of nowe-frakcje.ts (seed parity) is aliased with the bot's pick of the dwelling line, `(seed + tier + seat) % 2` in kingdom.ts:
    // the faction named first in a pair always gets the same units of tiers 2-5. DIAG_ORDER=parity keeps that rule; the default swaps seats by the second bit of the seed.
    const swap = process.env.DIAG_ORDER === 'parity' ? seed % 2 : (seed >> 1) & 1;
    const order = (swap ? [a, b] : [b, a]) as Race[];
    const s: any = createGame(mk(order, objective, seed, size, shape));
    const force = Number(process.env.DIAG_FORCE ?? 0);
    if (force > 0) for (const p of s.players as any[]) for (const st of Object.values(s.kingdom.settlements) as any[]) if (st.owner === p.faction) st.buildings[MECH_BUILDING[rsd(s, p.faction)]] = Math.max(st.buildings[MECH_BUILDING[rsd(s, p.faction)]] ?? 0, force);
    playGame(s, C);
    done++;
    if (s.winner === null || (s.winner as any) === 'draw') draws++; else if (raceOf(s, s.winner as any) === a) wa++; else wb++;
  }
  process.send!({ wa, wb, draws, done, C });
  process.exit(0);
}

// ---------------------------------------------------------------- report
const pct = (x: number, n: number) => (n ? `${(100 * x / n).toFixed(0)}%` : '-');
const f1 = (x: number, n: number) => (n ? (x / n).toFixed(2) : '-');
type Cell = { wa: number; wb: number; draws: number; done: number; C: Counters };
type Store = Record<string, Cell>;

function sumKeys(cells: Cell[], k: string) { return cells.reduce((a, c) => a + (c.C[k] ?? 0), 0); }

function report(path: string) {
  const store: Store = JSON.parse(readFileSync(path, 'utf8'));
  const keys = Object.keys(store);
  const goals = [...new Set(keys.map((k) => k.split('|')[1]))];
  const pairKeys = [...new Set(keys.map((k) => k.split('|')[0]))];
  const out: string[] = [];
  const total = Object.values(store).reduce((a, c) => a + c.done, 0);
  out.push(`Partii łącznie: ${total}`);
  // pair table
  out.push('\n### Pary: odsetek wygranych pierwszej frakcji, długość partii, bitwy');
  out.push('| para | goal | wyg. A | n | rundy partii | bitwy pvp | rund/bitwa pvp | limit rund bitwy pvp |');
  out.push('|---|---|---|---|---|---|---|---|');
  for (const pk of pairKeys) for (const g of goals) {
    const c = store[`${pk}|${g}`]; if (!c) continue;
    const n = c.wa + c.wb;
    const pb = c.C['pvp|*|battles'] ?? 0;
    out.push(`| ${pk.replace(':', ' vs ')} | ${g} | ${pct(c.wa, n)} (${c.wa}-${c.wb}${c.draws ? `, ${c.draws} remis` : ''}) | ${c.done} | ${f1(c.C['g|*|rounds'] ?? 0, c.done)} | ${f1(pb, c.done)} | ${f1(c.C['pvp|*|rounds'] ?? 0, pb)} | ${pct(c.C['pvp|*|end:limit'] ?? 0, pb)} |`);
  }
  // per faction aggregated over all cells
  const all = Object.values(store);
  out.push('\n### Frakcje: budynek mechaniki (odsetek bitew pvp według poziomu w chwili startu bitwy), pierwsza runda zbudowania');
  out.push('| frakcja | bitwy pvp/partię | poziom 0 | I | II | III | IV | śr. poziom | partie z lvl≥1 na końcu | śr. runda lvl I | śr. runda lvl III | liczba osad (koniec) |');
  out.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of RACES) {
    const nb = sumKeys(all, `pvp|${r}|battles`); const games = sumKeys(all, `g|${r}|games`);
    const L = (i: number) => pct(sumKeys(all, `pvp|${r}|mechLvl${i}`), nb);
    const end1 = [1, 2, 3, 4].reduce((a, i) => a + sumKeys(all, `g|${r}|mechEnd${i}`), 0);
    out.push(`| ${r} | ${f1(nb, games)} | ${L(0)} | ${L(1)} | ${L(2)} | ${L(3)} | ${L(4)} | ${f1(sumKeys(all, `pvp|${r}|mechLvlSum`), nb)} | ${pct(end1, games)} | ${f1(sumKeys(all, `g|${r}|first1Sum`), sumKeys(all, `g|${r}|reached1`))} | ${f1(sumKeys(all, `g|${r}|first3Sum`), sumKeys(all, `g|${r}|reached3`))} | ${f1(sumKeys(all, `g|${r}|settlements`), games)} |`);
  }
  out.push('\n### Inne budynki frakcji: odsetek partii, w których zbudowano (poziom ≥1 na końcu)');
  for (const r of RACES) {
    const games = sumKeys(all, `g|${r}|games`);
    out.push(`- ${r}: ` + ((FACTION_PACKS as any)[r].buildings as string[]).map((b) => `${b} ${pct(sumKeys(all, `g|${r}|bldHas:${b}`), games)} (śr. poziom ${f1(sumKeys(all, `g|${r}|bld:${b}`), games)})`).join(', '));
  }
  // mechanic counters per faction (pvp)
  const per = (r: string, m: string, cls = 'pvp') => sumKeys(all, `${cls}|${r}|${m}`);
  const nb = (r: string, cls = 'pvp') => per(r, 'battles', cls);
  const line = (label: string, v: number, n: number, unit: string) => `- ${label}: ${v} łącznie, ${f1(v, n)} ${unit}`;
  out.push('\n### Liczniki mechanik (bitwy pvp, wszystkie pary)');
  for (const r of RACES) out.push(`- ${r}: bitwy ${nb(r)}, wygrane bitwy ${pct(per(r, 'bwin'), nb(r))}, polegli/bitwę ${f1(per(r, 'unitsLost'), nb(r))}, jednostek na start ${f1(per(r, 'unitsStart'), nb(r))}, obrażenia zadane/bitwę ${f1(per(r, 'dmgDealt'), nb(r))}`);
  out.push('\n**Przymierze**'); out.push(line('Blask Świtu: leczenie (Ż)', per('dawn', 'heal'), nb('dawn'), 'Ż/bitwę') + `; zdarzeń ${f1(per('dawn', 'healEvents'), nb('dawn'))}/bitwę; Ż leczone na bitwę z lvl≥1: ${f1(per('dawn', 'heal'), nb('dawn') - per('dawn', 'mechLvl0'))}`);
  out.push('\n**Horda**'); out.push(line('Żądza Krwi odpaliła', per('horde', 'bloodlustFires'), nb('horde'), 'razy/bitwę') + `; w bitwach z lvl≥1: ${f1(per('horde', 'bloodlustFires'), nb('horde') - per('horde', 'mechLvl0'))}/bitwę`);
  out.push('\n**Stada**');
  for (const m of ['meleeAttacks', 'meleeAttacksWithStone', 'runQualified', 'attacksAfterMove', 'runSum', 'pushes', 'pushCells', 'collisions', 'collisionDamage', 'collisionSelfDamage']) out.push(line(m, per('herds', m), nb('herds'), '/bitwę'));
  const herdsKeys = new Set<string>(); for (const c of all) for (const k of Object.keys(c.C)) if (k.startsWith('pvp|herds|push:') || k.startsWith('pvp|herds|plannedPush:') || k.startsWith('pvp|herds|collisionInto:')) herdsKeys.add(k.split('|')[2]);
  for (const k of herdsKeys) out.push(line(k, per('herds', k), nb('herds'), '/bitwę'));
  out.push('\n**Umarli**');
  for (const m of ['wardRises', 'otherRises', 'pierceShots', 'pierceBonusHits', 'pierceBonusDmg', 'lichHits', 'lichHitsEnemyHasMana', 'manaDrained', 'manaDrainEvents', 'manaDrainedOther']) out.push(line(m, per('undead', m), nb('undead'), '/bitwę'));
  out.push('\n**Klany**');
  for (const m of ['activations', 'activationsInFormation', 'attacksOnClans', 'attacksOnFormation', 'absorbedHits', 'absorbedDmg', 'thornsDamage', 'pushAvoided']) out.push(line(m, per('clans', m), nb('clans'), '/bitwę'));
  const avoided = new Set<string>(); for (const c of all) for (const k of Object.keys(c.C)) if (k.startsWith('pvp|clans|pushAvoided:')) avoided.add(k.split('|')[2]);
  for (const k of avoided) out.push(line(k, per('clans', k), nb('clans'), '/bitwę'));
  out.push('\n**Szron**');
  for (const m of ['frostPut', 'freezes', 'brittleBreaks', 'iceWalls', 'iceCells', 'abductions', 'longNight', 'frostThr3', 'frostThr2']) out.push(line(m, per('frost', m), nb('frost'), '/bitwę'));
  out.push('\n**Kompanie**');
  for (const m of ['trapsLaid', 'trapsLaidAll', 'trapHits', 'trapHolds', 'trapDamage', 'trapsUnspent', 'trapNearEnemy', 'trapDistEnemySum', 'trapDistN', 'trapHit:hero', 'trapHit:support', 'trapHit:melee', 'trapHit:ranged', 'trapHitRound1', 'trapHitRound2', 'trapHitRound3', 'trapHitRound4', 'trapHitRound5', 'marks', 'reveals', 'unveils', 'veiledStart', 'ripostes', 'riposteDamage', 'pickpocket', 'towerShots']) out.push(line(m, per('free', m), nb('free'), '/bitwę'));
  // stat per pair for free traps
  out.push('\n### Per para: liczniki kluczowych mechanik (pvp)');
  out.push('| para (A vs B) | n | bitwy | A lvl≥1 | B lvl≥1 | Blask Ż/b | Żądza/b | Stada push/b | zderz./b | Wstania/b | Pierce bonus Ż/b | Mana/b | Klany akt. w szyku | Pochł. Ż/b | Szron put/b | zamr./b | Pułapki poł./b | trafione | trafione% |');
  out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const pk of pairKeys) {
    const cs = goals.map((g) => store[`${pk}|${g}`]).filter(Boolean);
    const [a, b] = pk.split(':');
    const nbat = sumKeys(cs, 'pvp|*|battles');
    const g = (r: string, m: string) => sumKeys(cs, `pvp|${r}|${m}`);
    const lvl1 = (r: string) => pct(g(r, 'battles') - g(r, 'mechLvl0'), g(r, 'battles'));
    const pb = (race: string, m: string) => (race === a || race === b ? f1(g(race, m), nbat) : '');
    const cell = (r: string, m: string) => ((a === r || b === r) ? pb(r, m) : '-');
    const clansForm = (a === 'clans' || b === 'clans') ? pct(g('clans', 'activationsInFormation'), g('clans', 'activations')) : '-';
    const traps = (a === 'free' || b === 'free') ? `${f1(g('free', 'trapsLaidAll'), nbat)} | ${f1(g('free', 'trapHits'), nbat)} | ${pct(g('free', 'trapHits'), g('free', 'trapsLaidAll'))}` : '- | - | -';
    out.push(`| ${a} vs ${b} | ${cs.reduce((x, c) => x + c.done, 0)} | ${nbat} | ${lvl1(a)} | ${lvl1(b)} | ${cell('dawn', 'heal')} | ${cell('horde', 'bloodlustFires')} | ${cell('herds', 'pushes')} | ${cell('herds', 'collisions')} | ${cell('undead', 'wardRises')} | ${cell('undead', 'pierceBonusDmg')} | ${cell('undead', 'manaDrained')} | ${clansForm} | ${cell('clans', 'absorbedDmg')} | ${cell('frost', 'frostPut')} | ${cell('frost', 'freezes')} | ${traps} |`);
  }
  // ability use
  out.push('\n### Użycie zdolności jednorazowych przez bota (pvp): jednostka obecna w bitwie / użyła / żywa na końcu');
  const abKeys = new Set<string>(); for (const c of all) for (const k of Object.keys(c.C)) if (k.startsWith('ab|pvp|') && k.endsWith('|present')) abKeys.add(k.split('|')[2]);
  const rows: string[] = [];
  for (const d of [...abKeys].sort((x, y) => (UNITS[x] as any).side.localeCompare((UNITS[y] as any).side))) {
    const def = UNITS[d] as any;
    const present = sumKeys(all, `ab|pvp|${d}|present`), used = sumKeys(all, `ab|pvp|${d}|used`), alive = sumKeys(all, `ab|pvp|${d}|alive`);
    const once = !UNLIMITED_ABILITIES.includes(def.ability);
    rows.push(`| ${def.side} | ${def.name} | ${def.abilityName} | ${once ? 'raz/bitwę' : 'stała'} | ${present} | ${once ? pct(used, present) : '-'} | ${pct(alive, present)} |`);
  }
  out.push('| frakcja | jednostka | zdolność | typ | obecna | użyta | żywa |'); out.push('|---|---|---|---|---|---|---|'); out.push(...rows);
  // squad composition: how many of the units in a battle are the three starting supports and how many tier 2-5 recruits
  out.push('\n### Skład drużyny w bitwach pvp (jednostek na bitwę): bohater, pomocnicy tieru 1, pomocnicy tierów 2-5');
  for (const r of RACES) {
    const nbr = nb(r); let hero = 0, t1 = 0, hi = 0;
    for (const k of abKeys) { const def = UNITS[k] as any; if (def.side !== r) continue; const pr = sumKeys(all, `ab|pvp|${k}|present`); if (def.kind === 'hero') hero += pr; else if ((FACTION_PACKS as any)[r].supports.includes(k)) t1 += pr; else hi += pr; }
    out.push(`- ${r}: bohaterowie ${f1(hero, nbr)}, tier 1 ${f1(t1, nbr)}, tiery 2-5 ${f1(hi, nbr)}`);
  }
  // battle classes
  out.push('\n### Bitwy wg klasy (wszystkie komórki)');
  for (const cls of ['pvp', 'siege', 'neutral']) {
    const n = sumKeys(all, `${cls}|*|battles`);
    out.push(`- ${cls}: ${n} bitew (${f1(n, total)}/partię), śr. ${f1(sumKeys(all, `${cls}|*|rounds`), n)} rund, limit rund: ${pct(sumKeys(all, `${cls}|*|end:limit`), n)}, wybicie: ${pct(sumKeys(all, `${cls}|*|end:wipe`), n)}`);
  }
  out.push(`- partia: śr. ${f1(sumKeys(all, 'g|*|rounds'), total)} rund, ${f1(sumKeys(all, 'g|*|actions'), total)} akcji, ${f1(sumKeys(all, 'g|*|ms'), total)} ms; limit rund partii trafiony: ${pct(sumKeys(all, 'g|*|roundLimitHit'), total)}; remisy ${pct(sumKeys(all, 'g|*|draws'), total)}; błędy pomiaru: ${sumKeys(all, 'err|pre')}`);
  console.log(out.join('\n'));
}

if (process.argv[2] === '--compare') {
  // --compare a.json b.json ...: win share of the first faction in every pair, side by side, with the target of the "Kto z kim" table
  const C: Record<string, string[]> = { dawn: ['horde', 'herds', 'free'], horde: ['undead', 'frost'], herds: ['frost', 'free'], undead: ['dawn', 'clans'], clans: ['horde', 'herds'], free: ['clans'], frost: ['clans'] };
  const target = (a: string, b: string) => (C[a].includes(b) ? 65 : C[b].includes(a) ? 35 : 50);
  const files = process.argv.slice(3);
  const stores = files.map((f) => JSON.parse(readFileSync(f, 'utf8')) as Store);
  console.log(`| para (A vs B) | cel A | ${files.map((f) => f.replace(/^.*\//, '')).join(' | ')} |`);
  console.log(`|---|---|${files.map(() => '---').join('|')}|`);
  const share = (st: Store, pk: string) => { let wa = 0, wb = 0; for (const [k, v] of Object.entries(st)) if (k.startsWith(pk + '|')) { wa += v.wa; wb += v.wb; } return wa + wb ? 100 * wa / (wa + wb) : NaN; };
  for (const pk of allPairs()) { const [a, b] = pk.split(':'); console.log(`| ${a} vs ${b} | ${target(a, b)} | ${stores.map((st) => share(st, pk).toFixed(0)).join(' | ')} |`); }
  process.exit(0);
}
if (process.argv[2] === '--report') { report(process.argv[3] ?? '.tmp/diagnoza.json'); process.exit(0); }

// ---------------------------------------------------------------- master
const N = Number(process.argv[2] ?? 200);
const goals = (process.argv[3] ?? 'control,conquest').split(',');
const pairsArg = process.argv[4] ?? 'all';
const pairs = pairsArg === 'all' ? allPairs() : pairsArg.split(',');
const outPath = process.argv[5] ?? '.tmp/diagnoza.json';
const size = 'long', shape = 'rectangle';
const workers = Math.max(1, Math.min(cpus().length - 1, 15));
const run = (a: string, b: string, objective: string) => new Promise<Cell>((resolve) => {
  const tot: Cell = { wa: 0, wb: 0, draws: 0, done: 0, C: {} };
  let left = workers;
  const per = Math.ceil(N / workers);
  for (let w = 0; w < workers; w++) {
    const from = w * per + 1, to = Math.min(N, (w + 1) * per);
    const ch = fork(fileURLToPath(import.meta.url), ['--shard', a, b, objective, String(from), String(to), size, shape], { execArgv: ['--import', 'tsx'] });
    ch.on('message', (m: any) => { tot.wa += m.wa; tot.wb += m.wb; tot.draws += m.draws; tot.done += m.done; for (const [k, v] of Object.entries(m.C as Counters)) tot.C[k] = (tot.C[k] ?? 0) + v; });
    ch.on('exit', () => { if (--left === 0) resolve(tot); });
  }
});

const store: Store = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {};
mkdirSync(dirname(outPath), { recursive: true });
console.log(`# ${N} games per cell, ${size}/${shape}, workers ${workers}, output ${outPath}`);
for (const pair of pairs) {
  const [a, b] = pair.split(':');
  const cells: string[] = [];
  for (const goal of goals) {
    const t0 = Date.now();
    const r = await run(a, b, goal);
    store[`${pair}|${goal}`] = r;
    writeFileSync(outPath, JSON.stringify(store));
    const n = r.wa + r.wb;
    cells.push(`${goal} ${n ? (100 * r.wa / n).toFixed(0) : '-'}% (${r.wa}-${r.wb}${r.draws ? `, ${r.draws} dr` : ''}, n=${r.done}, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  console.log(`${a} vs ${b}: ${cells.join(' | ')}`);
}

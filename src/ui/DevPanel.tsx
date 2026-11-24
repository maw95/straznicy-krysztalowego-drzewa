// The developer panel (backlog 43): changes a copy of the game state to look at a screen without playing up to it. Only in the development build (never in
// a release build or an online game), opened by ?dev=1 or Ctrl+Shift+D. The tools are engine/dev.ts; nothing here touches the rules.

import { useState } from 'react';
import { FACTION_NAMES, ITEMS, UNITS, type ItemKind } from '../engine/data';
import { activeHero } from '../engine/game';
import { ARTIFACTS } from '../engine/sites';
import { SPELL_IDS } from '../engine/magic';
import { addUnit, buildEverything, DEV_SCENES, fightNeutral, giveAllShards, giveArtifactTo, giveTreasure, giveXp, learnSpell, reviveAll, revealAll, setHeroLevel, setResources } from '../engine/dev';
import { RECRUITS } from '../engine/kingdom';
import { raceOf } from '../engine/teams';
import type { GameState } from '../engine/types';

/** Whether the panel may exist at all: the development build only. */
export const DEV_TOOLS_ALLOWED: boolean = import.meta.env.DEV === true;

export function DevPanel({ game, onChange, onClose }: { game: GameState; onChange: (g: GameState) => void; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [min, setMin] = useState(false);
  const hero = activeHero(game);
  const faction = hero?.faction ?? 'dawn';
  const race = raceOf(game, faction);
  const [gold, setGold] = useState(99);
  const [level, setLevel] = useState(5);
  const [artifact, setArtifact] = useState(ARTIFACTS[0].id);
  const [treasure, setTreasure] = useState<ItemKind>('heal');
  const [unit, setUnit] = useState(RECRUITS[race][0].id);
  const run = (what: string, fn: (s: GameState) => GameState | void) => {
    try {
      const copy = structuredClone(game);
      const out = fn(copy) ?? copy;
      onChange(out);
      setNote(what);
    } catch (e) {
      setNote(`Błąd: ${(e as Error).message}`);
    }
  };
  const row = { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const };
  const btn = { padding: '2px 10px', fontSize: 13 };
  return (
    <div className="plate parch" data-dev-panel style={{ position: 'fixed', left: 8, top: 8, zIndex: 200, width: min ? 150 : 330, maxHeight: '86vh', overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
      <div style={{ ...row, justifyContent: 'space-between' }}>
        <b style={{ fontSize: 16 }}>Panel testowy</b>
        <span style={row}>
          <button className="btn" style={btn} data-dev-min onClick={() => setMin(!min)}>{min ? 'Rozwiń' : 'Zwiń'}</button>
          <button className="btn" style={btn} onClick={onClose}>Zamknij</button>
        </span>
      </div>
      {min ? null : (<>
      <i>{hero ? `${UNITS[hero.id].name}, ${FACTION_NAMES[race]}` : 'Brak aktywnego bohatera (ruch po mapie niedostępny).'}</i>
      {note && <span data-dev-note style={{ color: note.startsWith('Błąd') ? '#8A2A18' : '#2E7A32' }}>{note}</span>}

      <b>Sceny</b>
      {DEV_SCENES.map((s) => {
        const off = Boolean(s.needs && !game.rules[s.needs]);
        return (
          <div key={s.id}>
            <button className="btn prim" data-dev-scene={s.id} disabled={off || !hero} style={btn} title={off ? `Wymaga poziomu gry z regułą „${s.needs}”.` : undefined} onClick={() => run(s.label, s.run)}>{s.label}</button>
            <div style={{ color: '#6B4A22' }}>{s.hint}</div>
          </div>
        );
      })}

      <b>Zasoby</b>
      <div style={row}>
        <input type="number" value={gold} onChange={(e) => setGold(Number(e.target.value))} style={{ width: 60 }} aria-label="Złoto" />
        <button className="btn" style={btn} data-dev="resources" disabled={!game.kingdom} onClick={() => run('Zasoby ustawione', (s) => setResources(s, faction, { gold, wood: gold, ore: gold, dust: gold }))}>Ustaw złoto i surowce</button>
      </div>

      <b>Bohater</b>
      <div style={row}>
        <input type="number" min={1} max={10} value={level} onChange={(e) => setLevel(Number(e.target.value))} style={{ width: 50 }} aria-label="Poziom" />
        <button className="btn" style={btn} data-dev="level" disabled={!hero} onClick={() => run('Poziom ustawiony', (s) => setHeroLevel(s, hero!.id, level))}>Ustaw poziom</button>
        <button className="btn" style={btn} data-dev="xp" disabled={!hero || !game.rules.heroGrowth} title="Dodaje 2 PD tak, jakby bohater wygrał walkę" onClick={() => run('PD dodane', (s) => giveXp(s, hero!.id, 2))}>+2 PD</button>
        <button className="btn" style={btn} data-dev="spells" disabled={!hero || !game.rules.realm} onClick={() => run('Wszystkie czary', (s) => SPELL_IDS.forEach((id) => learnSpell(s, hero!.id, id)))}>Wszystkie czary</button>
      </div>
      <div style={row}>
        <select value={artifact} onChange={(e) => setArtifact(e.target.value)} style={{ maxWidth: 200 }} aria-label="Artefakt">
          {ARTIFACTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button className="btn" style={btn} data-dev="artifact" disabled={!hero || !game.rules.heroGrowth} onClick={() => run('Artefakt dany', (s) => giveArtifactTo(s, hero!.id, artifact))}>Daj</button>
      </div>
      <div style={row}>
        <select value={treasure} onChange={(e) => setTreasure(e.target.value as ItemKind)} style={{ maxWidth: 200 }} aria-label="Skarb">
          {(Object.keys(ITEMS) as ItemKind[]).map((k) => <option key={k} value={k}>{ITEMS[k].name}</option>)}
        </select>
        <button className="btn" style={btn} data-dev="treasure" onClick={() => run('Skarb dany', (s) => giveTreasure(s, faction, treasure))}>Daj</button>
      </div>
      <div style={row}>
        <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ maxWidth: 200 }} aria-label="Jednostka">
          {RECRUITS[race].map((r) => <option key={r.id} value={r.id}>{UNITS[r.id].name}</option>)}
        </select>
        <button className="btn" style={btn} data-dev="unit" onClick={() => run('Jednostka dodana', (s) => addUnit(s, faction, unit))}>Dodaj do drużyny</button>
        <button className="btn" style={btn} onClick={() => run('Poległych wskrzeszono', (s) => reviveAll(s, faction))}>Wskrześ</button>
      </div>

      <b>Osada i mapa</b>
      <div style={row}>
        <button className="btn" style={btn} data-dev="build" disabled={!game.kingdom} onClick={() => run('Wszystko wybudowane', (s) => buildEverything(s, faction))}>Wybuduj wszystko</button>
        <button className="btn" style={btn} data-dev="reveal" onClick={() => run('Mapa odkryta', (s) => revealAll(s))}>Odkryj mapę</button>
        <button className="btn" style={btn} data-dev="shards" disabled={!hero || !game.rules.empire} onClick={() => run('Komplet Odłamków', (s) => giveAllShards(s, hero!.id))}>Odłamki</button>
      </div>
      <div style={row}>
        {([0, 1, 2] as const).map((t) => (
          <button key={t} className="btn" style={btn} data-dev-fight={t} disabled={!hero || game.phase !== 'adventure'} onClick={() => run(`Walka: neutralni (stopień ${t + 1})`, (s) => fightNeutral(s, t))}>Walka: stopień {t + 1}</button>
        ))}
      </div>
      </>)}
    </div>
  );
}

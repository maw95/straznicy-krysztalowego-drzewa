// Arena before the fight: the two heroes face each other over the painted arena while both sides
// choose their supports and draft treasures, and the draft dialog itself.

import { useState } from 'react';
import { ARENA_PICKS, FACTION_NAMES, itemDef, UNITS, type FactionId, type ItemKind } from '../engine/data';
import { isDigital, type GameState } from '../engine/types';
import { asset, Frame, Portrait, Ribbon, SIDE_RING } from './common';
import { ARTIFACT_BY_ID, RARITY_NAMES } from '../engine/sites';
import { ARENA_SPELL_PICKS, ARENA_SPELL_POOL, SPELLS, type SpellId } from '../engine/magic';
import { RuleText } from './statScale';
import { ArtifactMedal, SLOT_NAMES } from './growthUi';
import { TreasureCard } from './TreasureCard';
import { UnitCard } from './UnitCard';

const heroOf = (state: GameState, f: FactionId) => Object.values(state.heroes).find((h) => h.faction === f)!.id;
/** Treasures a side drafts in all: those it holds plus its picks still to come. */
const picksOf = (state: GameState, f: FactionId) => state.factions[f].inventory.length + (state.draft?.order.filter((x) => x === f).length ?? 0) || ARENA_PICKS;

/** Background while the arena match is being set up (and behind the end screen). */
export function ArenaPrep({ state }: { state: GameState }) {
  const b = state.battle;
  const arena = b?.arena ?? 'dawn';
  const status = (() => {
    if (!b) return '';
    if (b.stage === 'gear' && state.draft?.gear) return `${FACTION_NAMES[state.draft.gear.order[0]]} wybiera artefakt…`;
    if (b.stage === 'spells' && state.draft?.spells) return `${FACTION_NAMES[state.draft.spells.order[0]]} wybiera czary…`;
    if (b.stage === 'select') return `${FACTION_NAMES[b.needsSelection[0]]} wybiera pomocników…`;
    if (b.stage === 'draft' && state.draft) return `${FACTION_NAMES[state.draft.order[0]]} wybiera skarb…`;
    return '';
  })();
  return (
    <div className="screen arena-prep">
      <img className="ken-burns arena-prep-art" src={asset(`arena/${arena}.jpg`)} alt="" />
      <div className="arena-prep-shade" aria-hidden="true" />
      <div className="arena-prep-row">
        {(['dawn', 'horde'] as FactionId[]).map((f, i) => (
          <div key={f} className="arena-prep-side" style={{ order: i * 2 }}>
            <UnitCard unitId={heroOf(state, f)} width={Math.min(260, window.innerWidth / 3.4)} digital={isDigital(state.rules)} />
            <div className="arena-prep-supports" aria-label={`Pomocnicy: ${FACTION_NAMES[f]}`}>
              {b
                ? Object.values(b.units)
                    .filter((u) => u.side === f && UNITS[u.defId].kind === 'support')
                    .map((u) => <Portrait key={u.id} unitId={u.defId} size={54} ring={SIDE_RING[f]} />)
                : null}
            </div>
            <div className="arena-prep-items">
              Skarby: {state.factions[f].inventory.length} / {picksOf(state, f)}
            </div>
          </div>
        ))}
        <div className="arena-prep-vs" style={{ order: 1 }}>
          kontra
        </div>
      </div>
      {status && <div className="arena-prep-status">{status}</div>}
    </div>
  );
}

/**
 * The picker's three cards. With two people at one screen, the cards stay covered until the
 * picker says the other player is not looking.
 */
export function DraftDialog({ state, faction, covered, onReveal, onPick }: { state: GameState; faction: FactionId; covered: boolean; onReveal: () => void; onPick: (kind: ItemKind) => void }) {
  const d = state.draft!;
  const [chosen, setChosen] = useState<ItemKind | null>(null);
  const mine = state.factions[faction].inventory.map((id) => state.items[id].kind);
  const pickNo = mine.length + 1;
  const width = Math.min(d.offer.length > 3 ? 200 : 230, (window.innerWidth - 120) / d.offer.length);
  if (covered) {
    return (
      <div>
        <Frame crest style={{ width: 'min(560px, 94vw)' }} innerStyle={{ padding: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <Ribbon side={faction} style={{ width: 'min(420px, 90vw)' }}>Kolej: {FACTION_NAMES[faction]}</Ribbon>
          <div style={{ fontSize: 19 }}>Skarby są tajne. Przekaż urządzenie graczowi tej strony — drugi gracz niech nie patrzy.</div>
          <button className="btn prim btn-big" data-enter onClick={onReveal} autoFocus>
            Pokaż skarby
          </button>
        </Frame>
      </div>
    );
  }
  return (
    <div>
      <Frame crest style={{ width: d.offer.length > 3 ? 'min(960px, 96vw)' : 'min(820px, 96vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Ribbon side={faction} style={{ width: 'min(460px, 92vw)' }}>
          Wybierz skarb ({pickNo} z {picksOf(state, faction)})
        </Ribbon>
        <div style={{ fontSize: 16, color: 'var(--muted)', textAlign: 'center' }}>Pozostałe wracają do talii. Przeciwnik nie zobaczy Twoich skarbów, dopóki ich nie użyjesz.</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {d.offer.map((k) => (
            <button key={k} className="btn" aria-pressed={chosen === k} aria-label={itemDef(k, isDigital(state.rules)).name} onClick={() => setChosen(k)} style={{ background: 'none', border: 0, padding: 4, borderRadius: 12, boxShadow: chosen === k ? '0 0 0 3px #9EE4FF, 0 0 16px 4px rgba(158,228,255,0.6)' : 'none' }}>
              <TreasureCard kind={k} width={width} />
            </button>
          ))}
        </div>
        {mine.length > 0 && <div style={{ fontSize: 16 }}>Masz już: {mine.map((k) => itemDef(k, isDigital(state.rules)).name).join(', ')}</div>}
        <button className="btn prim btn-big" data-enter disabled={!chosen} onClick={() => chosen && onPick(chosen)}>
          Biorę ten skarb
        </button>
      </Frame>
    </div>
  );
}

/** 6 on 6 arena: one of three artifacts for the hero (chosen before the supports). */
export function GearDialog({ state, faction, onPick }: { state: GameState; faction: FactionId; onPick: (artifactId: string) => void }) {
  const offer = state.draft!.gear!.offer.map((id) => ARTIFACT_BY_ID[id]);
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div>
      <Frame crest style={{ width: 'min(820px, 96vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Ribbon side={faction} style={{ width: 'min(460px, 92vw)' }}>Wybierz artefakt bohatera</Ribbon>
        <div style={{ fontSize: 16, color: 'var(--muted)', textAlign: 'center' }}>Bohater zakłada go do tej bitwy. Potem wybierzesz mu dwa czary z kręgów I–II.</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {offer.map((a) => (
            <button key={a.id} className="btn plate parch" data-gear-offer={a.id} aria-pressed={chosen === a.id} onClick={() => setChosen(a.id)} style={{ width: 220, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', boxShadow: chosen === a.id ? '0 0 0 3px #9EE4FF, 0 0 18px #9EE4FF' : undefined }}>
              <ArtifactMedal art={a} size={72} />
              <b style={{ fontSize: 19 }}>{a.name}</b>
              <span style={{ fontSize: 14, color: '#6B4A22' }}>{SLOT_NAMES[a.slot]} · {RARITY_NAMES[a.rarity]}</span>
              <span style={{ fontSize: 15, lineHeight: 1.3 }}>{a.text}</span>
            </button>
          ))}
        </div>
        <button className="btn prim btn-big" data-enter disabled={!chosen} onClick={() => chosen && onPick(chosen)}>
          Biorę ten artefakt
        </button>
      </Frame>
    </div>
  );
}

/** 6 on 6 arena: the two spells of the hero (battle spells of circles I-II), chosen after the artifact. */
export function SpellPickDialog({ faction, onPick }: { faction: FactionId; onPick: (spells: SpellId[]) => void }) {
  const [chosen, setChosen] = useState<SpellId[]>([]);
  const toggle = (id: SpellId) => setChosen(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id].slice(-ARENA_SPELL_PICKS));
  return (
    <div>
      <Frame crest style={{ width: 'min(900px, 96vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Ribbon side={faction} style={{ width: 'min(460px, 92vw)' }}>Wybierz dwa czary bohatera</Ribbon>
        <div style={{ fontSize: 16, color: 'var(--muted)', textAlign: 'center' }}>Zaklęcia rzuca się w bitwie w aktywacji bohatera, za manę. Wybrane: {chosen.length} z {ARENA_SPELL_PICKS}.</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {ARENA_SPELL_POOL.map((id) => (
            <button key={id} className="btn plate parch" data-spell-offer={id} aria-pressed={chosen.includes(id)} onClick={() => toggle(id)} style={{ width: 250, padding: 10, display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', boxShadow: chosen.includes(id) ? '0 0 0 3px #9EE4FF, 0 0 18px #9EE4FF' : undefined }}>
              <img src={asset(`ikony/czary/${id}.webp`)} alt="" width={56} height={56} style={{ flex: 'none', borderRadius: '50%' }} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <b style={{ fontSize: 18 }}>{SPELLS[id].name}</b>
                <span style={{ fontSize: 13, color: '#5A3A8C', fontWeight: 700 }}>Koszt: {SPELLS[id].mana} many · krąg {SPELLS[id].circle}</span>
                <span style={{ fontSize: 14, lineHeight: 1.25 }}><RuleText text={SPELLS[id].text} /></span>
              </span>
            </button>
          ))}
        </div>
        <button className="btn prim btn-big" data-enter disabled={chosen.length !== ARENA_SPELL_PICKS} onClick={() => onPick(chosen)}>
          Biorę te czary
        </button>
      </Frame>
    </div>
  );
}

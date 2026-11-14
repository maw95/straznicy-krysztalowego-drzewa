// Pieces of the App screen that need nothing but their props: the music theme, the controls and layers
// every screen has, and the small game dialogs (confirm, "since your last turn", a found treasure,
// a card, the options) and the end-of-game effects.

import { useEffect, useState, type ReactNode } from 'react';
import { ITEMS, UNITS, type ItemKind } from '../engine/data';
import { ritualFormed } from '../engine/game';
import { GROWTH, levelOf, skillRank, type SkillId } from '../engine/growth';
import type { GameState, HeroState, LogEntry } from '../engine/types';
import type { BotSpeed, RoomView } from '../online/api';
import { BOT_SPEEDS } from '../online/api';
import { Frame, Modal, Ribbon, SvgDefs } from './common';
import { DetailsLayer } from './details';
import { FullscreenButton } from './fullscreen';
import { HoverCardLayer } from './hover';
import { SkillCard, XpBar } from './growthUi';
import { music, type Theme } from './music';
import { sfx } from './sfx';
import { RulesDialog } from './RulesDialog';
import { TreasureCard } from './TreasureCard';
import { TreasureReveal } from './CardBack';
import { UnitCard } from './UnitCard';
import { ANIM_SPEED_NAMES, ANIM_SPEEDS, animSpeedLevel, setAnimSpeedLevel } from './animSpeed';
import { FightPill } from './fightBadges';
import type { FightLevel } from '../engine/difficulty';

/** The music for what is on screen: menu, map, battle, a guardian fight or the ritual (silence at the end of the game). */
export function musicTheme(game: GameState | null): Theme {
  if (!game) return 'menu';
  if (game.setup.mode === 'arena') {
    if (game.phase === 'battle') return 'battle';
    return 'none';
  }
  // The end of the game is the victory or defeat sound effect (App.tsx); the old victory pieces would play over it.
  if (game.phase === 'over') return 'none';
  if (game.phase === 'battle' && (game.battle?.stage === 'fight' || game.battle?.stage === 'deploy')) return game.battle.kind === 'neutral' ? 'guardian' : 'battle';
  // The counter only drops at the end of the round, so the ritual music also needs the ritual to still stand (the dragon beaten in the middle of the round silenced it).
  return game.ritual > 0 && ritualFormed(game) ? 'ritual' : 'adventure';
}

/** What every screen has: the music and full-screen buttons, an error note, the rules and the card/details layers. */
export function AppChrome({ error, onDismissError, showRules, onCloseRules }: { error: string | null; onDismissError: () => void; showRules: boolean; onCloseRules: () => void }) {
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
      <FullscreenButton />
      {error && (
        <div className="plate parch" role="alert" style={{ position: 'fixed', left: '50%', top: 18, transform: 'translateX(-50%)', padding: '8px 16px', zIndex: 80, fontWeight: 700, color: '#8A1A1A' }} onClick={onDismissError}>
          {error}
        </div>
      )}
      <Modal open={showRules} onClose={onCloseRules}>
        <RulesDialog onClose={onCloseRules} />
      </Modal>
      <HoverCardLayer />
      <DetailsLayer />
    </>
  );
}

export interface Confirmation {
  text: string;
  /** How hard the fight announced in `text` is judged to be. */
  level?: FightLevel | null;
  yes: string;
  onYes: () => void;
}

export function ConfirmDialog({ confirm, onClose }: { confirm: Confirmation | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(confirm)} onClose={onClose}>
      {confirm && (
        <Frame crest style={{ width: 'min(480px, 94vw)' }} innerStyle={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 20, lineHeight: 1.35 }}>{confirm.text}</div>
          {confirm.level && <FightPill level={confirm.level} size={17} />}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn plate parch btn-wide" onClick={onClose}>Anuluj</button>
            <button
              className="btn prim"
              data-enter
              autoFocus
              style={{ padding: '8px 22px', fontSize: 19 }}
              onClick={() => {
                const go = confirm.onYes;
                onClose();
                go();
              }}
            >
              {confirm.yes}
            </button>
          </div>
        </Frame>
      )}
    </Modal>
  );
}

/** "Since your last turn": what happened off-screen while bots and others moved. */
export function DigestDialog({ entries, open, onClose }: { entries: LogEntry[] | null; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open}>
      {entries && (
        <div>
          <Frame crest style={{ width: 'min(620px, 94vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Ribbon>Od Twojej ostatniej tury</Ribbon>
            <div className="scroll" style={{ maxHeight: 360 }}>
              {entries.map((l, i) => (
                <div key={i} className={`log-line ${l.kind}`} style={{ fontSize: 17 }}>
                  <span style={{ color: '#9FB8BC', marginRight: 6 }}>[{l.round}]</span>
                  {l.text}
                </div>
              ))}
            </div>
            <button className="btn prim" data-enter style={{ alignSelf: 'center', padding: '6px 26px', fontSize: 19 }} onClick={onClose}>
              Dalej
            </button>
          </Frame>
        </div>
      )}
    </Modal>
  );
}

/** A freshly found treasure turning over in front of the player. */
export function FoundTreasure({ kind, open, onClose }: { kind: ItemKind | null; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open}>
      {kind && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }} onClick={onClose}>
          <Ribbon style={{ width: 'min(360px, 90vw)' }}>Znaleziono skarb!</Ribbon>
          <TreasureReveal kind={kind} width={Math.min(300, window.innerWidth - 60)} />
          <button className="btn prim" data-enter autoFocus style={{ padding: '6px 26px', fontSize: 18 }} onClick={onClose}>
            Do ekwipunku
          </button>
        </div>
      )}
    </Modal>
  );
}

/** A hero reached a level: three skills to choose from. */
export function SkillDialog({ hero, onChoose, earned = [] }: { hero: HeroState | null; onChoose: (skill: SkillId) => void; /** The latest experience this hero earned, newest last ("+2 PD: wygrana walka z bohaterem"): the answer to "why did I level up?". */ earned?: string[] }) {
  return (
    <Modal open={Boolean(hero?.offer?.length)}>
      {hero?.offer && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 'min(720px, 94vw)' }}>
          <Ribbon style={{ width: 'min(420px, 90vw)' }}>Poziom {levelOf(hero)}: wybierz umiejętność</Ribbon>
          <div style={{ fontSize: 18 }}>{UNITS[hero.id].name}</div>
          <XpBar hero={hero} />
          <div style={{ fontSize: 15, maxWidth: 560, textAlign: 'center', lineHeight: 1.35 }} data-xp-why>
            Awans za doświadczenie (PD). {earned.length > 0 ? <>Ostatnio: <b>{earned.join('; ')}</b>. </> : null}
            PD dają: pokonany strażnik +{GROWTH.xp.guardian}, wygrana walka z bohaterem +{GROWTH.xp.hero}, przegrana walka, którą bohater przeżył, +{GROWTH.xp.lost}, każdy znaleziony skarb +{GROWTH.xp.treasure}, kapliczka +2.
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {hero.offer.map((s) => (
              <SkillCard key={s} faction={hero.faction} skill={s} rank={skillRank(hero, s) + 1} raise={skillRank(hero, s) > 0} onChoose={onChoose} />
            ))}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Umiejętność zostaje bohaterowi do końca gry.</div>
        </div>
      )}
    </Modal>
  );
}

/** A Łowca skarbów beat a guardian: the treasures to choose from. */
export function TreasureDialog({ hero, onChoose }: { hero: HeroState | null; onChoose: (kind: ItemKind) => void }) {
  const pick = hero?.treasurePick;
  return (
    <Modal open={Boolean(pick?.kinds.length)}>
      {hero && pick && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 'min(960px, 94vw)' }}>
          <Ribbon style={{ width: 'min(460px, 90vw)' }}>Skarb strażnika: wybierz {pick.take > 1 ? `(jeszcze ${pick.take})` : 'jeden'}</Ribbon>
          <div style={{ fontSize: 18 }}>{UNITS[hero.id].name}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {pick.kinds.map((k) => (
              <button key={k} className="treasure-pick" onClick={() => onChoose(k)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} aria-label={ITEMS[k].name}>
                <TreasureCard kind={k} width={Math.min(220, (window.innerWidth - 60) / 2)} />
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

/** "Wyjdź z gry": save under a name and leave, leave without saving, or stay. Online games cannot be saved yet, so they only get leave / stay. */
export function LeaveDialog({ open, canSave, defaultName, onSaveAndLeave, onLeave, onClose }: { open: boolean; canSave: boolean; defaultName: string; onSaveAndLeave: (name: string) => void; onLeave: () => void; onClose: () => void }) {
  const [name, setName] = useState(defaultName);
  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);
  return (
    <Modal open={open} onClose={onClose}>
      {open && (
        <Frame crest style={{ width: 'min(520px, 94vw)' }} innerStyle={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 22, lineHeight: 1.35 }}>Czy na pewno chcesz wyjść z gry?</div>
          {canSave && (
            <input type="text" value={name} maxLength={40} aria-label="Nazwa zapisu" onChange={(e) => setName(e.target.value)} style={{ width: '100%', fontSize: 18, padding: '6px 10px', boxSizing: 'border-box' }} />
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn plate parch btn-wide" onClick={onClose}>Anuluj</button>
            <button className="btn prim r" style={{ padding: '8px 18px', fontSize: 18 }} onClick={onLeave} data-leave-nosave>Wyjdź bez zapisu</button>
            {canSave && <button className="btn prim" data-enter autoFocus style={{ padding: '8px 18px', fontSize: 18 }} onClick={() => onSaveAndLeave(name)} data-leave-save>Zapisz i wyjdź</button>}
          </div>
        </Frame>
      )}
    </Modal>
  );
}

/** A unit's card, or a treasure's (`item:<kind>`), large; a click closes it. */
export function CardDialog({ card, onClose }: { card: string | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(card)} onClose={onClose}>
      {card && (
        <div onClick={onClose}>
          {card.startsWith('item:') ? <TreasureCard kind={card.slice(5) as ItemKind} width={Math.min(360, window.innerWidth - 40)} /> : <UnitCard unitId={card} width={Math.min(360, window.innerWidth - 40)} />}
        </div>
      )}
    </Modal>
  );
}

/** Falling petals for a Dawn victory, a dark fog for a Horde one. */
export function VictoryEffects({ game }: { game: GameState }) {
  if (game.phase !== 'over') return null;
  if (game.winner === 'horde') return <div className="defeat-fog" style={{ zIndex: 49 }} />;
  if (game.winner !== 'dawn') return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 49, pointerEvents: 'none', overflow: 'hidden' }}>
      <div className="victory-rays" />
      {Array.from({ length: 26 }, (_, i) => (
        <span key={i} className="petal" style={{ left: `${(i * 37) % 100}%`, ['--px' as string]: `${((i * 23) % 120) - 60}px`, ['--pr' as string]: `${200 + i * 30}deg`, ['--pd' as string]: `${6 + (i % 5)}s`, ['--pdl' as string]: `${-(i * 0.6)}s` } as React.CSSProperties} />
      ))}
    </div>
  );
}

/** Options and test tools. Online, the bot pace belongs to the room and only its owner sets it. */
export function OptionsDialog(props: {
  open: boolean;
  onClose: () => void;
  game: GameState;
  room: RoomView | null;
  isOwner: boolean;
  onRoomSpeed: (speed: BotSpeed) => void;
  speed: BotSpeed;
  onSpeed: (speed: BotSpeed) => void;
  autoplay: boolean;
  onAutoplay: (on: boolean) => void;
  figures: boolean;
  onFigures: (on: boolean) => void;
  onRules: () => void;
  onLog: () => void;
  /** Keeps the game under a name (offline games only; undefined online). */
  onSaveGame?: (name: string) => void;
  defaultSaveName: string;
  onLeave: () => void;
}) {
  const { room } = props;
  const [animLevel, setAnimLevel] = useState(animSpeedLevel());
  const [saveName, setSaveName] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  /** The bot pace as a slider over the three speeds (slow, normal, fast). */
  const speeds = (value: BotSpeed, onChange: (s: BotSpeed) => void, disabled = false): ReactNode => (
    <>
      <input type="range" min={0} max={BOT_SPEEDS.length - 1} step={1} value={BOT_SPEEDS.indexOf(value)} disabled={disabled} data-bot-speed onChange={(e) => onChange(BOT_SPEEDS[Number(e.target.value)])} style={{ flex: 1 }} />
      <b style={{ minWidth: 80 }}>{value}</b>
    </>
  );
  return (
    <Modal open={props.open} onClose={props.onClose}>
      <div>
        <Frame crest style={{ width: 'min(560px, 94vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 17 }}>
          <Ribbon>Opcje</Ribbon>
          {room ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }} title={props.isOwner ? 'Tempo ruchów komputera dla wszystkich w pokoju' : 'Tempo ustawia założyciel pokoju'}>
              Tempo botów (dla całego pokoju) {speeds(room.botSpeed, props.onRoomSpeed, !props.isOwner)}
            </label>
          ) : (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>Tempo botów {speeds(props.speed, props.onSpeed)}</label>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }} title="Szybsze animacje skracają walki: ruchy, ciosy i efekty trwają krócej">
            Szybkość animacji
            <input type="range" min={0} max={ANIM_SPEEDS.length - 1} step={1} value={animLevel} data-anim-speed onChange={(e) => (setAnimLevel(Number(e.target.value)), setAnimSpeedLevel(Number(e.target.value)))} style={{ flex: 1 }} />
            <b style={{ minWidth: 110 }}>{ANIM_SPEED_NAMES[animLevel]}</b>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Muzyka
            <input type="range" min={0} max={1} step={0.05} value={music.volume} onChange={(e) => music.setVolume(Number(e.target.value))} style={{ flex: 1 }} />
            <input type="checkbox" checked={!music.muted} onChange={() => music.toggleMute()} /> włączona
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Efekty
            <input type="range" min={0} max={1} step={0.05} value={sfx.volume} onChange={(e) => sfx.setVolume(Number(e.target.value))} onPointerUp={() => sfx.play('sword_hit')} style={{ flex: 1 }} />
            <input type="checkbox" checked={!sfx.muted} onChange={() => sfx.toggleMute()} /> włączone
          </label>
          {!room && <label><input type="checkbox" checked={props.autoplay} onChange={(e) => props.onAutoplay(e.target.checked)} /> Autoplay: boty grają także za ludzi</label>}
          <label title="Na słabszym komputerze albo telefonie możesz wrócić do okrągłych portretów">
            <input type="checkbox" checked={props.figures} onChange={(e) => props.onFigures(e.target.checked)} /> Figurki 3D na planszy
          </label>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Skróty: Spacja — koniec tury/aktywacji · U — cofnij · F — przewiń boty · D — dziennik · R — zasady · Z — zdolność · S — skarby · Ctrl na jednostce — jej zasięg · Esc — zamknij</div>
          {props.onSaveGame && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" value={saveName} maxLength={40} placeholder={props.defaultSaveName} aria-label="Nazwa zapisu" onChange={(e) => { setSaveName(e.target.value); setSaved(null); }} style={{ flex: 1, minWidth: 160, fontSize: 17, padding: '5px 10px' }} />
              <button className="btn plate parch" style={{ padding: '6px 14px' }} data-save-game onClick={() => { const n = saveName.trim() || props.defaultSaveName; props.onSaveGame!(n); setSaved(n); }}>Zapisz grę</button>
              {saved && <span style={{ color: '#8FE3A0', fontSize: 15 }}>Zapisano: {saved}</span>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start' }}>
            <button className="btn plate parch" style={{ padding: '6px 14px' }} onClick={props.onRules}>Zasady i karty</button>
            <button className="btn plate parch" data-open-log title="Dziennik zdarzeń (D)" style={{ padding: '6px 14px' }} onClick={props.onLog}>Dziennik</button>
          </div>
          <button className="btn prim r" data-leave style={{ padding: '12px 20px', fontSize: 22, width: '100%' }} onClick={props.onLeave}>Wyjdź z gry</button>
          <button className="btn plate parch" data-enter style={{ padding: '6px 14px', alignSelf: 'flex-end' }} onClick={props.onClose}>Zamknij</button>
        </Frame>
      </div>
    </Modal>
  );
}

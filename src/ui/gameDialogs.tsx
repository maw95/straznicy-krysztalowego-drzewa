// Pieces of the App screen that need nothing but their props: the music theme, the controls and layers
// every screen has, and the small game dialogs (confirm, "since your last turn", a found treasure,
// a card, the options) and the end-of-game effects.

import type { ReactNode } from 'react';
import type { ItemKind } from '../engine/data';
import type { GameState, LogEntry } from '../engine/types';
import type { BotSpeed, RoomView } from '../online/api';
import { BOT_SPEEDS } from '../online/api';
import { Frame, Modal, Ribbon, SvgDefs } from './common';
import { DetailsLayer } from './details';
import { FullscreenButton } from './fullscreen';
import { HoverCardLayer } from './hover';
import { music, type Theme } from './music';
import { RulesDialog } from './RulesDialog';
import { TreasureCard } from './TreasureCard';
import { TreasureReveal } from './CardBack';
import { UnitCard } from './UnitCard';

/** The music for what is on screen: menu, map, battle, a guardian fight, the ritual or the end of the game. */
export function musicTheme(game: GameState | null): Theme {
  if (!game) return 'menu';
  if (game.setup.mode === 'arena') {
    if (game.phase === 'battle') return 'battle';
    return game.winner === 'dawn' ? 'dawnVictory' : game.winner === 'horde' ? 'hordeVictory' : 'none';
  }
  if (game.phase === 'over') return game.winner === 'dawn' ? 'dawnVictory' : 'hordeVictory';
  if (game.phase === 'battle' && (game.battle?.stage === 'fight' || game.battle?.stage === 'deploy')) return game.battle.kind === 'neutral' ? 'guardian' : 'battle';
  return game.ritual > 0 ? 'ritual' : 'adventure';
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
  yes: string;
  onYes: () => void;
}

export function ConfirmDialog({ confirm, onClose }: { confirm: Confirmation | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(confirm)} onClose={onClose}>
      {confirm && (
        <Frame crest style={{ width: 'min(480px, 94vw)' }} innerStyle={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 20, lineHeight: 1.35 }}>{confirm.text}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn plate parch" style={{ padding: '8px 18px', fontSize: 18 }} onClick={onClose}>Anuluj</button>
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
  onExportGame: () => void;
  onExportLog: () => void;
  onLeave: () => void;
}) {
  const { game, room } = props;
  const speeds = (value: BotSpeed, onChange: (s: BotSpeed) => void, disabled = false): ReactNode => (
    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as BotSpeed)}>
      {BOT_SPEEDS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
  return (
    <Modal open={props.open} onClose={props.onClose}>
      <div>
        <Frame crest style={{ width: 'min(560px, 94vw)' }} innerStyle={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 17 }}>
          <Ribbon>Opcje i narzędzia testowe</Ribbon>
          {room ? (
            <label title={props.isOwner ? 'Tempo ruchów komputera dla wszystkich w pokoju' : 'Tempo ustawia założyciel pokoju'}>
              Tempo botów (dla całego pokoju) {speeds(room.botSpeed, props.onRoomSpeed, !props.isOwner)}
            </label>
          ) : (
            <label>Tempo botów {speeds(props.speed, props.onSpeed)}</label>
          )}
          {!room && <label><input type="checkbox" checked={props.autoplay} onChange={(e) => props.onAutoplay(e.target.checked)} /> Autoplay — boty grają także za ludzi</label>}
          <label title="Na słabszym komputerze albo telefonie możesz wrócić do okrągłych portretów">
            <input type="checkbox" checked={props.figures} onChange={(e) => props.onFigures(e.target.checked)} /> Figurki 3D na planszy
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Muzyka
            <input type="range" min={0} max={1} step={0.05} value={music.volume} onChange={(e) => music.setVolume(Number(e.target.value))} style={{ flex: 1 }} />
            <input type="checkbox" checked={!music.muted} onChange={() => music.toggleMute()} /> włączona
          </label>
          <div>Ziarno partii: <b>{game.setup.seed}</b> · akcji: {game.actionCount} · gra zapisuje się automatycznie</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Skróty: Spacja — koniec tury/aktywacji · U — cofnij · F — przewiń boty · D — dziennik · R — zasady · Z — zdolność · S — skarby · Ctrl na jednostce — jej zasięg · Esc — zamknij</div>
          <button className="btn plate parch" style={{ padding: '6px 14px', alignSelf: 'flex-start' }} onClick={props.onRules}>Zasady i karty</button>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn prim" style={{ padding: '6px 14px' }} onClick={props.onExportGame}>Eksport partii (JSON)</button>
            <button className="btn prim" style={{ padding: '6px 14px' }} onClick={props.onExportLog}>Eksport dziennika</button>
            <button className="btn prim r" style={{ padding: '6px 14px' }} onClick={props.onLeave}>{room ? 'Wyjdź z gry' : 'Nowa gra'}</button>
          </div>
          <button className="btn plate parch" data-enter style={{ padding: '6px 14px', alignSelf: 'flex-end' }} onClick={props.onClose}>Zamknij</button>
        </Frame>
      </div>
    </Modal>
  );
}

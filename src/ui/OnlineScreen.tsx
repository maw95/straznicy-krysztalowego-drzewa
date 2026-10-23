import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { FACTION_HEROES, FACTION_NAMES, MAP_SIZE_NAMES, UNITS, type FactionId, type MapSize } from '../engine/data';
import type { Level, Mode } from '../engine/types';
import { currentUser, OnlineSession, signIn, signOut, type OnlineState, type RoomView, type TableConfig, type User } from '../online/api';
import { asset, Frame, Portrait, Ribbon, SIDE_RING } from './common';
import { ARENA_HINT, ARENA_LEVEL_TIPS, LEVEL_HINT, LEVEL_TIPS, LEVELS, mapTip, Row, SEAT_TINT, Tip, TIPS } from './SetupScreen';

/** The session's latest state; re-renders on every message from the server. */
export function useOnline(session: OnlineSession): OnlineState {
  return useSyncExternalStore(
    (listener) => session.subscribe(listener),
    () => session.state,
  );
}

/**
 * "Gra online": logging in, then creating or joining a room, then the room before the start.
 * The game itself is played on the usual screens (App), once the room starts.
 */
export function OnlineScreen({ session, onSession, onBack }: { session: OnlineSession | null; onSession: (s: OnlineSession | null) => void; onBack: () => void }) {
  const [checking, setChecking] = useState(!session);
  const [problem, setProblem] = useState<string | null>(null);

  // A saved session logs in by itself.
  useEffect(() => {
    if (session) return;
    let live = true;
    currentUser()
      .then((user) => live && user && onSession(new OnlineSession(user)))
      .catch((e: Error) => live && setProblem(e.message))
      .finally(() => live && setChecking(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen slate screen-enter" style={{ alignItems: 'center', paddingTop: 16, gap: 18 }}>
      <img src={asset('ui/cover.jpg')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', opacity: 0.3 }} />
      <h1 style={{ margin: 0, lineHeight: 0, position: 'relative' }}>
        <img className="logo-glow" src={asset('ui/logo.png')} alt="Strażnicy Kryształowego Drzewa" style={{ height: 'clamp(70px, 11vh, 110px)' }} />
      </h1>
      {session ? (
        <Lobby session={session} onSignOut={() => onSession(null)} onBack={onBack} />
      ) : checking ? (
        <Frame crest style={{ width: 'min(420px, 94vw)', position: 'relative' }} innerStyle={{ padding: 26, textAlign: 'center', fontSize: 19 }}>
          Łączenie z serwerem gry…
        </Frame>
      ) : (
        <SignIn problem={problem} onUser={(user) => onSession(new OnlineSession(user))} onBack={onBack} />
      )}
    </div>
  );
}

function SignIn({ problem, onUser, onBack }: { problem: string | null; onUser: (u: User) => void; onBack: () => void }) {
  const [kind, setKind] = useState<'login' | 'register'>('login');
  const [nick, setNick] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(problem);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      onUser((await signIn(kind, nick, password)).user);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  const choice = (active: boolean) => `btn plate parch ${active ? 'on' : ''}`;
  return (
    <Frame crest style={{ width: 'min(460px, 94vw)', position: 'relative' }} innerStyle={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Ribbon style={{ width: 'min(340px, 80vw)', alignSelf: 'center' }}>Gra online</Ribbon>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className={choice(kind === 'login')} style={{ padding: '4px 16px', fontSize: 17 }} onClick={() => setKind('login')}>Logowanie</button>
        <button className={choice(kind === 'register')} style={{ padding: '4px 16px', fontSize: 17 }} onClick={() => setKind('register')}>Nowe konto</button>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 18 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Nick
          <input type="text" value={nick} autoFocus autoComplete="username" onChange={(e) => setNick(e.target.value)} style={{ fontSize: 18, padding: '6px 10px' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Hasło
          <input type="password" value={password} autoComplete={kind === 'login' ? 'current-password' : 'new-password'} onChange={(e) => setPassword(e.target.value)} style={{ fontSize: 18, padding: '6px 10px' }} />
        </label>
        {kind === 'register' && <div style={{ fontSize: 15, color: 'var(--muted)' }}>Nick: 3–20 znaków (litery, cyfry, „_”, „-”). Hasło: co najmniej 4 znaki. Konta nie da się odzyskać — zapamiętaj hasło.</div>}
        {error && <div role="alert" style={{ color: '#F08A7A', fontWeight: 700 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 4 }}>
          <button type="button" className="btn plate parch" style={{ padding: '8px 18px', fontSize: 18 }} onClick={onBack}>Wróć</button>
          <button type="submit" className="btn prim" disabled={busy || !nick.trim() || !password} style={{ padding: '8px 24px', fontSize: 20 }}>
            {kind === 'login' ? 'Zaloguj' : 'Załóż konto'}
          </button>
        </div>
      </form>
    </Frame>
  );
}

function Lobby({ session, onSignOut, onBack }: { session: OnlineSession; onSignOut: () => void; onBack: () => void }) {
  const online = useOnline(session);
  const [code, setCode] = useState('');
  const { room, user } = online;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 17 }}>
        <span>
          Zalogowano jako <b style={{ color: '#F3D27A' }}>{user.nick}</b>
        </span>
        <span title={online.connected ? 'Połączono z serwerem' : 'Łączenie z serwerem…'} style={{ color: online.connected ? '#8FE3A0' : '#F0B35A' }}>
          {online.connected ? '● połączono' : '● łączenie…'}
        </span>
        <button
          className="btn plate parch"
          style={{ padding: '3px 12px', fontSize: 15 }}
          onClick={() => {
            session.close();
            void signOut();
            onSignOut();
          }}
        >
          Wyloguj
        </button>
      </div>
      {online.error && (
        <div className="plate parch" role="alert" style={{ padding: '6px 14px', fontWeight: 700, color: '#8A1A1A', cursor: 'pointer' }} onClick={() => session.clearError()}>
          {online.error}
        </div>
      )}
      {!room ? (
        <Frame crest style={{ width: 'min(520px, 94vw)' }} innerStyle={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <Ribbon style={{ width: 'min(340px, 80vw)' }}>Gra online</Ribbon>
          <button className="btn prim" style={{ height: 52, padding: '0 30px', fontSize: 21 }} disabled={!online.connected} onClick={() => session.send({ type: 'createRoom' })}>
            Załóż pokój
          </button>
          <div className="lbl">albo dołącz kodem od znajomego</div>
          <form
            style={{ display: 'flex', gap: 10 }}
            onSubmit={(e) => {
              e.preventDefault();
              session.send({ type: 'joinRoom', code });
            }}
          >
            <input type="text" value={code} placeholder="np. SMOK-4821" aria-label="Kod pokoju" onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ fontSize: 19, padding: '6px 10px', width: 170, letterSpacing: 1 }} />
            <button type="submit" className="btn prim" disabled={!online.connected || !code.trim()} style={{ padding: '6px 20px', fontSize: 19 }}>Dołącz</button>
          </form>
          <button className="btn plate parch" style={{ padding: '6px 18px', fontSize: 17, alignSelf: 'flex-start' }} onClick={onBack}>Wróć do menu</button>
        </Frame>
      ) : (
        <RoomLobby session={session} room={room} me={user} chat={online.chat} />
      )}
    </div>
  );
}

const defaultTable = (mode: Mode, count: number, level: Level): TableConfig => {
  const seats: TableConfig['seats'] =
    mode === 'arena'
      ? [
          { faction: 'dawn', heroId: FACTION_HEROES.dawn[0], bot: false },
          { faction: 'horde', heroId: FACTION_HEROES.horde[0], bot: true },
        ]
      : Array.from({ length: count }, (_, i) => {
          const faction: FactionId = mode === 'coop' || i % 2 === 0 ? 'dawn' : 'horde';
          return { faction, heroId: FACTION_HEROES[faction][mode === 'coop' ? i : Math.floor(i / 2)], bot: false };
        });
  return { mode, mapSize: 'short', level: mode === 'pvp' && level === 'hard' ? 'normal' : level, seats };
};

function RoomLobby({ session, room, me, chat }: { session: OnlineSession; room: RoomView; me: User; chat: OnlineState['chat'] }) {
  const owner = room.ownerId === me.id;
  const table: TableConfig = { mode: room.mode, mapSize: room.mapSize, level: room.level, seats: room.seats.map(({ faction, heroId, bot }) => ({ faction, heroId, bot })) };
  const configure = (patch: Partial<TableConfig>) => session.send({ type: 'configure', table: { ...table, ...patch } });
  const updateSeat = (i: number, patch: Partial<TableConfig['seats'][number]>) => configure({ seats: table.seats.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const takenBy = (heroId: string, i: number) => table.seats.some((s, j) => j !== i && s.heroId === heroId);
  const ready = room.seats.every((s) => s.bot || s.player);
  const arena = room.mode === 'arena';
  const choice = (active: boolean) => `btn plate parch ${active ? 'on' : ''}`;
  const chip = { padding: '4px 14px', fontSize: 17 };
  const [copied, setCopied] = useState(false);

  return (
    <div className="main-row setup-row" style={{ width: '100%', gap: 16 }}>
      <Frame crest className="grow" innerClass="slate scroll" innerStyle={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div className="lbl">Kod pokoju</div>
          <b style={{ fontSize: 30, letterSpacing: 2, color: '#F3D27A' }}>{room.code}</b>
          <button
            className="btn plate parch"
            style={{ padding: '3px 12px', fontSize: 15 }}
            onClick={() => {
              void navigator.clipboard?.writeText(room.code).then(() => setCopied(true));
            }}
          >
            {copied ? 'Skopiowano' : 'Kopiuj'}
          </button>
          <span style={{ fontSize: 15, color: 'var(--muted)' }}>Podaj kod znajomym — dołączą przez „Gra online”.</span>
        </div>
        {!owner && <div style={{ fontSize: 15, color: 'var(--muted)' }}>Stół ustawia założyciel pokoju: {room.members.find((m) => m.id === room.ownerId)?.nick}.</div>}
        <Row label="Tryb">
          {(['coop', 'pvp', 'arena'] as Mode[]).map((m) => (
            <Tip key={m} text={m === 'coop' ? TIPS.coop : m === 'pvp' ? TIPS.pvp : TIPS.arenaMode}>
              <button className={choice(room.mode === m)} style={chip} disabled={!owner} onClick={() => configure(defaultTable(m, m === 'pvp' ? 2 : 1, room.level))}>
                {m === 'coop' ? 'Kooperacja' : m === 'pvp' ? 'Rywalizacja' : 'Arena'}
              </button>
            </Tip>
          ))}
        </Row>
        {!arena && (
          <>
            <Row label="Gracze">
              {(room.mode === 'coop' ? [1, 2] : [2, 3, 4]).map((n) => (
                <button key={n} className={choice(room.seats.length === n)} style={chip} disabled={!owner} onClick={() => configure({ seats: defaultTable(room.mode, n, room.level).seats })}>
                  {n}
                </button>
              ))}
            </Row>
            <Row label="Mapa">
              {(Object.keys(MAP_SIZE_NAMES) as MapSize[]).map((m) => (
                <Tip key={m} text={mapTip(m)}>
                  <button className={choice(room.mapSize === m)} style={chip} disabled={!owner} onClick={() => configure({ mapSize: m })}>{MAP_SIZE_NAMES[m]}</button>
                </Tip>
              ))}
            </Row>
          </>
        )}
        {arena && <div style={{ fontSize: 15, color: 'var(--muted)' }}>{ARENA_HINT}</div>}
        <Row label={arena ? 'Komputer' : 'Poziom'}>
          {LEVELS.filter(([l]) => l !== 'custom' && (l !== 'hard' || room.mode !== 'pvp')).map(([l, label]) => (
            <Tip key={l} text={arena ? ARENA_LEVEL_TIPS[l as Level] : LEVEL_TIPS[l]}>
              <button className={choice(room.level === l)} style={chip} disabled={!owner} onClick={() => configure({ level: l as Level })}>{label}</button>
            </Tip>
          ))}
        </Row>
        {!arena && <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -4 }}>{LEVEL_HINT[room.level]}</div>}
        <Row label="Tempo botów">
          {(['wolno', 'normalnie', 'szybko'] as const).map((speed) => (
            <button key={speed} className={choice(room.botSpeed === speed)} style={chip} disabled={!owner} onClick={() => session.send({ type: 'botSpeed', speed })}>
              {speed}
            </button>
          ))}
        </Row>

        <div className="lbl" style={{ marginTop: 6 }}>Miejsca przy stole</div>
        {room.seats.map((s, i) => {
          const mine = s.player?.id === me.id;
          return (
            <div key={i} className="well" style={{ padding: '6px 12px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: SEAT_TINT[s.faction] }}>
              <img src={asset(`cards/crests/${s.faction}.png`)} alt="" title={FACTION_NAMES[s.faction]} style={{ width: 46, height: 46, objectFit: 'contain', flex: 'none' }} />
              {owner && room.mode === 'pvp' && (
                <select value={s.faction} aria-label="Frakcja" onChange={(e) => updateSeat(i, { faction: e.target.value as FactionId, heroId: FACTION_HEROES[e.target.value as FactionId].find((h) => !takenBy(h, i))! })}>
                  <option value="dawn">{FACTION_NAMES.dawn}</option>
                  <option value="horde">{FACTION_NAMES.horde}</option>
                </select>
              )}
              {owner && (
                <select value={s.bot ? 'bot' : 'human'} aria-label="Kto gra" onChange={(e) => updateSeat(i, { bot: e.target.value === 'bot' })}>
                  <option value="human">Gracz</option>
                  <option value="bot">Komputer</option>
                </select>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                {(owner ? FACTION_HEROES[s.faction] : [s.heroId]).map((h) => (
                  <button key={h} className="btn" title={UNITS[h].name} disabled={!owner || takenBy(h, i)} onClick={() => updateSeat(i, { heroId: h })} style={{ background: 'none', border: 0, padding: 0 }}>
                    <Portrait unitId={h} size={46} ring={SIDE_RING[s.faction]} glow={s.heroId === h ? '0 0 0 3px #9EE4FF, 0 0 10px 3px rgba(158,228,255,0.6)' : undefined} dim={takenBy(h, i)} />
                  </button>
                ))}
              </div>
              <div style={{ fontWeight: 700, color: '#F3D27A', minWidth: 140 }}>{UNITS[s.heroId].name}</div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 18 }}>
                {s.bot ? (
                  <i style={{ color: 'var(--muted)' }}>Komputer</i>
                ) : s.player ? (
                  <>
                    <b>{s.player.nick}{mine ? ' (Ty)' : ''}</b>
                    {mine && <button className="btn plate parch" style={{ padding: '3px 12px', fontSize: 15 }} onClick={() => session.send({ type: 'leaveSeat', seat: i })}>Zwolnij</button>}
                  </>
                ) : (
                  <button className="btn prim" style={{ padding: '4px 16px', fontSize: 17 }} onClick={() => session.send({ type: 'takeSeat', seat: i })}>Zajmij miejsce</button>
                )}
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 15, color: 'var(--muted)' }}>Możesz zająć kilka miejsc — zagrasz nimi na zmianę przy tym samym komputerze.</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
          <button className="btn plate parch" style={{ padding: '8px 18px', fontSize: 18 }} onClick={() => session.send({ type: 'leaveRoom' })}>Wyjdź z pokoju</button>
          {owner ? (
            <button className="btn prim" disabled={!ready} title={ready ? undefined : 'Każde miejsce musi zająć gracz albo komputer.'} style={{ height: 54, padding: '0 36px', fontSize: 23 }} onClick={() => session.send({ type: 'start' })}>
              Rozpocznij grę
            </button>
          ) : (
            <div style={{ fontSize: 17, color: 'var(--muted)', alignSelf: 'center' }}>Grę rozpocznie założyciel pokoju.</div>
          )}
        </div>
      </Frame>
      <Frame style={{ width: 'min(340px, 94vw)', flex: 'none' }} innerClass="slate" innerStyle={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        <div className="lbl">W pokoju</div>
        {room.members.map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}>
            <span style={{ color: m.online ? '#8FE3A0' : '#8A8A8A' }}>●</span>
            <span>{m.nick}</span>
            {m.id === room.ownerId && <span style={{ fontSize: 14, color: 'var(--muted)' }}>(założyciel)</span>}
          </div>
        ))}
        <ChatBox session={session} chat={chat} />
      </Frame>
    </div>
  );
}

/** Room chat: messages live only while the server runs (no history is kept). */
export function ChatBox({ session, chat, height = 260 }: { session: OnlineSession; chat: OnlineState['chat']; height?: number }) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [chat.length]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
      <div className="lbl">Czat</div>
      <div className="well scroll" style={{ height, padding: '6px 10px', fontSize: 16, lineHeight: 1.35 }}>
        {chat.length === 0 && <i style={{ color: 'var(--muted)' }}>Na razie cisza.</i>}
        {chat.map((m, i) => (
          <div key={i}>
            <b style={{ color: '#F3D27A' }}>{m.from}:</b> {m.text}
          </div>
        ))}
        <div ref={end} />
      </div>
      <form
        style={{ display: 'flex', gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          session.send({ type: 'chat', text });
          setText('');
        }}
      >
        <input type="text" value={text} maxLength={300} aria-label="Wiadomość" placeholder="Napisz…" onChange={(e) => setText(e.target.value)} style={{ flex: 1, minWidth: 0, fontSize: 16, padding: '4px 8px' }} />
        <button type="submit" className="btn prim" style={{ padding: '4px 14px', fontSize: 16 }}>Wyślij</button>
      </form>
    </div>
  );
}

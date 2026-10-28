import { useEffect, useRef, useState } from 'react';
import { FACTION_HEROES, FACTION_NAMES, MAP_SIZE_NAMES, UNITS, type FactionId, type MapSize } from '../engine/data';
import type { Level, Mode } from '../engine/types';
import { BOT_SPEEDS, currentUser, fetchRanking, OnlineSession, savedToken, signIn, signOut, type Invitation, type OnlineState, type PlayerOnline, type RankingRow, type RoomView, type TableConfig, type User } from '../online/api';
import { useOnline } from '../online/useOnline';
import { asset, Frame, Portrait, Ribbon, SIDE_RING } from './common';
import { ARENA_HINT, ARENA_LEVEL_TIPS, choice, CHIP, LEVEL_HINT, LEVEL_TIPS, LEVELS, mapTip, Row, SEAT_TINT, Tip, TIPS } from './setupShared';

/** Links of the main menu that do not depend on the account. */
export interface MenuLinks {
  onRules: () => void;
  onIntro: () => void;
  onChangelog: () => void;
  onTesters: () => void;
}

/**
 * The start of the game: with a saved session straight into the online menu, otherwise a choice —
 * log in, create an account, or play without one (only on this computer). The online menu has new rooms,
 * the ranking, players online with "Zaproś" and the general chat; a room shows its table before the start.
 * The game itself is played on the usual screens (App), once the room starts.
 */
export function OnlineScreen({ session, onSession, onLocalGame, onOffline, links }: { session: OnlineSession | null; onSession: (s: OnlineSession | null) => void; onLocalGame: () => void; onOffline: () => void; links: MenuLinks }) {
  // Only a saved session needs the server before anything shows; without one the welcome comes at once.
  const [checking, setChecking] = useState(!session && savedToken() !== null);
  const [problem, setProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // A saved session logs in by itself.
  useEffect(() => {
    if (session || savedToken() === null) return;
    let live = true;
    setChecking(true);
    setProblem(null);
    currentUser()
      .then((user) => live && user && onSession(new OnlineSession(user)))
      .catch((e: Error) => live && setProblem(e.message))
      .finally(() => live && setChecking(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return (
    <div className="screen slate screen-enter" style={{ alignItems: 'center', paddingTop: 16, gap: 14 }}>
      <img className="ken-burns" src={asset('ui/cover.jpg')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', opacity: 0.3 }} />
      <h1 style={{ margin: 0, lineHeight: 0, position: 'relative' }}>
        <img className="logo-glow" src={asset('ui/logo.png')} alt="Strażnicy Kryształowego Drzewa" style={{ height: 'clamp(70px, 11vh, 110px)' }} />
      </h1>
      {session ? (
        <Home session={session} onSignOut={() => onSession(null)} onLocalGame={onLocalGame} links={links} />
      ) : checking ? (
        <Frame crest style={{ width: 'min(420px, 94vw)', position: 'relative' }} innerStyle={{ padding: 26, textAlign: 'center', fontSize: 19 }}>
          Łączenie z serwerem gry…
        </Frame>
      ) : (
        <Welcome problem={problem} onRetry={() => setAttempt((a) => a + 1)} onUser={(user) => onSession(new OnlineSession(user))} onOffline={onOffline} />
      )}
    </div>
  );
}

/** Log in, create an account, or play without one (only on this computer: no online play, no ranking). */
function Welcome({ problem, onRetry, onUser, onOffline }: { problem: string | null; onRetry: () => void; onUser: (u: User) => void; onOffline: () => void }) {
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
  return (
    <Frame crest style={{ width: 'min(460px, 94vw)', position: 'relative' }} innerStyle={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Ribbon style={{ width: 'min(340px, 80vw)', alignSelf: 'center' }}>Witaj, Strażniku!</Ribbon>
      <div style={{ fontSize: 17, textAlign: 'center', lineHeight: 1.35 }}>Zaloguj się, żeby grać ze znajomymi przez internet i walczyć o miejsce w rankingu.</div>
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
        {error && (
          <div role="alert" style={{ color: '#F08A7A', fontWeight: 700 }}>
            {error}{' '}
            {error === problem && (
              <button type="button" className="btn plate parch" style={{ padding: '2px 10px', fontSize: 15 }} onClick={onRetry}>
                Spróbuj ponownie
              </button>
            )}
          </div>
        )}
        <button type="submit" className="btn prim" disabled={busy || !nick.trim() || !password} style={{ padding: '8px 24px', fontSize: 21, alignSelf: 'center' }}>
          {kind === 'login' ? 'Zaloguj' : 'Załóż konto'}
        </button>
      </form>
      <div style={{ borderTop: '1px solid rgba(243, 210, 122, 0.25)', paddingTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <button className="btn plate parch" style={{ padding: '6px 18px', fontSize: 17 }} onClick={onOffline}>
          Graj bez konta
        </button>
        <div style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>Tylko na tym komputerze: z botami albo z kimś przy jednym ekranie. Bez gry online i bez rankingu.</div>
      </div>
    </Frame>
  );
}

function Home({ session, onSignOut, onLocalGame, links }: { session: OnlineSession; onSignOut: () => void; onLocalGame: () => void; links: MenuLinks }) {
  const online = useOnline(session);
  const [code, setCode] = useState('');
  const { room, user } = online;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 1300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 17, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span>
          Zalogowano jako <b style={{ color: '#F3D27A' }}>{user.nick}</b>
        </span>
        <span title={online.connected ? 'Połączono z serwerem' : 'Łączenie z serwerem…'} style={{ color: online.connected ? '#8FE3A0' : '#F0B35A' }}>
          {online.connected ? '● połączono' : online.idle ? '● rozłączono' : '● łączenie…'}
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
      {room ? (
        <RoomLobby session={session} room={room} me={user} online={online} />
      ) : (
        <div className="main-row setup-row" style={{ width: '100%', gap: 16 }}>
          <Frame crest className="grow" innerClass="slate scroll" innerStyle={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <Ribbon style={{ width: 'min(380px, 80vw)' }}>Graj ze znajomymi</Ribbon>
            <button className="btn prim" style={{ height: 58, padding: '0 40px', fontSize: 24 }} disabled={!online.connected} onClick={() => session.send({ type: 'createRoom' })}>
              Nowy pokój
            </button>
            <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -6 }}>…i zaproś graczy z listy obok — albo kliknij „Zaproś” od razu, pokój założy się sam.</div>
            <form
              style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}
              onSubmit={(e) => {
                e.preventDefault();
                session.send({ type: 'joinRoom', code });
              }}
            >
              <span className="lbl">Masz kod pokoju?</span>
              <input type="text" value={code} placeholder="np. SMOK-4821" aria-label="Kod pokoju" onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ fontSize: 18, padding: '5px 10px', width: 160, letterSpacing: 1 }} />
              <button type="submit" className="btn plate parch" disabled={!online.connected || !code.trim()} style={{ padding: '5px 16px', fontSize: 17 }}>Dołącz</button>
            </form>
            <button className="btn plate parch" style={{ padding: '7px 20px', fontSize: 18 }} onClick={onLocalGame} title="Z botami albo z kimś przy jednym ekranie — gry przeciw komputerowi liczą się do rankingu">
              Gra na tym komputerze
            </button>
            <RankingTable me={user} refreshKey={room === null && online.connected} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 'auto' }}>
              <button className="btn plate parch" style={{ padding: '4px 12px', fontSize: 15 }} onClick={links.onRules}>Zasady i karty</button>
              <button className="btn plate parch" style={{ padding: '4px 12px', fontSize: 15 }} onClick={links.onIntro}>Wprowadzenie</button>
              <button className="btn plate parch" style={{ padding: '4px 12px', fontSize: 15 }} onClick={links.onTesters} title="Uwagi o grze i zgłoszone błędy — prosto do twórcy">Dla testerów</button>
              <button className="app-version" title="Historia zmian" onClick={links.onChangelog}>Wersja {__APP_VERSION__}</button>
            </div>
          </Frame>
          <Frame className="side" style={{ width: 'min(360px, 94vw)', flex: 'none' }} innerClass="slate" innerStyle={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
            <PlayersOnline session={session} online={online} />
            <ChatBox title="Czat ogólny" messages={online.generalChat} onSend={(text) => session.send({ type: 'generalChat', text })} />
          </Frame>
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<PlayerOnline['status'], string> = { menu: 'w menu', room: 'w pokoju', game: 'w grze' };
const STATUS_COLOR: Record<PlayerOnline['status'], string> = { menu: '#8FE3A0', room: '#9EE4FF', game: '#F0B35A' };

/** Everyone online, with where they are and "Zaproś" (not for those playing or already in your room). */
function PlayersOnline({ session, online }: { session: OnlineSession; online: OnlineState }) {
  const inRoom = new Set(online.room?.members.map((m) => m.id) ?? []);
  const others = online.players.filter((p) => p.id !== online.user.id);
  const roomStarted = online.room !== null && online.room.status !== 'lobby';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="lbl">Gracze online ({others.length})</div>
      <div className="scroll" style={{ maxHeight: 220, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {others.length === 0 && <i style={{ color: 'var(--muted)', fontSize: 16 }}>Nikogo poza Tobą — podeślij znajomym link do gry.</i>}
        {others.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}>
            <span style={{ color: STATUS_COLOR[p.status] }}>●</span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nick}</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{inRoom.has(p.id) ? 'w Twoim pokoju' : STATUS_LABEL[p.status]}</span>
            {!inRoom.has(p.id) && !roomStarted && (
              <button className="btn prim" style={{ padding: '2px 10px', fontSize: 14 }} disabled={p.status === 'game' || !online.connected} title={p.status === 'game' ? `${p.nick} właśnie gra` : `Zaproś ${p.nick} do pokoju`} onClick={() => session.send({ type: 'invite', userId: p.id })}>
                Zaproś
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const TROPHY = ['zloty', 'srebrny', 'brazowy'] as const;
const PODIUM_COLOR = ['#F3D27A', '#DDE3EA', '#E0A270'];

/** The top 10 by points; places 1–3 bigger, in gold, silver and bronze, with a cup. Your own place below, if lower. */
function RankingTable({ me, refreshKey }: { me: User; refreshKey: unknown }) {
  const [data, setData] = useState<{ top: RankingRow[]; me: RankingRow | null } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetchRanking()
      .then((d) => live && setData(d))
      .catch((e: Error) => live && setProblem(e.message));
    return () => {
      live = false;
    };
  }, [refreshKey]);
  const row = (r: RankingRow, own = false) => {
    const podium = r.place <= 3 ? r.place - 1 : -1;
    const style: React.CSSProperties = podium >= 0 ? { color: PODIUM_COLOR[podium], fontWeight: 800, fontSize: 19 } : { fontSize: 17 };
    return (
      <tr key={`${r.id}${own ? '-me' : ''}`} style={{ ...style, background: r.id === me.id ? 'rgba(158, 228, 255, 0.12)' : undefined }}>
        <td style={{ textAlign: 'right', paddingRight: 8 }}>{r.place}.</td>
        <td>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {podium >= 0 && <img src={asset(`ui/puchar_${TROPHY[podium]}.png`)} alt={`${r.place}. miejsce`} style={{ width: 28, height: 28 }} />}
            {r.nick}
            {r.id === me.id && <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>(Ty)</span>}
          </span>
        </td>
        <td style={{ textAlign: 'right' }}>{r.points}</td>
        <td style={{ textAlign: 'right' }}>{r.games}</td>
        <td style={{ textAlign: 'right' }}>{r.winRate}%</td>
      </tr>
    );
  };
  return (
    <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
      <Ribbon style={{ width: 'min(300px, 70vw)', alignSelf: 'center' }}>Ranking</Ribbon>
      <div className="well" style={{ padding: '8px 14px' }}>
        {!data ? (
          <i style={{ color: 'var(--muted)' }}>{problem ?? 'Wczytywanie…'}</i>
        ) : data.top.length === 0 ? (
          <i style={{ color: 'var(--muted)' }}>Nikt jeszcze nie skończył gry — możesz być pierwszy!</i>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', lineHeight: 1.6 }}>
            <thead>
              <tr className="lbl" style={{ textAlign: 'right' }}>
                <th />
                <th style={{ textAlign: 'left' }}>Gracz</th>
                <th>Punkty</th>
                <th>Gry</th>
                <th>Wygrane</th>
              </tr>
            </thead>
            <tbody>
              {data.top.map((r) => row(r))}
              {data.me && (
                <>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', lineHeight: 1 }}>⋯</td>
                  </tr>
                  {row(data.me, true)}
                </>
              )}
            </tbody>
          </table>
        )}
      </div>
      {data && !data.top.some((r) => r.id === me.id) && !data.me && <div style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>Skończ pierwszą grę, żeby trafić do rankingu.</div>}
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

function RoomLobby({ session, room, me, online }: { session: OnlineSession; room: RoomView; me: User; online: OnlineState }) {
  const owner = room.ownerId === me.id;
  const table: TableConfig = { mode: room.mode, mapSize: room.mapSize, level: room.level, seats: room.seats.map(({ faction, heroId, bot }) => ({ faction, heroId, bot })) };
  const configure = (patch: Partial<TableConfig>) => session.send({ type: 'configure', table: { ...table, ...patch } });
  const updateSeat = (i: number, patch: Partial<TableConfig['seats'][number]>) => configure({ seats: table.seats.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const takenBy = (heroId: string, i: number) => table.seats.some((s, j) => j !== i && s.heroId === heroId);
  const ready = room.seats.every((s) => s.bot || s.player);
  const arena = room.mode === 'arena';
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
          <span style={{ fontSize: 15, color: 'var(--muted)' }}>Zaproś graczy z listy obok albo podaj im ten kod („Masz kod pokoju?” w menu).</span>
        </div>
        {!owner && <div style={{ fontSize: 15, color: 'var(--muted)' }}>Stół ustawia założyciel pokoju: {room.members.find((m) => m.id === room.ownerId)?.nick}.</div>}
        <Row label="Tryb">
          {(['coop', 'pvp', 'arena'] as Mode[]).map((m) => (
            <Tip key={m} text={m === 'coop' ? TIPS.coop : m === 'pvp' ? TIPS.pvp : TIPS.arenaMode}>
              <button className={choice(room.mode === m)} style={CHIP} disabled={!owner} onClick={() => configure(defaultTable(m, m === 'pvp' ? 2 : 1, room.level))}>
                {m === 'coop' ? 'Kooperacja' : m === 'pvp' ? 'Rywalizacja' : 'Arena'}
              </button>
            </Tip>
          ))}
        </Row>
        {!arena && (
          <>
            <Row label="Gracze">
              {(room.mode === 'coop' ? [1, 2] : [2, 3, 4]).map((n) => (
                <button key={n} className={choice(room.seats.length === n)} style={CHIP} disabled={!owner} onClick={() => configure({ seats: defaultTable(room.mode, n, room.level).seats })}>
                  {n}
                </button>
              ))}
            </Row>
            <Row label="Mapa">
              {(Object.keys(MAP_SIZE_NAMES) as MapSize[]).map((m) => (
                <Tip key={m} text={mapTip(m)}>
                  <button className={choice(room.mapSize === m)} style={CHIP} disabled={!owner} onClick={() => configure({ mapSize: m })}>{MAP_SIZE_NAMES[m]}</button>
                </Tip>
              ))}
            </Row>
          </>
        )}
        {arena && <div style={{ fontSize: 15, color: 'var(--muted)' }}>{ARENA_HINT}</div>}
        <Row label={arena ? 'Komputer' : 'Poziom'}>
          {LEVELS.filter(([l]) => l !== 'custom' && (l !== 'hard' || room.mode !== 'pvp')).map(([l, label]) => (
            <Tip key={l} text={arena ? ARENA_LEVEL_TIPS[l as Level] : LEVEL_TIPS[l]}>
              <button className={choice(room.level === l)} style={CHIP} disabled={!owner} onClick={() => configure({ level: l as Level })}>{label}</button>
            </Tip>
          ))}
        </Row>
        {!arena && <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: -4 }}>{LEVEL_HINT[room.level]}</div>}
        <Row label="Tempo botów">
          {BOT_SPEEDS.map((speed) => (
            <button key={speed} className={choice(room.botSpeed === speed)} style={CHIP} disabled={!owner} onClick={() => session.send({ type: 'botSpeed', speed })}>
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
        <PlayersOnline session={session} online={online} />
        <ChatBox title="Czat pokoju" messages={online.chat} onSend={(text) => session.send({ type: 'chat', text })} height={200} />
      </Frame>
    </div>
  );
}

/** A chat (the room's or the general one): messages live only while the server runs (no history is kept). */
export function ChatBox({ title = 'Czat', messages: chat, onSend, height = 260 }: { title?: string; messages: Array<{ from: string; text: string }>; onSend: (text: string) => void; height?: number }) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [chat.length]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
      <div className="lbl">{title}</div>
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
          onSend(text);
          setText('');
        }}
      >
        <input type="text" value={text} maxLength={300} aria-label="Wiadomość" placeholder="Napisz…" onChange={(e) => setText(e.target.value)} style={{ flex: 1, minWidth: 0, fontSize: 16, padding: '4px 8px' }} />
        <button type="submit" className="btn prim" style={{ padding: '4px 14px', fontSize: 16 }}>Wyślij</button>
      </form>
    </div>
  );
}

/**
 * Over every screen while logged in: invitations to accept or decline (with a countdown), short notes
 * (an invitation sent, declined…) and, after a long idle time, the way back online.
 */
export function OnlineOverlay({ session, onAccept }: { session: OnlineSession; onAccept: (i: Invitation) => void }) {
  const online = useOnline(session);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!online.invitations.length) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [online.invitations.length]);
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 90, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', pointerEvents: 'none' }}>
      {online.notices.map((n) => (
        <div key={n.id} className="plate parch" role="status" style={{ padding: '6px 14px', fontSize: 16, fontWeight: 700 }}>
          {n.text}
        </div>
      ))}
      {online.idle && (
        <div className="plate parch" role="status" style={{ padding: '8px 14px', fontSize: 16, display: 'flex', gap: 10, alignItems: 'center', pointerEvents: 'auto' }}>
          Rozłączono po dłuższej bezczynności.
          <button className="btn prim" style={{ padding: '3px 12px', fontSize: 15 }} onClick={() => session.reconnect()}>
            Połącz ponownie
          </button>
        </div>
      )}
      {online.invitations.map((i) => (
        <Frame key={i.code} crest style={{ width: 'min(340px, 92vw)', pointerEvents: 'auto' }} innerStyle={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 19 }}>
            <b style={{ color: '#F3D27A' }}>{i.from.nick}</b> zaprasza Cię do gry
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Zaproszenie wygaśnie za {Math.min(60, Math.max(0, Math.ceil((i.expiresAt - now) / 1000)))} s</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn plate parch" style={{ padding: '5px 16px', fontSize: 17 }} onClick={() => session.answerInvitation(i, false)}>
              Odrzuć
            </button>
            <button className="btn prim" autoFocus style={{ padding: '5px 20px', fontSize: 18 }} onClick={() => onAccept(i)}>
              Dołącz
            </button>
          </div>
        </Frame>
      ))}
    </div>
  );
}

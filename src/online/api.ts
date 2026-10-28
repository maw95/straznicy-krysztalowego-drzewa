// The game server (repo straznicy-krysztalowego-drzewa-backend): accounts over HTTP, rooms and games over a WebSocket.
// `npm run dev` talks to a server started locally (make dev in the backend repo); the built game to Fly.io.
// VITE_SERVER_URL overrides both.

import type { GameState } from '../engine/types';

export const SERVER_URL: string =
  import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:8080' : 'https://straznicy-backend.fly.dev');

export interface User {
  id: number;
  nick: string;
}

export interface SeatView {
  faction: 'dawn' | 'horde';
  heroId: string;
  bot: boolean;
  player: (User & { online: boolean }) | null;
  /** A bot plays for the absent player until they come back. */
  botTakeover: boolean;
}

export interface RoomView {
  code: string;
  ownerId: number;
  status: 'lobby' | 'playing' | 'over';
  mode: 'coop' | 'pvp' | 'arena';
  mapSize: 'short' | 'medium' | 'long' | 'veryLong';
  level: 'kids' | 'normal' | 'hard';
  /** The computer's pace in this room, set by the owner (the same names as in the game's options). */
  botSpeed: 'wolno' | 'normalnie' | 'szybko';
  seats: SeatView[];
  members: Array<User & { online: boolean }>;
  /** The disconnected player whose turn it is: their seat and when a bot takes over (ms since epoch). */
  waiting: { seat: number; until: number } | null;
}

/** The table the room owner sends: the same choices as the setup screen, levels only. */
export interface TableConfig {
  mode: RoomView['mode'];
  mapSize: RoomView['mapSize'];
  level: RoomView['level'];
  seats: Array<{ faction: 'dawn' | 'horde'; heroId: string; bot: boolean }>;
}

/** Where a player online is: in the menu, in a room before the start (or after the end), or playing. */
export interface PlayerOnline extends User {
  status: 'menu' | 'room' | 'game';
}

export interface Invitation {
  from: User;
  code: string;
  expiresAt: number;
}

export interface RankingRow {
  place: number;
  id: number;
  nick: string;
  points: number;
  games: number;
  /** Share of won games, 0–100. */
  winRate: number;
}

export type ServerMessage =
  | { type: 'hello'; user: User; version: string }
  | { type: 'players'; players: PlayerOnline[] }
  | { type: 'generalChat'; messages: Array<{ from: string; text: string }> }
  | { type: 'generalChatMessage'; from: string; text: string }
  | { type: 'invite'; from: User; code: string; expiresAt: number; now?: number }
  | { type: 'inviteGone'; code: string }
  | { type: 'inviteSent'; to: User; expiresAt: number }
  | { type: 'inviteEnded'; to: User; reason: 'accepted' | 'declined' | 'expired' }
  | { type: 'pong' }
  | { type: 'room'; room: RoomView }
  | { type: 'game'; state: GameState }
  | { type: 'chat'; from: string; text: string }
  | { type: 'left' }
  | { type: 'error'; code: string; message: string };

// ------------------------------------------------------------------ accounts

const TOKEN_KEY = 'skd-online-token';

export function savedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private mode: the player logs in again next time.
  }
}

/** A refusal from the server, with its Polish message. */
export class ServerError extends Error {}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_URL}${path}`, { ...init, headers: { 'content-type': 'application/json', ...init.headers } });
  } catch {
    throw new ServerError('Brak połączenia z serwerem gry. Spróbuj za chwilę.');
  }
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ServerError(body?.error?.message ?? 'Serwer gry odpowiedział błędem.');
  return body as T;
}

export async function signIn(kind: 'login' | 'register', nick: string, password: string): Promise<{ token: string; user: User }> {
  const result = await request<{ token: string; user: User }>(`/auth/${kind}`, { method: 'POST', body: JSON.stringify({ nick, password }) });
  saveToken(result.token);
  return result;
}

/** The player of the saved session, or null when there is none or it has expired; throws when the server is unreachable. */
export async function currentUser(): Promise<User | null> {
  const token = savedToken();
  if (!token) return null;
  const response = await fetch(`${SERVER_URL}/auth/me`, { headers: { authorization: `Bearer ${token}` } }).catch(() => {
    throw new ServerError('Brak połączenia z serwerem gry. Spróbuj za chwilę.');
  });
  if (response.status === 401) {
    saveToken(null);
    return null;
  }
  if (!response.ok) throw new ServerError('Serwer gry odpowiedział błędem.');
  return ((await response.json()) as { user: User }).user;
}

export async function signOut() {
  const token = savedToken();
  saveToken(null);
  if (token) await request('/auth/logout', { method: 'POST', headers: { authorization: `Bearer ${token}` } }).catch(() => undefined);
}

// ------------------------------------------------------------------ the connection

export type ClientMessage =
  | { type: 'createRoom' }
  | { type: 'joinRoom'; code: string }
  | { type: 'leaveRoom' }
  | { type: 'configure'; table: TableConfig }
  | { type: 'takeSeat'; seat: number }
  | { type: 'leaveSeat'; seat: number }
  | { type: 'start' }
  | { type: 'action'; action: unknown }
  | { type: 'handToBot'; seat: number }
  | { type: 'botSpeed'; speed: RoomView['botSpeed'] }
  | { type: 'chat'; text: string }
  | { type: 'generalChat'; text: string }
  | { type: 'invite'; userId: number }
  | { type: 'inviteReply'; code: string; accept: boolean };

export interface OnlineState {
  user: User;
  connected: boolean;
  /** The connection dropped and a new attempt is scheduled (not after the session expired, another tab or idling). */
  reconnecting: boolean;
  room: RoomView | null;
  game: GameState | null;
  chat: Array<{ from: string; text: string }>;
  /** Chat messages received so far (the list above keeps only the last 100), for the unread count. */
  chatReceived: number;
  /** Everyone online (this player too), with where they are. */
  players: PlayerOnline[];
  generalChat: Array<{ from: string; text: string }>;
  /** Invitations to this player waiting for an answer. */
  invitations: Invitation[];
  /** Short notes for this player (an invitation sent, declined…), each shown for a few seconds. */
  notices: Array<{ id: number; text: string }>;
  /** The server closed the connection after a long time without activity; reconnect() opens it again. */
  idle: boolean;
  error: string | null;
}

const RECONNECT_MS = [500, 1000, 2000, 4000, 8000];

/**
 * The open connection to the server. It reconnects by itself after a drop (or a server restart),
 * and the server puts the player back into their room.
 */
export class OnlineSession {
  state: OnlineState;
  private socket: WebSocket | null = null;
  private listeners = new Set<() => void>();
  private attempts = 0;
  private closed = false;

  constructor(user: User) {
    this.state = { user, connected: false, reconnecting: false, room: null, game: null, chat: [], chatReceived: 0, players: [], generalChat: [], invitations: [], notices: [], idle: false, error: null };
    this.open();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  send(message: ClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
    else this.update({ error: this.state.reconnecting ? 'Brak połączenia z serwerem — łączę ponownie…' : 'Brak połączenia z serwerem.' });
  }

  clearError() {
    this.update({ error: null });
  }

  close() {
    this.closed = true;
    this.socket?.close();
  }

  /** After the idle disconnect: connect again (the server puts the player back where they were). */
  reconnect() {
    if (this.state.connected) return;
    this.update({ idle: false, error: null });
    this.open();
  }

  answerInvitation(invitation: Invitation, accept: boolean) {
    this.update({ invitations: this.state.invitations.filter((i) => i.code !== invitation.code) });
    this.send({ type: 'inviteReply', code: invitation.code, accept });
  }

  private notice(text: string) {
    const id = Date.now() + Math.random();
    this.update({ notices: [...this.state.notices, { id, text }] });
    window.setTimeout(() => this.update({ notices: this.state.notices.filter((n) => n.id !== id) }), 5000);
  }

  private update(patch: Partial<OnlineState>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  private open() {
    const url = `${SERVER_URL.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(savedToken() ?? '')}`;
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onopen = () => {
      this.attempts = 0;
      this.update({ connected: true, reconnecting: false, error: null });
    };
    socket.onmessage = (event) => this.receive(JSON.parse(event.data) as ServerMessage);
    socket.onclose = (event) => {
      if (this.socket !== socket) return;
      this.update({ connected: false, reconnecting: false });
      // 4401: the session expired; 4000: the same account connected elsewhere (another tab).
      if (this.closed) return;
      if (event.code === 4401) return this.update({ error: 'Sesja wygasła — zaloguj się ponownie.' });
      if (event.code === 4000) return this.update({ error: 'Gra jest otwarta w innej karcie albo na innym urządzeniu.' });
      // 4002: nothing happened for a long time (outside a game) — the player reconnects with one click.
      if (event.code === 4002) return this.update({ idle: true, players: [], invitations: [] });
      const delay = RECONNECT_MS[Math.min(this.attempts++, RECONNECT_MS.length - 1)];
      this.update({ reconnecting: true });
      window.setTimeout(() => !this.closed && this.open(), delay);
    };
  }

  private receive(message: ServerMessage) {
    switch (message.type) {
      case 'room':
        return this.update({ room: message.room, game: message.room.status === 'lobby' ? null : this.state.game });
      case 'game':
        return this.update({ game: message.state });
      case 'chat':
        return this.update({ chat: [...this.state.chat.slice(-99), { from: message.from, text: message.text }], chatReceived: this.state.chatReceived + 1 });
      case 'left':
        return this.update({ room: null, game: null, chat: [] });
      case 'error':
        return this.update({ error: message.message });
      case 'players':
        return this.update({ players: message.players });
      case 'generalChat':
        return this.update({ generalChat: message.messages });
      case 'generalChatMessage':
        return this.update({ generalChat: [...this.state.generalChat.slice(-99), { from: message.from, text: message.text }] });
      case 'invite':
        chime();
        // The countdown runs on this computer's clock (the server's may be a little off): the time left, as sent.
        return this.update({
          invitations: [
            ...this.state.invitations.filter((i) => i.code !== message.code),
            { from: message.from, code: message.code, expiresAt: Date.now() + Math.max(0, message.expiresAt - (message.now ?? message.expiresAt - 60_000)) },
          ],
        });
      case 'inviteGone':
        return this.update({ invitations: this.state.invitations.filter((i) => i.code !== message.code) });
      case 'inviteSent':
        return this.notice(`Zaproszenie wysłane: ${message.to.nick}.`);
      case 'inviteEnded':
        return this.notice(
          message.reason === 'accepted'
            ? `${message.to.nick} dołącza do pokoju.`
            : message.reason === 'declined'
              ? `${message.to.nick} odrzuca zaproszenie.`
              : `Zaproszenie dla ${message.to.nick} wygasło.`,
        );
    }
  }
}

/** A short two-note chime for an incoming invitation (no sound file needed). */
function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.16);
      osc.stop(ctx.currentTime + i * 0.16 + 0.4);
    });
    window.setTimeout(() => void ctx.close(), 1000);
  } catch {
    // No audio (or not allowed yet): the invitation still shows.
  }
}

// ------------------------------------------------------------------ ranking

export async function fetchRanking(): Promise<{ top: RankingRow[]; me: RankingRow | null }> {
  const token = savedToken();
  return request('/ranking', { headers: token ? { authorization: `Bearer ${token}` } : {} });
}

/** A finished offline game, for the ranking: the server replays it and scores it itself. */
export async function submitResult(setup: unknown, actions: unknown[]): Promise<{ counted: true; fresh: boolean; won: boolean; points: number } | { counted: false; reason: string }> {
  const token = savedToken();
  if (!token) throw new ServerError('Nie jesteś zalogowany.');
  return request('/results', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ setup, actions }) });
}

// ------------------------------------------------------------------ bug reports and feedback

/**
 * "Zgłoś błąd" (`bug`: the save file with the report) and "Dla testerów" (`feedback`: the tester's journal)
 * go straight to the server, logged in or not; an online game's own actions are added by the server.
 */
export async function submitReport(kind: 'bug' | 'feedback', data: object, roomCode?: string): Promise<void> {
  const token = savedToken();
  await request('/reports', {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ kind, version: __APP_VERSION__, data, ...(roomCode ? { roomCode } : {}) }),
  });
}

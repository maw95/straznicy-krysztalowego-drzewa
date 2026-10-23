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

export type ServerMessage =
  | { type: 'hello'; user: User; version: string }
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
  | { type: 'chat'; text: string };

export interface OnlineState {
  user: User;
  connected: boolean;
  room: RoomView | null;
  game: GameState | null;
  chat: Array<{ from: string; text: string }>;
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
    this.state = { user, connected: false, room: null, game: null, chat: [], error: null };
    this.open();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  send(message: ClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
    else this.update({ error: 'Brak połączenia z serwerem — łączę ponownie…' });
  }

  clearError() {
    this.update({ error: null });
  }

  close() {
    this.closed = true;
    this.socket?.close();
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
      this.update({ connected: true, error: null });
    };
    socket.onmessage = (event) => this.receive(JSON.parse(event.data) as ServerMessage);
    socket.onclose = (event) => {
      if (this.socket !== socket) return;
      this.update({ connected: false });
      // 4401: the session expired; 4000: the same account connected elsewhere (another tab).
      if (this.closed) return;
      if (event.code === 4401) return this.update({ error: 'Sesja wygasła — zaloguj się ponownie.' });
      if (event.code === 4000) return this.update({ error: 'Gra jest otwarta w innej karcie albo na innym urządzeniu.' });
      const delay = RECONNECT_MS[Math.min(this.attempts++, RECONNECT_MS.length - 1)];
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
        return this.update({ chat: [...this.state.chat.slice(-99), { from: message.from, text: message.text }] });
      case 'left':
        return this.update({ room: null, game: null, chat: [] });
      case 'error':
        return this.update({ error: message.message });
    }
  }
}

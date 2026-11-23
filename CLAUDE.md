# Gleamroot: Strażnicy Kryształowego Drzewa — notes for Claude

Digital prototype of a board game: React 18 + TypeScript + Vite, three.js figures, vitest. The online server is a
separate repo next to this one (`../straznicy-krysztalowego-drzewa-backend`, Fly.io). The author writes in Polish:
answer in Polish; code, comments and commit messages in English; CHANGELOG.md and docs/ in Polish.

## Map
- `src/engine/` — rules, map, battles, bots (`ai/`); pure, deterministic. `src/engine/data.ts` holds every number of the game.
- `src/ui/` — screens: `App.tsx` (state, dispatch, shortcuts), `gameDialogs.tsx`, `AdventureView.tsx` (map),
  `BattleView.tsx` + `ArenaBoard`, `ActivationBar`, `ItemsPanel`, `BattleSidePanel`, `useBattleAnimations`,
  `useDeployment`, `battleStatus.tsx` (arena), `DuelView.tsx`, `SetupScreen.tsx` / `OnlineScreen.tsx` + `setupShared.tsx`,
  `FigureLayer.tsx` (3D), `arenaGeometry.ts`, `styles.css` (phone layout: media queries, `COMPACT_QUERY` in common.tsx).
- `src/content/instrukcja.pl.md` — the in-game manual of the digital game (Zasady i karty → Instrukcja), rendered by `ManualView.tsx` / `manualDoc.ts` (TOC, search; `tests/manual.test.ts` checks links). Its English translation is `instrukcja.en.md` (same chapters in the same order, `@words:` for keywords; `tests/manual.test.ts` compares the two). **Update both in the same commit when a rule or feature changes.** `docs/INSTRUKCJA.md` is only the printable board manual.
- `src/online/` — client of the game server (`api.ts`, `useOnline.ts`).
- **Interrupted work (limits, account change): read `docs/WZNOWIENIE.md` first** (running background jobs, worktree `../skd-g1`, order of tasks).
- `docs/BACKLOG.md` — agreed work, with [x]/[ ]; start here. `docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md` — the official
  rules and every rule decision (add new ones as a section). `docs/INSTRUKCJA.md` — player rulebook.
  `docs/INFRASTRUKTURA.md` — servers, releases, secrets.
- **Board edition production (3 copies):** Claude acts as the author's production manager. When the author asks
  „co mam teraz zrobić?” (or similar), read `docs/wersja_planszowa/POSTEP_PRODUKCJI.md` (state, waiting items, measurements),
  give the next concrete step with exact how-to from `PLAN_KROK_PO_KROKU.md`, and update the tracker (tick + date, log line)
  when the author reports progress. The plywood order waits for measurements (section G there).
- `tests/` — `golden.test.ts` (62 bot games hashed: any change to game results fails it; update the snapshot with
  `npx vitest run tests/golden.test.ts -u` only for intended rule/AI changes, and say so in the commit), `helpers/engine.ts`.

## Commands (Makefile; Node is in ~/.local/node, the Makefile adds it to PATH)
- `make check` — typecheck + all tests (~10 s). Before every commit. `make test-engine` / `make test-ui` for one half.
- `make zrzut Q='steps=400&until=battle&mode=pvp&seed=3' WIDOK=desktop|wielki|ultraszeroki|telefon|poziomo ELEMENT=.arena-frame` — small
  screenshot in `.tmp/` through a headless browser with its own Vite server on :5180. Query hook: App.tsx (`steps`, `reveal=1` (all tiles shown),
  `seed`, `mode`, `players`, `size`, `until=battle`, `battle=board`, `ruleset=board` for the board edition; digital is the default). For clicks/hover checks write a short script
  importing `openGame` from `scripts/browser/game.ts`.
- **Panel testowy** (tylko build deweloperski, nigdy online): adres `?dev=1` albo Ctrl+Shift+D. Zmienia kopię stanu gry (`src/engine/dev.ts`, `src/ui/DevPanel.tsx`): zasoby, poziom i czary bohatera, artefakty, skarby, jednostki, „wybuduj wszystko”, odkrycie mapy, walka z neutralnymi i gotowe sceny (księga czarów w bitwie, osada z pełnym drzewkiem, legendarni neutralni, komplet Odłamków, okno skrzyni). Sprawdzenie: `npx tsx scripts/browser/panel-testowy.ts`. Funkcje dev są poza `applyAction`, więc golden i serwer ich nie widzą.
- **Języki (PL, EN):** gra jest napisana po polsku; angielski to słownik tekst-po-tekście (`src/i18n/en/*.ts`, klucz = polski tekst, `{0}` = dziura szablonu), nakładany na wyświetlany tekst przez `src/i18n/dom.ts` (MutationObserver), więc komponenty nic nie wiedzą o językach. Nowy polski tekst w kodzie = wpis w słowniku: `node scripts/i18n_extract.mjs --missing` (dodaj `--wide --caps` dla krótkich nazw bez polskich liter) wypisuje braki; `TEST_LANG=en npx tsx scripts/browser/telefon.ts` i `npx tsx scripts/browser/jezyk.ts en` pokazują teksty, które na ekranie zostały po polsku. Język: z przeglądarki (`navigator.languages`), wybór graczy w `localStorage` (`skd-lang`), `?lang=en` do testów; flagi w prawym górnym rogu ekranu startowego i menu oraz w Opcjach.
- `make sim-tabele GAMES=300` — Dawn win rates per mode/map/level (~30 s). Keep simulations under 3 minutes.
- `make zgloszenia` — fetch bug reports from the server ("sprawdź zgłoszenia"): analyse, then consult the author.

## Working rules
- One commit per change, with a player-readable Polish line in CHANGELOG.md under "W przygotowaniu" in the same commit.
  Commit freely; never push this repo (a push publishes the game). Backend: commit, push and `make deploy` freely.
- Check `git status` before committing: the IDE stages the author's big files (models, images) — never commit those,
  `.idea/` or `.tmp/`.
- UI changes: verify in the browser (`make zrzut` or a script), not only in jsdom tests.
- Never touch the author's own servers (game :5173, backend :8080, its data/): test servers use other ports and a
  scratch database (`PORT=8090 DATABASE_PATH=… ALLOWED_ORIGINS=http://localhost:5180`).

## Assets
- Every accepted graphic, animation, sound or music goes into the repo in the same session (sources in the cloud are not a backup).
  Keep it small: frame sheets/WebP instead of loose PNG frames, check `du -sh` before committing; list each file in
  `assets.json` (source, tool, model, prompt, date, AI yes/no, licence).

- **„G4 dla frakcji X” (author's shorthand) means the whole graphic set, not only units:** card art and portraits, ability icons, herb and frames, arena + obstacles, **faction tile set (own reverse `tiles/back_<id>.jpg`, 5 ground types + 2 obstacles, base, treasury) and faction variants of the map objects (shrine, mercenary camp, well, chest, sawmill, mine — scenery matching the faction's land, e.g. steppe, not green meadows)**, settlement, unit sprites, **music (2 tracks registered in `FACTION_MUSIC` in `src/ui/music.ts`: it plays in the faction's settlement and while the active hero stands on its land; ElevenLabs Music v2.5, ~0.5 CU/s, never name other games in the prompt: the filter rejects it and still charges)**. **Tiles and objects: cheap on purpose (lowest sensible quality/model tier, few variants, minimal CU) — the author does not need top quality there.** Check the list against `docs/frakcje/<id>.md` and the plan in BACKLOG item 52 before starting.

## Saving tokens
- Read only the part of a file you need (grep for the symbol, then read that range).
- Screenshots: `make zrzut` defaults are small; crop with `ELEMENT=`; check logic by text (DOM queries) when a
  picture is not needed.
- Subagents re-read everything: use them only for large, independent work (e.g. backend vs engine in parallel),
  never for a task of a few files. Give them file paths and the exact goal.
- Quiet output: pipe test runs through `grep -E "Tests |FAIL"`, long logs through `tail`.
- When a backlog topic is finished, tell the author it is a good moment for `/clear` (the backlog keeps the state).

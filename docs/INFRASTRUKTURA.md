# Infrastruktura i wdrażanie

Jak są poukładane gra i serwer gry online, gdzie co działa i jak wypuszczać zmiany — krok po kroku,
tak żeby dało się to zrobić bez wcześniejszych rozmów.

## W skrócie

```
 przeglądarka gracza
   │  gra (statyczna strona)            https://maw95.github.io/straznicy-krysztalowego-drzewa/
   │      └─ GitHub Pages ← repo gry (gałąź master)
   │
   └─ HTTP + WebSocket ───────────────► serwer gry  https://straznicy-backend.fly.dev
                                          └─ Fly.io (Frankfurt) ← repo serwera
                                               └─ silnik gry: pakiet z wydania gry na GitHubie
```

| Co | Gdzie | Repozytorium |
|---|---|---|
| Gra (przeglądarka) | GitHub Pages | `maw95/straznicy-krysztalowego-drzewa` (publiczne), lokalnie `~/WebstormProjects/straznicy-krysztalowego-drzewa` |
| Serwer gry online | Fly.io, aplikacja `straznicy-backend`, region `fra` | `maw95/straznicy-krysztalowego-drzewa-backend` (prywatne), lokalnie `~/WebstormProjects/straznicy-krysztalowego-drzewa-backend` |
| Silnik gry (zasady, mapa, boty) | `src/engine` w repo gry; serwer dostaje go jako pakiet dołączony do wydania gry | — |
| Baza serwera | SQLite na wolumenie Fly `straznicy_data` (1 GB, `/data/straznicy.db`) | — |

Oba repozytoria muszą leżeć **obok siebie** w tym samym katalogu — lokalnie serwer bierze silnik prosto z repo gry.

## Zasada pracy

- **Gra (front):** zmiany commitujemy lokalnie i testujemy lokalnie. **Nie wypychamy `master` na co dzień** —
  każdy push na `master` od razu publikuje grę na GitHub Pages. Wypychamy przy wydaniu wersji.
- **Serwer:** zmiany commitujemy, wypychamy i wdrażamy na bieżąco (`make deploy`).
- **Silnik na serwerze** zmienia się tylko przy wydaniu gry: serwer gra według zasad wydanej wersji gry,
  a nie według tego, co akurat leży lokalnie.
- Każda zmiana to osobny commit; zmiany opisujemy po polsku w `CHANGELOG.md` danego repo.

## Narzędzia i konta

| Narzędzie | Gdzie | Do czego |
|---|---|---|
| Node.js 24 | `~/.local/node` (Makefile same dopinają go do `PATH`) | gra i serwer |
| `git` przez SSH | klucz `~/.ssh/id_ed25519`, konto GitHub `maw95` | push do obu repo |
| `gh` (GitHub CLI) | zalogowany jako `maw95`, uprawnienie `repo` | wydania, sekrety, podgląd CI |
| `fly` (flyctl) | `~/.fly/bin/fly`, zalogowany kontem `mwozniak95@gmail.com` | wdrożenia serwera, logi |

Sprawdzenie: `gh auth status`, `~/.fly/bin/fly auth whoami`. Gdy wygasną: `gh auth login`, `fly auth login`.

**Sekrety** (nigdzie w kodzie):

| Sekret | Gdzie | Do czego | Jak odnowić |
|---|---|---|---|
| `FLY_API_TOKEN` | GitHub → repo serwera → Settings → Secrets and variables → Actions | automatyczny deploy po wydaniu serwera | `fly tokens create deploy --app straznicy-backend \| gh secret set FLY_API_TOKEN -R maw95/straznicy-krysztalowego-drzewa-backend`; stary: `fly tokens list --app straznicy-backend`, `fly tokens revoke <id>` |

Koszty: Fly.io umarza rachunki poniżej 5 USD miesięcznie; jedna mała maszyna, która usypia bez graczy, się w tym mieści.

## Praca lokalnie

Dwa terminale:

```bash
# 1. serwer: http://localhost:8080, baza w data/ (w repo serwera, ignorowana przez gita)
cd ~/WebstormProjects/straznicy-krysztalowego-drzewa-backend
make dev

# 2. gra: http://localhost:5173 — w trybie dev łączy się z serwerem na localhost:8080
cd ~/WebstormProjects/straznicy-krysztalowego-drzewa
make dev
```

- Gra online lokalnie: „Gra online” w menu. Dwóch graczy = dwa okna przeglądarki, jedno z nich prywatne
  (każde okno to osobne konto). Kont z produkcji lokalnie nie ma — zakłada się nowe.
- Inny adres serwera: `VITE_SERVER_URL=http://… make dev` (domyślnie: dev → `localhost:8080`, zbudowana gra → Fly.io).
- Limit rejestracji (5 kont na godzinę z jednego adresu) i logowania liczy się w pamięci serwera —
  restart lokalnego serwera go zeruje.
- Testy przed commitem: `make check` w danym repo. W serwerze dodatkowo `make test-package` — testy na
  **wydanym** silniku (tak, jak pójdzie na produkcję), a nie na lokalnym.

## Typowe sytuacje

### Zmiana tylko w serwerze

```bash
cd ~/WebstormProjects/straznicy-krysztalowego-drzewa-backend
make check                 # typy + testy
git commit …               # + wpis w CHANGELOG.md
git push                   # CI na GitHubie: typy + testy
make deploy                # testy, testy na wydanym silniku, wdrożenie na Fly.io (obraz buduje się na Fly)
curl https://straznicy-backend.fly.dev/health
```

Zmiana bazy danych: nowa migracja **na końcu** listy `MIGRATIONS` w `src/db.ts` — nigdy nie zmieniamy migracji,
która już poszła na serwer. Migracje uruchamiają się same przy starcie serwera.

Trwające partie przeżywają deploy: serwer zapisuje w bazie ruchy i po restarcie odtwarza partie, a gracze
łączą się ponownie sami (po kilku sekundach).

### Zmiana tylko w grze (bez zmian zasad)

Commit lokalnie, test lokalnie (`make check`, `make dev`). Do graczy trafi przy najbliższym wydaniu gry.

### Zmiana zasad gry (silnik)

1. Zmiana w `src/engine` w repo gry, commit lokalnie. Lokalny serwer od razu gra według nowych zasad.
2. Testy serwera na nowych zasadach: `make check` w repo serwera (lokalnie bierze silnik z repo gry obok).
3. Na produkcję trafia to dopiero przez **wydanie gry** i **aktualizację silnika w serwerze** (niżej).

Uwaga: partie online, które trwają w chwili wdrożenia nowych zasad, są odtwarzane nowym silnikiem.
Jeśli zmiana zasad zmienia wynik dawnych ruchów, serwer nie odtworzy takiej partii i ją usunie
(widać to w `make logs` jako „room could not be restored”). Najbezpieczniej wdrażać zmiany zasad,
gdy nikt nie gra.

### Wydanie gry (nowa wersja na GitHub Pages)

W repo gry, np. dla wersji `1.4.0`:

1. `CHANGELOG.md`: sekcję „W przygotowaniu” zamienić na `## 1.4.0 — RRRR-MM-DD` (gra czyta ten nagłówek),
   uzupełnić brakujące skróty commitów na końcu wpisów, nad nią zostawić pustą sekcję „W przygotowaniu”.
2. Wersja: `npm version 1.4.0 --no-git-tag-version` (zmienia `package.json` i `package-lock.json`).
3. `make check`, potem commit `Release 1.4.0`.
4. Tag z adnotacją: `git tag -a 1.4.0 -m "Release 1.4.0"`.
5. Push: `git push origin master 1.4.0` — workflow `Pages` publikuje grę (ok. 1–2 min; podgląd: `gh run list`).
6. Wydanie na GitHubie: `gh release create 1.4.0 --generate-notes` (albo przez stronę repo → Releases).
7. Pakiet silnika do tego wydania: `make silnik` (bierze wersję z `package.json`; z innego taga: `make silnik TAG=1.4.0`).

Przed wypchnięciem warto sprawdzić `git status`: duże pliki (np. modele 3D w `docs/wersja_planszowa/druk3d/`) nie mogą trafić
do commita — GitHub odrzuca pliki powyżej 100 MB.

### Aktualizacja silnika w serwerze (po wydaniu gry)

```bash
cd ~/WebstormProjects/straznicy-krysztalowego-drzewa-backend
npm install https://github.com/maw95/straznicy-krysztalowego-drzewa/releases/download/1.4.0/straznicy-engine-1.4.0.tgz
make deploy                # w tym testy na nowym pakiecie
git commit -am "Engine 1.4.0" && git push
```

Gra na Pages i serwer powinny mieć tę samą wersję silnika — po wydaniu gry z nowymi zasadami zaktualizuj serwer
od razu.

Opublikowanego pakietu się **nie podmienia**: `package-lock.json` serwera zapisuje jego sumę kontrolną, więc
podmieniony plik zablokowałby instalację. `make silnik` odmówi, jeśli pakiet już jest w wydaniu — poprawka
zasad to nowa wersja gry.

### Wydanie serwera (opcjonalnie)

Zamiast `make deploy` można opublikować wydanie w repo serwera — workflow `Deploy` sam przetestuje i wdroży:
podbić `version` w `package.json` serwera (widać ją w `/health`), sekcja wersji w `CHANGELOG.md`, commit,
`git tag -a 0.2.0 -m "Release 0.2.0"`, `git push origin master 0.2.0`, `gh release create 0.2.0 --generate-notes
-R maw95/straznicy-krysztalowego-drzewa-backend`. Workflow da się też uruchomić ręcznie: `gh workflow run Deploy -R …`.

## Zgłoszenia błędów i opinie graczy

- **W grze:** „Zgłoś błąd” (pasek w trakcie partii, klawisz B) wysyła opis razem z całą partią;
  „Dla testerów” (menu) wysyła uwagi z dziennikiem partii testera. Oba trafiają na serwer gry (`POST /reports`),
  także bez konta. Przy grze online serwer sam dokłada ruchy partii z pokoju. Bez internetu zostaje plik
  do pobrania, jak dawniej. Przy `make dev` zgłoszenia błędów nadal lądują od razu w `bug-reports/`.
- **Pobranie:** `make zgloszenia` w repozytorium gry — budzi serwer, przez `fly ssh` pobiera nowe zgłoszenia,
  zapisuje błędy do `bug-reports/…-serwer-<id>.json`, opinie do `tester-reports/`, oznacza je na serwerze
  jako pobrane, a potem odtwarza błędy (`scripts/report.ts`) i podsumowuje opinie (`scripts/testers.ts`).
  `make zgloszenia ACK=0` pobiera bez oznaczania. Pliki z serwera nie trafiają do gita (nicki i dane przeglądarek).
- **Na co dzień:** wystarczy napisać Claude'owi „sprawdź, czy doszły zgłoszenia albo opinie” — uruchomi
  `make zgloszenia`, przeanalizuje błędy (odtworzony stan gry w chwili zgłoszenia) i opinie i omówi je z Tobą.

## Serwer na Fly.io

W repo serwera:

| Komenda | Co robi |
|---|---|
| `make deploy` | testy i wdrożenie |
| `make logs` | logi na żywo |
| `make status` | stan maszyny |
| `make ssh` | konsola na maszynie (baza: `/data/straznicy.db`) |
| `curl https://straznicy-backend.fly.dev/health` | stan serwera i bazy, wersja |

- Maszyna usypia, gdy nikt nie jest połączony, i budzi się przy pierwszym zapytaniu (kilka sekund).
  Otwarte połączenie WebSocket utrzymuje ją przy życiu przez całą partię.
- Komunikat „Health check … has failed” w logach w sekundzie startu maszyny jest normalny (serwer jeszcze nie słucha).
- Kopie bazy: Fly robi codzienne migawki wolumenu i trzyma 5 ostatnich (`fly volumes snapshots list <id wolumenu>`;
  id: `fly volumes list --app straznicy-backend`).
- Ustawienia serwera (zmienne środowiskowe) są w `fly.toml` w sekcji `[env]`; tajne wartości ustawia się
  `fly secrets set NAZWA=… --app straznicy-backend` (na razie żadnych nie ma).

## Gdzie szukać szczegółów

- Repo serwera, `README.md`: API, protokół pokoi (wszystkie wiadomości WebSocket), limity prób logowania, zmienne.
- `docs/BACKLOG.md`: ustalenia trybu online i co jeszcze zostało.
- `.github/workflows/`: `pages.yml` w repo gry; `ci.yml` i `deploy.yml` w repo serwera.
- `scripts/engine-package.sh` w repo gry: jak powstaje pakiet silnika.

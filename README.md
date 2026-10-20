# Strażnicy Kryształowego Drzewa — cyfrowy prototyp

Przeglądarkowa wersja planszówki do testów: hot-seat dla 1–4 graczy, boty, kooperacja i rywalizacja.
Zasady: `docs/`. Notatki dla agenta pracującego nad wersją papierową: `docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md`.

## Uruchomienie

Najprościej przez `make` (bez argumentów pokazuje listę komend): `make dev`, `make test`, `make build`, `make sim`, `make check`.

Albo ręcznie:

Node.js jest zainstalowany w `~/.local/node`:

```bash
export PATH=~/.local/node/bin:$PATH
npm install
make dev          # gra pod http://localhost:5173 (lub: npm run dev)
npm test           # testy zasad
npm run sim -- 1000 short coop basic   # symulacje botów (rozmiar: short|medium|long, tryb: coop|pvp, wariant: basic|advanced)
npm run build      # wersja statyczna w dist/
```

Do testów można od razu przewinąć partię botami, np. `/?steps=40&seed=3&mode=pvp&difficulty=advanced`.

## Struktura

- `src/engine/` — silnik zasad, niezależny od UI. Stan gry to zwykłe dane (JSON), a jedynym wejściem jest `applyAction(state, action)`. Losowanie ze stałym ziarnem, więc partia odtwarza się z ziarna i listy akcji.
  - `data.ts` — jednostki, skarby, tereny i warianty map. Wszystkie liczby można tu stroić.
  - `types.ts` — `RulesConfig`: przełączniki zasad oznaczonych w specyfikacji jako TEST i DO USTALENIA.
  - `battle.ts` — arena 9×11, inicjatywa, ruch, linia strzału, zdolności, skarby.
  - `game.ts` — przygotowanie partii, tura na mapie, wywoływanie bitew, rytuał, warunki zwycięstwa.
  - `ai/` — automat zła z kooperacji (sekcja 7 specyfikacji) i boty.
- `src/ui/` — React. Styl wzięty z zaakceptowanych próbek.
- `scripts/simulate.ts` — masowe symulacje.
- `public/assets/music/` — muzyka (źródła w `docs/assets/soundtrack/`).
- `public/assets/cards/` — elementy kart (ramy, portrety, ikony) wycięte z arkuszy w `docs/assets/images/` skryptem `python3 scripts/assets/extract.py`. Karty jednostek składa na bieżąco `src/ui/UnitCard.tsx`, a karty skarbów `src/ui/TreasureCard.tsx`. Podgląd wszystkich kart: `/?cards`.
- `public/assets/` — grafiki. Ilustracje pochodzą z instrukcji. Drzewa i skała na arenie to grafiki z Battle for Wesnoth (GPL).

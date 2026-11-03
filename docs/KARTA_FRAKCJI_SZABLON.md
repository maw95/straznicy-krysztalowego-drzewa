# Karta frakcji — szablon

Autor zatwierdza kartę, resztę (dane w `src/engine/data.ts`, testy, symulacje balansu, wpisy do instrukcji, lista
grafik do wygenerowania) robi Claude. Skopiuj do `docs/frakcje/<id>.md` i wypełnij.

## Tożsamość
- **Nazwa / id:**
- **Klimat (2–3 zdania):**
- **Rola w grze** (np. obrona, agresja, kontrola, wyczerpanie):
- **Mechanika wyróżniająca** (jedna, wyraźna; czym różni się od pozostałych frakcji):
- **Mocne strony / słabości:**
- **Jak gra bot:** (priorytety, czego nie wolno mu robić)

## Bohaterowie (3)
| Id | Nazwa | Życie | Atak | Szybkość | Ruch (chód/lot) | Zasięg (wręcz/dystans) | Zdolność |
|---|---|---|---|---|---|---|---|

## Jednostki rekrutowane w osadzie (ok. 7)
| Id | Nazwa | Poziom | Życie | Atak | Szybkość | Ruch | Zasięg | Zdolność | Koszt (złoto/drewno/ruda/pył) | Budynek |
|---|---|---|---|---|---|---|---|---|---|---|

## Osada
- **Budynki** (nazwa, koszt, efekt, wymagania):
- **Dochód i przyrost rekrutów** (cykl tygodniowy):

## Zdolności (każda: nazwa, typ — aktywna/pasywna/reakcja, opis, ograniczenia)

## Grafika (wypełnia Claude po zatwierdzeniu)
- Lista zasobów: portrety, jednostki, karty, kafle osady, ikony zdolności; wpisy w `assets.json`.

## Balans (wypełnia Claude)
- Cel: 45–55% wygranych w każdej parze frakcji (`make sim-tabele`), wyniki i zmiany liczb.

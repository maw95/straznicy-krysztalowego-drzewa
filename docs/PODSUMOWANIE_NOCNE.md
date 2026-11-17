# Podsumowanie pracy nad kolejką 32–48 (17.11.2026)

Praca szła w dwóch częściach: zadanie uruchomione automatycznie o 16:00 (commity do 16:35, potem przerwał je limit 5-godzinny) i dokończenie w sesji interaktywnej od 17:50. Wszystkie zmiany są w commitach na `master`; niczego nie wypchnięto (gra, backend nietknięty).

## Zrobione

| Punkt | Co | Commity (skrót) |
|---|---|---|
| 32–36, 40–42, 45 | reguły, remisy, magia (3 kręgi), Relikt z Odłamkami, garnizon, ekrany ustawień, Bardzo trudny, ikony i efekty czarów | `fee4452` … `2ad028b` (zadanie nocne) |
| 39 | okno „Zasady i karty”: pomocnicy, dowódcy, legendy, zestawy artefaktów, wszystkie lokacje z poziomem | `10ce88b` |
| 38 | ozdobniki okien ze Scenario: narożniki ramek, Księga czarów jako otwarta księga, okno skarbów jako skrzynia | `7a2af32`, `c494092` |
| 48 | **arena 6 na 6 offline**: pula 8 jednostek, wybór 5, artefakt z 3, 2 czary, Bardzo trudny z dźwigniami (wygrane gracza ok. 24%), osobne statystyki i punkty | `f20179e` … `87e8f08` |
| 37 (część) | graf zależności budynków; osada na całym ekranie; Rada Osady z obrazami (Scenario); drzewko z liniami; limit „jeden budynek na rundę” usunięty | `205fbd2`, `c6c7b96`, `e2cacdd`, `fad0e82` |
| 43 | panel testowy (`?dev=1`, Ctrl+Shift+D): zasoby, bohater, czary, artefakty, skarby, jednostki, sceny | `1b58534` |
| 47 (część) | skrypt `scripts/browser/telefon.ts`, pasek mapy na niskich telefonach, cele 44 px | `a986a82` |

Stan na koniec: `make check` zielony (528 testów), golden niezmieniony, balans: 144 komórki z 432 poza pasmem przy 40 partiach (przed zmianami 143), czyli bez wpływu.

## Zostaje w backlogu

- **37 (reszta):** budynki unikalne frakcji zamiast drzewek frakcji, budynek Iskry w drzewku, Koszary i siedliska poziomu 6 w drzewku, układ osady jak w Heroes III, nowe obrazy budynków, samouczek i instrukcja.
- **47 (reszta):** 4 małe cele na mapie, opisy tylko po najechaniu, ekrany nieprzejrzane skryptem, test na prawdziwym telefonie (autor).
- **48 (reszta):** gra online (wymaga nowego wydania silnika).

## Do zakwestionowania przez autora

Lista przyjętych grafik i pytań jest w `docs/PYTANIA_DO_AUTORA.md` (ikony i efekty czarów, medale poziomów, ozdobniki okien, Rada Osady, decyzje o dźwigniach areny).

## Kredyty Scenario (17.11)

109 CU w sumie (zob. sekcja 8 backlogu): 79 (zadanie nocne) + 18 (ozdobniki okien) + 12 (Rada Osady).

## Uwagi

- Skrypt `scripts/browser/chatka.ts` padał na czystym HEAD dla ziarna 3 (losowało zadanie z artefaktem przy pustym plecaku); ustawiono ziarno 4.
- Dla narożników, księgi i skrzyni w `assets.json` są ID zadań, wyników i **tekstowych assetów z promptami** (`scenario_asset.prompt`); treści promptów nie przepisano do repo (można je odczytać w Scenario `asset_get`). Prompty Rady Osady są opisane w `assets.json` wprost.

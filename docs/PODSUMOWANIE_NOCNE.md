# Podsumowanie pracy nad kolejką 32–48 (17.11.2026)

Praca szła w dwóch częściach: zadanie uruchomione automatycznie o 16:00 (commity do 16:35, potem przerwał je limit 5-godzinny) i dokończenie w sesji interaktywnej od 17:50. Wszystkie zmiany są w commitach na `master`; niczego nie wypchnięto (gra, backend nietknięty).

## Zrobione

| Punkt | Co | Commity (skrót) |
|---|---|---|
| 32–36, 40–42, 45 | reguły, remisy, magia (3 kręgi), Relikt z Odłamkami, garnizon, ekrany ustawień, Bardzo trudny, ikony i efekty czarów | `fee4452` … `2ad028b` (zadanie nocne) |
| 39 | okno „Zasady i karty”: pomocnicy, dowódcy, legendy, zestawy artefaktów, wszystkie lokacje z poziomem | `10ce88b` |
| 38 | ozdobniki okien ze Scenario: narożniki ramek, Księga czarów jako otwarta księga, okno skarbów jako skrzynia | `7a2af32`, `c494092` |
| 48 | **arena 6 na 6 offline**: pula 8 jednostek, wybór 5, artefakt z 3, 2 czary, Bardzo trudny z dźwigniami (wygrane gracza ok. 24%), osobne statystyki i punkty | `f20179e` … `87e8f08` |
| 37 | graf zależności budynków; osada na całym ekranie z Radą Osady i drzewkiem; limit „jeden budynek na rundę” usunięty; budynki frakcji (Kapliczka Świtu, Jama Krwi, Szkółka, Krąg Gaju, Szabrownia, Wilcze Legowisko) zamiast drzewek, 8 obrazów ze Scenario; Koszary domyślne i siedliska w drzewku; układ jak w Heroes III | `205fbd2` … `3e4e251` |
| 43 | panel testowy (`?dev=1`, Ctrl+Shift+D): zasoby, bohater, czary, artefakty, skarby, jednostki, sceny | `1b58534` |
| 47 | skrypt `scripts/browser/telefon.ts` (13 ekranów, 3 rozmiary), pasek mapy, cele 44 px, opisy po dotknięciu | `a986a82`, `4bf0002` |
| 48 (dopiski) | wybór czarów przez gracza w 6 na 6, dźwignie Łatwego i Trudnego, Bardzo trudny w 3 na 3 | `2e56b87` |

Stan na koniec: `make check` zielony (534 testy), golden niezmieniony, balans: 144 komórki z 432 poza pasmem przy 40 partiach (przed zmianami 143), czyli bez wpływu.

## Zostaje w backlogu

- **47 (reszta):** test na prawdziwych telefonach (autor), chipy kolejki jednostek w bitwie, pasek mapy w dwóch rzędach, ekrany nieprzejrzane skryptem.
- **48 (reszta):** gra online (wymaga nowego wydania silnika, decyzja autora).
- **Przed premierą (28–30):** nowe frakcje, kampania i ekspedycja, wiele języków: duże prace, „nie robić bez wyraźnego polecenia autora”.

## Do zakwestionowania przez autora

Lista przyjętych grafik i pytań jest w `docs/PYTANIA_DO_AUTORA.md` (ikony i efekty czarów, medale poziomów, ozdobniki okien, Rada Osady, decyzje o dźwigniach areny).

## Kredyty Scenario (17.11)

145 CU w sumie (zob. sekcja 8 backlogu): 79 (zadanie nocne) + 18 (ozdobniki okien) + 12 (Rada Osady) + 36 (budynki frakcji).

## Uwagi

- Skrypt `scripts/browser/chatka.ts` padał na czystym HEAD dla ziarna 3 (losowało zadanie z artefaktem przy pustym plecaku); ustawiono ziarno 4.
- Dla narożników, księgi i skrzyni w `assets.json` są ID zadań, wyników i **tekstowych assetów z promptami** (`scenario_asset.prompt`); treści promptów nie przepisano do repo (można je odczytać w Scenario `asset_get`). Prompty Rady Osady są opisane w `assets.json` wprost.

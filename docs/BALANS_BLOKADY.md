# Pomiar do blokad kreatora (backlog 103)

Pomiar 28.11.2026: `scripts/sim/blokady.ts`, 400 gier na komórkę (boty Normalne po obu stronach, nowe ziarna 1001+), dane: `docs/balans_blokady.jsonl`. Komórka = cel × wielkość × kształt × gracze na stronę × warstwa. Kryształy i Przetrwanie mierzone na stopniu dźwigni z `tuningRolesData.ts` (pasmo 45–55% wygranych Przymierza), pozostałe cele z dostrojeniem poziomu Normalny (pasmo 45–65%). Warstwy: Kryształy i Przetrwanie wszystkie pięć (Kryształy także Przygoda bez rozwoju), inne cele Wyprawa, Księstwo, Imperium (Podbój: Księstwo, Imperium; Relikt: Imperium). Odchył = ile punktów procentowych poza pasmem; niepewność pomiaru około ±5 pkt.

## Ile komórek w każdym przedziale odchyłu

| cel | wielkość | w paśmie | ≤5 | 5–10 | 10–15 | >15 |
|---|---|---|---|---|---|---|
| Kryształy | S | 17 | 18 | 6 | 1 | 0 |
| Kryształy | M | 10 | 18 | 11 | 2 | 1 |
| Kryształy | L | 20 | 14 | 6 | 2 | 0 |
| Kryształy | XL | 14 | 13 | 12 | 3 | 0 |
| Kryształy | XXL | 14 | 9 | 10 | 5 | 4 |
| Kryształy | 3XL | 9 | 8 | 10 | 7 | 8 |
| Przetrwanie | S | 20 | 7 | 3 | 0 | 10 |
| Przetrwanie | M | 16 | 15 | 1 | 0 | 8 |
| Przetrwanie | L | 23 | 13 | 3 | 1 | 0 |
| Przetrwanie | XL | 22 | 12 | 5 | 1 | 0 |
| Przetrwanie | XXL | 19 | 12 | 8 | 1 | 0 |
| Przetrwanie | 3XL | 17 | 11 | 5 | 4 | 3 |
| Kontrola | S | 4 | 6 | 10 | 2 | 2 |
| Kontrola | M | 10 | 8 | 6 | 0 | 0 |
| Kontrola | L | 20 | 4 | 0 | 0 | 0 |
| Kontrola | XL | 24 | 0 | 0 | 0 | 0 |
| Kontrola | XXL | 19 | 5 | 0 | 0 | 0 |
| Kontrola | 3XL | 14 | 10 | 0 | 0 | 0 |
| Boss | S | 10 | 6 | 1 | 2 | 5 |
| Boss | M | 14 | 3 | 0 | 6 | 1 |
| Boss | L | 16 | 3 | 3 | 2 | 0 |
| Boss | XL | 11 | 7 | 3 | 3 | 0 |
| Boss | XXL | 9 | 6 | 5 | 4 | 0 |
| Boss | 3XL | 9 | 8 | 1 | 6 | 0 |
| Artefakt | S | 5 | 3 | 5 | 4 | 7 |
| Artefakt | M | 5 | 3 | 7 | 5 | 4 |
| Artefakt | L | 11 | 8 | 5 | 0 | 0 |
| Artefakt | XL | 16 | 5 | 2 | 1 | 0 |
| Artefakt | XXL | 20 | 2 | 1 | 0 | 1 |
| Artefakt | 3XL | 18 | 4 | 1 | 1 | 0 |
| Podbój | S | 0 | 1 | 1 | 2 | 12 |
| Podbój | M | 0 | 2 | 2 | 3 | 9 |
| Podbój | L | 1 | 5 | 4 | 5 | 1 |
| Podbój | XL | 6 | 6 | 3 | 1 | 0 |
| Podbój | XXL | 5 | 9 | 2 | 0 | 0 |
| Podbój | 3XL | 11 | 3 | 1 | 1 | 0 |
| Relikt | S | 3 | 2 | 3 | 0 | 0 |
| Relikt | M | 2 | 2 | 4 | 0 | 0 |
| Relikt | L | 2 | 2 | 4 | 0 | 0 |
| Relikt | XL | 2 | 3 | 3 | 0 | 0 |
| Relikt | XXL | 2 | 4 | 0 | 2 | 0 |
| Relikt | 3XL | 1 | 3 | 1 | 2 | 1 |
| Kryształy (Spacer) | S | 2 | 0 | 0 | 0 | 0 |
| Kryształy (Spacer) | M | 2 | 0 | 0 | 0 | 0 |
| Kryształy (Spacer) | L | 2 | 0 | 0 | 0 | 0 |
| Kryształy (Spacer) | XL | 2 | 0 | 0 | 0 | 0 |
| Kryształy (Spacer) | XXL | 0 | 1 | 0 | 0 | 1 |
| Kryształy (Spacer) | 3XL | 1 | 0 | 0 | 1 | 0 |

## Komórki z odchyłem powyżej 10 pkt

Każdy wiersz: cel, wielkość, kształt, gracze na stronę; dalej warstwy z wynikiem Przymierza (pogrubione: odchył >15).

| cel | wielkość | kształt | gracze | warstwy (wygrane Przymierza %) |
|---|---|---|---|---|
| Kryształy | S | prostokąt | 1 | Księstwo 40, Imperium 43, Osada 32, Wyprawa 42, Królestwo 42 |
| Kryształy | M | wyspy | 2 | Księstwo 41, Osada 38, Imperium 36, Wyprawa 32, Królestwo 52 |
| Kryształy | M | trójkąt | 2 | Przygoda 42, Księstwo 37, Osada 32, Imperium 40, Wyprawa **30**, Królestwo 43 |
| Kryształy | L | wyspy | 2 | Księstwo 34, Osada 44, Wyprawa 36, Imperium 35, Królestwo 45 |
| Kryształy | L | pierścień | 2 | Księstwo 61, Imperium 46, Wyprawa 57, Osada 59, Królestwo 66 |
| Kryształy | XL | wyspy | 1 | Księstwo 39, Imperium 40, Osada 35, Wyprawa 31, Królestwo 45 |
| Kryształy | XL | pierścień | 1 | Księstwo 32, Osada 30, Imperium 44, Wyprawa 38, Królestwo 47 |
| Kryształy | XXL | wyspy | 1 | Księstwo **28**, Imperium 36, Osada **24**, Wyprawa **28**, Królestwo 38 |
| Kryształy | XXL | prostokąt | 1 | Księstwo 34, Imperium 38, Osada 33, Wyprawa 35, Królestwo 43 |
| Kryształy | XXL | pierścień | 1 | Księstwo 38, Imperium 51, Osada 33, Wyprawa 35, Królestwo 50 |
| Kryształy | XXL | pierścień | 2 | Księstwo 56, Osada 53, Wyprawa 48, Imperium 32, Królestwo 38 |
| Kryształy | XXL | trójkąt | 2 | Przygoda 60, Księstwo **28**, Osada 51, Imperium 41, Wyprawa 45, Królestwo 36 |
| Kryształy | 3XL | wyspy | 1 | Wyprawa **19**, Osada **16**, Księstwo **24**, Imperium **28**, Królestwo 38 |
| Kryształy | 3XL | prostokąt | 1 | Osada **24**, Księstwo 33, Wyprawa **24**, Imperium 31, Królestwo 40 |
| Kryształy | 3XL | prostokąt | 2 | Księstwo 53, Imperium 59, Osada 50, Wyprawa 39, Królestwo 31 |
| Kryształy | 3XL | pierścień | 1 | Osada **30**, Księstwo 30, Wyprawa **27**, Imperium 43, Królestwo 44 |
| Kryształy | 3XL | trójkąt | 1 | Przygoda 43, Osada 32, Księstwo 36, Wyprawa 32, Imperium 40, Królestwo 47 |
| Kryształy | 3XL | trójkąt | 2 | Przygoda 60, Księstwo 48, Wyprawa 39, Osada 44, Imperium 62, Królestwo 34 |
| Kryształy (Spacer) | XXL | trójkąt | 1 | Spacer **23** |
| Kryształy (Spacer) | 3XL | trójkąt | 1 | Spacer 65 |
| Przetrwanie | S | trójkąt | 1 | Księstwo **75**, Imperium **77**, Osada **82**, Wyprawa **76**, Królestwo **74** |
| Przetrwanie | S | trójkąt | 2 | Księstwo **78**, Imperium **81**, Osada **82**, Wyprawa **81**, Królestwo **78** |
| Przetrwanie | M | trójkąt | 1 | Księstwo **73**, Imperium **76**, Osada **74**, Wyprawa 60, Królestwo **72** |
| Przetrwanie | M | trójkąt | 2 | Księstwo **76**, Imperium **74**, Osada **76**, Wyprawa 59, Królestwo **75** |
| Przetrwanie | L | prostokąt | 1 | Księstwo 36, Imperium 44, Osada 32, Wyprawa 37, Królestwo 38 |
| Przetrwanie | XL | wyspy | 2 | Księstwo 42, Wyprawa 42, Imperium 44, Osada 34, Królestwo 46 |
| Przetrwanie | XXL | prostokąt | 1 | Księstwo 39, Imperium 38, Osada 32, Wyprawa 44, Królestwo 37 |
| Przetrwanie | 3XL | prostokąt | 1 | Księstwo 34, Imperium **28**, Osada **25**, Wyprawa 34, Królestwo 32 |
| Przetrwanie | 3XL | prostokąt | 2 | Księstwo 44, Imperium 33, Wyprawa 40, Osada 36, Królestwo 42 |
| Przetrwanie | 3XL | pierścień | 2 | Księstwo 54, Wyprawa 57, Imperium 65, Osada 55, Królestwo **72** |
| Kontrola | S | prostokąt | 1 | Wyprawa **26**, Księstwo 34, Imperium 40 |
| Kontrola | S | prostokąt | 2 | Wyprawa **24**, Księstwo 38, Imperium 37 |
| Kontrola | S | trójkąt | 1 | Wyprawa 35, Księstwo 36, Imperium 42 |
| Boss | S | wyspy | 1 | Wyprawa **29**, Księstwo 40, Imperium 51 |
| Boss | S | wyspy | 2 | Wyprawa 32, Księstwo 49, Imperium 51 |
| Boss | S | prostokąt | 1 | Wyprawa **28**, Księstwo 45, Imperium 52 |
| Boss | S | pierścień | 1 | Wyprawa 30, Księstwo 43, Imperium 49 |
| Boss | S | pierścień | 2 | Wyprawa **28**, Księstwo 42, Imperium 48 |
| Boss | S | trójkąt | 1 | Wyprawa **29**, Księstwo 42, Imperium 49 |
| Boss | S | trójkąt | 2 | Wyprawa **29**, Księstwo 42, Imperium 49 |
| Boss | M | wyspy | 1 | Wyprawa **28**, Księstwo 45, Imperium 54 |
| Boss | M | wyspy | 2 | Wyprawa 34, Księstwo 52, Imperium 55 |
| Boss | M | prostokąt | 1 | Wyprawa 30, Księstwo 50, Imperium 55 |
| Boss | M | pierścień | 1 | Wyprawa 31, Księstwo 51, Imperium 56 |
| Boss | M | pierścień | 2 | Wyprawa 33, Księstwo 46, Imperium 52 |
| Boss | M | trójkąt | 1 | Wyprawa 30, Księstwo 42, Imperium 53 |
| Boss | M | trójkąt | 2 | Wyprawa 31, Księstwo 44, Imperium 52 |
| Boss | L | wyspy | 1 | Wyprawa 32, Księstwo 54, Imperium 58 |
| Boss | L | prostokąt | 1 | Wyprawa 31, Księstwo 54, Imperium 59 |
| Boss | XL | wyspy | 1 | Wyprawa 32, Księstwo 62, Imperium 60 |
| Boss | XL | pierścień | 1 | Wyprawa 35, Księstwo 61, Imperium 60 |
| Boss | XL | trójkąt | 1 | Wyprawa 34, Księstwo 64, Imperium 65 |
| Boss | XXL | wyspy | 1 | Wyprawa 31, Księstwo 64, Imperium 58 |
| Boss | XXL | prostokąt | 1 | Wyprawa 34, Księstwo 58, Imperium 54 |
| Boss | XXL | trójkąt | 1 | Wyprawa 31, Księstwo 70, Imperium 71 |
| Boss | XXL | trójkąt | 2 | Wyprawa 46, Księstwo 68, Imperium 78 |
| Boss | 3XL | wyspy | 1 | Wyprawa 32, Księstwo 65, Imperium 62 |
| Boss | 3XL | wyspy | 2 | Wyprawa 45, Księstwo 69, Imperium 77 |
| Boss | 3XL | prostokąt | 1 | Wyprawa 34, Księstwo 60, Imperium 58 |
| Boss | 3XL | prostokąt | 2 | Wyprawa 46, Księstwo 70, Imperium 76 |
| Boss | 3XL | trójkąt | 1 | Wyprawa 31, Księstwo 70, Imperium 69 |
| Boss | 3XL | trójkąt | 2 | Wyprawa 46, Księstwo 70, Imperium 78 |
| Artefakt | S | wyspy | 2 | Wyprawa 33, Księstwo 37, Imperium 42 |
| Artefakt | S | pierścień | 1 | Wyprawa **27**, Księstwo **25**, Imperium 32 |
| Artefakt | S | pierścień | 2 | Wyprawa **18**, Księstwo **26**, Imperium 34 |
| Artefakt | S | trójkąt | 1 | Wyprawa **27**, Księstwo **28**, Imperium 38 |
| Artefakt | S | trójkąt | 2 | Wyprawa **24**, Księstwo 32, Imperium 42 |
| Artefakt | M | wyspy | 2 | Wyprawa 34, Księstwo 38, Imperium 45 |
| Artefakt | M | pierścień | 1 | Wyprawa 34, Księstwo 32, Imperium 39 |
| Artefakt | M | pierścień | 2 | Wyprawa **28**, Księstwo **29**, Imperium 33 |
| Artefakt | M | trójkąt | 1 | Wyprawa 37, Księstwo 34, Imperium 39 |
| Artefakt | M | trójkąt | 2 | Wyprawa **28**, Księstwo **30**, Imperium 38 |
| Artefakt | XL | pierścień | 2 | Wyprawa 37, Księstwo 36, Imperium 33 |
| Artefakt | XXL | pierścień | 2 | Wyprawa 42, Księstwo 36, Imperium **30** |
| Artefakt | 3XL | pierścień | 2 | Wyprawa 46, Księstwo 40, Imperium 33 |
| Podbój | S | wyspy | 1 | Księstwo **15**, Imperium **26** |
| Podbój | S | wyspy | 2 | Księstwo **16**, Imperium 34 |
| Podbój | S | prostokąt | 1 | Księstwo **16**, Imperium **28** |
| Podbój | S | prostokąt | 2 | Księstwo **24**, Imperium 32 |
| Podbój | S | pierścień | 1 | Księstwo **18**, Imperium **27** |
| Podbój | S | pierścień | 2 | Księstwo **24**, Imperium 42 |
| Podbój | S | trójkąt | 1 | Księstwo **22**, Imperium **27** |
| Podbój | S | trójkąt | 2 | Księstwo **28**, Imperium 38 |
| Podbój | M | wyspy | 1 | Księstwo **23**, Imperium 30 |
| Podbój | M | wyspy | 2 | Księstwo **23**, Imperium 38 |
| Podbój | M | prostokąt | 1 | Księstwo **22**, Imperium **29** |
| Podbój | M | prostokąt | 2 | Księstwo **28**, Imperium 38 |
| Podbój | M | pierścień | 1 | Księstwo **21**, Imperium 32 |
| Podbój | M | pierścień | 2 | Księstwo **29**, Imperium 41 |
| Podbój | M | trójkąt | 1 | Księstwo **22**, Imperium 30 |
| Podbój | M | trójkąt | 2 | Księstwo **28**, Imperium 40 |
| Podbój | L | wyspy | 1 | Księstwo 31, Imperium 40 |
| Podbój | L | wyspy | 2 | Księstwo 31, Imperium 36 |
| Podbój | L | prostokąt | 1 | Księstwo **28**, Imperium 39 |
| Podbój | L | pierścień | 1 | Księstwo 32, Imperium 45 |
| Podbój | L | trójkąt | 1 | Księstwo 32, Imperium 41 |
| Podbój | L | trójkąt | 2 | Księstwo 31, Imperium 42 |
| Podbój | XL | wyspy | 2 | Księstwo 43, Imperium 34 |
| Podbój | 3XL | wyspy | 2 | Księstwo 46, Imperium 31 |
| Relikt | XXL | wyspy | 2 | Imperium 33 |
| Relikt | XXL | pierścień | 2 | Imperium 32 |
| Relikt | 3XL | wyspy | 2 | Imperium **27** |
| Relikt | 3XL | pierścień | 2 | Imperium 34 |
| Relikt | 3XL | trójkąt | 2 | Imperium 35 |

## Decyzja autora 28.11.2026: próg 10 pkt

Autor wybrał próg **10 pkt proc. poza pasmem** (zamiast 15), liczony z marginesem pomiaru (±4,9 pkt) i regułą większości warstw. Wynik: 16 reguł w `src/engine/blocks.ts` (`OPTION_BLOCKS`), 19 kombinacji cel × wielkość × kształt × gracze na stronę; `tests/blocks.test.ts` liczy je od nowa z `balans_blokady.jsonl`. Blokady według liczby graczy: dopisek na karcie celu w kreatorze, a strona miejsc wstrzymuje start z przyciskiem „Dodaj bota do każdej strony” (wybór autora z trzech makiet). Stół online: komunikat i wyłączony start (miejsc nie da się tam dodać). Własne ustawienia: tylko ostrzeżenie. Dawne `BLOCKED_SIZES` (Kryształy XXL/3XL, Przetrwanie S) usunięte. Przy 5 pkt doszłoby 14 kolejnych kombinacji (raport w rozmowie 28.11): zostawione do strojenia.

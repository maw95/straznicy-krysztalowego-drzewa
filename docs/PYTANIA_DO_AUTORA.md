# Pytania do autora i przyjęte grafiki (nocne zadanie 17.11.2026)

Zadanie ruszyło bez człowieka przy terminalu, więc decyzje, których nie dało się podjąć z backlogu, i grafiki przyjęte samodzielnie są tu zebrane. Można je kwestionować: każdą rzecz da się cofnąć albo podmienić.

## Przyjęte grafiki (do zakwestionowania)

| Ścieżka | Wariant | Uzasadnienie |
|---|---|---|
| `public/assets/ikony/czary/{thunder,curse,shield,inspire,quicken}.webp` | arkusz wariant 2 z 2 | ten sam styl i obwódka co ikony poziomu 5; czystsza tarcza i wyraźna czaszka |
| `public/assets/efekty/czar_{thunder,curse,shield,inspire}.webp`, `mapa_przyspieszenie.webp` | 1 próba, bez powtórek | czytelne na czarnym tle, 24 klatki; Grom i Klątwa mają obcięte najsłabsze smugi (kompresja do ok. 160 KB) |
| `public/assets/ui/menu/{wyprawa,osada,ksiestwo}.webp` | arkusz wariant 1 z 2 | większe, czytelniejsze motywy; spójne z Przygodą, Królestwem i Imperium na zrzucie desktop i telefon |
| `public/assets/ui/{corner_gold_tl,tr,bl,br,spellbook_bg,chest_bg}.webp` | 1 próba każdy, bez powtórek | narożnik z szafirem pasuje do złotej ramki (4 lustrzane pliki po 7 KB zamiast SVG), księga z grzbietem i skrzynia z aksamitem czytelne pod tekstem na desktopie i telefonie poziomo; tytuł Księgi przesunięty na lewą stronę, bo grzbiet przecinał napis |
| `public/assets/osady/{dawn,horde}_council1.webp` | wariant A z 2 (oba) | zwarty kadr jak reszta budynków; Przymierze: altana z liści i kryształu, Horda: sala wojenna z paleniskiem; widoczne w osadzie i w drzewku |
| `public/assets/osady/{dawn_shrine1,dawn_nursery1,dawn_grove1,horde_bloodPit1,horde_plunder1,horde_wolfDen1}.webp` | wariant A z 2 (wszystkie) | spójne z resztą budynków; jeden obraz na budynek (wszystkie poziomy), poziomy Kapliczki i Jamy różnią się tylko opisem |

Uwaga: istniejące `krolestwo.webp` i `imperium.webp` mają okruchy sąsiada na lewej krawędzi (widać na telefonie); do przycięcia osobno.

## Pytania

## Arena 6 na 6 (punkt 48): decyzje i pytania

**Odpowiedzi autora (17.11, wieczór), wdrożone:** (1) gracz **sam wybiera dwa czary** w 6 na 6 (z sześciu czarów bitewnych kręgów I–II; boty wybierają według wartości czaru); (2) **Łatwy w 6 na 6 delikatnie zaostrzony** (komputer dostaje jeden dodatkowy artefakt: 84% → 79% wygranych gracza); (3) **Bardzo trudny w 3 na 3 ma własną dźwignię** (komputer dobiera o jeden skarb więcej: 40% → 23%).

- **Dźwignie, wartości po strojeniu (`npx tsx scripts/sim/arena6.ts 2000 <poziom> <3|6>`, wszystkie w `types.ts`):** 6 na 6: Łatwy `ARENA_HANDICAP_EASY` (+1 artefakt) 79%, Normalny 53%, Trudny `ARENA_HANDICAP_HARD` (+1 mana) 44%, Bardzo trudny `ARENA_HANDICAP` (+2 many, +1 czar, +2 artefakty) 27%. 3 na 3: Łatwy 69%, Normalny 48%, Trudny 40%, Bardzo trudny `ARENA_DRAFT_HANDICAP` (+1 skarb) 23%. Pasma: Łatwy 65–85, Normalny 45–65, Trudny 30–45, Bardzo trudny 15–30.
- **Artefakty:** oferta trzech zawsze z różnych miejsc ciała i tylko takich, które działają w bitwie (bez Trzewików Trapera); rzadkości 55/35/10%.
- **Skarby z talii** w 6 na 6 zostają jak w 3 na 3 (2 na stronę).
- **Gra online: arena 6 na 6 NIE jest dostępna.** Serwer używa silnika z paczki wydania 2.8.0; potrzebne nowe wydanie silnika (decyzja o wydaniu jest Twoja, gry nie pushuję). W kreatorze online opcji nie ma. Dźwignia 3 na 3 (`computerDraft`) też trafi online dopiero z nowym silnikiem.

## Budynki frakcji (punkt 37): decyzje przyjęte samodzielnie

- **Ceny i efekty** poza Kapliczką Świtu i Jamą Krwi (te z `BUDYNKI.md`) dobrałem sam, odwracalnie (`ECONOMY.cost`, `FACTION_MECHANICS`): Szkółka Drzewa I 3 zł + 2 drewna, II 5 zł + 2 rudy + 1 Pył (+1 / +2 drewna na rundę); Krąg Gaju 5 zł + 2 Pyły; Szabrownia 4 zł + 2 rudy (+2 zł za budynek po wygranej z bohaterem lub strażnikiem); Wilcze Legowisko 4 zł + 3 drewna (+1 ruch bohaterów Hordy).
- **Bez budynku frakcja nie ma swojej mechaniki** (Blask Świtu, Żądza Krwi), zgodnie z decyzją z 17.11; do tej pory bazowy efekt był za darmo. W symulacji botów (krótkie partie, mało Pyłu) mechanika pojawia się rzadko; pasma bez zmian (142 komórki poza pasmem z 432 przed i po). Czy przy rozstawianiu cen obniżyć koszt I poziomu (dziś 3 zł + 2 drewna + 1 Pył)?
- **Obraz tylko jeden na budynek** (poziomy 2–4 Kapliczki i Jamy korzystają z tego samego); osobne obrazy poziomów można dogenerować.

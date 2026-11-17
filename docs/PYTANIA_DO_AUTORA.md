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

Uwaga: istniejące `krolestwo.webp` i `imperium.webp` mają okruchy sąsiada na lewej krawędzi (widać na telefonie); do przycięcia osobno.

## Pytania

## Arena 6 na 6 (punkt 48): decyzje i pytania

- **Dźwignie Bardzo trudnego (przyjęte samodzielnie, odwracalne: jedna stała `ARENA_HANDICAP` w `types.ts`):** +2 many, +1 czar i +2 artefakty dla bohatera komputera; gracz ma tyle samo jednostek co komputer (dźwignia „mniej pomocników gracza” jest w kodzie, wartość 0). `npx tsx scripts/sim/arena6.ts 1500 veryHard 6` daje wygrane gracza ok. 24% (pasmo 15–30%). Pojedynczo żadna dźwignia nie wystarcza (gear 2: 31%, playerLess 2: 11%), więc wzięte razem.
- **Pozostałe poziomy 6 na 6 (symulacja 1500 partii):** Łatwy 86,9% (pasmo 65–85: minimalnie nad), Normalny 50,7%, Trudny 44,7% (górny brzeg pasma 30–45). Czy zaostrzyć Łatwy (np. gorszy wybór artefaktu)?
- **Czary w 6 na 6:** każdy bohater dostaje 2 *losowe* czary bitewne z kręgów I–II (z ziarna gry), bez wyboru. Czy gracz ma je wybierać (jak artefakt)?
- **Artefakty:** oferta trzech zawsze z różnych miejsc ciała i tylko takich, które działają w bitwie (bez Trzewików Trapera); rzadkości 55/35/10% (pospolity/rzadki/legendarny).
- **Skarby z talii** w 6 na 6 zostają jak w 3 na 3 (2 na stronę).
- **Gra online: arena 6 na 6 NIE jest dostępna.** Serwer używa silnika z paczki wydania 2.8.0; potrzebne nowe wydanie silnika (decyzja o wydaniu jest Twoja, gry nie pushuję). W kreatorze online opcji nie ma.
- **Arena 3 na 3, Bardzo trudny:** zostaje jak Trudny (komputer bez błędów, bez dźwigni): ok. 42% wygranych gracza, czyli powyżej pasma 15–30%. Zgodnie z decyzją „3 na 3 bez zmian”. Chcesz tu osobną dźwignię (np. dodatkowy skarb komputera)?

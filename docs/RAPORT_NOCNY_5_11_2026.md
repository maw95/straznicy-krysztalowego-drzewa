# Raport z pracy autonomicznej (4–5.11.2026)

Co zrobione bez udziału autora, co obejrzeć i co zostało. Szczegóły zasad: `ZASADY_CYFROWE.md`, przepis na jednostkę:
`PRZEPIS_JEDNOSTKI.md`, styl: `STYL_JEDNOSTEK.md`, backlog: `BACKLOG.md`, plan: `MAPA_DROGOWA.md`.

## Jak to obejrzeć

Ekran nowej gry → „Wersja: Cyfrowa” (domyślna od 5.11, we wszystkich trybach; „Planszowa” przywraca figurki 3D). Adres testowy `?mode=arena&seed=1&steps=80&until=battle` (cyfrowa; `&ruleset=board` daje planszową)
(`&hero=<id>` wybiera bohatera Przymierza, np. `ancientBear`, `unicornKing`, `braveDuck`, `griffin`).

## Zrobione

- **Wszystkie 16 jednostek w nowej grafice 2D** w trybie cyfrowym (nie ma już figurek 3D ani portretów na arenie cyfrowej):
  Przymierze: Złoty Smok, Prastary Niedźwiedź, Król Jednorożców, Elf Druid, Nimfa, Pegaz, Dzielna Kaczka (sekret); Horda: Czarny Smok,
  Władca Wilkołaków, Ogr Żelazna Pięść, Goblin Szaman, Pająk Jaskiniowy, Nietoperz Cienia; neutralni: Cyklop, Gryf, Hydra.
  Każda: obraz stojący, trup, chód albo zawis, atak, trafienie, śmierć (braki niżej). Duże (2 pola): oba smoki, niedźwiedź, jednorożec,
  ogr, cyklop, hydra, gryf; reszta po 1 polu.
- **Arena cyfrowa:** poziome heksy 13 × 9, nowe ciemne tła, 8 + 7 przeszkód (część na 2 pola, jedna pod skosem na arenę), siatka z kodu,
  tło ciągnie się lustrzanie na szerokich ekranach.
- **Zasady cyfrowe:** duże jednostki na 2 polach, trupy zostają, ruch bez ataku kończy turę, strzelcy +1 do ataku (do strojenia).
- **Interfejs:** obrażenia i śmierć w momencie uderzenia animacji, animacja śmierci widoczna przed wynikiem, cienki pasek życia,
  przełącznik zasad, chód po ścieżce, kotwica i wielkość jednostki liczone z obrazu.
- **Boty:** liczą dystans, zagrożenie i drugi cel od najbliższych pól dużych jednostek.
- **Zasoby w repozytorium:** `public/assets/jednostki/` (ok. 48 MB), `public/assets/arena/cyfrowa/`, manifest `assets.json` (ok. 115 pozycji
  z promptami i ID zasobów Scenario, flaga AI). Skrypty: `scripts/animacje/` (`pack_unit.py`, `manifest.py`), `scripts/assets/arena_cyfrowa.py`.

## Braki klipów (w grze zastępuje je drgnięcie i błysk albo brak animacji)

- Atak: Elf Druid ma klip, ale zielono-złota fala wychodzi za prawy brzeg kadru.
- Śmierć: Ogr kończy siedząc, a obraz trupa leży na plecach (skok przy przejściu). Cyklop i Hydra mają.
- Trafienie: Hydra i Wilkołak mają nowe klipy; Nietoperz i Kaczka mają, ale skrzydła na kilku klatkach się rozmywają.
- Znane wady: ogień Czarnego Smoka i Złotego Smoka ucina prawa krawędź kadru; trup Wilkołaka i Goblina leży na plecach (głowa w prawo);
  klipy ataku Pegaza, Jednorożca i Gryfa to bardziej zryw niż uderzenie; Goblin ma niebieskawą kulę w ataku; Pająk i Nietoperz szersi
  niż zamierzano.
- Kredyty Scenario: zużyte ok. 1436 z 1500 CU (96%). Zablokowane przez filtr treści zadania zjadły ok. 250 CU: zob. lekcje w przepisie.

## Do decyzji autora / sprawdzenia

1. Styl mrocznych jednostek (Horda, neutralni): czy poważny, ciemny kierunek jest dobry (`STYL_JEDNOSTEK.md`); trening własnego stylu na planie
   Pro nie był robiony (wymaga zmiany planu).
2. Wielkość jednostek na arenie (`LARGE` 150×120 px, `SMALL` 76×96 px w `sprites.ts`) i pozycja stóp (`FEET` w `ArenaBoard.tsx`).
3. Strojenie balansu cyfrowego symulacjami (strzelcy +1 do ataku, duże jednostki, kierunek ogona) przed premierą.
4. Rozmiar repo: jednostki ważą ok. 3 MB każda (320 px, WebP 70); jeśli to za dużo, można zejść do 12 kl./s albo 256 px.
5. Boty nie wybierają taktycznie strony ogona dużych jednostek.

## Dalej (kolejność z mapy drogowej)

Faza C (mapy i cele, etap 1), faza D (tryb rodzinny), dźwięk (ElevenLabs, najpierw próbka), osiągnięcia i strona sklepu (faza E).

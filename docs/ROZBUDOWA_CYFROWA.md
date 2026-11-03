# Rozbudowa wydania cyfrowego

Ustalenia z 3.11.2026. Wersja cyfrowa przestaje być odbiciem planszówki: zasady planszówki są **zamrożone** jako tryb
„Klasyczny” (`NOTATKI_DLA_AGENTA_PLANSZOWKI.md`), a nowe możliwości są dodawane obok, za przełącznikami w `RulesConfig`.
Cztery kierunki wybrane przez autora: (1) mapy i cele, (2) pełna ekonomia jak w Heroesach, (3) trzy lub więcej nowych
frakcji, (4) kampania fabularna i wyprawa roguelike. Punkty oznaczone **[do potwierdzenia]** czekają na decyzję autora.

## Zasada nadrzędna

Każdy etap kończy się grywalną, przetestowaną wersją. Golden test (`tests/golden.test.ts`) obejmuje tylko tryb
Klasyczny i ma się nie zmieniać; nowe tryby dostają własne golden testy. Boty (`src/engine/ai/`) muszą umieć grać
każdy nowy cel i każdą nową mechanikę, bo to dziś główny koszt rozbudowy.

## Etap 0 — porządek

- Pole `ruleset` w ustawieniach gry: `classic` (planszówka) albo `digital`. Wszystkie zmiany etapów 1–4 działają tylko w `digital`.
- Dokument zasad cyfrowych obok notatek planszówki (nowa sekcja lub plik), żeby nie mieszać dwóch zestawów zasad.

## Etap 1 — mapy i cele

**Generator map** zamiast jednego trójkąta: interfejs `generateMap(shape, size, seed)`. Kształty:
trójkąt (klasyczny), prostokąt, wyspy (połączone mostami/przesmykami, latanie daje skróty), pierścień wokół centrum,
mapy ręcznie projektowane (plik JSON, używany przez kampanię).

**Cele** jako osobne moduły (`checkVictory`, postęp w interfejsie, wskazówki dla botów):
- *Kryształy / rytuał* — dzisiejszy cel (klasyczny).
- *Punkty kontrolne* — N punktów na mapie; kto utrzyma więcej przez K rund, wygrywa.
- *Boss* — neutralny boss w legowisku; tryb wyścigu (kto zada ostatni cios) albo kooperacji.
- *Artefakt / eskorta* — dotarcie do celu albo eskorta jednostki, która nie może zginąć.
- *Przetrwanie X rund* — fale wrogów (sterowane jak „automat zła”) atakują Drzewo/bazę.

Kolejność prac: interfejs celu → punkty kontrolne (najprostszy) → przetrwanie → boss → eskorta; generator: prostokąt → pierścień → wyspy → mapy ręczne.

## Etap 2 — ekonomia i rozwój

- **Zasoby [do potwierdzenia]:** złoto, drewno, ruda (kryształy zostają celem, nie walutą). Kopalnie na mapie dają dochód co rundę.
- **Osady:** startowa osada frakcji + osady do zdobycia. W osadzie jeden budynek na rundę; budynki odblokowują
  jednostki, bonusy i ulepszenia. Przyrost „puli rekrutów” w cyklu tygodniowym (7 rund).
- **Armia [do potwierdzenia]:** zalecany model *drużyny* zamiast stosów: bohater prowadzi do N pojedynczych jednostek
  (N rośnie z poziomem bohatera i budynkami). Dzięki temu arena i bitwy figurek zostają bez przebudowy; stosy jak w
  Heroesach wymagałyby nowego silnika bitew.
- **Bohaterowie:** doświadczenie za bitwy, poziomy, wybór 1 z 3 umiejętności przy awansie (drzewka na frakcję), ekwipunek.
- **Wydarzenia na mapie:** kapliczki, obozy najemników, skrzynie, strażnicy kopalń.

## Etap 3 — frakcje

Cel: razem co najmniej 5 frakcji (Przymierze Świtu, Mroczna Horda + 3 nowe). Każda: 3 bohaterów, 4–5 jednostek
rekrutowanych w osadzie, własna osada z budynkami i jedna mechanika wyróżniająca. Propozycje **[do potwierdzenia]**:
- *Leśny Krąg* (elfy/natura): pułapki, ruch przez las, wsparcie z dystansu.
- *Krypta* (nieumarli): odrodzenia, osłabianie, tanie jednostki.
- *Kamienne Hufce* (krasnoludy/golemy): pancerz, kopalnie, powolne, ale twarde jednostki.

Każda frakcja: symulacje balansu (`make sim-tabele`) przed włączeniem do gry; rośnie liczba par frakcji do zbalansowania.
**Wąskie gardło to grafika**: figurki 3D, portrety, karty, kafle osady. Ustalić jednolity styl i pipeline przed pierwszą nową frakcją.

## Etap 4 — kampania i wyprawa

- **Kampania fabularna:** 3–5 scenariuszy na frakcję, ręcznie ułożone mapy z różnymi celami z etapu 1, dialogi i opisy
  (tekst pisany z AI, redagowany ręcznie). Uczy gry i frakcji.
- **Wyprawa roguelike:** 8–10 losowych map pod rząd, bohater i drużyna przechodzą dalej, po każdej bitwie wybór 1 z 3
  nagród (relikwie, jednostki, umiejętności), rosnąca trudność. Postęp trwały: odblokowywanie bohaterów, relikwii,
  modyfikatorów trudności. Profil zapisywany do pliku (chmura Steam).
- **Seed dnia** z rankingiem (silnik jest deterministyczny, backend już istnieje).

## Kolejność i realistyczny zakres

Etapy 0 → 1 → 2 → 3 → 4; etap 3 (zawartość) można częściowo prowadzić równolegle po etapie 2. Minimum, które ma
sens jako płatna premiera na Steamie: etap 1 (co najmniej 3 cele i 3 kształty map), etap 2 w pełni, 1–2 nowe
frakcje, wyprawa roguelike i osiągnięcia. Reszta jako aktualizacje po premierze.

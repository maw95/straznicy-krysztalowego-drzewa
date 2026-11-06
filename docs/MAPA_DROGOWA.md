# Mapa drogowa wydania cyfrowego

Jedna lista „co dalej”. Łączy kod (etapy z `ROZBUDOWA_CYFROWA.md`) z pracą nad grafiką, animacją i dźwiękiem (`POTOK_ANIMACJI.md`).
Decyzje i pytania do autora: `DECYZJE.md`. Zrobione punkty oznaczamy [x] (i zostawiamy do końca fazy). Stan na 6.11.2026 (faza C zamknięta, faza D w toku: patrz `BACKLOG.md`, sekcja 6.4).

Zasady: zasady planszówki zamrożone jako tryb „Klasyczny” (`golden.test.ts` nie może się zmienić); jedna zmiana = jeden commit;
każdy nowy zasób wpisujemy do manifestu (źródło, narzędzie, prompt, licencja, czy AI), bo potrzebne jest ujawnienie AI na Steamie.

## Faza 0 — przygotowanie (zrobione)

- [x] Kierunek rozbudowy, drabinka złożoności, zakres premiery (poziomy 1–2 + hotseat/tryb rodzinny), frakcje na premierę.
- [x] Scenario: konto (Starter), MCP podłączone, licencja komercyjna potwierdzona.
- [x] Test grafiki, animacji lotu i śmierci na Złotym Smoku; potok opisany (`POTOK_ANIMACJI.md`).

## Faza A — fundament silnika i wzorzec jednostki 2D

- [x] Etap 0: pole `ruleset` (`classic` / `digital`) w ustawieniach gry; zmiany tylko w `digital`; dokument zasad cyfrowych obok notatek planszówki (`ZASADY_CYFROWE.md`).
- [x] Silnik bitwy (`digital`), trupy: martwe jednostki zostają na planszy, nie zajmują heksa (można po nich chodzić); wskrzeszenie na polu trupa. (Widok trupów w UI przyjdzie z rendererem 2D.)
- [x] Silnik bitwy (`digital`), duże jednostki: 2 heksy, głowa + ogon poziomo (ruch, atak, rozstawienie, trup, boty); rozmiar ustalany przy każdej frakcji, na start tylko Złoty Smok. (Wybór pola ogona i rozstawienie w interfejsie przyjdą z rendererem 2D.)
- [x] Arena cyfrowa z poziomymi heksami 13 × 9 (jak Heroes III), nowe tła i przeszkody ze Scenario (`ZASADY_CYFROWE.md`).
- [x] Boty a duże jednostki: ocena zagrożeń, odległości do wrogów, drugiego celu i skoku liczy najkrótszą odległość między polami jednostek (`dist2`, `footprintAt`); test bitew z kilkoma dużymi jednostkami. Do zrobienia później: bot nie wybiera strony ogona taktycznie.
- [x] Renderer 2D zamiast figurek 3D (`FigureLayer`): sprite'y z arkuszy klatek, odbicie lustrzane, maszyna stanów (stoi, ruch, atak, trafienie, śmierć, trup), cień pod jednostką. Gotowe jako `SpriteLayer` (`src/ui/SpriteLayer.tsx`, rejestr `src/ui/sprites.ts`); działa w trybie `digital` dla jednostek z wpisem w `SPRITES`, reszta nadal jako figurki 3D/portrety (mieszanie w jednej frakcji dopiero po wymianie całej frakcji).
- [x] Ruch: prędkość po planszy stała, ustalana w kodzie (`FLY_SPEED`); pętla lotu powtarzana do dystansu, wzbicie i lądowanie raz (lądowanie = wzbicie od tyłu). Do zrobienia przy jednostce naziemnej: pętla chodu po ścieżce.
- [x] Złoty Smok jako pierwsza jednostka w grze, w pełni zintegrowana (wzorzec dla reszty).
- [x] Trafienie: klip `trafienie` (odskok, ryk, powrót), gdy jednostka go ma; bez klipu drgnięcie i błysk w kodzie (`HIT_MS`). Złoty Smok ma klip (4.11.2026 akceptacja autora: kod słaby, docelowo klipy).

## Faza B — potok zasobów i pierwsza frakcja w nowej grafice

- [x] Klip ataku (smok): zionięcie (4.11), klip gotowy.
- [x] Pętla chodu dla jednostki naziemnej: Prastary Niedźwiedź, potem wszystkie chodzące (chód po ścieżce wokół przeszkód).
- [x] Odniesienia stylu dla mrocznych jednostek: przewodnik `STYL_JEDNOSTEK.md` (do oceny autora); zrobione jednostki Hordy i neutralnych są podstawą oceny.
- [ ] Trening własnego stylu w Scenario (Pro na jeden miesiąc): najpierw 20–25 obrazów treningowych, potem powrót na Starter.
- [x] Manifest zasobów (`assets.json`): wszystkie grafiki i animacje z promptami i ID zasobów. Muzyka wpisana do manifestu (6.11), licencje do uzupełnienia przez autora.
- [x] Przymierze Świtu i Mroczna Horda (oraz strażnicy neutralni) w nowej grafice (obrazy, ruch, atak, trafienie, śmierć, trup) w trybie cyfrowym: 16 jednostek, szczegóły i braki w `RAPORT_NOCNY_5_11_2026.md`. Braki do uzupełnienia: klip śmierci Ogra, ataku Elfa i Cyklopa, trafienia Wilkołaka i Hydry (w grze zastępuje je drgnięcie i błysk).
- [ ] Trening własnego stylu w Scenario (Pro): nie robiony, bo wymaga zmiany planu (decyzja autora).
- [ ] Dźwięk: próbka efektów i muzyki z ElevenLabs (przed zakupem planu), spis licencji obecnej muzyki.

## Faza C — mapy i cele (etap 1, poziom 2 „Wyprawa”)

- [x] Interfejs celu (`objectives.ts`: `init`, `checkVictory`, `onRoundEnd`, `onRoundLimit`, `progress`) i cel „Punkty kontrolne” (silnik, boty, symulacje, interfejs: sztandary na mapie, panel „Cele”, wybór celu w `SetupScreen`; opis w `ZASADY_CYFROWE.md`).
- [x] Cele „Przetrwanie”, „Boss” i „Artefakt” (6.11; „eskorta” jako osobny wariant odłożona, `BACKLOG` sekcja 7).
- [x] Generator map: prostokąt, pierścień, wyspy i mapy ręczne (tekst/JSON, `customMaps.ts`) — 6.11.
- [x] Tabela balansu cele × kształty (`make sim-cele`); poza pasmem kilka komórek (Dolina), lista w `ZASADY_CYFROWE.md`.
- [x] Rozwój bohatera: doświadczenie, poziomy 1–5, wybór 1 z 3 umiejętności, artefakty (3 sloty), kapliczki, obozy najemników i skrzynie (przełącznik `heroGrowth`, domyślnie wyłączony do czasu presetów).
- [ ] Do dopracowania przed premierą: grafika obiektów mapy i artefaktów (dziś medale), drzewka umiejętności z rozgałęzieniami, własny Boss (grafika), strojenie Doliny.

## Faza D — tryb rodzinny

- [ ] Hotseat i tryb rodzinny (wspólna gra rodzic + dziecko), poziomy 1–2 jako preset przełączników (w toku, `BACKLOG` 6.4).
- [ ] Autopilot dla warstw (bot zarządza osadami; dziecko wędruje i walczy): po wprowadzeniu warstw ekonomii.

## Faza E — premiera na Steamie (poziomy 1–2)

- [ ] Zakres premiery do ostatecznego potwierdzenia (propozycja: poziomy 1–2, hotseat, tryb rodzinny, Przymierze + Horda).
- [ ] Osiągnięcia, strona sklepu, ujawnienie użycia AI, przegląd licencji (odłożone: ręczny przegląd konkurencji, test z parami rodzic + dziecko).

## Po premierze — aktualizacje

- [ ] Etap 2: ekonomia i rozwój (poziomy 3–4): osady, budynki, zasoby (złoto, drewno, ruda, Gwiezdny Pył), cykl tygodniowy, drzewka umiejętności.
- [ ] Etap 3: Dzikie Stada, Królestwo Umarłych, Żelazne Klany; potem DLC (Wolne Kompanie, Dwór Wiecznego Szronu, Imperium Piasków, Rój Głębin, Władcy Przypływów). Każda frakcja: karta (`KARTA_FRAKCJI_SZABLON.md`), symulacje balansu.
- [ ] Etap 4: kampania fabularna, wyprawa roguelike, poziom 5 „Legenda” (magia, specjalności).

## Zależności (co blokuje co)

- Faza A przed jakimkolwiek nowym zasobem w grze: renderer 2D i maszyna stanów muszą istnieć, zanim wygenerujemy dziesiątki klipów.
- Klip ataku, chód i styl (faza B) przed pełną frakcją: inaczej ryzykujemy wymianę całej frakcji po zmianie stylu.
- Trening stylu (Pro) dopiero po przygotowaniu obrazów treningowych, żeby nie płacić za dni bez pracy.
- Faza C (mapy i cele) jest niezależna od grafiki i może iść równolegle z fazą B.
- Autopilot (faza D) wymaga ekonomii, więc jego zakres zależy od tego, co wejdzie do premiery.

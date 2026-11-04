# Mapa drogowa wydania cyfrowego

Jedna lista „co dalej”. Łączy kod (etapy z `ROZBUDOWA_CYFROWA.md`) z pracą nad grafiką, animacją i dźwiękiem (`POTOK_ANIMACJI.md`).
Decyzje i pytania do autora: `DECYZJE.md`. Zrobione punkty oznaczamy [x] (i zostawiamy do końca fazy). Stan na 4.11.2026.

Zasady: zasady planszówki zamrożone jako tryb „Klasyczny” (`golden.test.ts` nie może się zmienić); jedna zmiana = jeden commit;
każdy nowy zasób wpisujemy do manifestu (źródło, narzędzie, prompt, licencja, czy AI), bo potrzebne jest ujawnienie AI na Steamie.

## Faza 0 — przygotowanie (zrobione)

- [x] Kierunek rozbudowy, drabinka złożoności, zakres premiery (poziomy 1–2 + hotseat/tryb rodzinny), frakcje na premierę.
- [x] Scenario: konto (Starter), MCP podłączone, licencja komercyjna potwierdzona.
- [x] Test grafiki, animacji lotu i śmierci na Złotym Smoku; potok opisany (`POTOK_ANIMACJI.md`).

## Faza A — fundament silnika i wzorzec jednostki 2D

- [x] Etap 0: pole `ruleset` (`classic` / `digital`) w ustawieniach gry; zmiany tylko w `digital`; dokument zasad cyfrowych obok notatek planszówki (`ZASADY_CYFROWE.md`).
- [x] Silnik bitwy (`digital`), trupy: martwe jednostki zostają na planszy, nie zajmują heksa (można po nich chodzić); wskrzeszenie na polu trupa. (Widok trupów w UI przyjdzie z rendererem 2D.)
- [ ] Silnik bitwy (`digital`), duże jednostki: 2 heksy, głowa + ogon poziomo (ruch, atak, rozstawienie, boty); rozmiar ustalany przy każdej frakcji, na start tylko Złoty Smok.
- [ ] Renderer 2D zamiast figurek 3D (`FigureLayer`): sprite'y z arkuszy klatek, odbicie lustrzane, maszyna stanów (stoi, ruch, atak, trafienie, śmierć), cień pod jednostką.
- [ ] Ruch: prędkość po planszy stała, ustalana w kodzie; pętla lotu/chodu powtarzana do dystansu, wzbicie i lądowanie raz.
- [ ] Złoty Smok jako pierwsza jednostka w grze, w pełni zintegrowana (wzorzec dla reszty).
- [ ] Trafienie w kodzie (drgnięcie, błysk, cofnięcie): ocena efektu; jeśli za słaby, klip.

## Faza B — potok zasobów i pierwsza frakcja w nowej grafice

- [ ] Klip ataku (smok): najpierw decyzja autora, jaki to atak (zionięcie, pazury, ugryzienie).
- [ ] Pętla chodu dla jednostki naziemnej (test na jednej jednostce Przymierza lub Hordy).
- [ ] Odniesienia stylu dla mrocznych jednostek (Horda, neutralni): propozycje Claude, ocena autora.
- [ ] Trening własnego stylu w Scenario (Pro na jeden miesiąc): najpierw 20–25 obrazów treningowych, potem powrót na Starter.
- [ ] Manifest zasobów (`assets.json`) i spis licencji wszystkich grafik i muzyki.
- [ ] Przymierze Świtu w nowej grafice (obrazy, ruch, atak, śmierć, trup); potem Mroczna Horda. Wymiana frakcjami, bez mieszania z figurkami 3D.
- [ ] Dźwięk: próbka efektów i muzyki z ElevenLabs (przed zakupem planu), spis licencji obecnej muzyki.

## Faza C — mapy i cele (etap 1, poziom 2 „Wyprawa”)

- [ ] Interfejs celu → punkty kontrolne → przetrwanie → boss → eskorta; moduły `checkVictory`, postęp w UI, wskazówki dla botów.
- [ ] Generator map: prostokąt → pierścień → wyspy → mapy ręczne (JSON).
- [ ] Poziomy bohaterów, artefakty, więcej obiektów na mapie.

## Faza D — tryb rodzinny

- [ ] Hotseat i tryb rodzinny (wspólna gra rodzic + dziecko), poziomy 1–2 jako preset przełączników.
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

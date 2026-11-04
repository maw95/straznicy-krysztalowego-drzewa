# Zasady wydania cyfrowego (tryb `digital`)

Zasady planszówki (`NOTATKI_DLA_AGENTA_PLANSZOWKI.md`) są zamrożone jako tryb „Klasyczny” (`ruleset: 'classic'`, `golden.test.ts`).
Wszystko poniżej działa tylko przy `ruleset: 'digital'` (w kodzie: `isDigital(rules)`). Brak pola `ruleset` = klasyczny.
Etapy rozbudowy: `ROZBUDOWA_CYFROWA.md`; kolejność prac: `MAPA_DROGOWA.md`; decyzje autora: `DECYZJE.md`.

## Bitwa

### Trupy (4.11.2026)

- Poległa jednostka zostaje na planszy w polu, w którym padła (`BattleUnit.corpse`), ale **nie zajmuje pola** (`pos` jest puste):
  inne jednostki mogą po niej chodzić, stawać na tym polu i atakować stojących na nim (jak w Heroesach).
- Trup nie jest celem ataku ani czaru.
- **Wskrzeszenie** (Eliksir Odrodzenia): jednostka wstaje na polu, na którym leżała. Gdy pole jest zajęte (albo, dla dużej
  jednostki, brakuje drugiego pola), pojawia się na najbliższym wolnym polu (przy remisie pierwsze w kolejności planszy).
  Gracz nadal może wskazać pole sam (jak dotąd). W animacji wskrzeszenie to śmierć odtworzona od tyłu.
- Pomocnik wymieniony Rogiem Strażników nie zostawia trupa (wraca do puli nietknięty).
- Limit rund (strona z mniejszą sumą Ż „pada”) nie zostawia trupów: bitwa i tak się kończy.

### Duże jednostki: 2 heksy (ustalenia 4.11.2026)

Które jednostki są duże, ustalamy **przy każdej frakcji** (przy ich animacjach); w danych to `UnitDef.size: 2`. Na początek tylko
Złoty Smok (wzorzec). W pojedynku na mapie (`duel`) wszystkie jednostki zajmują 1 pole.

- **Układ:** głowa + ogon, poziomo. Głowa (`pos`, przód) leży na jednym polu, ogon (`tail`) na jednym z czterech pól w sąsiednich
  kolumnach (kolumna ±1, półrząd ±1). Strona (lewo/prawo) wynika z położenia ogona; sprite jest odbijany.
- **Ruch:** zasięg liczy się dla głowy (jak dla jednostki 1-polowej, także lot). Głowa może stanąć tylko na polu, przy którym jest
  wolne pole na ogon. Własny ogon nie blokuje; po drodze liczy się tylko głowa (ogon „podąża”, nie zatrzymuje się na przeszkodach).
  Ruch w prawo daje ogon z lewej, ruch w lewo z prawej (jednostka się obraca), ruch w pionie zachowuje stronę. Gracz może wskazać,
  na którym z wolnych pól ma leżeć ogon (`battleMove.tail`); bez wyboru działa pierwsze legalne (ta sama strona, wyższe pole).
- **Atak:** z któregokolwiek z dwóch pól; cel jest trafiony, gdy którekolwiek z jego pól sąsiaduje z którymkolwiek polem napastnika
  (dla dużego celu: dowolne z jego dwóch pól). Linia strzału dla dystansowych liczy się od głowy do dowolnego pola celu.
- **Sąsiedztwo** (Opiekun Gaju, Róg Odwagi, zasięg Pajęczych Sideł, drugi cel Paszcz Otchłani): najmniejsza odległość między polami dwóch jednostek.
- **Odpychanie** (Miażdżący Głaz): duże jednostki są za ciężkie i nie są odpychane.
- **Rozstawienie:** pole w kolumnie startowej zajmuje **ogon**, głowa leży kolumnę dalej w stronę wroga (strona lewa patrzy w prawo, prawa w lewo);
  z dwóch możliwych pól głowy wybierane jest wolne, bliższe środka. Gracz wskazuje (w `deployUnits`) pole ogona w kolumnie startowej.
- **Odskok, teleport, wskrzeszenie, wymiana Rogiem:** głowa na wskazanym wolnym polu, ogon na pierwszym legalnym; jeśli się nie mieści,
  akcja jest odrzucana (wskrzeszenie szuka najbliższego pola, na którym jednostka się zmieści).
- **Trup dużej jednostki** leży na obu polach (`corpse` + `corpseTail`) i nie zajmuje żadnego; wskrzeszenie odtwarza oba pola, jeśli są wolne.
- **Boty** planują po polu głowy (dla pojedynczego smoka to wystarcza); ocena odległości do dużych wrogów liczona od ich głowy.

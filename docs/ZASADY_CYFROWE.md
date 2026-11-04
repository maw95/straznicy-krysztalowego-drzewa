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

### Duże jednostki: 2 heksy (ustalenia 4.11.2026, wdrożenie w toku)

- Które jednostki są duże, ustalamy **przy każdej frakcji** (przy ich animacjach). Na początek tylko Złoty Smok (wzorzec).
- Układ: **głowa + ogon, poziomo**. Główny heks (głowa/przód) i drugi heks z tyłu, w sąsiedniej kolumnie (sąsiedzi w płaskich
  heksach: kolumna ±1, półrząd ±1, czyli dwa możliwe pola: wyższe lub niższe). Jednostka ma stronę (lewo/prawo), sprite jest odbijany.
  Gracz wybiera, na którym z dwóch pól leży ogon, razem z celem ruchu.
- Reguły ruchu, ataku (z którego heksa, które heksy są celem), rozstawienia i odpychania: do zapisania tutaj przy wdrożeniu.

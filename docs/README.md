# Dokumentacja gry „Strażnicy Kryształowego Drzewa”

- `NOTATKI_DLA_AGENTA_PLANSZOWKI.md` — **obowiązujące zasady** (sekcja 0), decyzje, otwarte pytania i wyniki symulacji. Gdy źródła się różnią, rozstrzyga ten plik.
- `zrodla_zasad/` — wcześniejsze źródła zasad: ilustrowana instrukcja (PDF), specyfikacja dla AI i dokument kontekstowy.
- `grafika/` — projekt graficzny, z którego gra wycina swoje elementy:
  - `okladka/` — okładka (PDF i PNG) i logo;
  - `karty/` — wzory kart (z tekstem i bez);
  - `portrety/` — arkusze portretów jednostek i skarbów;
  - `ikony/` — ikony zdolności, statystyk, typów i herby;
  - `kafelki_mapy/` — kafelki terenu, skarbów, baz, siedlisk, Drzewa i rewersy;
  - `areny/` — plansze bitwy Przymierza i Hordy.
- `muzyka/` — ścieżka dźwiękowa.

Skrypty, które przenoszą grafiki do gry (`public/assets/`): `scripts/assets/extract.py` (karty), `scripts/assets/tiles.py` (kafelki), `scripts/assets/menu.py` (okładka i logo), `scripts/assets/arenas.py` (areny bitew; nowa grafika musi zachować tę samą siatkę pól).

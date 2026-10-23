# Dokumentacja gry „Strażnicy Kryształowego Drzewa”

- `INSTRUKCJA.md` — **instrukcja dla graczy** (fabuła, jednostki, zasady).
- `NOTATKI_DLA_AGENTA_PLANSZOWKI.md` — **obowiązujące zasady** (sekcja 0), decyzje, otwarte pytania i wyniki symulacji. Gdy źródła się różnią, rozstrzyga ten plik.
- `WYMIARY_ELEMENTOW.md` — **wymiary elementów fizycznych** i rozmiary grafik do druku.
- `FIGURKI_SPECYFIKACJA.md` — figurki do druku 3D; `druk3d/` — podstawki, kryształy i modele.
- `BACKLOG.md` — uzgodnione pomysły do wdrożenia (tryb online, figurki 3D w grze).
- `INFRASTRUKTURA.md` — **gdzie działa gra i serwer gry online i jak wdrażać zmiany** (wydania, silnik na serwerze, Fly.io, sekrety).
- `zrodla_zasad/` — wcześniejsze źródła zasad: ilustrowana instrukcja (PDF), specyfikacja dla AI i dokument kontekstowy.
- `grafika/` — projekt graficzny, z którego gra wycina swoje elementy:
  - `okladka/` — okładka (PDF i PNG) i logo;
  - `karty/` — wzory kart (z tekstem i bez);
  - `portrety/` — arkusze portretów jednostek i skarbów;
  - `ikony/` — ikony zdolności, statystyk, typów i herby;
  - `kafelki_mapy/` — kafelki terenu, skarbów, baz, siedlisk, Drzewa i rewersy;
  - `areny/` — plansze bitwy Przymierza i Hordy.
- `muzyka/` — ścieżka dźwiękowa.

Skrypty, które przenoszą grafiki do gry (`public/assets/`): `scripts/assets/extract.py` (karty), `scripts/assets/tiles.py` (kafelki), `scripts/assets/menu.py` (okładka i logo), `scripts/assets/arenas.py` (areny bitew; nowa grafika musi zachować tę samą siatkę pól), `scripts/assets/markers.py` (znaczniki), `scripts/assets/trophies.py` (puchary rankingu z `grafika/ikony/puchary/`, zmniejszone do 96 px).

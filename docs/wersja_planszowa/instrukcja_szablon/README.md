# Strażnicy Kryształowego Drzewa — szablon instrukcji A4

Pełna instrukcja gry (okładka + 40 numerowanych stron A4; okładka nie ma numeru) na bazie szablonu HTML/CSS. Treść pochodzi z `docs/INSTRUKCJA.md`: okładka, wiadomość od autora (strona 1), spis treści, opowieść, zasady w obrazkach, rozdziały 1–16 z przykładami (tura na mapie, początek bitwy), przypadki szczególne, ściągawka i rozdział 17 o malowaniu figurek. Strony składa skrypt `scripts/assets/manual_build.py`; gotowy PDF do druku robi `make druk` (plik `../do_druku/01_instrukcja_A4.pdf`).

**Strona 1 — wiadomość od autora:** ma linie do pisania ręcznego po wydrukowaniu. Żeby wpisać tekst na komputerze, w `index.html` (albo w `scripts/assets/manual_build.py`, jeśli strony będą składane od nowa) zamień `<div class="lines"></div>` na akapity `<p>…</p>`.

## Jak zacząć

1. Rozpakuj **cały** folder. Wszystkie grafiki muszą pozostać w podfolderze `assets`.
2. Otwórz `index.html` w Chrome/Chromium/Edge lub Firefox.
3. Otwórz ten sam plik w edytorze (VS Code, PhpStorm), wyszukaj fragmenty tekstu w nawiasach kwadratowych `[ ... ]` i wstaw własne treści.
4. Kolory, fonty, marginesy i ozdobniki znajdują się w `style.css`. Najważniejsze kolory znajdziesz na początku pliku: `--forest`, `--horde`, `--navy`, `--gold`.
5. Jeśli potrzebujesz kolejnej strony, skopiuj cały blok `<section class="sheet"> ... </section>`. Możesz mieszać gotowe wzorce i kopiować elementy klas `banner`, `cols`, `steps`, `table`, `card`, `paper-note` itp.
6. Nagłówki/numeracja stron wpisane są ręcznie w przykładowych stronach, żeby projekt działał bez JavaScript. Aktualizuj je przy dodawaniu stron.

## Eksport do PDF

Otwórz `index.html` w Chrome → Drukuj (Ctrl+P) → Zapisz jako PDF → papier A4 → orientacja pionowa → marginesy **Brak** → skala **100%** → zaznacz „Grafika w tle” → wyłącz systemowe nagłówki/stopki.

**Ważne:** strony mają stały wymiar A4; długi tekst może wypaść poza ramkę. W takim przypadku skopiuj kolejną stronę, zamiast zmniejszać czcionkę do nieczytelnych rozmiarów. Przed drukiem każdorazowo sprawdź podgląd. Font użyty w projekcie to `EB Garamond` (z zamiennikami); jeśli nie masz go zainstalowanego, przeglądarka dobierze podobny krój. Pliki fontów nie są dołączone.

Grafiki pochodzą z wcześniej zaakceptowanych materiałów rozmowy. Ich kompozycja nie została generowana od nowa. W stronach demonstracyjnych zastosowano wyłącznie teksty zastępcze — nie traktuj ich jako ostatecznych reguł gry.

## Sprawdzanie stron (podgląd roboczy)

- Na górze podglądu widać napis „Wszystkie strony mieszczą się w ramkach” albo listę stron, na których tekst wychodzi poza ramkę. Takie strony mają też czerwony obrys. W druku/PDF tych oznaczeń nie ma.
- `index.html?show=5,6,7` pokazuje tylko wybrane strony obok siebie (wygodne do przeglądu).

## Grafiki

- `assets/karty/` — aktualne karty jednostek i skarbów (zrzuty z gry, statystyki zgodne z `src/engine/data.ts`).
- `assets/arena_przymierze.jpg`, `assets/arena_horda.jpg` — aktualne areny (siatka, pola startowe, 7 przeszkód).
- `assets/mapa_przyklad.png` — przykładowa mapa średnia złożona z kafelków gry; `assets/kafelki/` — pojedyncze kafelki.
- `assets/round_track.png`, `assets/round_crystal.png` — tor rund i znacznik; `assets/znaczniki/` — znaczniki.

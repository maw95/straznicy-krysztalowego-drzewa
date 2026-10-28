# Backlog

Uzgodnione pomysły do wdrożenia. Zrobione punkty są usuwane (zostają w historii gita i w CHANGELOG.md):
tryb online z menu i rankingiem, figurki 3D, szczegóły pod prawym przyciskiem, atak jednym kliknięciem,
porządki w kodzie (etapy 0–4 i resztki), wersja mobilna, zgłoszenia z 23.10 i 28.10.

## 1. Nowe materiały od autora (28.10)

Szacunki kosztu to tokeny zużyte przez Claude w jednej sesji (czytanie plików, zrzuty ekranu, testy). Każdy
punkt to osobny commit; najtańsza kolejność: 1.5 → 1.4 → 1.3 → 1.2 → 1.1.

- [ ] **1.1. Nowe modele figurek (GLB) w grze i rzuty w instrukcji.** *Koszt: ok. 150–250 tys. tokenów*
      (część a ok. 50–80 tys., część b ok. 100–170 tys.).
  - a) `docs/druk3d/figurki/z_teksturami/*.glb` (15 plików, razem 2,9 GB) → `make modele` → `public/modele/`,
    z limitem 2,5 MB na model; sprawdzić rozmiary, galerię `?figury` i figurki na mapie i arenie. Przy okazji
    sprawdzić, czy nowy Goblin ma scalone wierzchołki (punkt 2) i czy nieśledzone w gicie
    `public/modele/{cyclops,griffin,hydra,werewolfLord}.glb` mają trafić do repozytorium.
  - b) Nowe podglądy figurek zamiast `docs/grafika/figurki/pomalowane/{horda,przymierze}.png` (+ strażnicy):
    render modeli three.js w przeglądarce bez okna, z przezroczystym tłem (PNG z kanałem alfa), jeden obraz na
    figurkę albo zestaw na frakcję. Wstawić do instrukcji: `docs/INSTRUKCJA.md` i szablon
    `docs/edytowalny_szablon_instrukcji/assets/figurki/`. Da się to zrobić — gra już rysuje modele three.js,
    trzeba tylko skryptu, który ustawi kamerę i zapisze kadr.
- [ ] **1.2. Znaczniki „+3 Ataku” i „+4 Zdrowia”.** *Koszt: ok. 60–90 tys. tokenów.*
  - `docs/grafika/ikony/znacznik_+4_zdrowia.png` zastępuje dotychczasową ikonę Żywotności (+4 Ż).
  - `docs/grafika/ikony/znacznik_+3_ataku.png` — nowy znacznik przy Złotym Smoku po użyciu Słonecznego Blasku
    (`sunburstSelfBonus: 3`), widoczny w bitwie (karta, pasek aktywacji, arena), znika po jego ataku.
  - Dziś znaczniki są wycinane z arkusza `znaczniki.png` (`scripts/assets/markers.py`, `src/ui/markers.tsx`) —
    nowe są osobnymi plikami, trzeba je dopasować rozmiarem. Instrukcja: opis zdolności Smoka, lista znaczników,
    szablon (`assets/znaczniki/`).
- [ ] **1.3. Nowe portrety: 6 jednostek Hordy i Hydra.** *Koszt: ok. 40–70 tys. tokenów.*
  - `docs/grafika/portrety/horda_*_portret.png` i `straznik_hydra_portret.png` (stary `hydra.png` usunięty).
    Dziś portrety Hordy pochodzą z arkusza `portrety_mroczna_horda.png` — przejść na osobne pliki, przyciąć
    i zmniejszyć jak pozostałe. Sprawdzić w grze (karta, pasek, okno szczegółów, wybór bohatera) i podmienić
    w instrukcji i szablonie.

## 2. Figurki 3D — drobne

- **Goblin Szaman** waży 6,4 MB: jego model ma osobne wierzchołki dla prawie każdego trójkąta, więc upraszczanie
  stopuje na ok. 170 tys. trójkątów. Lepiej byłoby wyeksportować go ze scalonymi wierzchołkami.
- Kąt kamery i wielkość figurek — do ewentualnej korekty po obejrzeniu na żywo.

## 3. Szczegóły pod prawym przyciskiem — drobne

- Obecne podglądy kart po najechaniu myszą — do przejrzenia; docelowo prawy przycisk może je zastąpić tam,
  gdzie zasłaniają planszę.

## 4. Do przemyślenia: zasady bitwy

Pytania autora — jeszcze bez decyzji. Zmiana zasad dotyczy też wersji papierowej: instrukcji,
notatek (`docs/NOTATKI_DLA_AGENTA_PLANSZOWKI.md`) i balansu, więc przed decyzją warto puścić symulacje
(`make sim-battles`, `make sim-tabele`) z wariantem w `SIM_OVERRIDE` / przełącznikiem zasad.

### 4.1. Czy strzelec może się ruszyć, a potem zaatakować?

**Pytanie:** czy po ruchu strzelec powinien tracić możliwość ataku?

**Dziś:** może i ruszyć się, i strzelić w tej samej aktywacji. Zasięg strzału jest nieograniczony (wystarczy
linia wzroku), a gdy obok stoi wróg, strzelec musi zaatakować sąsiada.

**Uwagi (Claude):**
- „Ruch albo strzał” mocno osłabia strzelców — przy nieograniczonym zasięgu ruch służy im głównie do ucieczki
  od sąsiada albo do wyjścia zza przeszkody. Strzelcy wygrywali kiedyś ok. 62% bitew (notatki, sekcja balansu),
  więc pewne osłabienie może być wskazane, ale ta zasada byłaby dużą zmianą.
- Łagodniejsze warianty: strzał po ruchu z karą (−1 A), albo „ruch o najwyżej 1–2 pola i strzał”, albo zakaz
  strzału tylko po ruchu dłuższym niż połowa Szybkości.
- Prosta do wytłumaczenia na planszy jest wersja „albo ruch, albo strzał”; reszta wymaga liczenia pól.
- Gra ma już podobny wyjątek (aktywacja „tylko ruch” z Rogu Strażników), więc w kodzie to niewielka zmiana:
  przełącznik w `RulesConfig`, jak inne zasady testowe.

### 4.2. Czy inne jednostki zasłaniają strzał?

**Pytanie:** czy strzelec może strzelać przez inne jednostki, czy jednostki działają jak przeszkody terenowe?

**Dziś:** zasłaniają tylko przeszkody. W silniku jest już gotowy przełącznik `unitsBlockSight`
(wyłączony) — po włączeniu jednostki zasłaniają tak jak przeszkody, a kursor pokaże przekreśloną strzałę.

**Uwagi (Claude):**
- Za: więcej taktyki (zasłanianie strzelca własnymi jednostkami, ustawianie się na linii strzału), naturalne
  dla gracza.
- Przeciw: silnie osłabia strzelców w ciasnych bitwach 3 na 3, a na zatłoczonej arenie strzał byłby często
  niemożliwy; trudniej to sprawdzić „na oko” na planszy papierowej.
- Wariant pośredni: zasłaniają tylko **wrogie** jednostki (własne nie), albo tylko jednostki duże (smoki, ogr,
  niedźwiedź, cyklop, hydra).
- Przełącznik już działa, więc najpierw symulacje: jak zmieni się % wygranych strzelców i długość bitew.

Uwaga przy wydaniach: serwer odrzuca nieznane typy akcji, więc wydanie gry z nowym typem akcji wymaga najpierw
wdrożenia serwera z nowym pakietem silnika.

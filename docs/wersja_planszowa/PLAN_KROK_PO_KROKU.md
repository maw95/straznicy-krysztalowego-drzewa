# Wersja planszowa — plan krok po kroku

Ściąga: co przygotować, w jakiej kolejności, jakie wymiary, co kupić i gdzie. Stan na 28.10.2026:
figurki i znaczniki są zlecone do druku 3D, instrukcja trafi do segregatora, karty, kafelki, arena i instrukcja
drukujemy na zwykłej drukarce (papier fotograficzny), pudełko robimy ręcznie z cienkich desek.

## Co jest w tym folderze

| Plik / folder | Co to jest |
|---|---|
| `PLAN_KROK_PO_KROKU.md` | ten plik |
| `do_druku/` | **gotowe PDF-y do druku** (tworzy je `make druk`; pliki nie są w gicie, można je zawsze zrobić od nowa) |
| `okladki_przod_tyl_grzbiet.pdf` | **okładka segregatora** autora: 3 strony — przód (A4), tył (A4) i **grzbiet 10 × 297 mm** |
| `logo_zolte_120mm.pdf`, `logo_zolte_przezroczyste.png` | **żółte logo na przezroczystym tle** na pudełko: PDF 140 × 110 mm z logo szerokim na 120 mm, PNG 1448 × 1086 px (RGBA) |
| `ZAKUPY_3_EGZEMPLARZE.md` | lista zakupów na 3 egzemplarze z linkami do ofert, tusz do HP DeskJet 2545 |
| `WYMIARY_ELEMENTOW.md` | wymiary wszystkich elementów i zasady druku |
| `FIGURKI_SPECYFIKACJA.md`, `druk3d/` | figurki, podstawki, kryształy, znacznik rundy — pliki do druku 3D |
| `instrukcja_szablon/` | instrukcja A4 w HTML (źródło PDF-a); strona 1 (po okładce) to wiadomość od autora |
| `Instrukcja_Straznicy.docx` | instrukcja do edycji w Wordzie / Dokumentach Google |

Pliki w `do_druku/`:

| Plik | Arkuszy A4 | Na czym drukować |
|---|---:|---|
| `01_instrukcja_A4.pdf` | 41 stron (okładka + 40 numerowanych) | zwykły papier 80–90 g, jednostronnie do koszulek |
| `02_karty_jednostek_awersy.pdf` + `03_…_rewersy.pdf` | 5 + 5 | papier fotograficzny |
| `04_karty_skarbow_awersy.pdf` + `05_…_rewersy.pdf` | 3 + 3 | papier fotograficzny |
| `06_kafelki_mapy_awersy.pdf` + `07_…_rewersy.pdf` | 9 + 8 | papier fotograficzny |
| `08_arena_A3_na_4_arkuszach_A4.pdf` | 4 | papier fotograficzny |
| `09_naklejki_znaczniki_kosc_tor_rund.pdf` | 2 | papier samoprzylepny (strona 2 — tylko gdy tor rund jest jednokolorowy) |
| `10_okladka_A4_pokrywa_i_segregator.pdf` | 1 (+1) | papier fotograficzny — wersja zapasowa; do segregatora użyj `okladki_przod_tyl_grzbiet.pdf` z tego folderu (niżej) |
| `11_logo_etykiety_pudelka_i_grzbiet.pdf` | 3 | papier fotograficzny / samoprzylepny — etykiety na boki pudełka (strona 2) i grzbiety 35, 50 i 70 mm (strona 3) |
| `okladki_przod_tyl_grzbiet.pdf` (plik autora, kopiowany przez `make druk`) | 2 + pasek | papier fotograficzny — okładka segregatora: przód i tył A4 oraz pasek grzbietu 10 mm |
| `logo_zolte_120mm.pdf` (plik autora, kopiowany przez `make druk`) | 1 | logo na wieko pudełka (patrz krok 8, „Grafiki”) |

**Razem ok. 42 arkusze papieru fotograficznego, 2 arkusze samoprzylepnego i 41 kartek zwykłego papieru na instrukcję.**
Z zapasem na pomyłki kupcie 50–60 arkuszy fotograficznego na egzemplarz (ilości na 3 egzemplarze: `ZAKUPY_3_EGZEMPLARZE.md`).

---

## Krok 0. Zanim zaczniesz (15 min)

- [ ] **Zmierz segregator** (szerokość × wysokość × grzbiet) — od niego zależy wnętrze pudełka (krok 8).
- [ ] **Drukarka: HP DeskJet 2545** (atramentowa, wkłady HP 301 / 301XL) — papier fotograficzny do drukarek
      **atramentowych**. Druk dwustronny instrukcji ręcznie (najpierw strony nieparzyste, potem odwrócony stos).
- [ ] **Wydruk próbny:** wydrukuj **jedną** stronę z `06_kafelki_mapy_awersy.pdf` na zwykłym papierze.
      W ustawieniach druku: **skala 100% / „rozmiar rzeczywisty”**, nigdy „dopasuj do strony”.
      Na dole każdego arkusza jest odcinek — zmierz linijką: **musi mieć 50 mm**. Kafelek musi mieć 50 mm między
      płaskimi bokami. Jeśli wymiary się zgadzają, możesz drukować na właściwym papierze.
- [ ] Jakość druku: „najlepsza / foto”, typ papieru zgodny z kupionym (np. „błyszczący fotograficzny”).

## Krok 1. Zakupy

Lista zakupów z linkami do konkretnych ofert Allegro, ilościami na **3 egzemplarze** i tuszem do HP DeskJet 2545:
**[`ZAKUPY_3_EGZEMPLARZE.md`](ZAKUPY_3_EGZEMPLARZE.md)** (papier, tusz, tektura, kleje, laminowanie, narzędzia, segregatory,
drobiazgi i materiały na pudełka). Na jeden egzemplarz podziel ilości papieru, tektury i folii przez trzy.

## Krok 2. Instrukcja do segregatora (1 h)

1. Plik: `01_instrukcja_A4.pdf` (41 stron A4: okładka i 40 numerowanych). **Strona 1 jest na wiadomość od autora** — przed drukiem wpisz ją
   w `instrukcja_szablon/index.html` (opis w `instrukcja_szablon/README.md`) albo wydrukuj stronę z liniami i napisz ręcznie.
2. Druk: skala 100%, jednostronnie na zwykłym papierze 80–90 g; do koszulek wkładaj po dwie kartki plecami do siebie
   (41 stron = 21 koszulek).
3. Strony wpinamy po kolei. Okładka segregatora: `okladki_przod_tyl_grzbiet.pdf` (plik autora; oryginał w `wersja_planszowa/`, kopia w `do_druku/`) — **strona 1 to przód** (do przezroczystej kieszeni na przodzie), **strona 2 to tył**, **strona 3 to
   pasek grzbietu 10 × 297 mm** (do kieszeni na grzbiecie). Wydrukuj w skali 100%. Grzbiet ma 10 mm szerokości, więc
   **sprawdź, czy tyle ma grzbiet Twojego segregatora** (zmierzony w kroku 0). Jeśli grzbiet jest szerszy, weź etykietę
   z `11_logo_etykiety_…pdf` (trzecia strona: 35, 50 i 70 mm).

## Krok 3. Karty (2–3 h)

Wymiary: **karty jednostek 80 × 112 mm** (18 szt.), **karty skarbów 63 × 88 mm** (20 szt.). Na arkuszach jest
spad 1,5 mm i znaczniki cięcia na marginesach.

1. Wydrukuj awersy (`02`, `04`) i rewersy (`03`, `05`) na papierze fotograficznym. Rewersy są ułożone w lustrze —
   arkusz rewersów przyłożony tyłem do arkusza awersów trafia kartą na kartę.
2. **Sklejanie (klej w sprayu, jedna puszka na 3 egzemplarze):** cienko spryskaj arkusz rewersów (z 25–30 cm, przy otwartym
   oknie). Klej kontaktowy łapie od razu, więc połóż na nim papier do pieczenia, zostawiając odsłonięty pasek ok. 1 cm
   u góry, wyrównaj arkusz awersów tyłem do tyłu **pod światło** (szyba okna), dociśnij górny pasek i powoli wyciągaj
   papier do pieczenia, wygładzając arkusz od góry do dołu.
3. Opcjonalnie zalaminuj cały sklejony arkusz (folia 80 mic) — karty będą odporne na palce i krople.
4. Tnij nożykiem przy metalowej linijce: łącz parami znaczniki cięcia po przeciwnych stronach arkusza
   (najpierw wszystkie cięcia pionowe, potem poziome).
5. Narożniki zaokrąglij zaokrąglaczem R3–R4.
6. Kontrola: 6 Przymierza (zielony rewers), 6 Hordy (bordowy), 3 strażników (granatowy), 3 strażników do pojedynku
   (błękitny), 20 skarbów (w tym 6 Eliksirów Odrodzenia).

## Krok 4. Kafelki mapy (4–6 h — najdłuższy krok)

Wymiar: sześciokąt **50 mm** między płaskimi bokami (57,7 mm między rogami), 15 kafelków na arkuszu, **121 szt.**
Arkusze 1–4 to talia Przymierza (zielony rewers), 5–8 talia Hordy (bordowy), 9 — Kryształowe Drzewo.

1. Wydrukuj awersy (`06`, 9 arkuszy) i rewersy (`07`, 8 arkuszy; Drzewo nie ma rewersu).
2. Przytnij tekturę 2 mm na **arkusze A4 (210 × 297 mm)** — dokładnie na wymiar kartki.
3. Na każdy arkusz tektury naklej **klejem Wikol** (nierozcieńczonym, cienko i równo, wałkiem albo kartą, na tekturę):
   z jednej strony **rewersy**, z drugiej **awersy z tym samym numerem arkusza**, oba wyrównane do krawędzi tektury —
   **obie strony od razu**, żeby tektura się nie wygięła. Rewersy mają większy spad, więc 1–2 mm przesunięcia nie widać.
   Wygładź suchą ściereczką od środka do brzegów. Pierwszy arkusz zrób na próbę.
4. Przełóż papierem do pieczenia i zostaw pod stosem książek **na całą noc**.
5. Wycinaj od strony awersu wzdłuż białej linii każdego sześciokąta (6 prostych cięć na kafelek). Tekturę 2 mm tnie się
   w 2–3 przejściach — nie na siłę.
6. Krawędzie można przyciemnić czarnym/brązowym markerem — kafelki wyglądają wtedy jak ze sklepu.
7. Kontrola: 50 zielonych (po 7 z 7 rodzajów + 1 Polana), 49 bordowych (po 7 z 7 rodzajów), 16 skarbów (8 + 8),
   3 siedliska (Gryf — zielony; Cyklop, Hydra — bordowe), Drzewo, 2 bazy.

## Krok 5. Plansza areny (1–2 h)

Plansza A3 (420 × 297 mm), dwustronna, składana na pół; **pole 34 mm**, 85 pól, 7 przeszkód na stronę.
Plik `08_…pdf` ma 4 arkusze: arena Przymierza lewa i prawa połowa, arena Hordy lewa i prawa.

1. Wydrukuj 4 arkusze na papierze fotograficznym (skala 100%).
2. Na każdym arkuszu jest przerywana **linia cięcia przy środku planszy** — przytnij tam (5 mm od krawędzi kartki).
   Białe brzegi drukarki na zewnętrznych krawędziach też obetnij.
3. Wytnij z tektury 2 mm **dwa prostokąty** o wymiarze przyciętych połówek (ok. 205 × 290 mm).
4. **Uwaga na odwracanie:** po obróceniu planszy lewa połowa staje się prawą. Dlatego:
   - tektura A: **Przymierze — lewa połowa** z jednej strony, **Horda — prawa połowa** z drugiej;
   - tektura B: **Przymierze — prawa połowa** z jednej strony, **Horda — lewa połowa** z drugiej.
   Przed klejeniem połóż obie tektury obok siebie i sprawdź, że po obu stronach obrazy się łączą.
   Klej Wikolem jak kafelki (obie strony od razu, noc pod książkami).
5. Połącz połówki zawiasem z taśmy tkaninowej (duct tape) (z jednej strony, ze szczeliną 2–3 mm, żeby plansza się składała;
   z drugiej strony cienki pasek taśmy albo nic).
6. Sprawdź: podstawka figurki (30 mm) mieści się w polu z zapasem.

## Krok 6. Znaczniki, kość i tor rund (1 h, po odebraniu wydruków 3D)

Plik `09_…pdf`, papier samoprzylepny.

- **Znaczniki stanu** (19 szt.): naklejki Ø 21 mm na krążki Ø 23 mm — 6 × zużyta zdolność, 6 × Wzmocnienie Ataku,
  po 1: +3 Ataku, Żywotność, Ochrona, Unieruchomienie, Spowolnienie, Klątwa, Przyspieszenie. Wycinać nożyczkami
  albo dziurkaczem 20 mm.
- **Krople obrażeń** (16 szt., dwustronne 15,6 × 20 mm): naklejki 14 × 18 mm, po jednej na stronę — 6 kropli „1” / „2”,
  10 kropli „3” / „5”.
- **Kość:** kostka drewniana 16 mm + 6 naklejek 14 mm: −1, −1, 0, 0, +1, +1 (przeciwne ściany: −1 naprzeciw +1).
- **Tor rund** (strona 2 pliku): tylko jeśli wydruk 3D jest w jednym kolorze. Najpierw przyłóż wydruk do toru —
  gniazda muszą trafić w gniazda; otwory wytnij nożykiem.
- Kryształy (3) i znacznik rundy — z drukarki 3D, bez naklejek.

## Krok 7. Kontrola przed pudełkiem

Rozłóż partię próbną według instrukcji (mapa krótka, rozdział 5) — szybko widać, czego brakuje. Zmierz też
**najwyższą figurkę z podstawką** (planowo ok. 71 mm) — od niej zależy wysokość pudełka.

## Krok 8. Lekkie pudełko z cienkiej sklejki (1–2 dni z suszeniem)

Cel: pudełko **lekkie** i nadal sztywne. Zasady: lekki gatunek (topola), cienkie ścianki 3 mm, grubsze tylko dno (4 mm),
sztywność dają listewki 10 × 10 mm w narożnikach, a nie grubość płyt. Pokrywa nasuwana jak w pudełku na buty —
bez zawiasów, zamknięć i łańcuszków (to dodatkowe gramy i robota).

### Układ pięter (od dna)

1. **Dno 4 mm** + **pianka EVA 10–12 mm** (kafel piankowych puzzli podłogowych) przyklejona do dna, z 15 gniazdami na figurki.
2. **Półka 3 mm** wyjmowana, leży na szynach 10 × 10 przyklejonych do długich ścianek, 86 mm nad dnem
   (pianka 10 + najwyższa figurka z podstawką 71 + luz 5; przy piance 12 mm — 88 mm). Półka chroni figurki przed naciskiem.
3. Na półce: karty, tor rund, woreczki i **stosy kafelków** (6 stosów po 20, każdy kafelek ok. 2,3 mm, czyli stos ok. 46 mm),
   na nich złożona plansza areny (ok. 5 mm).
4. Na samej górze: **segregator** (leży płasko).

Układ na półce (330 × 250 dla segregatora autora): w pierwszym rzędzie tor rund 150 × 144 i obie talie kart (80 × 112
i 63 × 88), razem ok. 293 × 144; w drugim rzędzie 6 stosów kafelków 3 × 2 (ok. 174 × 100). Razem ok. 244 mm głębokości —
mieści się, ale ciasno; ułóż wszystko na sucho przed klejeniem szyn.

Ta sama półka przy okazji obciąża tylko szyny, a nie figurki. Przy 3 mm ugięcie półki pod 2 kg to szacunkowo ok. 1–2 mm
(rozpiętość 250 mm) — wystarczy, bo pod półką jest 5 mm luzu; po zbudowaniu sprawdź na pustym pudełku z ciężarem.

### Wnętrze figurek: pianka z otworami

- **Pianka:** zamiast modelarskiej EVA (ok. 50 zł za arkusz) **piankowe puzzle podłogowe 60 × 60 cm**, grubość 10–12 mm
  (nie 20 mm) — to też EVA, trochę mniej gęsta; jeden kafel starcza na wkładkę do jednego pudełka. Ząbki na brzegach
  odetnij nożykiem przy linijce, stronę z fakturą daj od spodu, pod klej.
- Otwory wycinaj **otwornicą bimetalową**, a nie piłą: pianka rwie się przy szybkim cięciu. Przyłóż piankę do kawałka
  zbędnej deski, dociśnij ściskiem, tnij na **niskich obrotach** i bez nacisku, od razu głębokość całej grubości.
- **Średnica otworu: 30 mm** — podstawki figurek są **okrągłe, Ø 30 mm**. Pianka lekko się ściska przy cięciu, więc
  gniazdo wyjdzie na styk i figurka będzie siedzieć ciasno. **Zrób próbę na ścinku z pierwszą wydrukowaną figurką,
  zanim potniesz kafel:** jeśli wkładanie jest za ciężkie albo wyjmowanie rwie brzeg gniazda, poszerz otwór
  (otwornica 32 mm albo przeszlifuj brzeg papierem nawiniętym na kołek).
- Dlaczego pianka 10 mm: podstawka ma 3 mm wysokości, więc w 5 mm pianki trzymałaby się tylko na 3 mm i figurka mogłaby
  wyskoczyć przy przechylaniu pudełka. W 10 mm pianka obejmuje podstawkę z zapasem i amortyzuje wstrząsy.
- **Rozstaw:** 15 gniazd, środek do środka co najmniej **50 mm** (5 × 3 gniazda zajmują ok. 250 × 150 mm). Skrzydła, ogony
  i broń zajmują więcej miejsca niż podstawka, więc przed cięciem ustaw wszystkie figurki na kartonie z zapasem 5–10 mm
  i obrysuj miejsca (bohaterów, zwłaszcza smoki, rozstaw szerzej).
- Piankę klej do dna klejem kontaktowym albo taśmą dwustronną. Klej PVA do pianki się nie nadaje.
- Dodatkowo (opcja): na spodzie półki, nad figurkami, przyklej pasek pianki 5 mm — lekko dociska figurki, gdyby ktoś odwrócił
  pudełko. Wtedy luz nad figurkami to 0 mm, więc podnieś szyny o 5 mm i sprawdź na najwyższej figurce.

### Wymiary (w mm)

Wnętrze musi zmieścić **segregator**, planszę, karty, stosy kafelków i figurki. Wzór:

- **długość wewnętrzna L** = dłuższy bok segregatora + **20** (10 na luz i 10 na słupki narożne)
- **szerokość wewnętrzna W** = krótszy bok segregatora + **20**, ale co najmniej **225** (złożona arena 210 × 297 leży
  wzdłuż pudełka)
- **wysokość wewnętrzna H** = 86 (pianka, figurki, luz) + 3 (półka) + wysokość stosów kafelków (ok. 46) + złożona arena (5)
  + grzbiet segregatora **z wpiętą instrukcją** + 5 luzu

**Segregator autora (31 × 23 × 1 cm):** **L = 330, W = 250, H = 155** (zewnętrznie ok. 336 × 256 × 159 z dnem 4 mm).
Przed zamówieniem sklejki zmierz: najwyższą wydrukowaną figurkę z podstawką (plan zakłada 71 mm), stos 20 sklejonych
kafelków (46 mm), grubość pianki (10 czy 12 mm) i segregator **z instrukcją w koszulkach** — każda różnica zmienia H.
Gdyby H miało być niższe, zrób stosy po 15 kafelków (8 stosów, ok. 35 mm; wtedy sprawdź, czy zmieszczą się na półce).

### Lista cięcia (t = 3 mm; dno 4 mm; dla segregatora autora)

| Element | Ile na 1 pudełko | Wymiar (mm) | Wzór |
|---|---:|---|---|
| Dno (sklejka **4 mm**, docinasz sam z formatki 500 × 500) | 1 | 336 × 256 | (L + 2t) × (W + 2t) |
| Ścianka długa | 2 | 336 × 155 | (L + 2t) × H |
| Ścianka krótka | 2 | 250 × 155 | W × H — między długimi |
| Półka | 1 | 329 × 249, w narożnikach wycięcia 10 × 10 (nożykiem) | (L − 1) × (W − 1) |
| Pokrywa — wieko | 1 | 343 × 263 | (L + 4t + 1) × (W + 4t + 1) |
| Pokrywa — rant długi | 2 | 343 × 30 | (L + 4t + 1) × 30 — z pasa, niżej |
| Pokrywa — rant krótki | 2 | 257 × 30 | (W + 2t + 1) × 30 — z pasa, niżej |
| Listwa 10 × 10: słupki narożne | 4 | 155 | H |
| Listwa 10 × 10: szyny półki (długie ścianki, wysoko 86 mm) | 2 | 310 | L − 20 |
| Listwa 10 × 10: ramka wewnątrz wieka | 2 + 2 | 337 oraz 237 | L + 2t + 1 oraz (W + 2t + 1) − 20; dopasuj do rantów |

Pokrywa ma 1 mm luzu. Przy innej grubości płyt podstaw w wzorach swoje `t`.

**Ranty z pasów.** Sklejka-Kraków nie tnie formatek węższych niż **100 mm**, a ranty mają 30 mm. Zamów więc na 3 pudełka
**jeden pas 343 × 200** (6 rantów długich) i **jeden pas 257 × 200** (6 rantów krótkich) i potnij je sam **nożykiem przy
stalowej linijce** na macie: odmierz 30 mm, kilka lekkich pociągnięć zamiast jednego mocnego, aż ostrze przejdzie przez
3 mm topoli. Krawędź po nożyku przeszlifuj papierem 180 na klocku. Piłą ręczną pasków węższych niż 30 mm nie tnij — wyjdą krzywe.

**Zamówienie na 3 pudełka:** z jednego arkusza 1880 × 1220 wychodzi dokładnie 20 formatek (limit bezpłatnego cięcia
to 17–20 na arkusz): 6 × 336 × 155, 6 × 250 × 155, 3 × 329 × 249, 3 × 343 × 263, 1 × 343 × 200, 1 × 257 × 200 —
razem ok. 1,24 m², mieszczą się w pasie ok. 1880 × 835 mm. Wymiary w uwagach to wymiary **gotowych** części (rzaz ok. 3 mm
po stronie sklepu); poproś o dokładność ±1 mm (sklep podaje ±1%, czyli na ściance nawet ±3,5 mm). Zostaje pas ok.
385 × 1880 mm, dłuższy niż limit kuriera (1450 × 1000) — napisz, żeby go docięli albo zatrzymali.

**Listwy na 3 pudełka** (12 × 155, 6 × 310, 6 × 337, 6 × 237) z 7 listew po 1200 mm:
3 × (337 + 337 + 310 + 155), 1 × (310 + 310 + 310 + 155), 1 × (237 × 4 + 155), 1 × (237 × 2 + 155 × 4), 1 × (155 × 3).
Bez zapasu — tnij najpierw najdłuższe odcinki i odmierzaj każdy od świeżo uciętego końca.

### Składanie

1. Przeszlifuj krawędzie (papier 120, potem 180). Zrób **próbne ustawienie na sucho** wszystkich części.
2. Do czterech słupków przyklej ścianki: długie i krótkie ustawione w ramkę na słupkach (klej do drewna, kątownik,
   ściski albo taśma malarska), potem przyklej ramkę do dna (klej + dociśnięcie ciężarkami; ścianki 3 mm mają
   cienką krawędź, więc słupki i ewentualny wałek kleju od środka dają wytrzymałość). Szyny półki przyklej na wysokości
   86 mm nad wewnętrzną powierzchnią dna, dopiero gdy EVA jest jeszcze nieprzyklejona (do pomiaru).
3. Wieko: przyklej ramkę z listewek do wieka, potem rant do ramki. Sprawdź nasuwanie na korpus przed wyschnięciem klejów.
4. Szlif 240, odkurz, 1–2 cienkie warstwy lakieru albo bejcy + lakier (lakier wodny, matowy). **Nie lakieruj pianki.**
5. **Grafiki:** na wieko **żółte logo na przezroczystym tle** (`logo_zolte_120mm.pdf`, skala 100%, logo ma 120 mm szerokości;
   ten sam kształt jest w `logo_zolte_przezroczyste.png`, gdy chcesz go przeskalować), na boki etykiety 270 × 26 mm
   (`11_…pdf`, strona 2). **Uwaga na drukarkę:** domowe drukarki nie drukują koloru białego, więc żółty nadruk na
   przezroczystej folii samoprzylepnej będzie półprzezroczysty i zmatowieje na ciemnym drewnie. Na jasnym drewnie albo
   białym lakierze wygląda dobrze; na ciemnym lepiej wydrukować na **białej** folii samoprzylepnej i wyciąć logo po obrysie,
   albo użyć wydruku jako szablonu i pomalować żółtą farbą akrylową. Zrób próbę na odpadzie sklejki. Klej do decoupage
   dotyczy papieru; folię samoprzylepną po prostu przyklej, bez kleju. Klej do decoupage: cienka warstwa pod spód, dociśnij od środka do brzegów,
   po wyschnięciu 2–3 cienkie warstwy na wierzch.
6. Po pełnym wyschnięciu: przyklej piankę do dna, wytnij gniazda *przed* przyklejeniem (łatwiej), ustaw półkę, nóżki filcowe
   pod dno.
7. **Próba końcowa:** obciąż pudełko zastępczo masą gry, sprawdź półkę i dno; włóż figurki, zamknij wieko i przenieś
   pudełko poziomo, podtrzymując dno — nie za wieko.

### Waga

Szacunek (poziom topolowej sklejki ok. 450 kg/m³): puste pudełko **ok. 1,2 kg**, z czego sklejka 3 mm ok. 0,7 kg, dno 4 mm
ok. 0,2 kg, listewki ok. 0,1 kg, EVA ok. 0,1 kg. Wersja z wszystkimi płytami 4 mm i dnem 6 mm byłaby cięższa o ok.
0,3–0,5 kg. Do wagi gry dochodzi segregator, kafelki i karty (te trzy rzeczy to prawdopodobnie 2–3 kg), więc samo
pudełko to niewiele — największy zysk dają: cienkie płyty, brak okuć i EVA zamiast sklejki w przegródkach.
Balsa jest jeszcze lżejsza (ok. 150 kg/m³), ale krucha: nadaje się najwyżej na wewnętrzne przegródki, nie na ścianki.

## Lista kontrolna kompletnego pudełka

- [ ] Instrukcja (40 stron) w segregatorze, ze stroną od autora
- [ ] 121 kafelków mapy (50 + 49 + 16 + 3 + Drzewo + 2 bazy)
- [ ] Plansza areny, dwustronna, składana
- [ ] 18 kart jednostek (6 + 6 + 3 + 3 do pojedynku), 20 kart skarbów
- [ ] 15 figurek
- [ ] 3 kryształy, tor rund, znacznik rundy
- [ ] 16 kropli obrażeń, 19 znaczników stanu
- [ ] Kość −1 / 0 / +1
- [ ] Pudełko z logo (żółte logo na wieku, etykiety na bokach)
- [ ] Okładka segregatora: przód, tył i grzbiet

## Jak odświeżyć pliki do druku

Po zmianie zasad, kart albo grafik: `make druk` (ok. 1–2 min). Robi od nowa wszystkie PDF-y w `do_druku/`
z aktualnej gry i grafik z `docs/grafika/`. Same strony instrukcji składa `python3 scripts/assets/manual_build.py`.

## Co można jeszcze poprawić

- Grafiki kafelków i areny są w źródle za małe do druku w pełnej ostrości (ok. 170 DPI) — wyglądają dobrze,
  ale z bliska lekko miękko. Ostrzejsze będą po wygenerowaniu w rozmiarach z `WYMIARY_ELEMENTOW.md`.
- Karty jednostek mają 80 × 112 mm (proporcje kart z gry), a nie planowane wcześniej 80 × 120 mm.

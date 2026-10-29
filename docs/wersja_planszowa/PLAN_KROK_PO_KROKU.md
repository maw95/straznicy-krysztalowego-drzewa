# Wersja planszowa — plan krok po kroku

Ściąga: co przygotować, w jakiej kolejności, jakie wymiary, co kupić i gdzie. Stan na 28.10.2026:
figurki i znaczniki są zlecone do druku 3D, instrukcja trafi do segregatora, karty, kafelki, arena i instrukcja
drukujemy na zwykłej drukarce (papier fotograficzny), pudełko robimy ręcznie z cienkich desek.

## Co jest w tym folderze

| Plik / folder | Co to jest |
|---|---|
| `PLAN_KROK_PO_KROKU.md` | ten plik |
| `do_druku/` | **gotowe PDF-y do druku** (tworzy je `make druk`; pliki nie są w gicie, można je zawsze zrobić od nowa) |
| `WYMIARY_ELEMENTOW.md` | wymiary wszystkich elementów i zasady druku |
| `FIGURKI_SPECYFIKACJA.md`, `druk3d/` | figurki, podstawki, kryształy, znacznik rundy — pliki do druku 3D |
| `instrukcja_szablon/` | instrukcja A4 w HTML (źródło PDF-a); strona 1 (po okładce) to wiadomość od autora |
| `Instrukcja_Straznicy.docx` | instrukcja do edycji w Wordzie / Dokumentach Google |

Pliki w `do_druku/`:

| Plik | Arkuszy A4 | Na czym drukować |
|---|---:|---|
| `01_instrukcja_A4.pdf` | 41 stron (okładka + 40 numerowanych) | papier matowy 160–200 g (dwustronnie) albo jednostronnie do koszulek |
| `02_karty_jednostek_awersy.pdf` + `03_…_rewersy.pdf` | 5 + 5 | papier fotograficzny |
| `04_karty_skarbow_awersy.pdf` + `05_…_rewersy.pdf` | 3 + 3 | papier fotograficzny |
| `06_kafelki_mapy_awersy.pdf` + `07_…_rewersy.pdf` | 9 + 8 | papier fotograficzny |
| `08_arena_A3_na_4_arkuszach_A4.pdf` | 4 | papier fotograficzny |
| `09_naklejki_znaczniki_kosc_tor_rund.pdf` | 2 | papier samoprzylepny (strona 2 — tylko gdy tor rund jest jednokolorowy) |
| `10_okladka_A4_pokrywa_i_segregator.pdf` | 1 (+1) | papier fotograficzny — na pokrywę pudełka i do okładki segregatora |
| `11_logo_etykiety_pudelka_i_grzbiet.pdf` | 3 | papier fotograficzny / samoprzylepny |

**Razem ok. 40 arkuszy papieru fotograficznego, 2 arkusze samoprzylepnego i 20–40 kartek na instrukcję.**
Z zapasem na pomyłki kupcie 50–60 arkuszy fotograficznego.

---

## Krok 0. Zanim zaczniesz (15 min)

- [ ] **Zmierz segregator** (szerokość × wysokość × grzbiet) — od niego zależy wnętrze pudełka (krok 8).
- [ ] **Sprawdź drukarkę:** atramentowa czy laserowa? Papier fotograficzny musi być do **tego** rodzaju drukarki
      (do laserowej: „papier fotograficzny do drukarek laserowych” albo kreda 200–250 g).
- [ ] **Wydruk próbny:** wydrukuj **jedną** stronę z `06_kafelki_mapy_awersy.pdf` na zwykłym papierze.
      W ustawieniach druku: **skala 100% / „rozmiar rzeczywisty”**, nigdy „dopasuj do strony”.
      Na dole każdego arkusza jest odcinek — zmierz linijką: **musi mieć 50 mm**. Kafelek musi mieć 50 mm między
      płaskimi bokami. Jeśli wymiary się zgadzają, możesz drukować na właściwym papierze.
- [ ] Jakość druku: „najlepsza / foto”, typ papieru zgodny z kupionym (np. „błyszczący fotograficzny”).

## Krok 1. Zakupy

Linki prowadzą do wyszukiwania w sklepie (konkretne oferty szybko znikają) — wybierz ofertę z dobrymi opiniami.
Ceny orientacyjne.

### Papier i druk

| Co | Ile | Gdzie |
|---|---|---|
| Papier fotograficzny A4, **matowy lub satynowy**, 180–230 g (mniej odblasków niż błyszczący) | 50–60 ark. | [Allegro](https://allegro.pl/listing?string=papier%20fotograficzny%20A4%20matowy%20230g) |
| Papier samoprzylepny A4 do drukarki (błyszczący albo matowy) | 5 ark. | [Allegro](https://allegro.pl/listing?string=papier%20samoprzylepny%20A4%20do%20drukarki) |
| Papier matowy 160–200 g na instrukcję (albo zwykły 100 g + koszulki) | 20–40 ark. | [Allegro](https://allegro.pl/listing?string=papier%20matowy%20A4%20160g) |
| Koszulki na dokumenty A4 (jeśli instrukcja ma być w koszulkach) | 20–40 szt. | [Allegro](https://allegro.pl/listing?string=koszulki%20A4%20krystaliczne%20100%20szt) |

### Tektura, klej, cięcie

| Co | Ile | Gdzie |
|---|---|---|
| **Tektura introligatorska 2 mm**, arkusze A4 (albo duży arkusz 70 × 100 cm do pocięcia) | 15–20 ark. A4 | [Allegro](https://allegro.pl/listing?string=tektura%20introligatorska%202%20mm%20A4) |
| Klej w sprayu do papieru (np. 3M Spray Mount / Photo Mount) — równo klei duże powierzchnie | 1–2 puszki | [Allegro](https://allegro.pl/listing?string=klej%20w%20sprayu%203M%20spray%20mount) |
| Nożyk z łamanym ostrzem albo skalpel + zapas ostrzy | 1 | [Allegro](https://allegro.pl/listing?string=no%C5%BCyk%20modelarski%20skalpel%20ostrza) |
| Mata do cięcia A3 (samogojąca) | 1 | [Allegro](https://allegro.pl/listing?string=mata%20do%20ci%C4%99cia%20A3) |
| Linijka metalowa 50 cm (z antypoślizgiem) | 1 | [Allegro](https://allegro.pl/listing?string=linijka%20metalowa%2050%20cm%20antypo%C5%9Blizgowa) |
| Zaokrąglacz narożników R3–R4 | 1 | [Allegro](https://allegro.pl/listing?string=zaokr%C4%85glacz%20naro%C5%BCnik%C3%B3w%20R4) |
| Laminator A4 + folie do laminowania A4 80 mic (karty) | 1 + 20 folii | [Allegro](https://allegro.pl/listing?string=laminator%20A4) · [folie](https://allegro.pl/listing?string=folia%20do%20laminowania%20A4%2080%20mic) |
| Taśma introligatorska płócienna 25–38 mm (zawias planszy areny) | 1 rolka | [Allegro](https://allegro.pl/listing?string=ta%C5%9Bma%20introligatorska%20p%C5%82%C3%B3cienna) |
| Opcjonalnie: dziurkacz ozdobny koło 20 mm (naklejki na znaczniki Ø 23 mm) | 1 | [Allegro](https://allegro.pl/listing?string=dziurkacz%20ozdobny%20ko%C5%82o%2020%20mm) |

### Pudełko z drewna

| Co | Ile | Gdzie |
|---|---|---|
| **Sklejka topolowa 3 mm** (ścianki, wieko, półka) — docięta w sklepie na wymiar z listy w kroku 8; topola jest jedną z najlżejszych sklejek (ok. 450 kg/m³), unikaj brzozowej, MDF i HDF (ok. 700+) | ok. 0,7 m² | [Castorama](https://www.castorama.pl/) / [Leroy Merlin](https://www.leroymerlin.pl/) (dział drewna: docinanie płyt na miejscu — zapytaj, czy tną sklejkę 3 mm) · [Allegro](https://allegro.pl/listing?string=sklejka%20topolowa%203%20mm%20docinanie%20na%20wymiar) |
| **Sklejka topolowa 4 mm** (tylko dno) | ok. 0,11 m² (kawałek 600 × 400) | jak wyżej |
| Listwa lipowa lub sosnowa **10 × 10 mm** (słupki narożne, szyny półki, ramka wieka) | ok. 3 m (2 × 1,5 m) | dział drewna · [Allegro](https://allegro.pl/listing?string=listwa%20lipowa%2010x10) |
| **Pianka EVA 10 mm** (wkładka z gniazdami na figurki; albo 2 × 5 mm sklejone) — arkusz 500 × 500 mm wystarczy | 1 | [Allegro](https://allegro.pl/listing?string=pianka%20EVA%2010%20mm%20arkusz) · sklepy cosplay |
| **Otwornica bimetalowa Ø 35 mm** (gniazda w EVA; patrz krok 8 — dlaczego 35, a nie 30) + wiertarka | 1 | [Allegro](https://allegro.pl/listing?string=otwornica%20bimetalowa%2035%20mm) |
| Klej do EVA (kontaktowy, np. do pianek i gumy) albo taśma dwustronna — przyklejenie EVA do dna | 1 mały | [Allegro](https://allegro.pl/listing?string=klej%20kontaktowy%20do%20EVA) |
| Klej do drewna D2/D3 (np. Wikol) | 1 | [Allegro](https://allegro.pl/listing?string=klej%20do%20drewna%20wikol) |
| Kątownik stolarski + ściski stolarskie albo taśma malarska do trzymania ścianek | 1 + 4 | [Allegro](https://allegro.pl/listing?string=%C5%9Bciski%20stolarskie%20zestaw) |
| Papier ścierny 120, 180, 240 | po 2 ark. | [Allegro](https://allegro.pl/listing?string=papier%20%C5%9Bcierny%20zestaw%20120%20180%20240) |
| Lakier akrylowy bezbarwny (satyna) albo bejca | 1 | [Allegro](https://allegro.pl/listing?string=lakier%20akrylowy%20bezbarwny%20satyna%20do%20drewna) |
| Klej-lakier do decoupage (np. Mod Podge, Magic) — do przyklejenia okładki i logo | 1 | [Allegro](https://allegro.pl/listing?string=klej%20do%20decoupage%20mod%20podge) |
| Nóżki filcowe samoprzylepne | 4 | [Allegro](https://allegro.pl/listing?string=filc%20samoprzylepny%20n%C3%B3%C5%BCki) |

### Drobiazgi

| Co | Ile | Gdzie |
|---|---|---|
| Kostka drewniana surowa **16 mm** (na kość −1 / 0 / +1) | 1 (+ zapas) | [Allegro](https://allegro.pl/listing?string=kostka%20drewniana%2016%20mm%20surowa) |
| Woreczki strunowe 6 × 8 cm (znaczniki, krople, kryształy) | 10 | [Allegro](https://allegro.pl/listing?string=woreczki%20strunowe%206x8) |
| Gumki recepturki / opaski na karty | kilka | — |
| Opcjonalnie: pianka do walizek „pick and pluck” na figurki | 1 arkusz | [Allegro](https://allegro.pl/listing?string=pianka%20pick%20and%20pluck) |

## Krok 2. Instrukcja do segregatora (1 h)

1. Plik: `01_instrukcja_A4.pdf` (41 stron A4: okładka i 40 numerowanych). **Strona 1 jest na wiadomość od autora** — przed drukiem wpisz ją
   w `instrukcja_szablon/index.html` (opis w `instrukcja_szablon/README.md`) albo wydrukuj stronę z liniami i napisz ręcznie.
2. Druk: skala 100%. Dwustronnie (41 stron = 21 kartek) na papierze matowym 160–200 g albo jednostronnie do koszulek
   (dwie strony plecami do siebie w jednej koszulce).
3. Strony wpinamy po kolei; okładka (`10_okladka_…pdf`) do przezroczystej kieszeni na przodzie segregatora,
   etykieta na grzbiet z `11_logo_etykiety_…pdf` (trzecia strona: szerokości 35, 50 i 70 mm — wybierz swoją).

## Krok 3. Karty (2–3 h)

Wymiary: **karty jednostek 80 × 112 mm** (18 szt.), **karty skarbów 63 × 88 mm** (20 szt.). Na arkuszach jest
spad 1,5 mm i znaczniki cięcia na marginesach.

1. Wydrukuj awersy (`02`, `04`) i rewersy (`03`, `05`) na papierze fotograficznym. Rewersy są ułożone w lustrze —
   arkusz rewersów przyłożony tyłem do arkusza awersów trafia kartą na kartę.
2. **Sklejanie:** cały arkusz rewersów spryskaj klejem (cienko, z 25 cm), połóż na nim arkusz awersów tyłem do tyłu,
   wyrównaj **pod światło** (szyba okna) i dociśnij. Dla sztywności można włożyć między nie kartkę 160–200 g.
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
3. Na każdy arkusz tektury naklej klejem w sprayu: z jednej strony **rewersy**, z drugiej **awersy z tym samym numerem
   arkusza**, oba wyrównane do krawędzi tektury. Rewersy mają większy spad, więc 1–2 mm przesunięcia nie widać.
4. Docisnąć i zostawić pod stosem książek na kilka godzin (żeby tektura się nie wygięła).
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
5. Połącz połówki zawiasem z taśmy płóciennej (z jednej strony, ze szczeliną 2–3 mm, żeby plansza się składała;
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

1. **Dno 4 mm** + **pianka EVA 10 mm** przyklejona do całego dna, z 15 gniazdami na figurki.
2. **Półka 3 mm** wyjmowana, leży na szynach 10 × 10 przyklejonych do długich ścianek, 86 mm nad dnem
   (EVA 10 + najwyższa figurka z podstawką 71 + luz 5). Półka chroni figurki przed naciskiem.
3. Na półce: złożona plansza areny, karty, tor rund, woreczki oraz **stosy kafelków** (6 stosów po 20, każdy kafelek
   ok. 2,3 mm, czyli stos ok. 46 mm).
4. Na samej górze: **segregator** (leży płasko, grzbiet 40 mm).

Ta sama półka przy okazji obciąża tylko szyny, a nie figurki. Przy 3 mm ugięcie półki pod 2 kg to szacunkowo ok. 2 mm
(rozpiętość 310 mm) — wystarczy, bo pod półką jest 9 mm luzu; po zbudowaniu sprawdź na pustym pudełku z ciężarem.

### Wnętrze figurek: pianka EVA z otworami

- Otwory wycinaj **otwornicą bimetalową**, a nie piłą: pianka rwie się przy szybkim cięciu. Przyłóż EVA do kawałka
  zbędnej deski, dociśnij ściskiem, tnij na **niskich obrotach** i bez nacisku, od razu głębokość całej grubości.
- **Średnica otworu: 35 mm, nie 30.** Podstawka jest sześciokątem 30 mm *między płaskimi bokami*, czyli
  **34,6 mm między rogami** — w okrągły otwór 30 mm nie wejdzie (rogi wciskałyby się w piankę po 2,3 mm z każdej strony;
  wciśnięcie byłoby ciężkie, a wyjmowanie rwałoby gniazdo). Otwór 35 mm daje sześciokątowi luz ok. 0,2 mm, a elastyczna
  pianka lekko go trzyma. Jeśli figurka zbyt się lula — weź otwornicę 33 mm. **Zrób próbę na odpadzie, zanim potniesz
  arkusz.** Tylko gdyby podstawki były okrągłe 30 mm, pasowałaby otwornica 30–31 mm.
- Dlaczego EVA 10 mm: podstawka ma 3 mm wysokości, więc w 5 mm pianki trzymałaby się tylko na 3 mm i figurka mogłaby
  wyskoczyć przy przechylaniu pudełka. W 10 mm pianka obejmuje podstawkę z zapasem i amortyzuje wstrząsy.
- **Rozstaw:** 15 gniazd, środek do środka co najmniej **50 mm** (5 × 3 gniazda zajmują ok. 250 × 150 mm). Skrzydła, ogony
  i broń zajmują więcej miejsca niż podstawka, więc przed cięciem ustaw wszystkie figurki na kartonie z zapasem 5–10 mm
  i obrysuj miejsca (bohaterów, zwłaszcza smoki, rozstaw szerzej).
- EVA klej do dna klejem kontaktowym albo taśmą dwustronną. Klej PVA do pianki się nie nadaje.
- Dodatkowo (opcja): na spodzie półki, nad figurkami, przyklej pasek EVA 5 mm — lekko dociska figurki, gdyby ktoś odwrócił
  pudełko. Wtedy luz nad figurkami to 4 mm, więc sprawdź na najwyższej figurce.

### Wymiary (w mm)

Wnętrze musi zmieścić **segregator**, plansze, karty, stosy kafelków i figurki. Wzór:

- **długość wewnętrzna L** = dłuższy bok segregatora + **20** (10 na luz i 10 na słupki narożne)
- **szerokość wewnętrzna W** = krótszy bok segregatora + **20** (co najmniej 300 — złożona arena ma ok. 205 × 290)
- **wysokość wewnętrzna H** = 86 (EVA, figurki, luz) + 3 (półka) + wysokość stosów kafelków (ok. 46) + grzbiet
  segregatora (40) + 5 luzu

Przykład dla segregatora A4 (320 × 290, grzbiet 40): **L = 340, W = 310, H = 180** (zewnętrznie ok. 346 × 316 × 184).
Najpierw zmierz **swój** segregator i **grubość swoich kafelków** (stos 20 szt.) i podstaw do wzorów. Gdyby H miało
być niższe, zrób stosy po 15 kafelków (8 stosów, ok. 35 mm) albo część kafelków włóż do segregatora w kieszeniach.

### Lista cięcia (t = 3 mm; dno 4 mm; dla przykładu wyżej)

| Element | Ile | Wymiar (mm) | Wzór |
|---|---:|---|---|
| Dno (sklejka **4 mm**) | 1 | 346 × 316 | (L + 2t) × (W + 2t) |
| Ścianka długa | 2 | 346 × 180 | (L + 2t) × H |
| Ścianka krótka | 2 | 310 × 180 | W × H — między długimi |
| Półka | 1 | 339 × 309, w narożnikach wycięcia 10 × 10 | (L − 1) × (W − 1) |
| Pokrywa — wieko | 1 | 353 × 323 | (L + 4t + 1) × (W + 4t + 1) |
| Pokrywa — rant długi | 2 | 353 × 30 | (L + 4t + 1) × 30 |
| Pokrywa — rant krótki | 2 | 317 × 30 | (W + 2t + 1) × 30 |
| Listwa 10 × 10: słupki narożne | 4 | 180 | H |
| Listwa 10 × 10: szyny półki (długie ścianki, wysoko 86 mm) | 2 | 320 | L − 20 |
| Listwa 10 × 10: ramka wewnątrz wieka | 2 + 2 | 347 oraz 303 | dopasuj do rantów |

Pokrywa ma 1 mm luzu. Przy innej grubości płyt podstaw w wzorach swoje `t`. Ścianki można rozciąć wzdłuż, ale
**nie tnij pasków węższych niż 30 mm samodzielnie piłą ręczną** — daj całą listę do docięcia (krok 1) i zapytaj o rzaz
(ok. 3 mm: lista musi mieć wymiary gotowych części).

### Składanie

1. Przeszlifuj krawędzie (papier 120, potem 180). Zrób **próbne ustawienie na sucho** wszystkich części.
2. Do czterech słupków przyklej ścianki: długie i krótkie ustawione w ramkę na słupkach (klej do drewna, kątownik,
   ściski albo taśma malarska), potem przyklej ramkę do dna (klej + dociśnięcie ciężarkami; ścianki 3 mm mają
   cienką krawędź, więc słupki i ewentualny wałek kleju od środka dają wytrzymałość). Szyny półki przyklej na wysokości
   86 mm nad wewnętrzną powierzchnią dna, dopiero gdy EVA jest jeszcze nieprzyklejona (do pomiaru).
3. Wieko: przyklej ramkę z listewek do wieka, potem rant do ramki. Sprawdź nasuwanie na korpus przed wyschnięciem klejów.
4. Szlif 240, odkurz, 1–2 cienkie warstwy lakieru albo bejcy + lakier (lakier wodny, matowy). **Nie lakieruj gniazd EVA.**
5. **Grafiki:** na wieko okładka A4 (`10_…pdf`) albo samo logo (`11_…pdf`, strona 1), na boki etykiety 270 × 26 mm
   (`11_…pdf`, strona 2). Klej do decoupage: cienka warstwa pod spód, dociśnij od środka do brzegów,
   po wyschnięciu 2–3 cienkie warstwy na wierzch.
6. Po pełnym wyschnięciu: przyklej EVA do dna, wytnij gniazda *przed* przyklejeniem (łatwiej), ustaw półkę, nóżki filcowe
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
- [ ] Pudełko z logo

## Jak odświeżyć pliki do druku

Po zmianie zasad, kart albo grafik: `make druk` (ok. 1–2 min). Robi od nowa wszystkie PDF-y w `do_druku/`
z aktualnej gry i grafik z `docs/grafika/`. Same strony instrukcji składa `python3 scripts/assets/manual_build.py`.

## Co można jeszcze poprawić

- Grafiki kafelków i areny są w źródle za małe do druku w pełnej ostrości (ok. 170 DPI) — wyglądają dobrze,
  ale z bliska lekko miękko. Ostrzejsze będą po wygenerowaniu w rozmiarach z `WYMIARY_ELEMENTOW.md`.
- Karty jednostek mają 80 × 112 mm (proporcje kart z gry), a nie planowane wcześniej 80 × 120 mm.

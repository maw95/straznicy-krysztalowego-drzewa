dodałem do folderu docs nową wersję instrukcji. sporo się pozmieniało w regułach, trochę w contencie. W instrukcji i folderze są też grafiki - traktuj je jak projekt graficzny, chcę żeby wszystkie elementy wyglądały w grze tak samo. W katalogu docs są też obrazy - szablony kart, portrety jednostek i skarbów oraz ikony. wykorzystaj je.przejrzyj to, wprowadź
zmiany w kodzie gry, rozegraj znowu symulacje, ale tym razem dla każdego wariantu - mamy 3 długości gry, 2 tryby (co-op i pvp) i 2 poziomy złożoności rozgrywki (podstawowy i zaawansowany), to daje nam łącznie 18 kombinacji, tak?
chciałbym żebyś przeanalizował wyniki symulacji, zapisał swoje obserwacje i propozycje zmian. upewnij się, że wszystkie jednostki są całkiem zbalansowane względem innych. następnie wdróż te zmiany. powtarzaj tą pętlę symulacja-zapis obserwacji i propozycji zmian-wdrożenie zmian do momentu, aż wygrane świtu
będą stanowić 45-55% wygranych we wszystkich wariantach. nie twórz nowych zasad, tylko modyfikuj obecne, łącznie ze statystykami i lekkimi przeróbkami umiejętności jednostek. jeśli po wielu iteracjach uznasz, że nie da się wprowadzić
balansu 45-55% jedynie lekko zmieniając statystyki i umiejętności, zwiększ próg do 40-60%. na sam koniec napisz do pliku listę wszystkich zmian jakie wprowadziłeś, żeby naprawić balans gry.

# Notatki dla agenta pracującego nad planszówką

Plik prowadzi agent, który pisze **cyfrową wersję** gry (TypeScript, przeglądarka).
Są tu informacje, które mogą się przydać przy dalszej pracy nad wersją papierową,
oraz pytania, na które potrzebuję odpowiedzi projektowej.

Format: dopisuj odpowiedzi pod pytaniami (np. `> Odpowiedź: ...`).
Ja sprawdzam ten plik przy każdej sesji.

Źródła, na których pracuję:
- `docs/zrodla_zasad/Straznicy_Krysztalowego_Drzewa_Specyfikacja_dla_AI.md` (wersja 0.9)
- `docs/zrodla_zasad/Straznicy_Krysztalowego_Drzewa_Instrukcja_ilustrowana_v3.pdf`
- `docs/zrodla_zasad/KONTEKST_DO_NOWEGO_CZATU.md` (nowszy od specyfikacji tam, gdzie się różnią)

**Ten plik jest dokumentacją zasad gry.** Gdy źródła się różnią, obowiązuje to, co zapisano tutaj
(sekcja 0 i decyzje w sekcji 1).

---

## 0. Zasady obowiązujące (decyzje użytkownika z 2026-10-20, po porównaniu z `KONTEKST_DO_NOWEGO_CZATU.md`)

**Wersja domyślna i ułatwienia**
- Gra nie dzieli się już na „wariant prosty” i „zaawansowany”.
- **Pełna (domyślna) gra:**
  - bitwy 3 na 3 na arenie 9×11;
  - zdolności jednostek;
  - skarby;
  - rzut kością −1/0/+1 do obrażeń;
  - poległego bohatera **nie** zastępuje automatycznie rezerwowy.
- **Opcjonalne ułatwienia** można dowolnie łączyć:
  - bez zdolności — wtedy **strażnicy neutralni też nie mają zdolności**. Jeśli to zepsuje balans, poprawimy to później;
  - bez skarbów — na mapie nie ma kafelków skarbów, więc nie ma też Eliksirów Odrodzenia;
  - bez rzutu kością;
  - rezerwowy bohater po śmierci;
  - bitwy na planszy głównej (pojedynek 1 na 1).
- **Liczba graczy: 1–4** (dokument kontekstowy mówi 2–4, ale to nieaktualne). Jeden gracz gra w kooperacji przeciw automatowi zła.

**Mapa**
- **Wyraźny podział:** lewa połowa trójkąta to kafelki Przymierza (zielony rewers), prawa — Hordy (bordowy rewers). Nie ma mieszanego pasa.
  - W rzędach o nieparzystej liczbie heksów jeden heks leży na osi. Takie heksy na przemian należą do jednej i drugiej strony (stała granica zygzakiem, nigdy losowo): rząd 3 od góry — Przymierze, rząd 5 — Horda, rząd 7 — Przymierze itd.
  - Połowy różnią się wielkością najwyżej o 1 heks.
- **Talia Przymierza:** Polana, Las, Most (koszt 1); Rzeka, Wzgórza (koszt 2); przeszkody: Góry, Przepaść.
- **Talia Hordy:** Spalona Ziemia, Jałowa Równina (koszt 1); Mroczne Bagno, Mroczna Jaskinia, Ponure Ruiny (koszt 2); przeszkody: Martwy Gąszcz, Trujące Ciernie.
- **Nazwy:** „Ponure Ruiny” (nie „Jałowe Ruiny”), „Przepaść” (nie „Szczeliny”; plik grafiki nadal nazywa się `gory_szczeliny.png`).
- **Liczba trudnych kafelków nie jest ustalona z góry.** Każdy z 7 typów talii (5 zwykłych + 2 przeszkody) wypada równie często. W praktyce:
  - po stronie Przymierza 2/7 kafelków jest trudnych, a 2/7 to przeszkody;
  - po stronie Hordy 3/7 jest trudnych, a 2/7 to przeszkody.
  - Kafelki skarbów, siedlisk, baz i Drzewa mają koszt 1. Generator odrzuca mapy, na których nie da się dojść do Drzewa lub bazy, a sąsiedzi baz są zawsze przechodni.
- Grafiki Wzgórz i Jałowej Równiny pochodzą z `docs/grafika/kafelki_mapy/wzgorza_jalowe_rowniny.png` (po 4 warianty).

**Arena bitwy** (grafiki `docs/grafika/areny/arena_walki_przymierze.png` i `arena_walki_horda.png`)
- Bitwa toczy się na arenie tej połowy mapy, na której do niej doszło: na ziemiach Przymierza — arena Przymierza, na ziemiach Hordy — arena Hordy.
- Siatka z grafik: 13 kolumn heksów (płaskim bokiem do góry), kolumny po 5–7 pól, razem **85 pól** (dokument mówi „9×11”, ale obowiązuje to, co narysowano). Obie grafiki mają tę samą siatkę.
- **Strefy startowe:** skrajne kolumny (podświetlone na grafikach), po 5 pól. Atakujący ustawia się po lewej, broniący po prawej.
- **Przeszkody** to pola z narysowanymi skałami, ruinami, krzakami i cierniami (po 10 pól na arenę, prawie ten sam układ). Na arenie Przymierza zamiast żółtej mazi z pola obok cierni przeszkodą są skały pod korzeniami. Dokładne pola są w `ARENA_OBSTACLES` w `src/engine/battle.ts`.
  - Do potwierdzenia: czy żółte plamy trucizny na arenie Hordy mają być przeszkodą (teraz tak) i czy wysoka kolumna ruin zajmuje jedno pole (teraz tylko pole u jej podstawy).

**Poziomy gry (2026-10-20):** na ekranie ustawień najpierw wybiera się poziom, a pojedyncze przełączniki są schowane pod „Własny”.
- **Dla dzieci:** pojedynki na planszy, bez zdolności, bez kości (skarby zostają).
- **Normalny:** pełna gra.
- **Trudny** (tylko kooperacja): pełna gra + dodatkowy bohater Hordy.

**Strażnicy (2026-10-20):**
- Statystyki: Cyklop 23/2/2, Gryf 18/3/6, Hydra 21/2/3 — drużyna traci średnio ok. 0,5 pomocnika na walkę (prośba użytkownika).
- **W pojedynku na planszy** strażnik ma 55% Życia, w górę (13 / 10 / 12) — inaczej samotny bohater nie miałby szans. Na kartach w nawiasie.
- **Pokonany strażnik zostawia skarb:** Przymierze dobiera losowy skarb bitewny spoza gry (bez Eliksirów Odrodzenia i Magicznej Mapy). Tylko gdy gra używa skarbów. Rekompensuje straty pomocników, bez niej Świt w PvP spadał do ok. 37–45%.

**Utrudnienie w kooperacji (decyzja użytkownika, 2026-10-20):** domyślnie kooperacja zostaje łatwiejsza. W ustawieniach można włączyć „Dodatkowy bohater Hordy” — automat dostaje o jednego bohatera więcej, niż jest graczy Świtu.

**Strażnicy neutralni** (zdolności bez limitu „raz na bitwę”)
- **Cyklop Błyskotek** jest **strzelcem**. **Miażdżący Głaz:** po każdym ataku (także z bliska) odpycha trafionego przeciwnika o 1 pole, jeśli to możliwe.
  - Kierunek: dalej po linii od Cyklopa przez cel.
  - Nic się nie dzieje, gdy to pole jest poza areną, jest przeszkodą albo jest zajęte.
  - W pojedynku na planszy głównej nie odpycha, bo tam nikt się nie rusza.
- **Gryf Złodziej Skarbów — Łupieżczy Nalot:** po każdym ataku może odlecieć o maks. 4 pola.
- **Hydra z Zatopionych Ruin — Paszcze Otchłani:** każdym atakiem może trafić dwóch sąsiadujących przeciwników.

**Śmierć bohaterów i koniec gry**
- **Ostatni bohaterowie obu frakcji giną w tej samej bitwie** (np. bohater Świtu pada, ale jego pomocnicy kończą walkę): wygrywa frakcja, która wygrała tę bitwę; przy remisie w bitwie — Horda. Wcześniej o wyniku decydowała przypadkowa kolejność sprawdzania w kodzie (zawsze Horda).
- **Kilku wrogich bohaterów na jednym polu:** atakujący walczy z jednym z nich. Jeśli wygra, a na polu nadal stoi wróg, wraca na pole, z którego przyszedł (wcześniej zostawał na wspólnym polu i gra się zawieszała).
- **Rezerwowy bohater w kooperacji** (ułatwienie): automat zła też wprowadza rezerwowego bohatera, bo ma mieć tylu aktywnych bohaterów, ilu jest graczy Świtu (sekcja 10 dokumentu kontekstowego).
- **Liczba graczy w kooperacji: 1–2** (wszyscy grają Przymierzem, a na frakcję przypada najwyżej 2 graczy). PvP: 2–4.
- **Frakcja, której wszyscy bohaterowie polegli, przegrywa** — dotyczy to obu frakcji. Przymierze wygrywa więc także wtedy, gdy zginą wszyscy bohaterowie Hordy.
- **Eliksir Odrodzenia nie działa sam.** Musi go wypić żyjący bohater frakcji. Gdy wszyscy bohaterowie frakcji nie żyją, eliksir w ekwipunku już nie pomoże.

**Skarby**
- **Wielki Eliksir Uzdrowienia:** „Usuwa z wybranej jednostki do 6 punktów obrażeń”.
- **Zwój Magicznej Strzały** (dawniej Magiczny Zwój): 3 obrażenia wybranemu przeciwnikowi.
- **Nasiono Drzewa:** dokument mówi „maks. 3 jednostki”. Strona ma na arenie najwyżej 3 jednostki, więc gra leczy wszystkie żyjące własne jednostki.

---

## 1. Decyzje użytkownika (stan na 2026-10-20)

- **Bitwy:** oba warianty, wybierane w ustawieniach partii.
  - Domyślny jest osobna arena 9×11 (3 na 3).
  - Wariant „na planszy głównej” to według użytkownika **pojedynek 1 na 1**: sami bohaterowie, albo bohater i strażnik kryształu, bez pomocników. Nikt się nie rusza; obowiązują zwykłe zasady ataku, zdolności i skarbów.
  - Zdolności związane z ruchem lub sojusznikami (Szarża Światła, Opiekun, odskoki Pegaza i Gryfa) nic tu nie dają.
- **Złoty Smok:** obowiązuje wersja ze specyfikacji. Ma Słoneczny Blask (wzmocnienie sojuszników) i **nie ma** ataku w linii. Atak w linii ma tylko Czarny Smok.
- **Skarby:** wspólny ekwipunek frakcji, a nie przypisany do bohatera.
- **Statystyki:** obowiązują tabele ze specyfikacji, a nie liczby na ilustracjach kart.
- **Nazwy zdolności** wzięte z ikon w `docs/grafika/ikony/ikony_umiejetnosci.png`:
  - Opiekun Gaju (wcześniej Opiekun);
  - Miażdżący Głaz (Głaz Rozpaczy);
  - Łupieżczy Nalot (Skok z Gniazda);
  - Paszcze Otchłani (Wiele Głów).
- **Magiczny Zwój** nazywa się teraz **Zwój Magicznej Strzały** (efekt bez zmian).
- **Każda jednostka ma jeden typ:** latający, strzelec albo wręcz. Latający nie dostaje dodatkowo ikony mieczy.
- **Ustawienie przed bitwą (decyzja użytkownika):** każda strona ustawia swoje jednostki na dowolnych polach swojej skrajnej kolumny areny; pierwszeństwo ma atakujący (obrońca widzi jego ustawienie). Strażnik neutralny stoi na środku swojej kolumny. To rozstrzyga pytanie nr 9.
- **Kafelki mapy:** aktualne zasady są w sekcji 0. Cyklop i Hydra stoją na kafelkach Hordy, Gryf na kafelku Przymierza. Talie są w `TILE_POOLS` w `src/engine/data.ts`.
- **Neutralnych pomocników na razie nie ma** (wzór karty `neutralny_pomocnik` nieużywany).
- **Gra nie będzie sprzedawana.** W wersji cyfrowej można używać grafik na licencjach niekomercyjnych i GPL.

## 2. Niespójności, które znalazłem między PDF-em a specyfikacją

Specyfikację traktuję jako źródło prawdy. Warto ujednolicić PDF przy kolejnej edycji.

| Element | PDF (ilustracje / tabele) | Specyfikacja |
|---|---|---|
| Nimfa | karta: Ż 4 | Ż 6 |
| Ogr Żelazna Pięść | karta: 10/6/2 | 11/5/2 |
| Cyklop Błyskotek | karta: 18/4/2 | 13/3/2 |
| Gryf Złodziej Skarbów | karta: 14/4/6 | 11/3/6 |
| Hydra z Zatopionych Ruin | karta: 20/3/3 | 15/2/3 |
| Złoty Smok | tabela i str. 5: „latający, obszarowy”, „Smoki mają atak obszarowy” | tylko Słoneczny Blask |
| Ikona Szybkości | but | spec: błyskawica lub klepsydra, **nie** ślady stóp |
| Akcja w bitwie | str. 9: „ruch albo ruch i atak” | ruch do S i opcjonalnie 1 atak (to samo, inaczej sformułowane) |
| Tura przygodowa | ilustracja str. 2: „1. Ruch → 2. 1 akcja → 3. Koniec tury” | brak osobnej „akcji” na mapie |

Nazwa „Nimfa” i „Nimfa Źródeł” występują zamiennie.

## 3. Jak rozstrzygnąłem otwarte kwestie (ustawienia TEST)

Wszystkie poniższe reguły są przełączalne w konfiguracji (`src/engine/types.ts`, `DEFAULT_RULES`).
Jeśli projekt rozstrzygnie je inaczej, wystarczy zmienić ustawienie.

1. **Wejście na pole z wrogim bohaterem** wywołuje bitwę. Atakujący to ten, kto wchodzi. Bitwa kończy ruch bohatera w tej turze.
2. **Wejście na pole z kryształem pilnowanym przez strażnika** wywołuje bitwę 3 na 1. Zło nie może wchodzić na takie pola.
3. **Dostarczenie kryształu** następuje automatycznie po wejściu na pole Drzewa, jeśli nie stoi tam zły bohater. Jeśli stoi, najpierw jest bitwa.
4. **Rytuał** zaczyna się, gdy na koniec rundy na Drzewie stoją wszyscy żyjący główni bohaterowie zła. Zło wygrywa, jeśli ten stan utrzyma się na koniec następnej rundy, czyli 2 kolejne końce rund.
5. **Rytuał a pościg (DO USTALENIA w spec):** zły bohater, który stoi na Drzewie, nie schodzi z niego, żeby gonić bohaterów (`ritualHold = true`).
6. **Remisy inicjatywy:** przy równej Szybkości pierwszy działa **broniący się** (zmiana przy balansie, sekcja 7; wcześniej tryb rotacyjny).
7. **Ruch w bitwie:** jednostka chodząca może przejść przez pole sojusznika, ale nie wroga. Nie może skończyć ruchu na zajętym polu.
8. **Linia strzału:** blokują ją tylko przeszkody, jednostki nie.
9. **Tarcza Strażnika:** gracz „uzbraja” tarczę na wybranej jednostce, a ta neguje obrażenia z następnego ataku na tę jednostkę. Pozwala to uniknąć pytań w trakcie cudzej tury przy grze na jednym urządzeniu.
10. **Opiekun i Twardogłowy** (reakcje) uruchamiają się automatycznie:
    - Opiekun przejmuje atak, gdy ten zabiłby sąsiedniego sojusznika, a Niedźwiedź go przeżyje;
    - Twardogłowy działa przy pierwszym trafieniu za co najmniej 2 obrażenia.
11. **Ognisty Oddech:** smok atakuje sąsiedniego wroga oraz jednostkę stojącą bezpośrednio za nim w tej samej linii, jeśli to wróg.
12. **Pajęcze Sidła:** cel w odległości do 4 heksów, linia wzroku niewymagana.
13. ~~Zdolności strażników w wariancie bez zdolności~~ — rozstrzygnięte: bez zdolności strażnicy też ich nie mają (sekcja 0).
14. **Wskrzeszony główny bohater** (poza bitwą) pojawia się na polu bohatera, który użył eliksiru, i działa od swojej następnej tury.
15. ~~Automatyczny Eliksir Odrodzenia~~ — usunięte: frakcja bez żyjących bohaterów przegrywa (sekcja 0).
16. **Kryształy** może nieść dowolnie wiele.
17. **AI zła w kooperacji** zna tylko odkryte pola. Zakryte traktuje przy planowaniu jako koszt 1, a po odkryciu aktualizuje trasę.

## 4. Pytania do projektanta

1. Czy jednostki (sojusznicze lub wrogie) mają blokować linię strzału?
2. Kto rzuca Tarczę Strażnika w grze papierowej: obrońca w dowolnym momencie ataku przeciwnika? Czy wersja z „uzbrajaniem” tarczy jest akceptowalna?
3. Czy wejście na pole sąsiadujące z wrogiem (a nie na jego pole) ma wywoływać bitwę? Spec mówi przy AI zła: „jeśli wróg sąsiaduje, rozpoczyna walkę”.
4. Czy zło może zbierać skarby? (Na razie: tak).
5. Ile kryształów może nieść jeden bohater?
6. Czy Ognisty Oddech wymaga, żeby pierwszy cel sąsiadował ze smokiem?
7. Czy Szarża Światła liczy ruch, który zakończył się obok celu (np. 3 heksy, a potem atak)? (Na razie: tak, liczy się dystans przebyty w tej aktywacji).
8. Czy po Rogu Strażników nowy pomocnik może działać w tej samej rundzie?
9. Gdzie stoją jednostki na początku bitwy: dowolnie w skrajnej kolumnie (gracz wybiera), czy w ustalonych rzędach?
10. Czy skrajne kolumny areny mają być wolne od przeszkód? (Tak założyłem).

---

## 5. Wyniki symulacji botów (2026-10-20, 1000 gier na wariant)

Boty to proste heurystyki. Te liczby nie są oceną balansu przy grze ludzi, ale dobrze pokazują trendy.
Kooperacja: 2 bohaterów Przymierza (Złoty Smok i Król Jednorożców) przeciw automatowi zła.
PvP: Prastary Niedźwiedź przeciw Władcy Wilkołaków.
Polecenie do powtórzenia: `npm run sim -- 1000 short coop full` (zamiast `full` można podać ułatwienia, np. `noabilities,notreasures,nodice,replacement`).

**Uwaga:** tabele w sekcjach 5 i 5a są nieaktualne — wyniki po balansie są w sekcji 7. Tabela poniżej pochodzi sprzed zmian z sekcji 0 (stare kafelki, ograniczone zdolności strażników, automatyczny eliksir, Horda bez warunku przegranej). Nowe wyniki są w sekcji 5a.

| Wariant | Wygrane Świtu | Śr. rund | Bitew na grę | Poległych bohaterów Świtu na grę | Całkowita porażka ze strażnikiem | Śr. strata pomocników na walkę ze strażnikiem |
|---|---:|---:|---:|---:|---:|---:|
| krótka · coop · podstawowy | 28.6% | 5.4 | 3.4 | 1.40 | 3.4% | 0.58 |
| krótka · coop · zaawansowany | 54.8% | 5.7 | 3.6 | 0.93 | 0.0% | 0.24 |
| średnia · coop · podstawowy | 19.8% | 8.6 | 4.1 | 1.63 | 2.3% | 0.67 |
| średnia · coop · zaawansowany | 42.7% | 9.0 | 4.5 | 1.24 | 0.0% | 0.28 |
| długa · coop · podstawowy | 16.7% | 12.4 | 3.8 | 1.54 | 2.1% | 0.67 |
| krótka · PvP · podstawowy | 52.4% | 6.2 | 2.4 | 0.39 | 0.0% | 0.89 |
| średnia · PvP · zaawansowany | 36.3% | 9.0 | 2.9 | 0.58 | 0.0% | 0.34 |

Obserwacje:
- **Strażnicy neutralni spełniają założenie z instrukcji** („małe lub średnie wyzwanie, straty 1–2 pomocników, nie rutynowa zagłada”). Całkowita porażka zdarza się w 0–3,4% walk, a śr. strata to 0,2–0,9 pomocnika na walkę.
- **W kooperacji wariant podstawowy jest wyraźnie trudny dla dobra.** Przyczyną najczęściej jest śmierć wszystkich bohaterów w starciach z bohaterami zła. Wariant zaawansowany wyrównuje szanse, głównie dzięki Słonecznemu Blaskowi i zdolnościom pomocników.
- **Limit rund rzadko decyduje (4–13% gier).** Długość partii wyznaczają głównie bitwy.
- **Rytuał przy Drzewie kończy 5–9% gier.**

## 5a. Symulacje po zmianach z sekcji 0 (2026-10-20, 500 gier na wariant, arena)

Kooperacja: 2 bohaterów Przymierza przeciw 2 bohaterom automatu zła. PvP: 1 na 1.

| Wariant | Wygrane Świtu | Śr. rund | Koniec: polegli wszyscy bohaterowie Świtu | Koniec: polegli wszyscy bohaterowie Hordy | Koniec: kryształy | Koniec: rytuał / limit rund |
|---|---:|---:|---:|---:|---:|---:|
| krótka · coop · pełna gra | 42.0% | 3.8 | 279 | 154 | 56 | 11 |
| krótka · coop · bez zdolności | 35.8% | 3.7 | 305 | 134 | 45 | 16 |
| średnia · coop · pełna gra | 31.6% | 5.7 | 315 | 150 | 8 | 27 |
| krótka · PvP · pełna gra | 25.6% | 3.1 | 366 | 118 | 10 | 6 |
| średnia · PvP · pełna gra | 24.2% | 4.2 | 364 | 121 | 0 | 15 |

Obserwacje:
- **Partie kończą się teraz głównie wybiciem bohaterów jednej frakcji, zwykle w 3–6 rundzie.** Kryształy prawie nigdy nie decydują.
  - Przyczyna: każdy gracz prowadzi jednego bohatera. Jedna przegrana bitwa bohaterów (PvP 1 na 1) albo dwie (kooperacja 2 na 2) kończą grę.
  - Wcześniej automatyczny eliksir i brak warunku przegranej Hordy wydłużały partię.
- Balans odłożono na później (decyzja użytkownika). Możliwe dźwignie:
  - ułatwienie „rezerwowy bohater po śmierci”;
  - mniej starć bohaterów (AI zła atakuje każdego sąsiada);
  - silniejsi pomocnicy dobra.

## 6. Dodatkowe pytania po implementacji

11. W kooperacji automat zła zawsze atakuje bohatera dobra, który z nim sąsiaduje. Czy zło powinno też unikać walki, gdy jest wyraźnie słabsze?
12. Czy po wygranej bitwie z bohaterem zła w kooperacji pokonany zły bohater ginie na stałe? (Teraz: tak, tak jak każdy główny bohater.)
13. ~~Wariant walki na planszy głównej~~ — rozstrzygnięte przez użytkownika: pojedynek 1 na 1.
    Uwaga do balansu (symulacje, 500 gier, krótka mapa): w pojedynku bohater ginie w walce ze strażnikiem w ok. 29% walk, a na arenie z pomocnikami w 0–3%. Strażnicy mają 11–15 Ż, a bohaterowie 7–11. Czy strażnicy w tym wariancie powinni mieć osłabione statystyki?
14. Odkryte heksy są wspólne dla wszystkich graczy, tak jak odwrócone kafelki na stole. W PvP na 4 osoby mapa odsłania się więc bardzo szybko, bo czterech bohaterów zwiedza ją jednocześnie. Czy tak ma być, czy każda frakcja powinna widzieć tylko to, co sama odkryła?
15. Skarby są wspólne dla frakcji (decyzja użytkownika). Czy bot-sojusznik może sam użyć wspólnego skarbu, np. Eliksiru Odrodzenia, bez zgody gracza? W teście gracz był tym zaskoczony. Teraz: tak, a gracz dostaje podsumowanie „Od Twojej ostatniej tury”.

## 7. Balans — pętla symulacji (2026-10-20)

Polecenie użytkownika: symulacje wszystkich wariantów, obserwacje, zmiany, powtarzanie, aż Świt wygrywa 45–55% wszędzie (a jeśli się nie da — 40–60%). Bez nowych zasad: tylko statystyki, parametry i lekkie przeróbki zdolności.

### 7.1. Jak mierzyłem
- **72 warianty:** 3 długości mapy × 4 stoły (kooperacja 1 i 2 graczy, PvP 1 na 1 i 2 na 2) × 6 opcji (pełna gra, bez zdolności, bez skarbów, bez kości, rezerwowy bohater, pojedynki na planszy). Bohaterowie losowani w każdej partii.
- `make sim-matrix GAMES=1000` — macierz wariantów z diagnostyką botów i statystykami jednostek (`scripts/sim/matrix.ts`); `scripts/sim/brief.ts <nazwa>` — skrócona tabela.
- `make sim-battles` — turniej jednostek w równych warunkach (`scripts/sim/battles.ts`): każdy bohater Świtu z każdym Hordy (3 na 3 i 1 na 1), drużyny przeciw strażnikom, porównanie pomocników.
- Zmienna `SIM_OVERRIDE` podmienia statystyki i parametry na czas symulacji, bez zmiany gry (`scripts/sim/override.ts`).
- Wszystkie liczby pochodzą z gry **botów**. Przy ludziach balans może wyglądać inaczej.

### 7.2. Błędy botów i silnika znalezione po drodze (naprawione)
1. **Gra się zawieszała**, gdy zwycięzca bitwy zostawał na polu z drugim wrogim bohaterem: nikt nie umiał zaatakować na własnym polu, więc partia stała do limitu rund. Naprawa w silniku (sekcja 0).
2. **Remis „oboje polegli” zawsze wygrywała Horda** przez kolejność sprawdzania w kodzie (ok. 5% partii z jednym bohaterem na stronę). Naprawa w silniku (sekcja 0).
3. **Bot Świtu nigdy nie przerywał rytuału** Hordy przy Drzewie, chyba że niósł kryształ.
4. **Bot Świtu wchodził tuż obok wyraźnie silniejszych wrogów.** Ocena siły (Ż + 2×A bohatera) pomijała pomocników i strzelców. Teraz liczy siłę drużyny (suma Ż × suma A, strzelcy ×1,3) i unika pól w zasięgu silniejszego wroga.
5. **Bot Hordy w PvP grał jak automat z kooperacji**, czyli atakował każdego sąsiada. Teraz osobny bot gracza Hordy wybiera walki, poluje na niosących kryształy, a w innym razie idzie na rytuał.
6. **Boty graczy nie polowały na wrogich bohaterów**, choć wybicie ich też daje zwycięstwo. Teraz polują przy wyraźnej przewadze, a w pojedynkach tylko przy dużej, bo atakujący bije drugi.
7. **Bot Hordy i automat nie używały Eliksiru Odrodzenia na mapie**, a boty nie zbierały celowo skarbów. Teraz robią to tak jak bot Świtu.
8. **Ocena siły nie uwzględniała**, który bohater faktycznie broni pola z kilkoma bohaterami, ani tego, że w pojedynku nie ma pomocników.
9. **Rezerwowy bohater w kooperacji działał tylko dla graczy**: Świt miał 3 „życia”, automat 1 (patrz sekcja 0).

Diagnostyka końcowa (72 000 partii): 0 nielegalnych akcji, 0 zawieszonych gier, 0 bitew przerwanych limitem rund.

### 7.3. Lista zmian balansu
Budżety punktowe zachowane (bohater 18, pomocnik 11). Nie zmieniałem wartości nadrukowanych na znacznikach (−2 S, −1 A, +1 A, +3 S, +4 Ż).

| Jednostka / parametr | Było | Jest | Dlaczego |
|---|---|---|---|
| Król Jednorożców | 7/4/7 | **8/5/5** | ginął od jednego ciosu (12% wygranych z Wilkołakiem) |
| Władca Wilkołaków | 7/5/6 | **8/5/5** | lustro Jednorożca; wcześniej najsilniejszy w bitwach 3 na 3 |
| Czarny Smok | 8/6/3 | **9/5/3** | lustro Złotego Smoka; bez zdolności Horda miała przewagę Ataku |
| Ogr Żelazna Pięść | 11/5/2 | **11/4/3** | wygrywał prawie każdy pojedynek |
| Twardogłowy (Ogr) | ignoruje do 4 obrażeń | **do 2** | razem z Życiem dawał w praktyce 15 Ż |
| Elf Druid | 3/2/4 | **4/1/4** | strzelcy wygrywali ok. 62% bitew, reszta pomocników ok. 44% |
| Goblin Szaman | 4/2/3 | **5/1/3** | jw. |
| Nimfa | 6/1/4 | **5/2/4** | lustro Pająka |
| Pegaz | 3/2/5 | **4/2/4** | ginął w 89% bitew |
| Pająk Jaskiniowy | 5/2/4 | **6/2/3** | wyrównanie po osłabieniu Goblina |
| Nietoperz Cienia | 3/1/6 | **4/2/4** | ginął w 90% bitew, prawie bez obrażeń |
| Nocna Zasadzka | +2 obrażenia | **+3** | jw. |
| Cyklop Błyskotek | 13/3/2 | **15/2/2** | zabijał kruchych pomocników jednym strzałem; przy jednym bohaterze śmierć u strażnika kończy grę |
| Gryf Złodziej Skarbów | 11/3/6 | **9/3/6** | w pojedynkach na planszy wygrywał ok. 45% |
| Hydra z Zatopionych Ruin | 15/2/3 | **13/2/3** | jw. |
| Remis inicjatywy | rotacyjnie | **obrońca pierwszy** | Horda prawie zawsze atakuje (automat), co dawało jej przewagę |
| Mapa średnia — skarby | 2 Eliksiry + 2 inne | **1 Eliksir + 3 inne** | wskrzeszanie na mapie mocno faworyzowało grę dwoma bohaterami |

Sprawdzone i odrzucone:
- Klątwa −2 A — wartość jest nadrukowana na znaczniku;
- rytuał 3 rundy — sprzeczne z „jedną pełną rundą” z dokumentu;
- każda jednostka Hordy słabsza o 1 punkt (propozycja użytkownika) — Świt średnio 66%, w kooperacji do 83%;
- Nietoperz 5/2/3 — sam się wyrównuje, ale przechyla całą Hordę;
- tryb rotacyjny inicjatywy — pogarsza PvP.

Liczby zdolności są teraz w tabeli `ABILITY` w `src/engine/data.ts`, a teksty kart biorą je stamtąd.

### 7.4. Wynik końcowy (1000 partii na wariant, % wygranych Świtu; `+` powyżej 55, `-` poniżej 45)

```
                   full noabilit notreasu   nodice replacem    board
short·coop1         59+      60+      55       64+      50       50 
short·coop2         64+      65+      52       70+      62+      60+
short·pvp1          50       50       41-      47       45       42-
short·pvp2          51       52       41-      53       48       41-
medium·coop1        56+      56+      55       60+      41-      46 
medium·coop2        55       57+      51       59+      52       50 
medium·pvp1         41-      40-      40-      39-      28-      36-
medium·pvp2         42-      47       35-      46       40-      32-
long·coop1          61+      57+      49       59+      45-      47 
long·coop2          58+      61+      47       62+      57+      54 
long·pvp1           39-      40-      38-      40-      27-      31-
long·pvp2           45-      47       37-      47       40-      28-
w przedziale 0.45–0.55: 26/72 · min 26.8 · max 69.5 · średnio 48.5
```

Na starcie (te same 72 warianty): 5/72 w 45–55%, 20/72 w 40–60%, średnio 36%. Teraz: **26/72 w 45–55%, 51/72 w 40–60%**, średnio 48,5%.

Turniej jednostek (500 bitew na parę):
- bitwy 3 na 3 — Świt 52%, pary bohaterów 41–66%;
- pomocnicy 47–57%, poza Nietoperzem (39%; mocniejsze wersje przechylały całą Hordę);
- strażnicy przegrywają z drużyną w 99–100% i zabierają średnio 0–0,6 pomocnika.

### 7.5. Czego nie da się osiągnąć samymi statystykami — do decyzji
Celu 45–55% (ani 40–60%) nie osiągnąłem we wszystkich wariantach. Pozostałe odstępstwa mają przyczyny w zasadach, nie w liczbach:
1. **Kooperacja jest o ok. 12–15 punktów łatwiejsza niż PvP.** Sprawdziłem to wprost: gdy w kooperacji Hordą gra bot z PvP, wyniki spadają do poziomu PvP. Automat zła z zasad (zawsze atakuje sąsiada, idzie do najbliższego celu) atakuje także w przegranych sytuacjach. Każda zmiana statystyk przesuwa kooperację i PvP razem.
   *Propozycje:* automat atakuje tylko wtedy, gdy nie jest wyraźnie słabszy; albo w kooperacji Horda ma o jednego bohatera więcej; albo przyjmujemy, że kooperacja (gra przeciw komputerowi) jest łatwiejsza.
2. **PvP z rezerwowym bohaterem (27–48%).** Rezerwowy bohater Świtu startuje w bazie, a samotny bohater Hordy w tym czasie kończy rytuał przy Drzewie (rytuał rozstrzyga ok. 40% partii).
   *Propozycje:* rezerwowy bohater wchodzi przy Drzewie albo śmierć bohatera Świtu nie pozwala zacząć rytuału w tej samej rundzie.
3. **Pojedynki na planszy w PvP (28–42%).** W pojedynku działają 2 zdolności Hordy (Zew Krwi, Twardogłowy) i tylko 1 Świtu (Słoneczny Blask): Szarża Światła wymaga ruchu, a Opiekun Gaju sojusznika.
   *Propozycja:* w pojedynku Szarża Światła działa przy pierwszym ataku, a Opiekun Gaju raz na bitwę zmniejsza obrażenia Niedźwiedzia o 2.
4. **Strażnicy są teraz łatwi.** To cena za mniejszy rozrzut: w grze jednym bohaterem każda śmierć przy strażniku kończy partię. Jeśli mają zabierać 1–2 pomocników, trzeba ich wzmocnić i pogodzić się z niższym wynikiem Świtu w grach jednym bohaterem.

### 7.6. Po decyzjach użytkownika (2026-10-20)
Wprowadzone: opcja „Dodatkowy bohater Hordy” (kooperacja), zdolności Świtu w pojedynkach (sekcja 0), strażnicy +1 Życia (Cyklop 16/2/2, Gryf 10/3/6, Hydra 13→14/2/3).

1000 partii na wariant (kolumna `extraevi` = kooperacja z dodatkowym bohaterem Hordy):

```
                   full noabilit notreasu   nodice replacem    board extraevi
short·coop1         59+      60+      57+      64+      49       60+      41-
short·coop2         64+      66+      53       66+      61+      71+      56+
short·pvp1          49       51       42-      46       44-      51          
short·pvp2          50       52       42-      51       48       54          
medium·coop1        56+      56+      55       60+      40-      54       34-
medium·coop2        53       57+      51       56+      50       65+      48 
medium·pvp1         40-      40-      40-      39-      27-      45-         
medium·pvp2         41-      46       35-      43-      38-      46          
long·coop1          61+      56+      50       59+      44-      55       39-
long·coop2          58+      60+      45-      59+      55+      68+      51 
long·pvp1           38-      40-      39-      38-      25-      37-         
long·pvp2           44-      47       36-      45-      40-      41-         
w przedziale 0.45–0.55: 23/78 · min 25.4 · max 70.5 · średnio 49.3
```

- Dla 72 wariantów bazowych: 21/72 w 45–55%, 45/72 w 40–60%, średnio 49,7% (wcześniej 26, 51, 48,5%).
- **Dodatkowy bohater Hordy:** kooperacja 2 graczy wychodzi zbalansowana (48–56%), dla 1 gracza jest trudna (34–41%).
- **Pojedynki:** PvP poprawiło się (37–54% zamiast 28–42%), ale kooperacja na planszy stała się za łatwa (54–71%). Przewaga obrońcy w pojedynku jest duża: atakujący wygrywa tylko ok. 30%.
- **Strażnicy +1 Życia:** prawie bez wpływu — nadal przegrywają z drużyną w ~99% walk i zabierają 0–0,6 pomocnika.
- **Rezerwowy bohater w PvP 1 na 1:** 25–44% (rytuał kończy 19–46% partii; bez tej opcji partię rozstrzyga zwykle jedna bitwa bohaterów).

### 7.7. Poziomy gry i wzmocnieni strażnicy (2026-10-20)
Zmiany: cofnięte efekty zdolności w pojedynkach; strażnicy z większym Życiem, połową Życia w pojedynku i skarbem po pokonaniu; poziomy gry; bot Świtu nie idzie do strażnika z jednym pomocnikiem przed połową rund.

1000 partii na wariant (kolumny `kids` i `hard` to gotowe poziomy):

```
                   full noabilit notreasu   nodice replacem    board     kids     hard
short·coop1         65+      61+      54       68+      51       53       69+      43-
short·coop2         66+      68+      50       68+      63+      64+      80+      56+
short·pvp1          52       50       39-      50       44-      51       62+         
short·pvp2          54       56+      36-      52       51       47       60+         
medium·coop1        61+      57+      48       63+      44-      53       67+      38-
medium·coop2        59+      59+      42-      57+      56+      56+      75+      50 
medium·pvp1         43-      43-      39-      43-      28-      43-      57+         
medium·pvp2         47       50       35-      44-      42-      41-      50          
long·coop1          63+      56+      47       63+      49       53       63+      39-
long·coop2          64+      63+      46       60+      61+      57+      74+      53 
long·pvp1           43-      43-      38-      40-      26-      39-      49          
long·pvp2           49       49       35-      48       44-      34-      45-         
w przedziale 0.45–0.55: 27/90 · min 25.6 · max 80.2 · średnio 51.8
```

- **Normalny:** kooperacja 59–66% (celowo łatwiejsza — decyzja użytkownika), PvP 43–54%.
- **Dla dzieci:** kooperacja 63–80% (łatwo, o to chodzi), PvP 45–62%.
- **Trudny:** 38–56% — wyzwanie, zwłaszcza dla jednego gracza.
- Odstają tylko pojedyncze przełączniki z „Własnego” w PvP (bez skarbów 35–39%, rezerwowy bohater 26–51%) — opisane w instrukcji.
- Instrukcja dla graczy: `docs/INSTRUKCJA.md`.

### 7.8. Limity rund 8 / 12 / 16 (2026-10-21, decyzja użytkownika)

Długość partii z limitem podniesionym do 100 (400 gier na wariant, poziomy Normalny / Dla dzieci / Trudny):

| Mapa | Tryb | Mediana | 90% | 95% | 99% |
|---|---|---:|---:|---:|---:|
| Krótka | kooperacja | 3 | 5 | 6 | 7 |
| Krótka | PvP | 4 | 6 | 7 | 9 |
| Średnia | kooperacja | 5 | 8 | 9 | 11 |
| Średnia | PvP | 6 | 9 | 10 | 13 |
| Długa | kooperacja | 7 | 12 | 13 | 15 |
| Długa | PvP | 9 | 14 | 15 | 18 |

- Stare limity 12 / 20 / 30 rozstrzygały ok. 0,1–0,3% partii, czyli praktycznie nigdy.
- Nowe limity 8 / 12 / 16 zmieniają wygrane Świtu o ≤ 1 pp. Limit rozstrzyga 0–0,2% partii w kooperacji, 0,5–3% w PvP i do 4% w PvP dla dzieci.

### 7.9. Kryształ poległego nosiciela i bardzo długa mapa (2026-10-21, decyzje użytkownika)

- **Bezpański kryształ pod bohaterem:** wolny kryształ na polu, na którym stoi żyjący bohater Przymierza, trafia do niego od razu, bez ruchu (sprawdzane po każdej akcji w `applyAction`, testy w `tests/rules.test.ts`).
- **Bot (zawieszone partie PvP):** w ostatniej ćwierci rund Świt przyjmuje każdą walkę. Zawieszonych partii przy limicie 100: 0/4800 (wcześniej 24).
- **Bardzo długa mapa** (`veryLong`): 14 rzędów (105 pól), 3 kryształy (więcej strażników nie ma), 3 Eliksiry Odrodzenia + 5 innych skarbów, limit 20 rund (decyzja użytkownika; pierwsza wersja: 2 + 6, limit 22).
  - Naturalna długość (limit 100): kooperacja mediana 10 / p90 16 / p95 18 / p99 23; PvP 13 / 19 / 21 / 24.
  - Wygrane Świtu (400 gier) w porównaniu z długą mapą: kooperacja Normalny 55–58% (długa 64–66%), Dla dzieci 62–74%, Trudny 35–48%; PvP Normalny 42–44% (46–48%), Dla dzieci 39% (46–49%). Limit rozstrzyga 0–3,5% partii.
  - Pierwsza wersja: Świt słabszy niż na długiej mapie, bo dłużej nosi kryształy.
  - Po zmianie na 3 + 5 i limit 20 (400 gier): kooperacja Normalny 57–62%, Dla dzieci 59–74%, Trudny 39–54%; PvP Normalny 41–46%, Dla dzieci 37–41%. Limit rozstrzyga 1–6,5% partii (najwięcej w PvP 1 na 1). Zawieszonych partii: 0.
- **Areny: 7 przeszkód** (decyzja użytkownika): 2 szerokie na parach pól + 5 pojedynczych, 9 pól zamiast 10 (usunięte pole (8, 14) na obu arenach). Wpływ na wygrane Świtu: ±3 pp na pozostałych mapach.
- **Minimum obrażeń zostaje 0** (decyzja użytkownika z 2026-10-21): Atak 1 z rzutem −1 nie zadaje obrażeń. Zasady „co najmniej 1” nie wprowadzamy. Dziennik bitwy pokazuje każdy rzut kością.

### 7.10. Rezerwowy bohater i „Same Eliksiry Odrodzenia” (2026-10-21, decyzje użytkownika)

- **Rezerwowy bohater** wkracza na najbliższe wolne pole od miejsca śmierci poprzednika (wolne = przejezdne, bez wrogiego bohatera i strzeżonego kryształu). Przy kilku polach wybiera gracz na początku tury (`HeroState.entering`, ruch `enter` bez kosztu); bot wybiera pole najbliżej Drzewa.
  - Wcześniej (start w bazie, limity 8/12/16/20) Świt w 1 bohaterze wygrywał 3–39%. Teraz (300 gier): koop 1 gracz 41–45%, koop 2 graczy 53–65%, PvP 1 na 1 26–36%, PvP 2 na 2 41–50%. W PvP 1 na 1 Horda nadal wygrywa często rytuałem (22–26% partii).
- **„Bez skarbów” → „Same Eliksiry Odrodzenia”:** 1 / 2 / 3 / 4 eliksiry na mapie (`onlyResurrections`), strażnik nic nie zostawia. Świt (300 gier): koop 57–65%, PvP 41–56% (wcześniej bez skarbów: koop 40–54%, PvP 30–39%).

### 7.11. Wyrównanie bohaterów zdolnościami (2026-10-21)

- **Statystyki zostają lustrzane i w budżecie 18 / 11.** Próby zmian statystyk (także w ramach budżetu) psuły poziom Dla dzieci i „bez zdolności”, gdzie liczą się same liczby (np. Wilkołak z S 5 przeciw bohaterom z S 4 wygrywał 79% pojedynków). Użytkownik zgodził się najpierw złamać budżet, ale po tym pomiarze wróciłem do budżetu i balansu samymi zdolnościami (w poziomach bez zdolności nic się nie zmienia).
- **Zmiany:**
  - Opiekun Gaju (Niedźwiedź): przejmuje śmiertelny cios wymierzony w sąsiedniego sojusznika **albo w siebie** i ignoruje z niego 3 obrażenia (raz na bitwę).
  - Słoneczny Blask (Złoty Smok): drużyna +1 A do następnego ataku, **sam Smok +3 A**.
  - Szarża Światła (Jednorożec): od **4** pól rozbiegu (było 3).
- **Wynik (PvP, Normalny, 400 gier na wariant):** strona bohatera wygrywa: Niedźwiedź 48%, Złoty Smok 48%, Jednorożec 58%, Czarny Smok 47%, Ogr 48%, Wilkołak 50% (wcześniej 40–59%). Jednorożec bez Szarży nadal ma ok. 56% — jego siła to zestaw 8/5/5 i sposób gry botów.
- **Skutek uboczny:** Świt jako całość jest mocniejszy — kooperacja Normalny 59–75% (łatwiej niż wcześniej), PvP 1 na 1 nadal 40–57% (najsłabiej na bardzo długiej mapie). Próby wyrównania 1 na 1 na dużych mapach bez efektu: +1 Eliksir Odrodzenia, rytuał 3 rundy, 2 kryształy zamiast 3.

### 7.12. Jeden bohater na polu, automat według instrukcji (2026-10-21, decyzje użytkownika)

- **Jeden bohater na polu**; wyjątek: własna baza (start). Na pole sojusznika nie można wejść ani przez nie przejść. Przy kilku obrońcach w bazie walczy ten z największą liczbą Życia.
- **Rytuał:** jeden bohater Hordy na Drzewie, pozostali żyjący na polach obok (`ritualFormed`, `ritualSpot`).
- **Wskrzeszenie na mapie:** wskrzeszony staje na wybranym wolnym polu obok pijącego (`reviveSpots`, `useMapItem.targets[0]`).
- **Automat (kooperacja) i strażnicy w bitwie** grają według instrukcji (`battleAi.ts`, `rulebookAction`): zdolności od razu; bohater/strażnik bije bohatera, inaczej pomocnika z najmniejszym Życiem; pomocnik automatu bije najpierw pomocników; bez celu — do najbliższego wroga. W rywalizacji strażnikiem przy stole kieruje gracz Hordy; w grze jednoosobowej — ten sam gracz.
- **Wynik (300 gier):** kooperacja łatwiejsza (Normalny 67–77%, Trudny 49–73%), PvP Normalny 41–61%. Zero zawieszonych partii i niedozwolonych ruchów.
- **Zawartość pudełka** (max potrzeb — bardzo długa mapa, bitwa 3 na 3): 50 + 49 kafelków terenu, 16 kafelków skarbów (8 + 8), 3 siedliska, Drzewo, 2 bazy, 2 areny, 15 kart i 15 figurek, 18 kart skarbów (4 Eliksiry + 14), 3 kryształy, tor rund + znacznik, kość; znaczniki: krople 5 × 10, 3 / 2 / 1 × 6, zużyta zdolność 6, Wzmocnienie Ataku 6, Żywotność 4, Ochrona 2, pozostałe po 1.

### 7.13. Wygrana tylko kryształami, 3 punkty ruchu, nowe boty (2026-10-21, decyzje użytkownika)

- **Przymierze wygrywa tylko kryształami.** Pokonanie wszystkich bohaterów Hordy nie kończy gry. Horda wygrywa limitem rund, wybiciem Przymierza albo rytuałem.
- **3 punkty ruchu** (było 2), limity rund bez zmian (8 / 12 / 16 / 20).
- **Kryształy:** 2 przy jednym bohaterze Przymierza, 3 przy dwóch (`crystalsFor`), na każdej mapie.
- **Bot Przymierza (gracz):** wyprawy po kilka kryształów — z kryształem dalej zwiedza i zbiera, do Drzewa wraca, gdy niesie wszystkie brakujące albo gdy kończy się czas (liczy rundy powrotu); kryształy przed skarbami (skarb tylko ≤ 2 pola); strażnik już z 1 pomocnikiem; Hordę atakuje tylko obok siebie (gdy wyraźnie silniejszy) albo żeby przerwać rytuał; dwóch bohaterów dzieli się kryształami i obszarami zwiedzania; zwiedza w stronę połowy mapy z nieznalezionymi siedliskami; bez kryształu nie stoi na Drzewie ani obok, gdy sojusznik niesie kryształ.
- **Bot Hordy (gracz w PvP):** gdy Przymierze niesie kryształ — trzyma Drzewo (blokuje oddanie), dochodzi do niego pierwszy albo przechwytuje nosiciela.
- **Wynik (200 gier, Normalny):** koop 1 gracz 45–67%, koop 2 graczy 40–55%, PvP 1 na 1 24–48%, PvP 2 na 2 26–41%. Słabe miejsce: PvP na długich mapach — rytuał samotnego bohatera Hordy (do 37% partii na bardzo długiej mapie 1 na 1).

### 7.14. Rytuał 3 rundy, boty liczą czas (2026-10-21)

- **Rytuał trwa 3 rundy** na każdej mapie (`ritualRounds: 3`).
- **Bot Przymierza pilnuje Drzewa z zegarem:** bohater najbliżej Drzewa (także nosiciel) liczy, ile punktów ruchu zostało, zanim Horda dojdzie i utrzyma rytuał. Dopóki zdąży wrócić z zapasem jednej tury, zwiedza i zbiera po drodze; bez zapasu idzie prosto do Drzewa.
- **Nie atakuje bez wyraźnej przewagi** (obrońca uderza pierwszy: z symulacji obrońca wygrywa ok. 2/3 walk przy równych siłach). Wcześniej ścieżki przechodziły przez wroga już przy stosunku sił 0,9.
- **Rytuał przerywa sojusznik bez kryształu**, jeśli zdąży (nosiciel straciłby kryształy).
- **W PvP nosiciel nie atakuje Hordy siedzącej na Drzewie**, dopóki nie ma rytuału ani presji czasu. W koop nie czeka, bo automat z Drzewa nie schodzi.
- **Kryształy oddaje od razu**, gdy Drzewo jest w zasięgu tej tury.
- **Skarby:** do 4 pól objazdu, także podczas zwiedzania (wcześniej tylko gdy znał położenie kryształu).
- **Sprawdzone i odrzucone** (bez efektu albo gorzej):
  - omijanie zasięgu silniejszych wrogów i niekończenie tury w ich zasięgu;
  - trzymanie Drzewa, gdy Horda jest blisko.
- **Wynik (1000 gier, Normalny, pełne zasady, porównanie z tymi samymi ziarnami):**
  - zmiana od −3 do +3 pkt proc.;
  - rytuał na bardzo długiej mapie 1 na 1: 20% → 14%;
  - koop 1 gracz 39–62%, koop 2 graczy 40–56%, PvP 1 na 1 26–46%, PvP 2 na 2 26–43%.
  - Wyniki dla 200 gier były mylące (szum ±3,5 pkt).
- **Wnioski strukturalne:**
  - przewaga obrońcy;
  - Horda nic nie traci, atakując (śmierć jej bohaterów nie daje Przymierzu wygranej);
  - w 1 na 1 samotny bohater Hordy na Drzewie od razu tworzy rytuał.

### 7.15. Balans bez remisów — dziennik prac (2026-10-21, w toku)

**Założenia użytkownika:**
- ten sam odsetek wygranych na danym poziomie niezależnie od mapy i stołu;
- kryształy zostają;
- bez nowych zasad;
- remisy Szybkości mają być rzadkie;
- Przymierze może mieć trochę więcej punktów.

**Cele, które przyjąłem:** Normalny ok. 50%, Dzieci ok. 70%, Trudny ok. 35% (±5).

**Symulacje:** `scripts/sim/matrix.ts` domyślnie liczy tylko poziomy (Dzieci = `kids`, Normalny = `full`, Trudny = `hard`), 40 wariantów. 200 gier to ok. 1,5 minuty, 300 gier ok. 2 minuty. Filtr jest wyrażeniem regularnym. `SIM_ALL=1` dodaje opcje testowe.

**Ustalenia:**
- **Remis dla obrońcy był ukrytym bonusem Przymierza.** To Horda zwykle atakuje, więc remis wygrywa broniące się Przymierze. Usunięcie remisów (parzysta Szybkość u Przymierza, nieparzysta u Hordy) przesuwa wyniki o −20 do +25 pkt, zależnie od tego, kto jest szybszy.
- **Kooperacja jest bardzo czuła na statystyki.** Każde +1 Szybkości bohatera Przymierza (−1 Życia) daje +5–10 pkt w koop.
- **Różnica koop/PvP bierze się z AI bitewnego.** Automat walczy według instrukcji (prosto), Horda w PvP ma pełne AI. W pojedynkach na planszy (Dzieci) tej różnicy nie ma.
- **Strażnicy są niegroźni:** Przymierze wygrywa z nimi w 97–100% walk.
- **Eliksir odrodzenia nie pomaga przy jednym bohaterze Przymierza.** Jego śmierć od razu kończy grę, więc więcej eliksirów pomaga tylko stołom z 2 bohaterami (i pomocnikom). Horda też zbiera eliksiry.
- **Błąd bota (naprawiony):** gdy następne pole kosztowało więcej niż zostało punktów, bot zawracał i krążył między dwoma polami. Teraz kończy turę. To dało do +8 pkt na dużych mapach.
- **Duże mapy:** siedliska są losowo rozrzucone po połowie mapy, więc na bardzo długiej mapie część gier kończy się limitem przed znalezieniem ostatniego strażnika.
- **Rezerwowy bohater Hordy** (`rules.hordeReserve`, w kodzie, domyślnie wyłączony): w koop ~0 do −10 pkt, w Dzieci ok. −10 pkt.
- **Prostsza zasada celu automatu** („każda jednostka atakuje wroga z najmniejszym Życiem”) obniża koop o 10–20 pkt i dotyczy też strażników. Eksperyment: zmienna `RB_MODE` w `battleAi.ts`, do usunięcia albo wdrożenia.
- **Oba poziomy z tymi samymi ziarnami (300 gier):**

  | Poziom | Obecne zasady (z poprawionym botem) | Propozycja F1 |
  |---|---|---|
  | Dzieci | 34–79%, średnio 61% | 62–87%, średnio 74% |
  | Normalny | 25–63%, średnio 45% | 37–64%, średnio 52% |
  | Trudny | 32–48%, średnio 43% | 21–39%, średnio 33% |

  Konfiguracja: `.tmp/F1.json`.
- **Propozycja F1:**
  - **Statystyki bez remisów:** Przymierze ma parzystą Szybkość, Horda nieparzystą.
    - Złoty Smok 9/5/4, Jednorożec 8/5/6, Niedźwiedź 11/4/4 (+1 S każdy, +1 punkt budżetu);
    - Czarny Smok 7/5/5, Ogr 9/4/5 (+2 S, −2 Ż);
    - Nietoperz 5/2/3 (−1 S, +1 Ż);
    - pozostali bez zmian.
    - Remis zostaje tylko Jednorożec–Gryf (6).
  - **Automat i strażnicy:** każda jednostka atakuje wroga z najmniejszym Życiem (`automatonTarget: 'weakest'`).
  - **Koop:** automat gra co najmniej 2 bohaterami (`minEvilHeroes: 2`).
  - **Limity rund:** 8 / 12 / 18 / 24.
  - **Dzieci:** dodatkowo bohater rezerwowy (`heroReplacement`) i brak rytuału.
  - **Trudny:** dodatkowy bohater automatu jak dotąd, a do tego +2 Życia dla każdej jednostki automatu (`automatonHp: 2`).
- **Odrzucone albo słabe:**
  - **rezerwowy bohater Hordy:** −3 do −5 pkt dla Przymierza, nie wyrównuje map;
  - **dłuższy rytuał na dużych mapach (`ritualExtra`):** prawie bez efektu, bo Przymierze i tak przegrywa walkę o Drzewo;
  - **+1 punkt ruchu na dużych mapach (`moveExtra`):** działa jak 2–4 rundy limitu więcej;
  - **więcej eliksirów:** nie działa przy jednym bohaterze, a Horda też je zbiera;
  - **bohater rezerwowy na poziomie Normalnym:** Horda też dostaje rezerwy, więc w PvP jest gorzej.
- **Nowe parametry silnika:** `hordeReserve`, `minEvilHeroes`, `automatonHp`, `automatonTarget`, `roundLimitDelta`, `MapVariant.ritualExtra/moveExtra`, `LEVEL_RULES`. Wszystkie są domyślnie wyłączone, więc gra ma dotychczasowe zasady, dopóki użytkownik nie zdecyduje.
- **Strukturalnie zostaje:**
  - PvP na dużych mapach ok. 37–38% (samotny nosiciel jest ścigany, a w 1 na 1 dochodzi rytuał);
  - koop 2 graczy ok. 62% wobec 1 gracza ok. 50% (różna liczba kryształów).
- **Skarby na start (pomysł użytkownika, `MapVariant.startTreasures`):** Przymierze zaczyna grę z kilkoma skarbami w ręku. Skarby bitewne bardzo mocno ograniczają zgony, także przy jednym bohaterze. Eliksir też pomaga samotnemu bohaterowi, bo wskrzesza pomocników.
  - 2 skarby na długiej i 4 na bardzo długiej (F2) to za dużo: Normalny 48–81%, duże mapy łatwiejsze od małych.
  - **Wybrane (F3):** długa 1 skarb (nie eliksir), bardzo długa 2 skarby (1 eliksir + 1 inny).
  - Normalny 46–76%, średnio 56%. Średnie wierszy (krótka/średnia/długa/bardzo długa): 57,5 / 55 / 54 / 58%, czyli wynik nie zależy już od mapy.
  - Trudny 27–51%, średnio 36%; Dzieci bez zmian (74%).
  - Konfiguracja: `.tmp/F3.json`.
  - Zostaje różnica stołów: koop 2 graczy ok. +10 pkt na każdej mapie.

### 7.16. Decyzje użytkownika i Trudny ze skarbami Hordy (2026-10-21)

**Wdrożone w grze i instrukcji:**
- limity rund 8 / 12 / 18 / 24;
- poziom „Dla dzieci” nazywa się teraz **„Łatwy”** (identyfikator w kodzie zostaje `kids`);
- poziom Łatwy ma bohatera rezerwowego i nie ma rytuału. Służy do tego nowa flaga `rules.ritual: false`: rytuał się nie liczy, `ritualFormed` zwraca false, a bot Przymierza nie pilnuje Drzewa.
  - Łatwy z prawdziwą flagą (F3, 300 gier): 59–91%, średnio ok. 79%. Na F3 z rytuałem 99 rund było 74%, bo boty niepotrzebnie atakowały Hordę na Drzewie.

**Odrzucone:** +2 Życia dla automatu na Trudnym. Bez tego Trudny ≈ Normalny (średnio 55%).

**Test skarbów Hordy na start na Trudnym** (`rules.hordeStartTreasures`; F3 bez +2 Ż; 500 gier):

| Wariant | Średnio | Rozrzut |
|---|---|---|
| brak skarbów | 54% | 41–71% |
| 1 losowy | 43% | 33–61% |
| 2 losowe | 35% | 26–57% |
| eliksir + 1 inny | 28% | 19–54% |
| 1 eliksir | 32% | 22–59% |

- Bardzo długa mapa przy 2 graczach zawsze wychodzi najwyżej, bo Przymierze dostaje tam skarby na start.
- Uwaga na liczbę kart: w pudełku są 4 eliksiry. Na bardzo długiej mapie leżą 3, a 1 dostaje Przymierze na start, więc eliksir dla Hordy byłby piątym.

### 7.17. Wdrożony zestaw F3 + Trudny z 2 losowymi skarbami Hordy (2026-10-22, zatwierdzone przez użytkownika)

**Statystyki (bez remisów: Przymierze parzysta S, Horda nieparzysta):**
- Złoty Smok 9/5/4, Jednorożec 8/5/6, Niedźwiedź 11/4/4;
- Czarny Smok 7/5/5, Ogr 9/4/5;
- Nietoperz 5/2/3.

**Automat i strażnicy:** każda jednostka atakuje wroga z najmniejszym Życiem w zasięgu (najpierw bez ruchu, potem po ruchu); przy remisie wybiera bohatera.

**Koop:** automat ma co najmniej 2 bohaterów (`minEvilHeroes: 2`).

**Mapy:**
- limity 8 / 12 / 18 / 24;
- skarby Przymierza na start: długa 1 losowy (nie eliksir), bardzo długa 1 eliksir + 1 losowy;
- w pudełku jest 6 Eliksirów Odrodzenia (20 kart skarbów).

**Poziomy:**
- **Łatwy** (dawniej „Dla dzieci”, id `kids`): pojedynki, bez zdolności, bez rytuału, bohater rezerwowy;
- **Trudny:** automat ma +1 bohatera i 2 losowe skarby na start.

**Usunięte z kodu** (odrzucone): rezerwowy bohater Hordy, +Ż automatu, dłuższy rytuał na mapie, +PR na mapie, przesunięcie limitu.

**Tor rund:** ma 20 gniazd. Przy limicie 24 znacznik okrąża tor drugi raz (w grze odznaka „+20”). Do decyzji użytkownika: nowa grafika z 24 gniazdami albo drugie okrążenie na planszy.

**Wynik końcowy (300 gier, `.tmp/sim/final.json`):**

| Poziom | Rozrzut | Średnio |
|---|---|---|
| Łatwy | 59–91% | 79% |
| Normalny | 46–76% | 56% |
| Trudny | 23–59% | 35% |

Tabele trudności w instrukcji wygenerowano z tych danych: trudność = round(1 + 9 × (1 − wygrane Przymierza)), w PvP Horda = 11 − Przymierze.

### 7.18. Posiłki Hordy w kooperacji (2026-10-22, decyzja użytkownika, wyniki symulacji zaakceptowane)

Zmiana zasad automatu na poziomach **Łatwym i Normalnym** (Trudny bez zmian, rywalizacja bez zmian):
- na starcie automat ma **tylu bohaterów, ilu jest graczy** (wcześniej: co najmniej dwóch);
- gdy polegnie ostatni żyjący bohater automatu, w **bazie Hordy** od razu staje kolejny: nieużywany bohater Hordy, a gdy takich nie ma — jeden z poległych. Gra od następnej rundy; gdy bazę zajmuje bohater Przymierza, staje na najbliższym wolnym polu.
- W silniku: `minEvilHeroes: 1`, `hordeRespawn: true` w `DEFAULT_RULES`; Trudny ma `minEvilHeroes: 2`, `hordeRespawn: false`.

Symulacje (500 partii botów na wariant, wygrane Przymierza, obecne → nowe):

| Poziom | Gracze | Krótka | Średnia | Długa | Bardzo długa |
|---|---|---|---|---|---|
| Łatwy | 1 | 88 → 90 | 85 → 92 | 82 → 83 | 83 → 78 |
| Łatwy | 2 | 77 → 78 | 75 → 75 | 70 → 67 | 74 → 73 |
| Normalny | 1 | 58 → 63 | 57 → 66 | 55 → 56 | 60 → 63 |
| Normalny | 2 | 66 → 61 | 61 → 53 | 63 → 57 | 78 → 72 |
| Trudny | 1 i 2 | bez zmian | | | |

Jeden gracz zyskuje (jeden bohater Hordy zamiast dwóch), dwóch graczy traci (start bez zmian, ale wybita Horda wraca). Tabele trudności w instrukcji (rozdział 13, kolumna Normalny w kooperacji) i oceny w `src/ui/scoring.ts` uaktualnione; kolumny pojedynczych ustawień w `scoring.ts` pochodzą jeszcze sprzed zmiany.

## 8. Arena — nowy tryb gry (2026-10-22, decyzje użytkownika)

Jedna bitwa 3 na 3 bez mapy przygody, także w wersji papierowej (trafi do instrukcji).
- **Nazwa:** „Arena” (nie „pojedynek” — to już nazwa bitwy bohaterów na planszy).
- **Strony:** zawsze Przymierze Świtu kontra Mroczna Horda. Przeciw żywemu graczowi albo komputerowi.
- **Skład:** każdy wybiera bohatera i 2 z 3 pomocników swojej frakcji. Skład jest jawny.
- **Skarby:** wspólna talia — każdy skarb działający w bitwie po jednym (bez Magicznej Mapy) i **2 Eliksiry Odrodzenia** (15 kart). Losowanie naprzemienne **A, B, B, A**: wybierający widzi 3 różne skarby z wierzchu potasowanej talii, bierze jeden, dwa pozostałe wracają do talii. Każdy ma 2 skarby, **ukryte przed przeciwnikiem do użycia**. Róg Strażników zostaje: „rezerwa” to trzeci, niewybrany pomocnik.
- **Start:** losowo, kto wybiera pierwszy (A) i na której arenie (Przymierza czy Hordy) się walczy. A ustawia się po lewej, pierwszy, i jest „atakującym” w zasadzie remisu inicjatywy.
- **Remis inicjatywy:** „na zmianę” (w nieparzystych rundach bitwy pierwszy jest A, w parzystych B).
- **Jedna bitwa** = cała partia; remis (obie strony giną) jest remisem.
- **Komputer:** poziomy Łatwy (losowy skład i skarby), Normalny (dobre wybory, czasem drugi najlepszy skarb), Trudny (najlepsze wybory). Bot nie bierze skarbów, których nie umie użyć (Róg Strażników, Róg Odwagi, Klepsydra, Zwój Teleportacji); na arenie używa też Butów Wiatru i wskrzesza pomocników.
- **Punkty w „Twoich partiach”:** za wygraną z komputerem 1 / 2 / 3 pkt (Łatwy / Normalny / Trudny) — zaakceptowane przez użytkownika. Zwykła partia to 3–5 bitew i 3–30 pkt w 20–70 min (ok. 14–33 pkt na godzinę), Arena to jedna bitwa w 5–10 min (ok. 6–36 pkt na godzinę przy samych wygranych, w praktyce mniej), więc się nie opłaca bardziej.
- **Instrukcja:** rozdział 15 „Arena — szybka bitwa” (ściągawka przeszła na rozdział 16).
- **Symulacje (1000 partii na każde z 81 starć, `make sim-arena`):** Przymierze wygrywa średnio 58% (boty Normalne) i 56% (Trudne). Najlepsze składy przeciw najlepszym: 46–55% dla Przymierza — wyrównane. Horda ma jednak jednego mocnego bohatera (Czarny Smok ok. 50%, Ogr ok. 41%, Wilkołak ok. 36%), a pary Goblin + Nietoperz i Elf + Pegaz są wyraźnie najsłabsze.

## 9. Balans jednostek 2 (2026-10-22, zatwierdzony przez użytkownika)

Decyzje użytkownika:
- **Budżet statystyk bohaterów (18–19 punktów) przestaje obowiązywać.** Zostają specjalizacje: w Hordzie Ogr ma najwięcej Życia, a Władca Wilkołaków jest najszybszy; w Przymierzu Niedźwiedź ma najwięcej Życia, a Jednorożec jest najszybszy. Szybkości dalej bez remisów (Przymierze parzyste, Horda nieparzyste).
- Wolno zmieniać statystyki o więcej niż 1 i treść zdolności.
- Zwykła gra: każdy wariant poziomu (Łatwy / Normalny / Trudny, kooperacja i rywalizacja, każda mapa) w granicach ±5 punktów procentowych wygranych Przymierza. W rywalizacji Przymierze może trochę osłabnąć; kooperacja ma zostać łatwiejsza niż rywalizacja. **Zasad poziomu Łatwego nie zmieniamy.**

Ustalenia z symulacji:
- Na Łatwym bitwy to pojedynki bez zdolności i bez kości — wynik jest z góry przesądzony przez Ż, A i S (pierwszy uderza szybszy). Zmiana statystyki bohatera o 1 potrafi odwrócić pojedynek i przesunąć Łatwy o 30–65 punktów. Statystyki bohaterów można więc zmienić tylko tak, żeby wszystkie pojedynki (9 bohater–bohater, 18 bohater–strażnik) wyszły tak samo: Wilkołak S 7 wymaga Jednorożca S 8; Ogr Ż 10 odwraca tylko rzadki pojedynek z Gryfem. Resztę balansu dają zdolności i pomocnicy (na Łatwym nie działają).
- Pełne wyrównanie Areny (50/50) obniża Przymierze w zwykłej grze o 3–15 punktów — sprzeczne z limitem ±5. Najlepszy kompromis wyrównuje bohaterów wewnątrz frakcji, a siła frakcji zostaje prawie ta sama.
- Bot szybką jednostką wbiega przed resztę drużyny, więc sama wyższa Szybkość osłabia jednostkę na arenie.

Wdrożony zestaw (U1 i zasady dodatkowe, zatwierdzone):
- **Władca Wilkołaków:** S 5 → **7**; **Zew Krwi** zawsze (nie raz na bitwę): **+1 A do każdego ataku na już rannego wroga** (wcześniej raz na bitwę +2 A).
- **Król Jednorożców:** S 6 → **8**; **Szarża Światła +2 A** (wcześniej +1 A), nadal po ruchu o co najmniej 4 pola.
- **Ogr Żelazna Pięść:** Ż 9 → **10**.
- **Bitwa:** chodzące jednostki **nie przechodzą przez sojuszników** (wcześniej mogły) — decyzja po zgłoszeniu z 22.10.
- **Arena:** przy losowaniu skarbów **Horda widzi 4 karty**, Przymierze 3.

Wyniki (zwykła gra: 500 partii na wariant; Arena: 1000 partii na każde z 81 starć):
- Łatwy ±1,2 pkt; kooperacja Normalny/Trudny ±4,4 pkt; rywalizacja Normalny: Przymierze −1,6 do −8,2 pkt (zgodnie z decyzją, że Przymierze może w rywalizacji trochę osłabnąć). Kooperacja dalej łatwiejsza niż rywalizacja.
- Arena: Przymierze 50,3%; bohaterowie 46–53% (Złoty Smok 53, Jednorożec 48, Niedźwiedź 50, Czarny Smok 46, Wilkołak 51, Ogr 52). Najsłabsze pary pomocników: Elf + Pegaz 42%, Goblin + Nietoperz 43% (reszta 52–55%).
- Odrzucone (łamały limit ±5): osłabienie Słonecznego Blasku, Opiekuna Gaju i Daru Życia (rywalizacja −7 do −15), wzmocnienie Szarży (od 3 pól), Pegaza i Elfa (Ż 5) — kooperacja Trudny +8 do +16; Horda z trzecim skarbem na Arenie (Przymierze 36%).
- Tabele trudności w rozdziale 13 instrukcji i oceny w `src/ui/scoring.ts` przeliczone na nowo.

**Dla wersji papierowej (do poprawienia):** karty jednostek Władca Wilkołaków (S 7, nowy tekst Zewu Krwi), Król Jednorożców (S 8, Szarża +2 A), Ogr Żelazna Pięść (Ż 10); w instrukcji rozdział 2, zasada ruchu w bitwie (rozdział 8 i ściągawka), rozdział 13 (tabele), rozdział 15 (Horda widzi 4 karty). Figurki bez zmian.

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

**Utrudnienie w kooperacji (decyzja użytkownika, 2026-10-20):** domyślnie kooperacja zostaje łatwiejsza. W ustawieniach można włączyć „Dodatkowy bohater Hordy” — automat dostaje o jednego bohatera więcej, niż jest graczy Świtu.

**Zdolności Świtu w pojedynkach na planszy (decyzja użytkownika, 2026-10-20):**
- Szarża Światła — w pojedynku dodaje premię do pierwszego ataku (nie ma ruchu, więc nie da się jej inaczej użyć).
- Opiekun Gaju — w pojedynku (nie ma kogo osłaniać) raz na bitwę zmniejsza obrażenia z jednego ataku o 2.

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

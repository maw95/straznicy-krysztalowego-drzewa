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
- `docs/Straznicy_Krysztalowego_Drzewa_Specyfikacja_dla_AI.md` (wersja 0.9)
- `docs/Straznicy_Krysztalowego_Drzewa_Instrukcja_ilustrowana_v3.pdf`

---

## 1. Decyzje użytkownika (stan na 2026-10-20)

- **Bitwy:** oba warianty, wybierane w ustawieniach partii.
  - Domyślny jest osobna arena 9×11 (3 na 3).
  - Wariant „na planszy głównej” to według użytkownika **pojedynek 1 na 1**: sami bohaterowie, albo bohater i strażnik kryształu, bez pomocników. Nikt się nie rusza; obowiązują zwykłe zasady ataku, zdolności i skarbów.
  - Zdolności związane z ruchem lub sojusznikami (Szarża Światła, Opiekun, odskoki Pegaza i Gryfa) nic tu nie dają.
- **Złoty Smok:** obowiązuje wersja ze specyfikacji. Ma Słoneczny Blask (wzmocnienie sojuszników) i **nie ma** ataku w linii. Atak w linii ma tylko Czarny Smok.
- **Skarby:** wspólny ekwipunek frakcji, a nie przypisany do bohatera.
- **Statystyki:** obowiązują tabele ze specyfikacji, a nie liczby na ilustracjach kart.
- **Nazwy zdolności** wzięte z ikon w `docs/assets/images/ikony_umiejetnosci.png`:
  - Opiekun Gaju (wcześniej Opiekun);
  - Miażdżący Głaz (Głaz Rozpaczy);
  - Łupieżczy Nalot (Skok z Gniazda);
  - Paszcze Otchłani (Wiele Głów).
- **Magiczny Zwój** nazywa się teraz **Zwój Magicznej Strzały** (efekt bez zmian).
- **Każda jednostka ma jeden typ:** latający, strzelec albo wręcz. Latający nie dostaje dodatkowo ikony mieczy.
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
6. **Remisy inicjatywy:** tryb rotacyjny. W rundach nieparzystych pierwszeństwo ma atakujący, w parzystych broniący się.
7. **Ruch w bitwie:** jednostka chodząca może przejść przez pole sojusznika, ale nie wroga. Nie może skończyć ruchu na zajętym polu.
8. **Linia strzału:** blokują ją tylko przeszkody, jednostki nie.
9. **Tarcza Strażnika:** gracz „uzbraja” tarczę na wybranej jednostce, a ta neguje obrażenia z następnego ataku na tę jednostkę. Pozwala to uniknąć pytań w trakcie cudzej tury przy grze na jednym urządzeniu.
10. **Opiekun i Twardogłowy** (reakcje) uruchamiają się automatycznie:
    - Opiekun przejmuje atak, gdy ten zabiłby sąsiedniego sojusznika, a Niedźwiedź go przeżyje;
    - Twardogłowy działa przy pierwszym trafieniu za co najmniej 2 obrażenia.
11. **Ognisty Oddech:** smok atakuje sąsiedniego wroga oraz jednostkę stojącą bezpośrednio za nim w tej samej linii, jeśli to wróg.
12. **Pajęcze Sidła:** cel w odległości do 4 heksów, linia wzroku niewymagana.
13. **Zdolności neutralnych strażników** działają także w wariancie podstawowym (`neutralAbilitiesAlways = true`), bo definiują ich charakter.
14. **Wskrzeszony główny bohater** (poza bitwą) pojawia się na polu bohatera, który użył eliksiru, i działa od swojej następnej tury.
15. **Wszyscy bohaterowie dobra polegli, ale frakcja ma Eliksir Odrodzenia:** eliksir zużywa się automatycznie i wskrzesza pierwszego poległego w bazie dobra.
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
Polecenie do powtórzenia: `npm run sim -- 1000 short coop basic`.

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

## 6. Dodatkowe pytania po implementacji

11. W kooperacji automat zła zawsze atakuje bohatera dobra, który z nim sąsiaduje. Czy zło powinno też unikać walki, gdy jest wyraźnie słabsze?
12. Czy po wygranej bitwie z bohaterem zła w kooperacji pokonany zły bohater ginie na stałe? (Teraz: tak, tak jak każdy główny bohater.)
13. ~~Wariant walki na planszy głównej~~ — rozstrzygnięte przez użytkownika: pojedynek 1 na 1.
    Uwaga do balansu (symulacje, 500 gier, krótka mapa): w pojedynku bohater ginie w walce ze strażnikiem w ok. 29% walk, a na arenie z pomocnikami w 0–3%. Strażnicy mają 11–15 Ż, a bohaterowie 7–11. Czy strażnicy w tym wariancie powinni mieć osłabione statystyki?
14. Odkryte heksy są wspólne dla wszystkich graczy, tak jak odwrócone kafelki na stole. W PvP na 4 osoby mapa odsłania się więc bardzo szybko, bo czterech bohaterów zwiedza ją jednocześnie. Czy tak ma być, czy każda frakcja powinna widzieć tylko to, co sama odkryła?
15. Skarby są wspólne dla frakcji (decyzja użytkownika). Czy bot-sojusznik może sam użyć wspólnego skarbu, np. Eliksiru Odrodzenia, bez zgody gracza? W teście gracz był tym zaskoczony. Teraz: tak, a gracz dostaje podsumowanie „Od Twojej ostatniej tury”.

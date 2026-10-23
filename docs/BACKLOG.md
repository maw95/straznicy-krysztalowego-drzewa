# Backlog

Uzgodnione pomysły do wdrożenia. Tryb online z menu „najpierw online” i rankingiem oraz szczegóły pod prawym
przyciskiem są zrobione (trafią do graczy z wydaniem 1.4.0); dalej figurki 3D.

## 1. Tryb online

**Cel:** znajomi (spoza firmy) grają razem przez internet, na żywo, we wszystkich trybach.

### Ustalenia

- **Własny serwer** w osobnym repozytorium `straznicy-krysztalowego-drzewa-backend`: Node + TypeScript + WebSocket, hosting na Fly.io
  (rachunki poniżej 5 USD/mies. są umarzane). Frontend zostaje na GitHub Pages.
- **Serwer pilnuje zasad:** używa tego samego silnika gry co frontend, sprawdza każdy ruch
  i wysyła graczom tylko to, co mogą widzieć (cudze karty i skarby zostają na serwerze).
- **Pokoje:** gracz zakłada pokój i dostaje krótki kod (np. `SMOK-4821`), inni dołączają kodem.
  Założyciel wybiera tryb, mapę i poziom. Każde miejsce przy stole (bohater / strona) może zająć:
  gracz online, gracz przy tym samym komputerze albo bot — dowolnie wymieszani.
- **Wszystkie tryby:** kooperacja, rywalizacja 1 na 1 i 2 na 2, Arena.
- **Gra tylko na żywo** (bez korespondencyjnej).
- **Rozłączenie w trakcie partii:** czekamy 2 minuty na powrót gracza, potem jego rolę przejmuje bot.
  Gracz, który wróci później, odzyskuje miejsce od bota. Gra stoi tylko wtedy, gdy wypada ruch
  rozłączonego; pozostali widzą odliczanie i mogą wcześniej kliknąć „Oddaj botowi”.
- **Rozłączenie przed startem:** miejsce w pokoju zwalnia się od razu („Maciek wyszedł”);
  można wrócić tym samym kodem, jeśli miejsce jest wolne.
- **Założyciel pokoju** wybiera tryb, mapę i poziom oraz startuje partię. Gdy wyjdzie przed startem,
  ta rola przechodzi na następnego gracza; w trakcie partii jest zwykłym graczem (zasad pilnuje serwer).
- **Restart serwera** (np. deploy) nie przerywa partii: serwer trzyma w bazie ziarno i listę ruchów,
  po restarcie odtwarza partię, a gracze łączą się ponownie automatycznie.
- **Pusty pokój** (także partia, z której wszyscy wyszli) znika po 10 minutach.
- **Jedna przeglądarka może zająć kilka miejsc** (gra przy jednym komputerze, reszta stołu online).
- **Bez widzów** na razie — ewentualnie później.
- **Czat** w pokoju, bez zapisywania historii (wiadomości żyją tylko w pamięci serwera).
- **Statystyki** wszystkich partii zapisywane na serwerze (SQLite na wolumenie Fly).
- **Zgłaszanie błędów** prosto z gry na serwer, zamiast pobierania pliku i wysyłania ręcznie.
- **Deploy:** `make deploy` uruchamiane ręcznie, a docelowo GitHub Action robiący deploy
  przy każdym release backendu (token `FLY_API_TOKEN` w sekretach repo).
- Maszyna Fly musi działać w trakcie partii: `min_machines_running = 1` albo akceptujemy
  kilka sekund rozruchu przy pierwszym połączeniu.

- **Konta graczy:** sam nick (min. 3 znaki) i hasło — bez e-maila i bez resetu hasła; kto zapomni hasła,
  zakłada nowe konto. Statystyki przypisane do konta. Limit prób logowania i rejestracji jest na serwerze.
- **Kolejność:** zaczynamy od serwera (modele figurek powstają w tym czasie).

### Menu „najpierw online” (zrobione)

**Cel:** gra online jest domyślną drogą, a całość ma być maksymalnie prosta i wygodna.

- **Pierwsze uruchomienie** (i po wylogowaniu), po wprowadzeniu: okienko „Zaloguj się / Załóż konto /
  Graj bez konta”. Przy „Graj bez konta” dopisek, że to gra tylko na tym komputerze (z botami albo przy
  jednym ekranie) — **gra online wymaga konta**, nie ma kont gościa.
- Kto ma zapisaną sesję, od razu trafia do menu online, bez okienka. Kto wybrał grę bez konta, nie widzi
  okienka przy każdym wejściu — w menu ma stały przycisk „Zaloguj się, żeby grać ze znajomymi”.
- **Menu zalogowanego:** na środku duże „Nowy pokój”, niżej „Dołącz kodem” i „Gra na tym komputerze”
  (obecny ekran ustawień, już jako podstrona, a nie strona startowa). Z prawej lista graczy online
  ze statusem (w menu / w pokoju / w grze), pod nią **ogólny czat** wszystkich online (bez historii).
- **Zaproś** przy graczu na liście: jeśli nie masz pokoju, gra sama go zakłada i wysyła zaproszenie.
  Nieaktywne przy kimś, kto gra. U zaproszonego dymek „X zaprasza cię do gry — Dołącz / Odrzuć” z dźwiękiem,
  wygasa po ok. minucie; zapraszający widzi odmowę albo wygaśnięcie. Kod pokoju zostaje jako druga droga.
- **Ranking:** tabela top 10 według punktów (opis niżej).
- Serwer niedostępny: menu pokazuje „łączenie…”, a gdy trwa to za długo, proponuje grę bez konta.
- Połączenie w menu trzyma maszynę Fly przy życiu — po ok. 15 minutach bezczynności rozłączamy.

### Ranking (zrobione)

Punkty jak w „Twoich partiach”; liczą się gry online i gry offline przeciw komputerowi skończone po zalogowaniu
(serwer odtwarza partię i liczy sam), bez gier dwóch osób przy jednym ekranie. Wyjście z gry online przed końcem
to przegrana. Kolejność: punkty, procent zwycięstw, kto wcześniej zdobył punkty; pod tabelą własne miejsce.

- Tabela **top 10** graczy według zdobytych **punktów**; w wierszu: nick, punkty, liczba rozegranych gier,
  procent zwycięstw.
- **Miejsca 1–3 wyróżnione:** tekst nieco większy i pogrubiony, w kolorze złotym / srebrnym / brązowym,
  przy nicku puchar w tym samym kolorze.

## 2. Figurki 3D zamiast portretów

**Cel:** na mapie świata i na arenie stoją trójwymiarowe figurki, które realistycznie
obracają się w kierunku ruchu.

### Ustalenia

- **Plansza zostaje płaska (2D), jak w Heroes 3.** Figurki rysuje three.js w przezroczystej
  warstwie nad planszą, z nieruchomą kamerą lekko pochyloną, żeby było widać ich przód.
- **Ruch:** płynny obrót w stronę celu i przesunięcie. Bez animacji szkieletowych.
- **Modele:** autor dostarcza po jednym GLB na jednostkę (15 sztuk), z kolorami i teksturami.
  Konwencja: podstawka w punkcie (0,0,0), oś Y w górę, przód figurki wzdłuż +Z, wspólna skala.
- **Odchudzanie:** `make modele` zamienia pełne modele z `docs/druk3d/**/*.glb` (np. `figurki/pegaz/pegaz.glb`) na wersje do gry
  w `public/modele/` (uproszczenie do 1% trójkątów + kompresja meshopt). Niedźwiedź:
  120 MB / 5 mln trójkątów → 525 KB / 39 tys. trójkątów, bez widocznej różnicy w rozmiarze
  figurki na planszy. Pełne modele do druku nie trafiają do gita (limit 100 MB na plik w GitHubie).
- Pasek Życia, pierścień aktywnej jednostki i znaczniki (Klątwa, zużyta zdolność) zostają
  jako nakładka 2D nad figurką.

- Portrety w panelach bocznych (lista jednostek, kolejka ruchów) zostają.

### Do ustalenia

- Kąt kamery i wielkość figurki względem pola — do dobrania na żywo, gdy będą 2–3 modele.

## 3. Szczegóły pod prawym przyciskiem (jak w Heroesach) — zrobione

**Cel:** przytrzymanie prawego przycisku na czymś w grze pokazuje okienko ze szczegółami; puszczenie
przycisku je chowa.

- **Co pokazuje:** pole mapy (teren, koszt ruchu, co na nim leży), bohatera na mapie, jednostkę na arenie
  z bieżącym stanem (Życie, Klątwa i inne efekty, zużyta zdolność), skarby i portrety.
- **Touchpad** (kliknięcie dwoma palcami nie da się przytrzymać): krótkie kliknięcie prawym zostawia
  okienko otwarte do następnego kliknięcia. **Telefon:** przytrzymanie palca.
- Menu kontekstowe przeglądarki nie otwiera się nigdy (prawy przycisk należy do gry); kopiowanie w polach tekstowych działa skrótami Ctrl+C / Ctrl+V.
- Obecne podglądy kart po najechaniu myszą — do przejrzenia; docelowo prawy przycisk może je zastąpić tam,
  gdzie zasłaniają planszę.

## 4. Do przemyślenia: zasady bitwy

Pytania autora — jeszcze bez decyzji. Zmiana zasad (1 i 2) dotyczy też wersji papierowej: instrukcji,
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

### 4.3. Atak jednym kliknięciem z dojściem do wroga — zrobione

Wdrożone w wersji jak w Heroes III: strona wybierana kursorem, pole ataku podświetlone przed kliknięciem,
na telefonie dwa dotknięcia. Poniżej pierwotne pytanie i uwagi.

**Pytanie:** czy jednostka walcząca wręcz (lub latająca) ma móc zaatakować wroga w zasięgu ruchu jednym
kliknięciem (dojście + atak)? Wygodniej, ale trzeba rozwiązać, z której strony podejdzie.

**Dziś:** dwa kliknięcia — najpierw pole obok wroga, potem wróg (kursor mieczyka pokazuje cel dopiero, gdy
jednostka stoi obok).

**Uwagi (Claude):**
- To zmiana tylko interfejsu, nie zasad — wersja papierowa się nie zmienia.
- Wybór strony, jak w Heroes III: kursor mieczyka **zmienia kierunek** zależnie od tego, w którą część heksa
  wroga celuje mysz (sześć kierunków = sześć pól wokół wroga); podświetla się pole, z którego nastąpi atak.
  Pola nieosiągalne albo zajęte są pomijane.
- Prostszy wariant na start: kliknięcie wroga wybiera **najbliższe osiągalne** pole obok niego (przy remisie
  to, które wymaga najkrótszej drogi), a pole jest podświetlone przed kliknięciem — kto chce innej strony,
  robi to jak dziś, dwoma kliknięciami.
- Pułapki: strona ma znaczenie przy Szarży Światła (liczy się przebyta odległość), Ognistym Oddechu
  (drugi cel za pierwszym), Miażdżącym Głazie (odpychanie) i przy zasłanianiu sojuszników — tam wybór strony
  powinien być widoczny przed kliknięciem.
- Na telefonie „celowanie w część heksa” jest niewygodne — tam lepiej pierwsze dotknięcie pokazuje pole
  ataku, drugie potwierdza.

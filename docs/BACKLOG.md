# Backlog

Uzgodnione pomysły do wdrożenia. Tryb online z menu „najpierw online” i rankingiem oraz szczegóły pod prawym
przyciskiem są zrobione; figurki 3D też. Dalej, po kolei: porządki w kodzie (punkt 5),
wersja mobilna (6), zgłoszenie z 23.10 (7), nowe zgłoszenia (8).

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

## 2. Figurki 3D zamiast portretów — zrobione

**Cel:** na mapie świata i na arenie stoją trójwymiarowe figurki, które realistycznie
obracają się w kierunku ruchu; obracająca się figurka bohatera także obok jego karty w menu.

### Jak jest zrobione

- **Plansza zostaje płaska (2D), jak w Heroes 3.** Figurki rysuje three.js na jednym przezroczystym płótnie
  nad planszą (`src/ui/FigureLayer.tsx`), kamerą ortograficzną pochyloną o 35° (widać przód figurki).
  three.js ładuje się dopiero przy pierwszej figurce (osobny plik, ok. 190 KB po kompresji).
- **Ruch:** figurka płynie za pozycją żetonu i obraca się w kierunku ruchu; przy ataku wręcz odwraca się
  do celu i robi wypad, przy strzale odwraca się do celu, przy trafieniu drży. Pierścień wokół podstawki:
  kolor strony, niebieski — aktywna jednostka, czerwony — cel ataku. Pasek Życia i znaczniki zostają w 2D.
- **Skala:** wszystkie figurki mają podstawkę tej samej wielkości (jak wydruki na wspólnej podstawce),
  wysokość wynika z modelu.
- **Modele:** `make modele` robi z `docs/druk3d/figurki/z_teksturami/<frakcja>/<nazwa>/<nazwa>.glb`
  pliki `public/modele/<jednostka>.glb` (2% wierzchołków, tekstury 1024 px WebP, kompresja meshopt):
  ok. 1–1,5 MB zamiast 120–200 MB. Mapowanie nazw → jednostek jest w Makefile (`FIGURES`), lista jednostek
  z modelem w `src/ui/figures.ts`. Galeria `?figury` pokazuje każdą figurkę z czterech stron (przód = pierwsza).
- **Menu:** obracająca się figurka nad kartą bohatera na ekranie ustawień.
- **Opcje:** „Figurki 3D na planszy” — na słabszym sprzęcie można wrócić do portretów; bez WebGL portrety
  zostają same. Jednostki bez modelu też mają portret.

### Do zrobienia

- **Goblin Szaman** waży 6,4 MB: jego model ma osobne wierzchołki dla prawie każdego trójkąta, więc upraszczanie
  stopuje na ok. 170 tys. trójkątów. Lepiej byłoby wyeksportować go ze scalonymi wierzchołkami.
- Kąt kamery i wielkość figurek — do ewentualnej korekty po obejrzeniu na żywo.

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

## 5. Analiza i uporządkowanie kodu

**Cel:** po wielu iteracjach przejrzeć kod gry i serwera i posprzątać to, co utrudnia czytanie albo spowalnia
grę. Bez zmian w zasadach i wyglądzie, poza poprawkami błędów wymienionymi niżej.

**Analiza zrobiona 23.10** (trzech agentów: interfejs, silnik ze skryptami, serwer; każde ustalenie sprawdzone
w kodzie). Plan zaakceptowany; decyzje:
- Zmiany lekko zmieniające zachowanie wchodzą wszystkie (podgląd obrażeń, ocena obrońcy wspólnej bazy przez bota,
  `make sim` bez kości) — każda poprawia błąd.
- Testy bitew w UI: 12 partii zamiast 36 (każdy bohater ze zdolnościami i bez), pełny przegląd w `make test-slow`.
- Kolejność: etapy 0–1 od razu, potem 2, 3, 4. Każdy krok osobnym commitem z testami. Serwer wdrażany na bieżąco
  (bot serwera korzysta z pakietu silnika, więc zmiany zachowania bota trafiają online dopiero z nową wersją
  pakietu); zmiany w grze zbierane w wydanie 2.0.2.

### Etap 0: siatka bezpieczeństwa

- [ ] **Test „złotych” partii:** boty rozgrywają po kilka ziaren w każdym wariancie (kooperacja, rywalizacja,
  arena, bitwy na planszy i na arenie, z kością, poziomy łatwy/trudny), test zapisuje skrót stanu końcowego
  i listy ruchów. Każda późniejsza zmiana musi dać ten sam wynik (poza świadomymi poprawkami, wtedy aktualizacja
  wzorca osobnym commitem). Dziś `engine.test.ts:179-190` porównuje tylko dwa przebiegi tego samego kodu.
- Uwaga: decyzje AI i silnika zależą od kolejności wstawiania `state.heroes`, `state.items`, `b.units`,
  a id skarbów to `it${liczba+1}` — refaktor musi zachować kolejność tworzenia i wzór id.

### Etap 1: błędy

**Serwer** (`straznicy-krysztalowego-drzewa-backend`):
- [x] Wyjątek w timerze pokoju (ruch bota, czekanie na gracza, pusty pokój, zaproszenie) wyłącza proces,
  a po restarcie ten sam ruch bota wyłącza go znowu. `guard(fn)` dla timerów, błąd do logu i do graczy.
- [x] Bot bez ruchu (`chooseAction` zwraca null) zamraża partię bez śladu — log i komunikat.
- [x] Brak pingu WebSocket: telefon, który zgubi zasięg w swojej turze, zamraża partię na zawsze.
  `socket.ping()` co ~30 s, `terminate()` bez odpowiedzi (protokół bez zmian).
- [x] `maxPayload` 100 MB i akcje zapisywane tak, jak przyszły → limit 64 KB, zapis znormalizowanej akcji,
  sprawdzenie `action.type`; nie logować całej wiadomości klienta; błędy silnika jako stały polski komunikat.
- [x] Token sesji w logach Fly (`/ws?token=…`) → serializer żądań bez query stringa.
- [x] Pokój bez właściciela (ostatni wyszedł, ktoś dołącza) — dołączający zostaje właścicielem.
- [x] Zaproszenie zamykane jako „przyjęte” przed udanym dołączeniem; zaproszenia nie znikają, gdy zapraszający
  wyjdzie lub się rozłączy.
- [x] Restart przywraca do pokoju graczy, którzy wyszli (i kasuje im przegraną); gracz w dwóch pokojach
  przywracany losowo.
- [x] Zamykanie serwera: zdarzenia `close` gniazd zmieniają pokoje po zamknięciu bazy → flaga `closing`.
- [x] Wiadomości JSON niebędące obiektem logowane jako błąd serwera → ignorować.
- [x] Drobne: akcja zapisana przed statusem `over` (bez transakcji), czat pokoju bez limitu, limit czatu ogólnego
  resetuje się przy ponownym połączeniu, „Ta partia już trwa” przy zakończonej, nienumeryczny `PORT`,
  limit długości `actions` przy odtwarzaniu gry offline do rankingu.

**Gra:**
- [x] Animacje bitwy zacinają się przy szybkich botach (`BattleView.tsx:133-188`: sprzątanie co zmianę `b` kasuje
  timer usuwający `strikes`/`floaters`/`ghosts`; figurka przestaje robić wypad). Timery w refie, czyszczone przy
  odmontowaniu.
- [x] `FigurePreview`: przy szybkim przełączaniu bohaterów dwie pętle rysują na jednym płótnie; nowy renderer
  przy każdym najechaniu.
- [x] Druga partia w sesji: fałszywe „Znaleziono skarb!” (`knownItems`, `seenLog` w App nie są zerowane).
- [x] Baner „łączę ponownie…” wisi, gdy po kodach 4401/4000/4002 nie ma ponownego łączenia → flaga `reconnecting`.
- [ ] Podgląd obrażeń różni się od silnika (UI liczy Kamień Ochrony przed Twardogłowym) → wspólne
  `predictDamage` w `battle.ts`, helper `bearCanGuard`.
- [ ] Bot bitewny na chwilę zmienia `u.pos` w stanie wyświetlanym przez ekran (`battleAi.ts:117-120`) → parametr
  `from` w `breathSecondTarget`.
- [ ] Bot źle ocenia obrońcę wspólnej bazy (bierze pierwszego, silnik bierze najsilniejszego; `adventureAi.ts:54-58`).
- [ ] `make sim` domyślnie z kością obrażeń (`scripts/simulate.ts:19`) → bez kości, wspólne `setupFor` z `sim/core.ts`.
- [ ] Drobne: WebGL nie zwalnia zasobów (pierścienie, tekstura pokoju, `forceContextLoss`), `walkTimers` rośnie,
  listener `pointerup` w details nie jest usuwany, `JSON.parse` w `api.ts` bez try/catch, timery powiadomień po
  `close()`, Esc nie zamyka części okien, `describeSave` nazywa arenę „Rywalizacja”, `sim-tabele` pada na czystym
  checkoutcie, statystyki symulacji (`neutralWipeRate`, stare przyczyny końca gry).

### Etap 2: wydajność (wyniki identyczne — pilnuje test z etapu 0)

- [ ] Silnik: `shortestPaths` z kopcem binarnym i mapą rodziców (63% czasu symulacji), memoizacja ścieżek
  w jednej decyzji bota (`treeCostFrom`, `pathsFor`), `dangerCost`/`heldByAlly` liczone raz na decyzję,
  `applyActionInPlace` dla symulacji, raportów i serwera (kopiowanie stanu to 28% czasu), stałe `ARENA_CELLS`,
  zbiór przeszkód i mapa zajętości w bitwie. Cel: symulacje 2–3× szybciej.
- [ ] Gra: ekran ustawień odtwarza zapisaną partię dwa razy przy każdym renderze; każdy ruch przepisuje cały
  dziennik partii w localStorage; `FigureLayer` rysuje klatkę przy każdym najechaniu; `legalHeroMoves` na każde
  pole mapy; kursory i podejścia w bitwie liczone 3–5 razy na jednostkę; statyczna siatka areny budowana co render;
  `figureFor` czyta localStorage w renderze; Modal renderuje się podwójnie; przewijanie bitwy po każdej zmianie Życia.
- [x] Serwer: lista graczy online wysyłana wszystkim po każdej wiadomości (wysyłać tylko przy zmianie, jeden
  `Intl.Collator`), serializacja raz na rozgłoszenie, zapytania SQL przygotowane raz, kasowanie wygasłych sesji,
  zapis pokoju przy połączeniu tylko przy zmianie.

### Etap 3: czytelność

- [ ] Martwy kod i nieaktualne komentarze („arena 9×11”, „pointy-top”, `ritualHold` „DO USTALENIA”,
  `armedAbility`, nieużywane eksporty i przełączniki zasad — pola zasad zostają opcjonalne przy odczycie zapisów).
- [ ] Nazwane stałe: tabela `ITEM_EFFECT` (efekty skarbów w silniku, AI i opisach), `SUPPORTS_PER_BATTLE = 2`
  (6 miejsc), `AI_TUNING`, próg Twardogłowego.
- [ ] Powtórzony kod: opis pola mapy (3 razy w `AdventureView`), ustawienia stołu lokalnie i online
  (`setupShared.tsx`), dwa hooki stanu online, zapis autozapisu w zgłoszeniu błędu, wspólna „ramka” App (baner
  błędu, muzyka, zasady), `walkCost` w AI (4 kopie), `grantItem`, `log`, `livingHeroes`, czytelne tabele punktacji;
  na serwerze `parseChatText`, `requestUser`, domyślne pola pokoju przy wczytaniu, `rowToRoom`.
- [x] Protokół: jedna pełna definicja typów wiadomości klient/serwer (`protocol.ts`).
- [ ] Testy: wspólne helpery (`battleFixture`, `setup`, `playOut`, `clearDialogs`; na serwerze `useServer`,
  `roomWith`), fake timers zamiast sleepów, `make test-engine`/`make test-ui` uruchamiają wszystkie swoje testy,
  12 partii bitew + `make test-slow`.

### Etap 4: większe podziały

- [ ] `App.tsx` (1010 linii): `useLocalGame`, `useBotTimer`, `useStepWalker`, `useOnlineGame`, `useShortcuts`,
  `musicTheme()`, osobne okna dialogowe.
- [ ] `BattleView.tsx` (1017 linii): `useBattleAnimations`, `useDeployment`, `ArenaBoard`, `ActivationBar`,
  `ItemsPanel`, `SidePanel`, `battleStatus.tsx`, `activationHint()`.
- [ ] Hub serwera: `Connections`, `RoomDirectory`, `Presence`, `Lounge`, `Invitations`; widok pokoju wysyłany raz
  na zmianę (najpierw sprawdzić, czy klient zależy od kolejności `room`/`game`).
- [ ] Najdłuższe funkcje: `goodAction` (kroki jako osobne funkcje, kolejność bez zmian), `battleItem` (tablica
  obsługi), `finalizeBattle`, `createGame`.

Serwer: etapy 1–4 zrobione i wdrożone 28.10 (60 testów; protokół dla gry bez zmian; „Protokół” zrobiony po stronie serwera).

**Do decyzji autora (z prac nad serwerem):**
- [ ] **Ranking da się oszukać:** `levelOf` nie sprawdza części zasad (`heroMovePoints`, rytuał, `hordeStartTreasures`,
  `battleRoundLimit`…), więc spreparowana gra wysłana do `/results` może dostać punkty jak za „Trudny” (do 30 pkt),
  a serwer nie wie, czy ludzkie miejsca nie grał bot (skrypt może wysyłać do 60 wygranych na godzinę). Możliwa
  poprawka: dla poziomów gotowych serwer sam buduje ustawienia i odtwarza partię; dla własnych — sprawdza pole po polu.
- [ ] Wiadomość `game` nadal zawiera wpisy dziennika `privateTo` (ukryte tylko w kliencie).
- Uwaga przy wydaniach: serwer odrzuca nieznane typy akcji, więc wydanie gry z nowym typem akcji wymaga najpierw
  wdrożenia serwera z nowym pakietem silnika. Tokeny zapisane w logach Fly przed 28.10 wygasną z logami.

Do osobnego sprawdzenia: czy spreparowany `setup` wysłany do `/results` może dać zawyżone punkty (`levelOf`);
wiadomość `game` zawiera cały dziennik z wpisami `privateTo` (filtrowane tylko w kliencie).

## 6. Wersja mobilna

**Cel:** gra wygodna na telefonie, także na dużych mapach — tyle, ile się da zmieścić.

- [x] Przegląd wszystkich ekranów na wąskim i niskim ekranie (pion i poziom): mapa świata, arena, panele
  bohaterów, pasek akcji, okna dialogowe, menu online.
- [x] Duże mapy: przewijanie/przybliżanie mapy, panele zwijane albo wysuwane, żeby plansza miała jak najwięcej
  miejsca.
- [x] Opis pola na mapie świata (tooltip) zasłania dużą część ekranu — mniejszy, przy krawędzi ekranu albo
  zwijany, nie nad planszą.

## 7. Zgłoszenie z 23.10 (`bug-reports/2026-10-23-20-10-31-ziarno-615040.json`)

- [x] Figurki na arenie i na mapie świata większe, nawet jeśli częściowo wchodzą na sąsiednie heksy
  (`docs/nachodzace_heksy.png`).
- [x] Zamiast jednolitych pierścieni wokół figurek — delikatna aura z gradientem, mniej nachalna.
- [x] Arena Hordy: przeszkody terenowe nie mają innego koloru obramowania heksa.
- [x] Usunąć przycisk „zasięg wrogów” (chyba nie działa). Zamiast niego: wciśnięty Ctrl z kursorem na jednostce
  pokazuje jej zasięg.
- [x] Strzelec z wrogiem obok: kursor strzały zamiast miecza nad tym wrogiem (i tak strzela).

## 8. Nowe zgłoszenia (na końcu, po punktach 5–7)

- [x] `make zgloszenia` (28.10): 2 nowe zgłoszenia z serwera, obie z gry online ORK-3769
  (`bug-reports/2026-10-23-20-38-45-serwer-3.json`, `…-2026-10-25-14-31-26-serwer-4.json`); lokalnie w `bug-reports/`
  nie ma innych nieprzeanalizowanych plików, `tester-reports/` jest puste.
- [x] **#3, telefon 375×794:** tor rund zasłaniał pola mapy, nie dało się ich kliknąć. Naprawione w punkcie 6
  (na telefonie tor rund jest ukryty, runda jest na dolnym pasku).
- [ ] **#4, do decyzji:** „walka z cyklopem zabrała mi wszystkie punkty ruchu, a powinna zabrać tylko jeden”.
  Gra działa według obecnych zasad: każda bitwa kończy ruch bohatera w tej turze (silnik: `turnBattleDone`,
  `movePoints = 0`). Instrukcja mówi to wprost dla bitwy z wrogim bohaterem (rozdz. 7), ale przy strażniku
  („Strażnik — wejście na jego pole to wyzwanie do walki”) już nie. Możliwości:
  1. zostawić zasadę i dopisać ją w instrukcji przy strażniku (oraz w podpowiedzi na mapie: „walka zakończy ruch”);
  2. walka ze strażnikiem kosztuje 1 punkt ruchu, a po wygranej bohater idzie dalej — zmiana zasad także
     w wersji papierowej, do sprawdzenia symulacjami (przyspiesza zbieranie kryształów, więc kooperacja będzie łatwiejsza).

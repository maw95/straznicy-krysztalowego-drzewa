# Backlog

Uzgodnione pomysły do wdrożenia. Najpierw tryb online (teraz: menu „najpierw online” i ranking),
potem figurki 3D; szczegóły pod prawym przyciskiem — po menu online.

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

### Menu „najpierw online” (następny krok)

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

### Ranking

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
- **Odchudzanie:** `make modele` zamienia pełne modele z `docs/druk3d/*.glb` na wersje do gry
  w `public/modele/` (uproszczenie do 1% trójkątów + kompresja meshopt). Niedźwiedź:
  120 MB / 5 mln trójkątów → 525 KB / 39 tys. trójkątów, bez widocznej różnicy w rozmiarze
  figurki na planszy. Pełne modele do druku nie trafiają do gita (limit 100 MB na plik w GitHubie).
- Pasek Życia, pierścień aktywnej jednostki i znaczniki (Klątwa, zużyta zdolność) zostają
  jako nakładka 2D nad figurką.

- Portrety w panelach bocznych (lista jednostek, kolejka ruchów) zostają.

### Do ustalenia

- Kąt kamery i wielkość figurki względem pola — do dobrania na żywo, gdy będą 2–3 modele.

## 3. Szczegóły pod prawym przyciskiem (jak w Heroesach)

**Cel:** przytrzymanie prawego przycisku na czymś w grze pokazuje okienko ze szczegółami; puszczenie
przycisku je chowa.

- **Co pokazuje:** pole mapy (teren, koszt ruchu, co na nim leży), bohatera na mapie, jednostkę na arenie
  z bieżącym stanem (Życie, Klątwa i inne efekty, zużyta zdolność), skarby i portrety.
- **Touchpad** (kliknięcie dwoma palcami nie da się przytrzymać): krótkie kliknięcie prawym zostawia
  okienko otwarte do następnego kliknięcia. **Telefon:** przytrzymanie palca.
- Menu kontekstowe przeglądarki wyłączone tylko na planszy i kartach (np. tekst z czatu da się dalej kopiować).
- Obecne podglądy kart po najechaniu myszą — do przejrzenia; docelowo prawy przycisk może je zastąpić tam,
  gdzie zasłaniają planszę.

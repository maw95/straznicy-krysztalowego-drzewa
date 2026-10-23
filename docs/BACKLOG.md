# Backlog

Uzgodnione pomysły do wdrożenia. Najpierw tryb online, potem figurki 3D.

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
- **Rozłączenie:** czekamy 2 minuty na powrót gracza, potem jego rolę przejmuje bot.
  Gracz, który wróci później, odzyskuje miejsce od bota.
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

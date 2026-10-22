# Historia zmian

Co się zmieniało w kolejnych wersjach gry. Wersja to tag w repozytorium (np. `1.1.0`) i pole `version` w `package.json`; numer widać w menu głównym, a kliknięcie go otwiera tę historię w grze.

Każdy wpis to jeden commit, a skrót commita stoi w nawiasie na końcu wpisu (commit nie zna własnego skrótu, więc dopisuję go w następnym commicie albo przy tagowaniu). Zmiany, które nie trafiły jeszcze do żadnej wersji, są w sekcji „W przygotowaniu”. Nagłówek wersji ma postać `## numer — RRRR-MM-DD`, bo gra czyta ten plik.

## W przygotowaniu

- Narzędzia: przebudowa instrukcji (`scripts/assets/manual.py`) nadpisuje pliki zamiast kasować folder, przez co działający serwer deweloperski pokazywał w zakładce „Instrukcja” menu gry zamiast instrukcji (`9b73c58`).
- Notatki projektowe: zasady nowego trybu Arena (`d8f75e1`).
- Arena, część 1: zasady w silniku gry (wybór pomocników, losowanie skarbów A, B, B, A ze wspólnej talii, jedna bitwa) i bot na trzech poziomach; ekrany jeszcze w budowie (`4cbdc11`).
- Narzędzia: symulacje balansu Areny (`scripts/sim/arena.ts`): każdy skład Przymierza przeciw każdemu składowi Hordy (`d227c4b`).
- Arena, część 2: tryb „Arena (jedna bitwa)” w menu — przeciw komputerowi (Łatwy / Normalny / Trudny) albo drugiemu graczowi; ekran przed walką, losowanie skarbów (przy dwóch graczach zakryte, dopóki strona ich nie odsłoni), ekran końca; w „Twoich partiach” osobny wiersz Areny i 1 / 2 / 3 pkt za wygraną z komputerem.

## 1.2.0 — 2026-10-22

- Historia zmian w repozytorium: lista commitów w każdej wersji (`1667367`).
- Instrukcja, rozdział 13: tabele trudności tylko dla poziomów Łatwy, Normalny i Trudny; w rywalizacji osobne kolumny Przymierza i Hordy w kolorach frakcji (`1cb09f8`).
- Menu: remis inicjatywy jest teraz ustawieniem Własnego poziomu (domyślnie obrońca pierwszy), samouczek stoi nad zasadami testowymi (`14d9a91`).
- Menu, „Twoje partie”: procent wygranych, punkty za wygrane (długość mapy × zmierzona trudność, najwyżej 30) i okienko „Dokładne dane” z tabelą według trybu, mapy i poziomu. Nieukończone partie się nie liczą (`0047738`).
- Wprowadzenie przy pierwszym uruchomieniu: pokaz slajdów z opowieścią i podstawowymi zasadami (grafiki w przygotowaniu); przycisk „Wprowadzenie” w menu pokazuje je ponownie (`eca6c54`).
- Poprawiona podpowiedź w menu o liczbie bohaterów automatu zła (`c237c05`).
- Kooperacja na poziomach Łatwym i Normalnym: automat zaczyna z tyloma bohaterami Hordy, ilu jest graczy, a gdy polegną wszyscy, w bazie Hordy pojawia się kolejny. Poziom Trudny bez zmian (`a46d086`).
- Instrukcja i punkty uwzględniają posiłki Hordy: rozdziały 4, 12 i 13, nowe oceny trudności kooperacji (`d621403`).
- Notatki projektowe: wyniki symulacji posiłków Hordy zaakceptowane (`19b98db`).
- Historia zmian w grze: kliknięcie numeru wersji w menu głównym otwiera okienko z wersjami, datami i zmianami; ten plik prowadzony po polsku (`54c7e38`).
- Wprowadzenie z prawdziwymi ilustracjami (9 slajdów, JPG zamiast PNG: 3,6 MB zamiast 24,6 MB) i łagodniejszy ruch kamery (`e5920d6`).
- Pełny ekran jak F11: przycisk w prawym górnym rogu (obok muzyki) i ustawienie „Pełny ekran przy uruchomieniu” — gra przechodzi na pełny ekran przy pierwszym kliknięciu albo klawiszu; Esc wraca do okna (`b54281e`).
- Ekran tytułowy przy każdym otwarciu gry: logo, hasło i przycisk START, który włącza pełny ekran i muzykę, a za pierwszym razem prowadzi do wprowadzenia (`cdfb484`).
- Ekran tytułowy wczytuje w tle muzykę menu i (przy pierwszym uruchomieniu) grafiki wprowadzenia, więc po kliknięciu START nic nie doczytuje się na oczach gracza (`9167c7a`).
- Poprawione grafiki: nowa okładka (tło menu i ekranu tytułowego, okładka instrukcji) i nowe ilustracje pięciu slajdów wprowadzenia (strażnicy, jak wygrać, wędrówka, bitwa, tryby gry) (`bb144e7`).
- Poprawka: zamknięcie dziennika zdarzeń wywracało grę („Błąd interfejsu: n is not a function”) w nowszych przeglądarkach opartych na Chrome, np. Operze; zgłosił Filip (`d3e3f39`).
- Narzędzia: analiza zgłoszeń (`make report`) czyta też pliki testerów z „INFO DLA TESTERÓW” i pokazuje ich uwagi (`b96531b`).
- Poprawka: liczba na kropli obrażeń w bitwie stoi teraz na środku kropli i nie wystaje poza nią (cyfry równej wysokości, mniejsza czcionka dla liczb dwucyfrowych) (`e6484e6`).

## 1.1.0 — 2026-10-22

- Balans: szybkości bez remisów (Przymierze parzyste, Horda nieparzyste), prostszy automat zła, poziomy Łatwy i Trudny, limity rund 8 / 12 / 18 / 24, skarby Przymierza na start na długich mapach, 6 Eliksirów Odrodzenia (`51f6d15`).
- Interfejs: numer wersji w menu, poziom Łatwy, tor rund z 24 gniazdami, animacja chodzenia jednostek na arenie (`36cd3ec`).
- Grafika: areny z przeszkodami dopasowanymi do pól (dwie zajmują po 2 pola), nowe znaczniki i tor rund, portret Zwoju Magicznej Strzały, arkusze figurek (`7911897`).
- Instrukcja 1.1: nowe zasady i poziomy, skarby automatu, figurki, tabele trudności (`bd6f9bf`).
- Zgłoszenia błędów od testerów z 21 października 2026 (`9b41cce`).

## 1.0.0 — 2026-10-21

- Pierwsza wersja cyfrowego prototypu: silnik zasad, boty, gra na jednym urządzeniu, mapa przygody i bitwy na arenie (`5f86ad0`).
- Usprawnienia interfejsu: animacje bitew, odkrywanie skarbów, wygląd kart (`cddb9b0`).
- Wiele zmian w zasadach, interfejsie i grafice, zapis gry, samouczek (`3d3c4bb`).
- Gra dostępna w przeglądarce przez GitHub Pages (`84b5a7d`).
- Poprawka konfiguracji publikacji (`0b4120e`).
- Wersja 1.0: muzyka, informacje dla testerów i dziennik partii, znaczniki w bitwie (`d3e25d9`).

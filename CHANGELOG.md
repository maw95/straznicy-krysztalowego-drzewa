# Historia zmian

Co się zmieniało w kolejnych wersjach gry. Wersja to tag w repozytorium (np. `1.1.0`) i pole `version` w `package.json`; numer widać w menu głównym, a kliknięcie go otwiera tę historię w grze.

Każdy wpis to jeden commit, a skrót commita stoi w nawiasie na końcu wpisu (commit nie zna własnego skrótu, więc dopisuję go w następnym commicie albo przy tagowaniu). Zmiany, które nie trafiły jeszcze do żadnej wersji, są w sekcji „W przygotowaniu”. Nagłówek wersji ma postać `## numer — RRRR-MM-DD`, bo gra czyta ten plik.

## W przygotowaniu

- Instrukcja, rozdział 17: wariant „na szybko” podaje farby w kolorze frakcji (zieleń, bordo, granat) i ten sam kolor na podstawkę; wariant „porządniej” ma pełną paletę z nazwami farb na wszystkie 15 figurek, cienie i wskazówki mieszania; z nagłówka zniknęła uwaga o drukarce.
- Plan wersji planszowej: lżejsze pudełko — sklejka topolowa 3 mm (dno 4 mm), listewki 10 × 10 w narożnikach, wyjmowana półka nad figurkami, figurki w piance EVA 10 mm z otworami Ø 35 mm (sześciokątna podstawka 30 mm ma 34,6 mm między rogami, więc otwornica 30 mm nie wystarczy), orientacyjna waga i lista cięcia.
- Instrukcja (poprawki): okładka nie jest liczona do numeracji stron; „Przymierze Świtu” na stronie opowieści ma zielony nagłówek; nazwa gry i rozdziału w stopce nie są już „przekreślone” linią ramki; liczby przy znacznikach („× 6”) zawsze stoją w osobnej linii; punkt „Skarby i strażnicy” w przygotowaniu ma numer 4 (kolejne przesunięte); bazy Przymierza i Hordy mają przezroczyste tło; obrazki aren pokazują aktualny układ przeszkód i obwódki; strona „Słowo na drogę” bez linijek „Drogi / Droga” i „Autor gry”; nowy rozdział 17 „Malowanie figurek” (malowanie na szybko drybrushem albo porządniej, techniki, sprzęt i farby) na jednej stronie; na gęstych stronach więcej zapasu, żeby tekst nie wychodził poza ramkę.
- Menu główne: w panelu po prawej karta jednostki jest teraz na górze, a pod nią większa figurka 3D.
- Wersja do druku: `make druk` robi gotowe PDF-y na drukarkę domową (A4, 300 DPI) — instrukcję, karty jednostek i skarbów z rewersami, 121 kafelków mapy z rewersami, dwustronną planszę areny na 4 arkuszach, naklejki na znaczniki z drukarki 3D, kość i tor rund, okładkę, logo i etykiety na pudełko i grzbiet segregatora.
- Instrukcja: nowa strona „Rady na pierwsze wyprawy” (wskazówki dla Przymierza, Hordy i na arenę); karty jednostek mają w wersji do druku 8 × 11,2 cm — tak jak karty w grze.
- Instrukcja ma 40 stron: na drugiej stronie miejsce na wiadomość od autora, „Zasady w obrazkach” (cała gra w ośmiu obrazkach na pierwszą partię), przykład tury na mapie i przykład początku bitwy krok po kroku. Przygotowanie mówi, jak rozłożyć karty skarbów (stos skarbów mapy i talia skarbów), a rozdział 7 nie twierdzi już, że bitwa kończy ruch.
- Wersja do druku: wszystko, co potrzebne do papierowej wersji gry (wymiary, figurki do druku 3D, instrukcja do edycji), jest teraz w jednym folderze `docs/wersja_planszowa/`.
- Punkty za partię z ustawieniem „pojedynki na planszy”: od kiedy Złoty Smok używa w pojedynku Słonecznego Blasku, to ustawienie wyraźnie ułatwia grę Przymierzu, więc wygrana Przymierza daje mniej punktów, a wygrana Hordy w rywalizacji więcej. Instrukcja (rozdział 13) mówi, komu pojedynki sprzyjają.
- Instrukcja: karty strażników do pojedynku (błękitny rewers) — w liście elementów (18 kart jednostek), przy strażnikach (z obrazkami kart), w zasadach pojedynku i w ściągawce.
- Karty strażników do pojedynku są w grze: w pojedynku strażnik pokazuje swoją kartę pojedynkową (błękitna obwódka, napis „Pojedynek”), a wszystkie trzy są w „Zasadach i kartach → Jednostki”. Zwykła karta strażnika nie ma już liczby Życia w nawiasie.
- **Zmiana zasad:** w pojedynku na planszy strażnik walczy osobną kartą: Cyklop ma Kamienną Skórę (każdy cios w niego o 1 mniej, 14 Życia), Gryf Złodziejski Szpon (gdy zrani, odzyskuje 1 Życie, 10 Życia), a Hydra Odrastające Głowy (na początku swojej aktywacji odzyskuje 2 Życia, 12 Życia). Bot Przymierza w pojedynku używa Słonecznego Blasku.
- Figurki 3D: wszystkie 15 z nowych modeli autora (także Pegaz, Pająk Jaskiniowy, Hydra i Król Jednorożców), każda poniżej 2,5 MB. W instrukcji każda frakcja ma swoją stronę: większe figurki bohaterów, pod nimi mniejsze figurki pomocników.
- Figurki 3D obracają się wolniej, a ruch ma dwie fazy: najpierw obrót w miejscu, potem przesunięcie (tak samo przed atakiem: obrót do celu, potem cios).
- Areny: przeszkody nie wchodzą już na sąsiednie pola (podwójne są obrócone wzdłuż swoich dwóch pól), a ich obwódka jest ciemnożółta na obu arenach.
- Figurki 3D nie mają już kolorowej poświaty — tylko aktywna figurka ma cienką żółtą obwódkę wokół podstawki.
- Instrukcja, rozdział 1: krople obrażeń są dwustronne (6 × „1” / „2”, 10 × „3” / „5”), a znaczników Żywotności i Ochrony jest po jednym — tyle, ile naprawdę może być potrzebne w jednej bitwie. Róg Odwagi oznacza się dwoma znacznikami Wzmocnienia Ataku.
- Instrukcja: figurki są pokazane jako rzuty modeli 3D z gry, każda podpisana, a strażnicy na osobnej stronie. Narzędzia: `make figurki` robi te rzuty od nowa.
- Figurki 3D: nowe, dokładniejsze modele 11 jednostek (Goblin Szaman jest przy tym kilka razy lżejszy); Cyklop, Gryf, Hydra i Władca Wilkołaków mają figurki także w wersji z GitHuba.
- Bitwa: Złoty Smok po Słonecznym Blasku ma własny znacznik „+3 Ataku” (znika po jego ataku), Eliksir Żywotności ma nowy znacznik „+4”, a pasek aktywacji pokazuje znaczniki aktywnej jednostki. Oba znaczniki są też w instrukcji.
- Instrukcja, rozdział 1: lista elementów z pudełka ma rozmiary (kafelki, plansza, karty, figurki, kryształy, tor rund) i nowy znacznik „+3 Ataku” Złotego Smoka.
- Wersja do druku: wymiary znaczników (Ø 23 mm), kropli obrażeń, toru rund, znacznika rundy i kryształów są już ostateczne — wszystkie te elementy będą drukowane w 3D.
- **Zmiana zasad:** bitwa nie kończy już ruchu. Wejście na pole wrogiego bohatera albo strażnika kosztuje tyle punktów ruchu, ile koszt terenu tego pola (jak każdy krok), a po wygranej bohater może iść dalej. Zasada jest też w instrukcji i w „Zasadach i kartach”.
- Figurki 3D: na mapie i na arenie bohaterowie i pomocnicy stoją jako trójwymiarowe figurki — obracają się w stronę ruchu, odwracają do celu przy ataku, a pierścień wokół podstawki pokazuje stronę, aktywną jednostkę i cel. W menu obok karty bohatera obraca się jego figurka. Na słabszym sprzęcie figurki można wyłączyć w Opcjach. Mają je wszystkie jednostki, także strażnicy kryształów — na mapie stoją przy pilnowanym krysztale.
- Nowe portrety Hydry i wszystkich jednostek Mrocznej Hordy — na kartach, w kolejce bitwy, w oknie szczegółów i przy wyborze bohatera, a także w instrukcji.
- Telefon, mapa świata: mapa zajmuje całą ramkę (runda jest na dolnym pasku), można ją przybliżać i oddalać przyciskami +/− albo dwoma palcami, a na początku tury mapa sama przewija się do aktywnego bohatera.
- Opis pola na mapie nie zasłania już planszy: myszką pojawia się po chwili jako mała notka obok pola, a na ekranie dotykowym dotknięte pole jest opisane w jednym pasku na dole mapy.
- Telefon trzymany poziomo: okna (zasady, opcje, dziennik) mają mniejsze marginesy, więc mieści się w nich więcej.
- Telefon trzymany poziomo: mapa albo arena z lewej, panel z prawej, wszystko na jednym ekranie. Na arenie telefon pokazuje same pola (bez szerokiej malowanej ramki), więc heksy są większe; ostatni atak jest opisany na dole areny, a nie pod tytułem bitwy.
- Boty lepiej oceniają atak na pole z kilkoma bohaterami: liczą się z obrońcą o największym Życiu, tak jak gra.
- Silnik gry działa kilka razy szybciej (symulacje ok. 8×), a wynik każdej partii jest identyczny — pilnuje tego nowy test „złotych” partii.
- Narzędzia: `make zrzut` robi mały zrzut ekranu gry w przeglądarce bez okna (desktop, telefon pionowo i poziomo, cały ekran albo jeden element).
- Narzędzia: `make sim` domyślnie bez kości obrażeń (opcja `dice`), `make sim-tabele` działa na czystym repo, nowe `make test-slow`, a `make test-engine` i `make test-ui` uruchamiają wszystkie swoje testy.
- Podgląd obrażeń nad wrogiem liczy dokładnie tak jak gra (np. Ogr z Kamieniem Ochrony: Twardogłowy działa przed Kamieniem, więc cios za 2 pokazuje −0), a gdy cios przyjmie Opiekun Gaju, podgląd to mówi.
- Zapis partii w trybie Arena jest w menu opisany jako „Arena”, a nie „Rywalizacja”.
- Esc zamyka każde okno (także czat, „Dla testerów”, „Od Twojej ostatniej tury” i znaleziony skarb), a skróty literowe nie działają, gdy jakieś okno jest otwarte.
- Figurki na mapie i na arenie są większe (mogą lekko wchodzić na sąsiednie pola), a zamiast jednolitych pierścieni otacza je delikatna, rozmyta poświata w kolorze strony.
- Bitwa: przycisk „Zasięg wrogów” zastępuje Ctrl — przytrzymany nad dowolną jednostką pokazuje, dokąd może dojść (niebieskie pola) i kogo dosięgnie (czerwone).
- Figurka obok karty bohatera w menu nie miga już przy szybkim przełączaniu bohaterów, a menu nie tworzy przy tym coraz to nowych płócien 3D.
- Bitwa przy szybkich botach: animacje ataków już się nie zacinają — figurka robi wypad przy każdym ataku, a liczby obrażeń i ślady ciosów znikają jak trzeba. Na telefonie arena nie przewija się po każdym trafieniu, tylko gdy zmienia się aktywna jednostka.
- Druga partia w tej samej sesji nie pokazuje już na starcie fałszywego „Znaleziono skarb!”, a podsumowanie „Od Twojej ostatniej tury” nie miesza wpisów z poprzedniej partii.
- Gra online: napis „Utracono połączenie z serwerem — łączę ponownie…” pojawia się tylko wtedy, gdy gra naprawdę łączy się ponownie (a nie np. po wygaśnięciu sesji).
- Strzelec, który ma wroga tuż obok, widzi nad nim kursor strzały, a nie miecza — i tak strzela, a nie bije wręcz.
- Narzędzia: `make modele` robi lekkie figurki do gry z modeli do druku (ok. 1–1,5 MB zamiast 120–200 MB); galeria `?figury` pokazuje każdą z czterech stron.
- Narzędzia: testy interfejsu korzystają ze wspólnych pomocników (`tests/helpers/ui.ts`: przygotowanie jsdom, szukanie przycisków, zamykanie okien).
- Mapa świata: ślad drogi bohatera i odsłanianie pól liczone porządniej (bez zmian w wyglądzie).
- Narzędzia: powtarzające się rozmiary przycisków są klasami CSS (`btn-bar`, `chip`, `btn-dialog`…), wygląd bez zmian.
- Narzędzia: domyślni bohaterowie przy nowym stole są wspólni dla gry lokalnej i pokoju online (`defaultHeroes`).

## 2.0.1 — 2026-10-23

- „Zgłoś błąd” wysyła zgłoszenie prosto do twórcy gry, razem z partią — także z gry online. Opinie z „Dla testerów” wysyła przycisk „Wyślij do twórcy” (bez internetu wciąż można pobrać plik); „Dla testerów” jest teraz także w menu gry online (`03e0e5a`).
- Narzędzia: `make zgloszenia` pobiera z serwera nowe zgłoszenia błędów i opinie, odtwarza błędy i podsumowuje opinie (`03e0e5a`).
- Po wydaniu nowej wersji gra raz pokazuje okienko „Nowa wersja — co nowego” ze zmianami od Twojej ostatniej wizyty (`5deeb5b`).
- „Historia zmian” nie pokazuje już numerów technicznych przy niektórych wpisach (`5deeb5b`).

## 2.0.0 — 2026-10-23

- Narzędzia: `make sim-tabele` — czytelne tabele z % wygranych Przymierza w każdym trybie, mapie i poziomie oraz z tym, jak przegrywa (wybici bohaterowie, rytuał, limit rund) (`0f1b64f`).
- Gra online (wersja próbna): przycisk „Gra online” w menu — konto (nick i hasło), pokój z kodem dla znajomych, ustawienia stołu, zajmowanie miejsc i czat; partię we wszystkich trybach prowadzi serwer gry. W trakcie gry: czat, odliczanie, gdy ktoś się rozłączy, i „Oddaj botowi”. Podczas `npm run dev` gra łączy się z serwerem uruchomionym lokalnie (`d73b84d`).
- Gra online: tempo botów ustawia założyciel pokoju (w lobby i w Opcjach) dla wszystkich graczy; na przycisku „Czat” liczba nowych wiadomości (`a503c65`).
- Narzędzia: `make silnik` — silnik gry jako pakiet dołączony do wydania na GitHubie; z niego korzysta serwer gry online (`9fbbe08`).
- Dokumentacja: `docs/INFRASTRUKTURA.md` — gdzie działa gra i serwer, jak wydawać wersje i wdrażać zmiany (`112849c`).
- Punktacja i rozpoznawanie poziomu przeniesione do silnika gry, żeby serwer liczył ranking tak samo jak gra (`125e876`).
- Menu „najpierw online”: na starcie „Zaloguj się / Nowe konto / Graj bez konta” (bez konta — tylko gra na tym komputerze; wybór zapamiętany), a po zalogowaniu menu z „Nowy pokój”, kodem pokoju, „Gra na tym komputerze”, rankingiem top 10 (puchary dla miejsc 1–3, własne miejsce pod tabelą), listą graczy online z „Zaproś” i ogólnym czatem. Zaproszenia wyskakują w rogu ekranu (z dźwiękiem i odliczaniem), a gry przeciw komputerowi skończone po zalogowaniu trafiają do rankingu (`3f86dc5`).
- Bitwa: ikony statystyk w listach jednostek po bokach areny (i pod kartami w pojedynku) są białe, czytelne na ciemnym tle, i odsunięte od paska Życia (`f79eb4c`).
- Szczegóły pod prawym przyciskiem, jak w Heroesach: przytrzymanie prawego przycisku na polu mapy (teren, koszt ruchu, kryształ ze strażnikiem, skarb, stojący tam bohaterowie), jednostce na arenie (karta z bieżącymi wartościami, Życie, efekty), portrecie albo skarbie pokazuje okienko, a puszczenie je chowa. Krótkie kliknięcie prawym (np. na touchpadzie) zostawia okienko do następnego kliknięcia; na telefonie — przytrzymanie palca (`6b17291`).
- Kursory: złote także na polach mapy i areny i na jednostkach w bitwie (wcześniej systemowe); kursor mówi, co zrobi kliknięcie — but (ruch), miecz (atak wręcz, także strzelca na sąsiada), strzała (strzał), przekreślona strzała (przeszkoda zasłania cel, z podpowiedzią nad celem) (`5e90c41`).
- Arena: obrysy pól nie nachodzą już na siebie — każdy róg pola liczony z perspektywy planszy na jego własnej wysokości, więc sąsiednie pola mają wspólne krawędzie (`c36cbdb`).
- Enter w okienkach naciska ich przycisk potwierdzenia albo zamknięcia (np. „Dalej”, „Do ekwipunku”, „Zamknij”, „Zakończ turę” w pytaniu); okienka bez takiego przycisku zamyka. Nie działa na ekranie końca gry, żeby nie zacząć nowej przypadkiem (`167e25c`).
- Bitwa: atak jednym kliknięciem — jednostka walcząca wręcz klika wroga w zasięgu ruchu, podchodzi i atakuje. Stronę wybiera się kursorem (część wroga, w którą celuje mysz, jak w Heroes III); pole, z którego nastąpi atak, świeci się na złoto, a nad wrogiem widać obrażenia. Na telefonie pierwsze dotknięcie pokazuje pole, drugie atakuje (`34556ea`).
- Kursory z nowych grafik: zwykły, but (ruch), skrzydło (ruch jednostki latającej w bitwie), miecz, strzała i przekreślona strzała; miecz i strzały obracają się w stronę ataku — miecz od pola, z którego jednostka uderzy, strzały od strzelca do celu (na mapie miecz od bohatera do pola z walką) (`77e1693`, `c80f70b`).
- Prawy przycisk nigdy nie otwiera menu przeglądarki (należy do gry); w polach tekstowych kopiowanie i wklejanie działa skrótami Ctrl+C / Ctrl+V (`bcde321`).
- Arena: równa złota siatka pól rysowana przez grę na planszy — na malowanych arenach sąsiednie heksy miały osobne obwódki, które nie zawsze leżały na sobie (podwójne krawędzie, jasne pola startowe nachodzące na sąsiadów) (`7a97561`).

## 1.3.0 — 2026-10-22

- Narzędzia: przebudowa instrukcji (`scripts/assets/manual.py`) nadpisuje pliki zamiast kasować folder, przez co działający serwer deweloperski pokazywał w zakładce „Instrukcja” menu gry zamiast instrukcji (`9b73c58`).
- Notatki projektowe: zasady nowego trybu Arena (`d8f75e1`).
- Arena, część 1: zasady w silniku gry (wybór pomocników, losowanie skarbów A, B, B, A ze wspólnej talii, jedna bitwa) i bot na trzech poziomach; ekrany jeszcze w budowie (`4cbdc11`).
- Narzędzia: symulacje balansu Areny (`scripts/sim/arena.ts`): każdy skład Przymierza przeciw każdemu składowi Hordy (`d227c4b`).
- Arena, część 2: tryb „Arena (jedna bitwa)” w menu — przeciw komputerowi (Łatwy / Normalny / Trudny) albo drugiemu graczowi; ekran przed walką, losowanie skarbów (przy dwóch graczach zakryte, dopóki strona ich nie odsłoni), ekran końca; w „Twoich partiach” osobny wiersz Areny i 1 / 2 / 3 pkt za wygraną z komputerem (`86a53c2`).
- Instrukcja: nowy rozdział 15 „Arena — szybka bitwa” (ściągawka to teraz rozdział 16) i sekcja Areny w „Podstawowych zasadach”; w notatkach wyniki symulacji Areny (`3309c1e`).
- Notatki projektowe: punkty za Arenę (1 / 2 / 3) zaakceptowane (`b064e71`).
- Narzędzia: symulacje Areny przyjmują zmiany testowe (`SIM_OVERRIDE`) i zapisują wyniki do porównań (`1a42647`).
- Narzędzia: porównywanie zestawów zmian jednostek z wynikami wyjściowymi na Arenie i w całej grze (`scripts/sim/tune.ts`) oraz testowe warianty zdolności Zew Krwi i Twardogłowy (domyślnie wyłączone) (`7c8a91f`).
- Notatki projektowe: założenia i ustalenia nowego balansu jednostek (bez budżetu statystyk, specjalizacje, limit ±5 punktów) (`adcc12f`).
- Balans jednostek: Władca Wilkołaków S 7, a Zew Krwi daje +1 A do każdego ataku na rannego wroga (zamiast raz na bitwę +2 A); Król Jednorożców S 8 i Szarża Światła +2 A; Ogr Żelazna Pięść Ż 10 (`40372c7`).
- Arena: przy losowaniu skarbów Horda widzi 4 karty zamiast 3 (bez tego Przymierze wygrywało ok. 55% starć); okienko wyboru mieści 4 karty w jednym rzędzie (`0bcd3d5`).
- Bitwa: chodzące jednostki nie przechodzą już przez pola zajęte przez sojuszników (zgłoszenie z 22 października 2026); opis w „Podstawowych zasadach” (`e684e4c`).
- Instrukcja i punkty po nowym balansie: statystyki i zdolności w rozdziale 2 (z nowymi obrazkami kart Wilkołaka, Jednorożca i Ogra), zasada ruchu w bitwie, 4 karty dla Hordy na Arenie, przeliczone tabele trudności w rozdziale 13 i oceny w punktach; w notatkach wyniki balansu i lista zmian dla wersji papierowej (`bdf0d90`).

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

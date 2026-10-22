# Wymiary elementów fizycznej wersji gry

Wymiary wszystkich elementów z pudełka (rozdział 1 instrukcji) oraz rozmiary grafik potrzebne do druku.
Geometria pól jest wyliczona z układu plansz w grze (`src/engine/hex.ts`, `src/engine/battle.ts`),
więc wersja fizyczna i komputerowa mają te same pola.

## Zasady wspólne

- **Druk:** 300 DPI, spad **3 mm** z każdej strony, ważne napisy i liczby min. **4 mm** od linii cięcia.
- **Przeliczenie:** 1 mm = 11,81 px przy 300 DPI. Rozmiary w pikselach poniżej już zawierają spad.
- **Tektura** na kafelki, planszę, tor rund i znaczniki: **2 mm**. Karty: papier kartonowy ok. 300 g/m², lakier matowy.
- **Jedno pole = jedna figurka.** Pole areny ma **34 mm** między płaskimi bokami — prawie najwięcej,
  ile mieści szerokość A3 (granica to ok. 36 mm bez żadnej ramki). Podstawka figurki ma **30 mm**,
  więc między podstawkami sąsiednich figurek zostają 4 mm (zob. `FIGURKI_SPECYFIKACJA.md`).

## Tabela zbiorcza

| Element | Ile | Wymiar netto | Grafika do druku (ze spadem) |
|---|---:|---|---|
| Kafelek mapy (teren, skarb, siedlisko, Drzewo, baza) | 121 | sześciokąt **50 mm** między płaskimi bokami (57,7 mm między rogami), wierzchołkiem do góry | **661 × 753 px** na kafelek, osobno awers i rewers |
| Plansza areny, dwustronna | 1 | **420 × 297 mm** (A3), składana raz na pół do 210 × 297 mm | **5031 × 3579 px** na stronę |
| Pole areny | 85 na stronę | sześciokąt **34 mm** między płaskimi bokami, płaskim bokiem do góry | — (siatka rysowana programowo, niżej) |
| Karta jednostki | 15 | **80 × 120 mm** (rozmiar „Dixit”, proporcje 2:3 jak obecne wzory) | **1016 × 1488 px** |
| Karta skarbu | 20 | **63 × 88 mm** (standardowa karta do gry) | **815 × 1110 px** |
| Rewers karty jednostki / skarbu | po 1 wzorze | jak awers | jak awers |
| Kropla obrażeń („5”, „3”, „2”, „1”) | 28 | kropla **18 × 22 mm** | **283 × 331 px** |
| Znaczniki stanu (zużyta zdolność, Wzmocnienie Ataku, Żywotność, Ochrona, Unieruchomienie, Spowolnienie, Klątwa, Przyspieszenie) | 24 | koło **Ø 20 mm** | **307 × 307 px** |
| Tor rund | 1 | sześciokąt **150 mm** między płaskimi bokami, 24 gniazda Ø 14 mm co ok. 17 mm | **2117 × 1843 px** |
| Kryształowy znacznik rundy (druk 3D) | 1 | graniastosłup sześciokątny 8 mm, wys. 14 mm | — |
| Kryształy (druk 3D) | 3 | graniastosłup sześciokątny 10 mm, wys. 18 mm | — |
| Figurki z podstawką (druk 3D) | 15 | podstawka 30 mm, wys. postaci 28–68 mm | — |
| Kość −1 / 0 / +1 | 1 | sześcienna **16 mm**, ścianki: −1, −1, 0, 0, +1, +1 | 6 pól po **189 × 189 px** (bez spadu) |
| Instrukcja | 1 | **A4** (210 × 297 mm), zeszyt zszywany | 2480 × 3508 px na stronę |
| Pudełko | 1 | wnętrze **305 × 305 × 90 mm**, zewnątrz ok. 310 × 310 × 95 mm | szablon (wykrojnik) od drukarni |

## Kafelki mapy

- **Kształt:** sześciokąt wierzchołkiem do góry, 50 mm między płaskimi bokami — tak jak na mapie w grze.
  Na kafelku zmieszczą się figurka strażnika (podstawka 30 mm) i kryształ (10 mm) obok niej.
- **Liczba:** 50 Przymierza + 49 Hordy + 16 skarbów + 3 siedliska + Drzewo + 2 bazy = **121**.
- **Miejsce na stole** (sama mapa):

  | Mapa | Rzędy | Szerokość × wysokość |
  |---|---:|---|
  | Krótka | 6 | 30 × 27 cm |
  | Średnia | 8 | 40 × 36 cm |
  | Długa | 11 | 55 × 49 cm |
  | Bardzo długa | 14 | **70 × 62 cm** |

  Obok leży plansza areny (42 × 30 cm), więc na bardzo długą mapę potrzeba stołu ok. 115 × 70 cm.
- **Grafika:** obraz terenu musi wypełniać cały prostokąt 661 × 753 px, także poza sześciokątem (to spad).
  Najważniejsze elementy rysunku trzymać w okręgu o średnicy ok. 500 px wokół środka.

## Plansza areny

- **Siatka:** 13 kolumn sześciokątów płaskim bokiem do góry, kolumny po 5–7 pól, 85 pól, kolumny startowe po 5 pól.
- **Pole 34 mm** między płaskimi bokami (39,3 mm między rogami). Cała siatka zajmuje **393 × 255 mm**
  i stoi na środku planszy A3. Zostaje ramka ok. 14 mm po bokach i 21 mm u góry i u dołu — na ozdobny brzeg,
  bez miejsca na większe napisy.
- **Przeszkody:** 7 na każdej stronie, w tych samych polach co w grze (`ARENA_OBSTACLES`).
- **Siatkę i przeszkody narysować programowo** (SVG) i nałożyć na tło. Generator obrazów nie trafi
  w dokładne wymiary pól, a figurki muszą w nie wchodzić co do milimetra. Od generatora potrzebne jest
  tylko tło terenu bez siatki, 5031 × 3579 px.

## Karty

- **Karty jednostek 80 × 120 mm:** leżą na nich krople obrażeń i znaczniki stanu, więc potrzebują miejsca.
  Na karcie warto zostawić wolne pole ok. 70 × 30 mm (np. pod ilustracją) na 5–6 znaczników. Proporcje 2:3 pasują do obecnych wzorów.
- **Karty skarbów 63 × 88 mm:** standardowe, do kupienia w koszulkach ochronnych.
- **Rogi** zaokrąglone, promień 3 mm.

## Tor rund

- Sześciokąt 150 mm, w środku Kryształowe Drzewo, 24 gniazda wzdłuż obwodu (po 4 na bok).
- Gniazda limitów **8, 12, 18 i 24** wyróżnione (obwódka, numer większy).
- Gniazdo Ø 14 mm mieści znacznik rundy (8 mm, 9,2 mm między rogami) z zapasem.

## Pudełko

- Wnętrze 305 × 305 × 90 mm mieści: złożoną planszę areny (297 × 210 mm), wypraskę z 15 figurkami
  (najwyższa ma z podstawką ok. 71 mm), wytłoczone arkusze kafelków lub ich stosy, karty, tor rund i instrukcję A4.

## Stan obecnych grafik

Obecne grafiki są **za małe do druku**. Generator zwraca obrazy do ok. 1536 px, a na przykład arkusz
z 8 kafelkami ma 1448 × 1086 px, czyli ok. 340 × 385 px na kafelek przy potrzebnych 661 × 753 px
(ok. 2 razy za mało). Plansza areny ma 1448 px szerokości przy potrzebnych 5031 px (3,5 razy za mało).
Każdy element trzeba więc wygenerować osobno albo powiększyć programem do skalowania AI.
Kafelki z arkuszy są przycięte dokładnie do sześciokąta, bez spadu — nowe muszą wypełniać cały prostokąt. Proporcje wzorów kart też się różnią
(2:3, 0,71, 0,75, 0,77) — przy generowaniu nowych podawać dokładnie rozmiary z tabeli.

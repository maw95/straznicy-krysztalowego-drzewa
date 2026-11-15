# Backlog

Tylko to, co jeszcze **nie jest zrobione**. Zrobione punkty są usuwane: ich ślad zostaje w CHANGELOG.md, historii gita i w opisach zasad (`ZASADY_CYFROWE.md`, `NOTATKI_DLA_AGENTA_PLANSZOWKI.md`).
Plan wydania: `MAPA_DROGOWA.md`. Decyzje autora: `DECYZJE.md`. Mechaniki według poziomów: `MECHANIKI_I_POZIOMY.md`.

**Jak z tego korzystać:** autor pisze „zrób punkty 2, 3, 5”, a Claude pracuje sam, aż skończy. „Zrób wszystko” = idź po numerach od góry. Każdy punkt ma numer (stały, żeby dało się go przywoływać), warunek ukończenia i rozmiar (S ≈ godzina, M ≈ kilka godzin, L ≈ dzień+).

## Stan (15.11.2026)

Wydane: **2.7.0** (14.11, poziom 3 „Osada”). Niewydane, ale zrobione i wepchnięte do mastera lokalnie (10 commitów przed `origin/master`): poziom 0 „Spacer”, Łatwy na arenie dla poziomów 1–3, bot-kupiec, Królestwo w rankingu, przestrojone Normalny i Trudny. `make check` zielone. **Nic nie wypchnięte** (push gry robi tylko autor).

Drabinka (nazwy = ranga zmagań): 0 Spacer, 1 Przygoda, 2 Wyprawa, 3 Osada, 4 Księstwo, 5 Królestwo, 6 Imperium. Premiera dopiero po poziomie 6.
Nazwy techniczne w kodzie (`kingdom`, `zero`, `kids`) i w rankingu online zostają.

## 1. Kolejka prac (w tej kolejności)

### Etap A. Domknięcie poziomów 0–3 (przed budową poziomu 4)
4. **Wdrożenie serwera przy następnym wydaniu** (S, razem z wydaniem): repo backendu ma niewdrożony commit z rankingiem; poziom 0 i Łatwy na arenie zmieniają znaczenie `kids` (stary klient dostałby arenę zamiast pojedynków).

### Etap B. Poziom 4 „Księstwo” (gospodarka i osady), kolejność wewnątrz poziomu
Poziom 4 zbudowany 15.11 (Kuźnia, wymiana, obiekty mapy, obrona osady, Podbój, autopilot warstw); czeka na ogranie przez autora (sekcja 3).

### Etap C. Poziom 5 „Królestwo” (bohaterowie i magia)
10. **5a. Drugi bohater, reszta** (M): zrobione 15.11 (karczma, najem, tura, PD i artefakty dowódcy, śmierć i wykup, boty, UI). Zostaje do decyzji autora: osobna drużyna dowódcy (dziś wspólna pula pomocników frakcji), własna krzywa wzrostu archetypów (wchodzi z 5c), sprite'y dowódców (sekcja 2a).
Poziom 5 zbudowany 15.11 (drugi bohater, magia, typy i specjalności, rozgałęzienia umiejętności); czeka na ogranie przez autora. Łatwy i Trudny dla poziomów 4–5 jadą na strojeniu poziomu 3 (osobno niemierzone).

### Etap D. Poziom 6 „Imperium” (frakcje i Relikt)
14. **6b. Drzewka i mechaniki frakcji** + jednostka poziomu 6 (L).
15. **6c. Alternatywne jednostki poziomów 2–5** (L; 8 jednostek, grafika, animacje; pierwszy kandydat do cięcia).

### Etap E. Przed premierą
16. **Inwentaryzacja tekstów pod wiele języków** (M): tylko spis, tłumaczenia po premierze.
18. **Premiera na Steamie** (L, głównie autor): strona sklepu, zrzuty, trailer (Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji. Numer wydania premiery do ustalenia (dawne „3.0” traci sens).

### Po premierze
19. Nowe frakcje: Dzikie Stada → Królestwo Umarłych → Żelazne Klany (karta frakcji, grafika, symulacje 10 par), potem DLC. Przed startem: próbka jednej jednostki w nowym stylu i decyzja autora.
20. Kampania fabularna (mapy ręczne są; fabuła przez wyzwalacze) i Ekspedycja (8–10 map, nagrody po bitwie, profil trwały, seed dnia z rankingiem).
21. Wiele języków (PL + EN: interfejs, dane, instrukcja, CHANGELOG, serwer).
22. Więcej niż 6 graczy (do 8), „cios od tyłu / z flanki” dla innych jednostek.

## 2. Grafika i prezentacja (do wzięcia, gdy autor zdecyduje)
- [ ] **Ozdobne narożniki ramek** nie pasują do ramki: narożniki jako osobne elementy (9-slice / `border-image`), generowane razem z ramką w Scenario, albo prostsze narożniki w CSS/SVG (wymaga decyzji o stylu).
- [ ] **Okładka do druku** (`docs/grafika/okladka/okladka.png`, `ui/cover.jpg`): ma stare logo wypalone u góry (w grze niewidoczne, na wydruku tak). Wygenerować bez logo i nałożyć nowe (`ui/logo.png`), potem `python3 scripts/assets/menu.py` i `druk.py`.
- [ ] Pliki w `docs/wersja_planszowa/` (`logo_zolte_*`, `okladki_przod_tyl_grzbiet.pdf`, `Instrukcja_Straznicy.docx`) mają starą nazwę (binarne, po ostatecznym potwierdzeniu nazwy).
- [ ] Domeny i konta, znak towarowy (brak wpisów), tytuł w sklepie Steam (autor).

## 2a. Grafiki i dźwięki do wygenerowania i podmiany (placeholdery)

Lista rzeczy, które w grze działają na zastępczej grafice albo bez własnego dźwięku. Po wygenerowaniu podmienić plik i dopisać wpis w `assets.json`.

**Poziom 4 (Księstwo)**
- Strzał katapulty: brak własnego dźwięku, gra `public/assets/dzwieki/build.mp3` (uderzenia młotka). Potrzebny: `dzwieki/katapulta.mp3` (świst i huk kamienia w mur), podmiana w `BattleView.tsx` (`sfx.play('build')` przy `battleCatapult`).
- Strzał wieżyczki i wejście w fosę: brak animacji i dźwięku (tylko spadek Życia i wpis w dzienniku). Potrzebne: `dzwieki/wiezyczka.mp3` (strzała), `dzwieki/fosa.mp3` (kolce) oraz krótka animacja strzały z wieżyczki do celu.
- Wymiana surowców, garnizon: gra dźwięk monet `coins_buy.mp3` (do zostawienia albo własny `dzwieki/wymiana.mp3`).
- Ikona celu „Podbój” w kreatorze: zastępczo `ikony/mapa/osada_neutral.webp`. Potrzebna własna: `ui/menu/podboj.webp` (512×592 jak pozostałe karty kreatora; np. sztandar na murach zdobytej osady).
- Elementy oblężenia (`arena/oblezenie/`: mur, brama, wieża, gruzy, fosa, katapulta) są neutralne (szary kamień) dla obu frakcji; do rozważenia wersje frakcyjne.

**Poziom 5 (Królestwo)**
- Sześciu dowódców (`dawnKnight`, `dawnHuntress`, `dawnSage`, `hordeWarlord`, `hordeCrossbow`, `hordeShadow`) nie ma sprite'ów ani figurek 3D: na arenie i mapie stoją jako żetony z portretem. Potrzebne dla każdego: arkusze klatek `stoi`, `ruch`, `atak`, `trafienie`, `smierc` w `public/assets/jednostki/<nazwa>/` (potok: `docs/POTOK_ANIMACJI.md`, wpis w `src/ui/sprites.ts`) oraz dźwięki ataku `dzwieki/jednostki/<id>_atak.mp3`.
- Karty kreatora „Królestwo” i „Imperium” używają ikon mapy (`karczma.webp`, `odlamek.webp`) zamiast kart 512×592 (`ui/menu/krolestwo.webp`, `ui/menu/imperium.webp`).
- Najem i wykup dowódcy: gra `coins_buy.mp3`; do rozważenia własny `dzwieki/najem.mp3`.
- Czary w bitwie nie mają animacji: widać tylko skutek (spadek lub wzrost Życia, znacznik) i słychać `magic_cast` / `magic_attack`. Potrzebne efekty na arenie w `public/assets/efekty/` (jak istniejące efekty zdolności): pocisk lecący do celu (`czar_bolt`), zielona poświata leczenia (`czar_mend`), fioletowe łańcuchy (`czar_slow`), kamienna powłoka (`czar_stoneskin`), wybuch na polu celu i sąsiadach (`czar_fireball`), złote smugi (`czar_haste`); dane do odtworzenia są w `BattleState.spells`.
- Wizja i Wrota na mapie: brak animacji (odkrycie pól, błysk portalu); do rozważenia dźwięk `dzwieki/portal.mp3`.
- Wieża maga: jeden obraz na oba poziomy (`osady/<frakcja>_magic1.webp`); potrzebny `osady/dawn_magic2.webp` i `osady/horde_magic2.webp` (rozbudowana wieża), potem zmiana w `buildingPicture` (`SettlementDialog.tsx`).

**Poziom 6 (Imperium)**
- Podnoszenie Odłamka i wzniesienie Pierwotnej Iskry: brak własnego dźwięku i animacji (gra dźwięk budowy `build.mp3`). Potrzebne: `dzwieki/odlamek.mp3` (kryształowy dzwon), `dzwieki/iskra.mp3` (fanfara mocy), błysk na kafelku przy podniesieniu.
- Karta celu „Relikt” w kreatorze używa ikony mapy `odlamek.webp` (docelowo `ui/menu/relikt.webp`, 512×592).

## 3. Do sprawdzenia na żywo (autor)
Zrobione i przetestowane, bez potwierdzenia w prawdziwej grze:
- **Poziom 4 (15.11):** surowce w dolnym pasku, ceny z surowcami w oknie osady, ikony tartaku, kopalni rudy, źródła Pyłu i chatki, panel zadania chatki (nie sprawdzony kliknięciem), karta „Księstwo” w kreatorze, samouczek.
- **Poziom 3:** widok osady z budynkami obu frakcji, dźwięki zakupu, animacje i portrety 8 pomocników (sprite'y bez klipu śmierci), ikony zestawów artefaktów i licznik „2/3 zestawu”, samouczek, autopilot dziecka, zapisy online, szósty gracz. Nowe 15.11: poziom 0, Łatwy na arenie, bot-kupiec.
- Kraken (czy groźny, ale uczciwy; czy sześć jednostek mieści się na arenie) i Pegaz.
- Klikalność jednostek zasłoniętych (Pegaz kontra Hydra, partia 114857, akcja 60; poprawka `behind` w `ArenaBoard.tsx`).
- Błysk zakrytych kafelków (`fog-drift`); kursor ataku na wszystkich heksach jednostki; zwłoki (`CORPSE_MAX_W` w `sprites.ts`); rzut Cyklopa (śmierć zaczyna się przed lądowaniem); kolejka stanów online (`usePresentation.ts`).
- Rozmiar Czarnego Smoka, figurki Szamana, Nietoperza, Jednorożca.

## 4. Parking (pomysły bez terminu)
- Pierwsza strona instrukcji planszowej: imienna wiadomość autora (pisze autor).
- Kąt kamery i wielkość figurek 3D (autor, po obejrzeniu na żywo).
- Zwój Teleportacji jest nieużywany przez boty (35 z 35): potrzebuje pomysłu (ratowanie strzelca, skok za linię wroga).
- Garnizony i budynek obronny osady do rozważenia po strojeniu (jeśli przejmowanie okaże się za łatwe; częściowo pokrywa 4c).
- Łatwy w wydaniu planszowym (94/91/88/79% 1 na 1): domyślnie zostawiony „jak wydrukowany”; dźwignie stroiciela tylko w grze cyfrowej.

## 5. Zasady pracy bez nadzoru (decyzje autora, 12.11.2026)
- Jeden punkt = jeden lub kilka commitów, każdy z wpisem w CHANGELOG.md i `make check` przed commitem; bez pushu gry. Zmiana AI albo liczb przesuwa `golden.test.ts` i tabele: osobny commit z `-u` i opisem w commicie.
- Grafiki i dźwięki: Claude robi je sam (Scenario/ElevenLabs), ogląda/odsłuchuje, wybiera, wrzuca do repo z wpisem w `assets.json`. Jeśli jeden punkt wymaga więcej niż ok. 30 generacji, kończy to, co ma, i pyta.
- Gdy trzeba decyzji autora, Claude nie zgaduje: dopisuje pytanie do sekcji 8, robi następny punkt i wraca po odpowiedzi.
- Po skończeniu: dźwięk `complete.oga`, krótkie podsumowanie po polsku, uwaga o `/clear`.

## 6. Balans: pasma i znane odchylenia

Pasma autora (wygrane Przymierza): Łatwy 65–85%, Normalny 45–65%, Trudny 30–45%. Stroiciele: `scripts/sim/tuneLevels.ts`, `scripts/sim/tuneKingdom.ts` (Osada); tabele: `make sim-tabele`, `make sim-cele` (poniżej 3 minut; każdy nowy cel i kształt mnoży tabelę). Do mierzenia gry cyfrowej: `SIM_DIGITAL=1 make sim-tabele` (i `SIM_GROWTH=1`); bez `SIM_DIGITAL` mierzy wydanie planszowe.
- Stan: Łatwy w paśmie w każdej komórce; Normalny w paśmie niemal wszędzie (z rozwojem poniżej pasma: kooperacja 39–44% na średniej, długiej i bardzo długiej, 2 na 2 długa 35%; Trudny w koopie 22–30%: ewentualnie `tuneLevels.ts <cel> 1`). Osada: Normalny 51–67%, Trudny koop 34–45%; cele inne niż „Kryształy” bez strojenia.
- Poza pasmem, zostawiamy (decyzja 10.11): Kryształy na ręcznych mapach (Cieśnina, Dolina), koop 2 graczy Normalny bardzo długa 75%, Artefakt i Boss z rozwojem na wyspach, Boss Trudny. Dźwignie stroiciela (skarby startowe, bohater Hordy) za grube; potrzebna nowa (liczba strażników lub kryształów).
- **Księstwo, cel „Podbój”** (15.11): Normalny 43–65% po strojeniu; poza pasmem kooperacja 1 gracz na bardzo długiej mapie (33–35%, dźwignie skarbów i limitu rund za słabe: potrzebna inna, np. słabsi obrońcy osad Hordy). Łatwy i Trudny dla Podboju niestrojone. Szturmy: garnizon 1–2 jednostek nie zatrzymuje bohatera, 3 jednostki bronią w połowie przypadków (`scripts/sim/siege.ts`).
- **Imperium, cel „Relikt”** (15.11): Normalny 43–72% po strojeniu; powyżej pasma 2 graczy na krótkiej mapie (72%) i bardzo długa mapa 2 graczy (70–72%). Łatwy i Trudny niestrojone.
- Wartości robocze do akceptacji autora (zmiana w jednym miejscu): `SURVIVAL`, `MAP_SHAPES`, `SHAPE_ROUND_FACTOR`, `DIGITAL_TUNING`, progi PD i pula umiejętności (`growth.ts`), `FAMILY` (`data.ts`), liczby artefaktów, obiektów, jednostek i bossów neutralnych, spotkań na mapie, progi botów, progi `levelOfFight`.
- Boty, zbadane i bez zmian: „bezczynne tury” w kontroli, przetrwaniu i artefakcie to trzymanie punktu, zgodnie z celem; „bezczynne aktywacje” w bitwie to wybór pozostania.

## 7. Decyzje obowiązujące (archiwum, 12–15.11.2026)

**Zakres:** premiera dopiero po poziomie 6; poziomy 3–6 wchodzą przed pakowaniem na Steam. Nowe frakcje, kampania i Ekspedycja po premierze. Odrzucone: machiny wojenne (poza katapultą), morale i szczęście, neutralni do przekonania, dyplomacja, mgła wojny, tereny, jednostki poziomów 7+, cykl tygodniowy.

**Poziom 3 (osady i złoto):**
- Waluta: tylko złoto, skala mała (najtańsza rzecz 1 zł, dochód osady 1–2 zł na rundę; ceny w całych złotych, stroić liczbą osad i cenami). Osady jednakowe: kopalnia 1, osada 2, osada ze skarbcem 3. Brak utraty złota po porażce.
- Gracze tej samej frakcji (też w rywalizacji) dzielą skarby, złoto i pomocników; kasa per frakcja.
- Osada ma narzuconą frakcję według połowy mapy; kto wejdzie, zostaje właścicielem (budynki i ulepszenia zostają). Właściciel innej frakcji ma dochód, targ i szpital, ale nie rekrutuje.
- Budynki trzeba kupić (koszary, targ, szpital, budynek dochodu). Szpital: ulepszenie = wskrzeszanie za 1/3 ceny jednostki zamiast 1/2.
- Okno osady jak w Heroes III: losowa unikalna nazwa pasująca do frakcji, krajobraz z grafikami budynków, klik w budynek otwiera funkcję.
- Rekrutacja bez kopii: jedna jednostka danego typu w armii (bez przebudowy na instancje). Neutralni nie są rekrutowani. 7 pomocników na frakcję (3 dawni = poziom 1, nowi poziomów 2–5), maks. 5 w drużynie, wspólni dla drużyny. Miejsca: start 2, +1 na 3. poziomie bohatera, +1 na 6., +1 z ulepszonych koszar.
- Cena jednostki z symulacji (użyteczność w walce), bez limitu zakupów na turę.
- Nagrody: złoto tylko z osad, kopalń i skrzyń (w skrzyni wybór: artefakt albo złoto; ilość zależy od poziomu skrzyni); strażnicy i spotkania dają skarby jak na poziomie 2; walka z bohaterem wroga: nic. Kopalnie złota: +1 na rundę (właściciel: patrz decyzje poziomu 4).
- Obrońcy osad: neutralni trochę silniejsi niż strażnicy kryształów. Obrona: tylko stanie na kafelku (wrogi bohater na pustej osadzie przejmuje ją bez walki).
- Liczba osad: 2 / 4 / 4 / 6 (krótka / średnia / długa / bardzo długa), parzyste, po równo na połowę; dobór końcowy symulacjami.
- Cel „Podbój” dopiero na poziomie 4. Automat zła w koopie: posiłki co kilka rund, realnie groźne.
- Strojenie: długie symulacje w tle, do rozmowy tylko skrót. Ruch klient–serwer oszczędny (punkt 3).
- Nowi pomocnicy zaakceptowani 13.11 (Przymierze: Jeżozwierz, Centaur, Alabastrowy Odyniec, Opiekun Drzewa; Horda: Szczurołak, Piekielny Ogar, Salamandra Popiołu, Herszt Minotaurów). Tryb roguelike nazywa się „Ekspedycja”.

**Poziom 4, decyzje z 15.11 (wieczór):**
- Zakres dnia: punkty 1–3 i 4a/4b; bez pushu, bez wdrożenia serwera, bez tagów. Liczby poziomu 4 ustala Claude i stroi symulacjami (maks. ok. godziny na poziom; jeśli dalej poza pasmem, zapis w sekcji 6 i idziemy dalej).
- Surowce (projekt Claude'a do korekty): drewno i ruda płacą za budynki i ulepszenia, złoto za jednostki, Gwiezdny Pył tylko za rzadkie rzeczy (legendarne artefakty na targu, drugi poziom ulepszeń); wspólne na frakcję jak złoto.
- **Kopalnie złota i surowców (zmiana względem poziomu 3):** kto wejdzie, zostaje właścicielem na stałe (jak osady), dopóki ktoś inny nie przejmie; flagi właściciela na mapie. Przejęcie bez walki, chyba że na kafelku kopalni stoi jej aktualny właściciel.
- Chatki: gracz **przynosi złoto, surowce lub artefakt**; nagroda: złoto, surowce, artefakt lub doświadczenie (jedno zadanie na chatkę, raz na grę).
- Grafika: budżet Scenario 566 kredytów na miesiąc, można wykorzystać całość (limit ok. 30 generacji na punkt z sekcji 5 nie obowiązuje tego dnia).

**Podział poziomów 4–6 (15.11):** na 4 gospodarka i osady, na 5 bohaterowie i magia, na 6 frakcje i Relikt: wyrównana liczba i złożoność nowości dla gracza.

## 8. Pytania czekające na autora
Brak.

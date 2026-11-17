# Backlog

Tylko to, co jeszcze **nie jest zrobione**. Zrobione punkty są usuwane: ich ślad zostaje w CHANGELOG.md, historii gita i w opisach zasad (`ZASADY_CYFROWE.md`, `NOTATKI_DLA_AGENTA_PLANSZOWKI.md`).
Plan wydania: `MAPA_DROGOWA.md`. Decyzje autora: `DECYZJE.md`. Mechaniki według poziomów: `MECHANIKI_I_POZIOMY.md`.

## Jak z tego korzystać (zasady dla Claude'a)

Autor pisze „zrób punkty 1, 2 i 3” (albo „zrób 9–10”, „zrób wszystko z grupy A”), a Claude robi je **sam, bez pytań**, w podanej kolejności, aż skończy. „Zrób wszystko” = po numerach od góry, z pominięciem punktów oznaczonych **kredyty** (patrz niżej) i grupy „Tylko autor”.

**Każdy punkt jest samowystarczalny.** Ma: rozmiar (S ≈ godzina, M ≈ kilka godzin, L ≈ dzień+), zależności, miejsca w kodzie, zakres, **decyzje już podjęte** i warunek ukończenia („Gotowe, gdy”). Numery są stałe (po przeglądzie 16.11.2026 numeracja jest nowa; stare numery z commitów sprzed tej daty już nie obowiązują).

**Co robić, gdy czegoś brakuje w opisie punktu (zamiast pytać):**
1. Zastosuj to, co mówi `NOTATKI_DLA_AGENTA_PLANSZOWKI.md` (rozstrzyga przy sprzecznościach) i sekcja „Decyzje obowiązujące” niżej.
2. Wybierz najprostszą, odwracalną opcję, zrób i dopisz jedną linię do sekcji „Decyzje podjęte przez Claude'a (do akceptacji)” na dole (data, punkt, co wybrałeś, jak to zmienić). Autor przeczyta to przy okazji; nie blokuje to pracy.
3. Pytaj (i zatrzymaj tylko ten punkt, resztę rób dalej) wyłącznie wtedy, gdy: trzeba wydać więcej kredytów niż w budżecie (niżej), trzeba coś wypchnąć (push gry robi tylko autor), akcja jest nieodwracalna (usuwanie danych, serwer autora), albo dwa punkty wzajemnie się wykluczają.

**Punkty z grafiką i dźwiękiem (oznaczone „kredyty”):** zasób to kredyty Scenario (CU). Claude **nie widzi salda**; autor podaje budżet w poleceniu („zrób 17, mam 300 CU”). Bez podanego budżetu Claude wydaje najwyżej **150 CU na jedno polecenie**. Liczy wydatki sam (ceny w sekcji „Kredyty Scenario” niżej), robi punkty w kolejności i kończy to, co zdąży w budżecie; resztę zostawia z adnotacją „zostało: …” w punkcie. Limit na jednostkę: 100 CU; jedna ponowna próba na zasób (zablokowane zadania też kosztują), potem „nie wyszło” w punkcie i następna jednostka.

**Przy każdym punkcie:**
- `make check` przed commitem; jeden commit na zmianę (punkt może mieć kilka commitów); wpis w CHANGELOG.md pod „W przygotowaniu” (po polsku, zrozumiały dla gracza); **bez pushu gry** (backend: commit, push i `make deploy` wolno).
- Zmiana interfejsu: sprawdź w przeglądarce (`make zrzut` albo skrypt `scripts/browser/`, desktop i telefon), nie tylko w testach jsdom.
- Zmiana liczb lub AI przesuwa `tests/golden.test.ts` i tabele: osobny commit z `-u` i opisem w commicie; tylko gdy zmiana jest zamierzona.
- Każdy zaakceptowany obraz, animacja, dźwięk lub muzyka trafia do repo w tej samej sesji z wpisem w `assets.json`.
- Po skończeniu: usuń punkt z tego pliku (albo zaznacz, co zostało), zagraj `complete.oga`, krótkie podsumowanie po polsku, uwaga, że to dobry moment na `/clear`.

## Stan (17.11.2026, po wydaniu 2.8.0)

Wydane: **2.8.0** (16.11: poziomy 0, 4, 5 i 6, Łatwy na arenie, bot-kupiec, animacje i efekty; gra na Pages, serwer 0.2.0 na Fly.io, silnik 2.8.0). Wcześniej **2.7.0** (14.11, poziom 3 „Osada”). Wszystko z poniższej listy jest już wydane, nic nie czeka na push.

Drabinka (nazwy = ranga zmagań): 0 Spacer, 1 Przygoda, 2 Wyprawa, 3 Osada, 4 Księstwo, 5 Królestwo, 6 Imperium. Premiera dopiero po poziomie 6.
Nazwy techniczne w kodzie (`kingdom`, `zero`, `kids` = Łatwy, `economy`, `realm`, `empire`) i w rankingu online zostają. Typ `Level` w `src/engine/types.ts`: `zero | kids | normal | hard`.

## 1. Kolejka prac (w tej kolejności)

### Grupa A. Zasady i silnik (kolejność dowolna; decyzje autora z 17.11)

**32. Obrona osady steruje właściciel** (M). Garnizon bez bohatera nie jest już prowadzony przez komputer: w bitwie o osadę jednostkami garnizonu steruje jej właściciel (człowiek lub bot swojej strony). Miejsca: `src/engine/kingdom.ts` (garnizon), `battle.ts` (kto aktywuje), `ui/BattleView`. Gotowe, gdy: test silnika + zrzut bitwy o osadę z garnizonem; zmiana przesuwa golden i strojenie Podboju (osobny commit `-u`).

**33. Więcej czarów** (M). Dziś 8 czarów (mana 3 + poziom, bohaterowie znają Magiczny Pocisk). Zaprojektować dodatkowe (po 2–3 na szkołę: obrażenia, leczenie, wsparcie, osłabienie), dopisać do `data.ts`/`magic.ts`, bota (`botSpell`), księgi czarów i wieży maga; propozycje liczb do akceptacji w sekcji 7.

**34. Relikt: warunek budowy** (S). Budynek Reliktu w osadzie może wybudować tylko bohater stojący na kafelku tej osady, który ma przy sobie **wszystkie** Odłamki (nie „odłamki żywych bohaterów frakcji”). Miejsca: `economy.ts`/`kingdom.ts` (warunek budowy), tekst w oknie osady i w `ZASADY_CYFROWE.md`.

**35. Przemiana trudności Bardzo trudnego: skarby zamiast Życia** (M). Bez manipulowania Życiem jednostek (zdejmujemy +20% Życia i −15% na Łatwym, jeśli jest): przewagi komputera to surowce i artefakty początkowe (dziś: dochód ×1,5, +2 skarby na start; dołożyć startowe surowce i artefakty). Po zmianie ponowne strojenie pasm (`make sim-raport`), golden `-u` osobnym commitem.

**36. Mnożnik rankingu Bardzo trudnego = 1,5** (S), żeby ten poziom był bardziej wynagradzający (dziś Trudny × 1,25). Spacer (poziom 0) zostaje bez wyboru trudności. Miejsce: mnożniki w `src/engine` (ranking) i serwer (`../straznicy-krysztalowego-drzewa-backend`: commit, push, `make deploy`).

### Grupa B. Ekran osady (L)

**37. Osada na pełnym ekranie, wzór: Heroes III** (L). Całą mechanikę i wygląd brać z Heroes III; jedyna różnica to podgląd budynków do wybudowania.
- Okno osady zajmuje **cały ekran** (nie mały modal).
- Jeden budynek zawsze wybudowany: **Rada Osady** (nazwa robocza). Klik w niego zmienia ekran na **drzewko budynków do kupienia**.
- Drzewko (graf, nie lista jak w Heroes III): zależności między budynkami widać od razu liniami; w Heroes III trzeba kliknąć prawym przyciskiem budynek, żeby zobaczyć wymagany.
- Dziś: `src/ui/SettlementDialog.tsx` (okno z 9 budynkami i drzewkiem frakcji), `kingdom.ts`/`economy.ts` (budynki, koszty). Sprawdzić też na telefonie (poziomo i pionowo). Grafiki krajobrazu osady: `kredyty`, ewentualnie ze Scenario.

### Grupa C. Grafika (kredyty Scenario; zasady budżetu na górze)

**38. Ozdobniki ramek i tła okien ze Scenario** (M, kredyty). Obecne ozdobniki przy ramkach (narożniki SVG, punkt dawniej 26) są brzydkie: wygenerować ze Scenario nowe. Tło okien „Księga czarów” i skrzynia skarbów (dziś CSS: skóra, drewno, pergamin) jest bardzo brzydkie: wygenerować potrzebne grafiki (tło księgi, skrzynia, pergamin). Przepis: wszystko do repo z wpisem w `assets.json`, małe pliki (WebP).

## 2. Tylko autor (Claude tego nie bierze)
- **Premiera na Steamie** (L): strona sklepu, zrzuty, trailer (Higgsfield odłożony), ujawnienie użycia AI, przegląd licencji, osiągnięcia, opakowanie komputerowe (Electron/Tauri), zapis profilu, chmura Steam, test z parami rodzic + dziecko, przegląd konkurencji. Numer wydania premiery do ustalenia (dawne „3.0” traci sens).
- Domeny i konta, znak towarowy (brak wpisów), tytuł w sklepie Steam.
- Pliki w `docs/wersja_planszowa/` (`logo_zolte_*`, `okladki_przod_tyl_grzbiet.pdf`, `Instrukcja_Straznicy.docx`) mają starą nazwę (binarne, po ostatecznym potwierdzeniu nazwy).
- Odsłuch dźwięków (Claude nie ma jak ich odsłuchać): 7 z 15.11 (`catapult.mp3`, `tower_shot.mp3`, `moat.mp3`, `shard_pickup.mp3`, `spark.mp3`, `portal.mp3`, `tavern_hire.mp3`) i 32 z 16.11 (`public/assets/dzwieki/jednostki/<id>_atak|_smierc.mp3` dla 16 jednostek poziomów 5–6); co się nie podoba, Claude wygeneruje od nowa (1 CU za sztukę).
- Pierwsza strona instrukcji planszowej (imienna wiadomość autora) i kąt kamery z wielkością figurek 3D: autor, po obejrzeniu na żywo (decyzja 17.11: poza parkingiem, bez terminu).

## Przed premierą (decyzja autora 17.11: wchodzą przed Steamem; po punktach z kolejki)
28. **Nowe frakcje:** Dzikie Stada → Królestwo Umarłych → Żelazne Klany (karta frakcji, grafika, symulacje 10 par), potem DLC. Przed startem: próbka jednej jednostki w nowym stylu i decyzja autora. Koszt grafik i dźwięków jednej frakcji: sekcja „Kredyty Scenario”.
29. **Kampania fabularna** (mapy ręczne są; fabuła przez wyzwalacze) i **Ekspedycja** (8–10 map, nagrody po bitwie, profil trwały, seed dnia z rankingiem).
30. **Wiele języków** (PL + EN: interfejs, dane, instrukcja, CHANGELOG, serwer). Spis tekstów i trudności: `TEKSTY_DO_TLUMACZENIA.md` (ok. 1300 napisów i 71 tys. znaków w kodzie, plus instrukcja i serwer). Najlepiej robić ostatnie, gdy teksty się ustalą.
(Nie robić bez wyraźnego polecenia autora: to duże prace.)

## 3. Sprawdzenie na żywo
Wyczyszczone 17.11: autor sam sprawdza grę i zgłasza błędy (`make zgloszenia`); nie prowadzimy listy „do sprawdzenia”.

## 4. Parking (pomysły bez terminu)
- **Więcej niż 6 graczy** (do 8), „cios od tyłu / z flanki” dla innych jednostek.

## 5. Balans: pasma i znane odchylenia

**Raport:** `make sim-raport` (np. `GAMES=100`) buduje `docs/BALANS_TABELE.html`: tabele wygranych Przymierza dla każdego poziomu gry, trudności, trybu i mapy (bez ustawień własnych); komórki poza pasmem mają inny kolor tła (czerwony poniżej, niebieski powyżej). Generuj od nowa po każdej zmianie liczb lub AI.

Pasma autora (wygrane Przymierza): Łatwy 65–85%, Normalny 45–65%, Trudny 30–45%. Stroiciele: `scripts/sim/tuneLevels.ts`, `scripts/sim/tuneKingdom.ts` (Osada); tabele: `make sim-tabele`, `make sim-cele` (poniżej 3 minut; każdy nowy cel i kształt mnoży tabelę). Do mierzenia gry cyfrowej: `SIM_DIGITAL=1 make sim-tabele` (i `SIM_GROWTH=1`); bez `SIM_DIGITAL` mierzy wydanie planszowe.
- Stan: Łatwy w paśmie w każdej komórce; Normalny w paśmie niemal wszędzie (z rozwojem poniżej pasma: kooperacja 39–44% na średniej, długiej i bardzo długiej, 2 na 2 długa 35%; Trudny w koopie 22–30%: ewentualnie `tuneLevels.ts <cel> 1`). Osada: Normalny 51–67%, Trudny koop 34–45%; cele inne niż „Kryształy” bez strojenia.
- Poza pasmem, zostawiamy (decyzja 10.11): Kryształy na ręcznych mapach (Cieśnina, Dolina), koop 2 graczy Normalny bardzo długa 75%, Artefakt i Boss z rozwojem na wyspach, Boss Trudny. Dźwignie stroiciela (skarby startowe, bohater Hordy) za grube; potrzebna nowa (liczba strażników lub kryształów).
- **Księstwo, cel „Podbój”** (15.11): Normalny 43–65% po strojeniu; poza pasmem kooperacja 1 gracz na bardzo długiej mapie (33–35%, dźwignie skarbów i limitu rund za słabe: potrzebna inna, np. słabsi obrońcy osad Hordy). Łatwy i Trudny dla Podboju niestrojone. Szturmy: garnizon 1–2 jednostek nie zatrzymuje bohatera, 3 jednostki bronią w połowie przypadków (`scripts/sim/siege.ts`).
- **Imperium, cel „Relikt”** (15.11): Normalny 43–72% po strojeniu; powyżej pasma 2 graczy na krótkiej mapie (72%) i bardzo długa mapa 2 graczy (70–72%). Łatwy i Trudny niestrojone.
- **Poziomy 4–6, wszystkie trudności** (16.11, `SIM_ECONOMY|REALM|EMPIRE=1 SIM_LEVEL=kids|normal|hard|veryhard SIM_DAWN_HUMAN=1 scripts/sim/kingdom.ts 60`, cel Kryształy, mapy S/M/L, 4 stoły; przy stołach PvP Przymierze to człowiek, a komputer ma przewagi poziomu; 60 gier na komórkę, błąd ok. ±6 pkt): zakres wygranych Przymierza w komórkach, bez dodatkowego strojenia:

| Poziom gry | Łatwy (65–85) | Normalny (45–65) | Trudny (30–45) | Bardzo trudny (15–30) |
|---|---|---|---|---|
| 4 Księstwo | 58–92 | 38–70 | 27–52 | 13–28 |
| 5 Królestwo | 63–92 | 47–62 | 27–53 | 12–28 |
| 6 Imperium | 58–87 | 47–68 | 27–60 | 15–43 |

  Odstępstwa (zostawione, decyzja 16.11 po limicie godziny na poziom): Normalny Księstwo średnia kooperacja 2 graczy 38%; Trudny powyżej pasma na krótkich mapach (48–60%) i w kooperacji 2 graczy na długiej (50–52%); Łatwy Księstwo/Królestwo poniżej 65% na kilku średnich i długich mapach (58–60%) i powyżej 85% na krótkiej mapie PvP 2 na 2 (92%); Bardzo trudny Imperium krótka koop 2 graczy 43%. Bardzo trudny (przewagi komputera: Życie +20%, dochód ×1,5, skarby +2) mieści się w paśmie 15–30% w większości komórek.
- Wartości robocze do akceptacji autora (zmiana w jednym miejscu): `SURVIVAL`, `MAP_SHAPES`, `SHAPE_ROUND_FACTOR`, `DIGITAL_TUNING`, progi PD i pula umiejętności (`growth.ts`), `FAMILY` (`data.ts`), liczby artefaktów, obiektów, jednostek i bossów neutralnych, spotkań na mapie, progi botów, progi `levelOfFight`.
- Boty, zbadane i bez zmian: „bezczynne tury” w kontroli, przetrwaniu i artefakcie to trzymanie punktu, zgodnie z celem; „bezczynne aktywacje” w bitwie to wybór pozostania.

## 6. Decyzje obowiązujące (archiwum, 12–15.11.2026)

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
- Grafika: budżet Scenario 566 kredytów na miesiąc, można wykorzystać całość (limit kredytów na polecenie z początku tego pliku nie obowiązywał tego dnia).

**Podział poziomów 4–6 (15.11):** na 4 gospodarka i osady, na 5 bohaterowie i magia, na 6 frakcje i Relikt: wyrównana liczba i złożoność nowości dla gracza.

## 7. Decyzje podjęte przez Claude'a (przejrzane przez autora 17.11)

Autor przejrzał listę 1–29 (17.11). Zaakceptowane bez zmian: 2, 3, 4, 6, 7, 9, 10, 13, 16, 17, 19, 20, 21 (strojenie per komórka musi zostać), 22–27, 29; 5 (z dopisaniem „więcej czarów”, punkt 33); 8 i 11 zmienione (punkty 34 i 37); 1 zmienione (punkt 32); 12 nieaktualne (serwer 0.2.0 jest już wypchnięty i wdrożony); 14 zmienione (punkt 35); 15 zmienione (punkt 36); 18 i 28 zmienione (punkt 38: grafiki ze Scenario).
Nowe wpisy dopisuj na końcu z datą i numerem punktu:
1. **(17.11, Zwój Teleportacji)** Boty używają Zwoju: skok do pola obok sojusznika przyciśniętego przez silniejszego wroga lub przynajmniej dwóch (ratunek), albo, gdy nikogo nie da się uderzyć w tej turze, skok przybliżający o co najmniej 3 pola do wroga. Nie używa go automat kooperacji (trzyma się listy z instrukcji). Wartość w dobieraniu skarbów w arenie: 3. Zmiana przesunęła `golden` (osobny commit z `-u`).
2. **(17.11, Łatwy w wydaniu planszowym)** Zostaje „jak wydrukowany” (94/91/88/79% 1 na 1); dźwignie stroiciela tylko w grze cyfrowej (decyzja autora).
3. **(17.11, garnizony i budynek obronny osady)** Skreślone z parkingu: jeśli przejmowanie będzie za łatwe, autor zgłosi propozycję.

## 8. Kredyty Scenario

**Ile jeszcze potrzeba (stan 16.11.2026, po wydaniu 239 CU; punkty 16–25 z kolejki)**
Ceny z faktur: dźwięk (ElevenLabs SFX) 1 CU; obraz Flare `medium` 3 CU, `high` 14 CU; wideo P-Video 2 po 5 CU za sekundę (klip 3 s = 15 CU, 2 s = 10 CU); muzyka ok. 30 CU za utwór. Zablokowane lub nieudane zadania wideo **też kosztują**: 16.11 padło 6 z 14 klipów (ok. 90 CU), więc do kosztu „czystego” (ok. 72 CU na jednostkę) doliczam ok. 40% zapasu (ok. 105 CU na jednostkę).
| Pozycja | Bez porażek | Z zapasem na porażki |
|---|---:|---:|
| Animacje 14 jednostek (punkty 17–21; Łowczyni, Mędrzec, Kapitan Kuszników, Szaman Cieni, Feniks, Behemot, Lis, Sowa, Driada, Jeleń, Procarz, Gargulec, Troll, Wiwerna; latające dodatkowo klip `wzbicie`, Feniks klip `odrodzenie`) | ok. 1 050 | ok. 1 470 |
| Brakujący atak Wodza Hordy (punkt 16) | 15 | 30 |
| Efekty czarów, oblężenia (punkty 22–23), Odłamka, Iskry i mechanik frakcji (ok. 14 efektów po ok. 13 CU: obraz + krótki klip) i ich dźwięki | ok. 180 | ok. 250 |
| Ikony drzewka frakcji (6), siedliska jednostek (16 ikon), frakcyjne elementy oblężenia (ok. 6 obrazów; punkt 24) | ok. 100 | ok. 130 |
| Dźwięki (własny dźwięk monet, poprawki po odsłuchu autora; okładka z punktu 25 ok. 14 CU) | ok. 20 | ok. 30 |
| **Razem** | **ok. 1 350** | **ok. 1 900** |
Zrobione 16.11 i nie wchodzą już do sumy: 32 dźwięki ataku i śmierci wszystkich 16 jednostek poziomów 5–6, ikona Odrodzenia, animacje Rycerza Świtu i Wodza Hordy (bez ataku). Plan Starter pozwala na 2 równoległe zadania wideo.

**Kredyty Scenario: koszt jednej nowej frakcji (wszystkie grafiki i dźwięki; szacunek)**
Frakcja to ok. 3 bohaterów i 7 jednostek (`DECYZJE.md`): 10 postaci.
| Pozycja | Bez porażek | Z zapasem |
|---|---:|---:|
| 10 postaci: ilustracja karty (obraz `high` 14 CU, portret wycinany lokalnie za 0) + pełny zestaw animacji (obraz bazowy 14, trup 3, klipy chodu, ataku i śmierci 15 + 15 + 15, trafienie 10; latające +10) + dźwięki ataku i śmierci (2 CU) — ok. 88 CU na postać | ok. 880 | ok. 1 230 |
| Dodatkowe klipy: wzbicie i lot dla postaci latających (ok. 3), skrzydła i inne efekty | ok. 60 | ok. 90 |
| Osada: widok, budynki, siedliska 7 + drzewko (3 ikony) + garnizon i wieża maga (ok. 14 obrazów po 3–14 CU) | ok. 100 | ok. 140 |
| Arena frakcji (plansza bitwy, 1–2 duże obrazy), kafle mapy, herb, ikona mechaniki frakcji i jej efekt | ok. 70 | ok. 100 |
| Muzyka frakcji (2–3 utwory po ok. 30 CU) i dźwięki interfejsu frakcji | ok. 90 | ok. 100 |
| **Razem** | **ok. 1 200** | **ok. 1 650** |
Do tego ok. 3–4 h pracy nad pakowaniem, kontrolą i wpisami (`PRZEPIS_JEDNOSTKI.md`). Przy braku limitu jednej jednostki (100 CU) wychodzi ok. 1 000 CU samych postaci. Szacunek do aktualizacji po pierwszej nowej frakcji (Dzikie Stada), kiedy będzie znany koszt rzeczywisty.

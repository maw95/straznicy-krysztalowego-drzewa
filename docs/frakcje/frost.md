# Karta frakcji: Dwór Wiecznego Szronu (`frost`) — G1 zrobiona, liczby czekają na G2

Stan: 19.11.2026. Karta powstała z `FRAKCJE_PROPOZYCJE.md` (sekcja 7, zatwierdzona przez autora) i z rozstrzygnięć z 19.11: **żadnych wilków ani psów (Ryś Śnieżny zamiast Wilczycy Zamieci, Mamut Wiecznej Zimy zamiast Białego Wilka Zimy; Mamut przeszedł ze Stad do Szronu)**.
Szablon: `KARTA_FRAKCJI_SZABLON.md`. Liczby Ż/A/S i koszty są przybliżone (skala Przymierza, Stad, Umarłych i Klanów; autor kazał się nimi nie przejmować) i zostaną dostrojone przy bramce G2. Szron był w backlogu jako DLC (po Klanach); wdrożony wcześniej na polecenie autora. Czego **nie** robić: `ODRZUCONE_POMYSLY.md`.

## Tożsamość
- **Nazwa / id:** Dwór Wiecznego Szronu / `frost` (EN: Court of Everfrost).
- **Klimat:** dwór Marzanny, Pani Zimy, w lodowych salach na północy: olbrzymy, wiedźmy zamieci, śnieżny ryś, mamut, strzygi wichru. Zima nie jest zła, tylko nieubłagana.
- **Rola w grze:** kontrola.
- **Mechanika wyróżniająca: Szron** (budynek Pałac Szronu): cios jednostki Dworu nakłada szron, przy progu cel zamarza (traci aktywację); do tego izolowanie (lodowa ściana, porwanie).
- **Mocne strony / słabości:** zamrażanie dużych jednostek, dzielenie armii wroga; szron potrzebuje kilku ciosów, szybcy i agresywni (Stada, Horda) dobiegają, zanim zadziała.
- **Jak gra bot:** skupia ciosy na jednym celu, żeby go zamrozić (premia za szron na celu i za cios, który zamrozi), strzelcy i czarownice trzymają dystans, słabi wręcz się nie pchają; Lodową Ścianą odcina wroga, Dzwoneczkiem zamraża najbardziej oszronionego, Strzygą porywa strzelców, Długą Noc używa, gdy w pobliżu są co najmniej dwaj wrogowie; na mapie buduje Wieżę maga i Pałac Szronu (przez ogólną logikę mechaniki), Kryształową Grotę.

## Bohaterowie (3 + czwarty + 3 dowódców)
| Id | Nazwa | Typ | Rozm. | Ż | A | S | Ruch | Zasięg | Zdolność |
|---|---|---|---:|---:|---:|---:|---|---|---|
| `marzanna` | Marzanna, Pani Zimy | mędrzec | 1 | 6 | 2 | 3 | chód | dyst. | **Lodowa Ściana** (raz na bitwę): 3 pola muru z lodu w linii na 2 rundy |
| `frostJarl` | Jarl Szronu | wojownik | 2 | 12 | 5 | 3 | chód | wręcz | **Lodowy Cios** (raz na bitwę): trafiony zamarza |
| `snowLynx` | Ryś Śnieżny | łowca | 1 | 7 | 3 | 5 | chód | wręcz | **Ślad Zamieci** (stała): pola, przez które przebiegł, spowalniają wrogów do końca rundy |
| `oldHailer` | Stary Gradowy (4. bohater, 7–8 graczy) | mędrzec | 1 | 5 | 2 | 3 | chód | dyst. | **Grad Głazów** (stała): strzał trafia cel i jego sąsiadów, każdy dostaje szron |
Specjalności (poziom 5): Marzanna: czary +1 (Oddech Zimy); Jarl: pomocnicy +1 Ż (Dwór Olbrzymów); Ryś: +1 ruchu (Biegnąca z Wiatrem); Stary Gradowy: czary +1.
Dowódcy z karczmy: Rycerz Lodowej Gwardii (`iceKnight`, wojownik, 8/4/3, Lodowa Gwardia jak Twardogłowy), Łowczyni z Gronostajem (`ermineHuntress`, łowca, 5/3/4, Strzała z Soplem), Szronowa Wiedźma (`frostWitch`, mędrzec, 5/2/3, Zimowy Lament jak Lament Płaczki).

## Jednostki rekrutowane w osadzie (ceny: poziomy 1–5 = 2/3/5/8/12 zł, legenda 20 zł + 3 Pyły). Do rekrutacji idzie A (`tierUnits`), B (`altUnits`) tylko na poziomie 6
| Poziom | Id | Nazwa | Rozm. | Ż | A | S | Ruch | Zasięg | Zdolność | Siedlisko |
|---|---|---|---:|---:|---:|---:|---|---|---|---|
| 1 | `frostImp` | Chochlik Szronu | 1 | 5 | 2 | 4 | lot | dyst. | Lodowa Igła: raz na bitwę trafiony −2 S | — |
| 1 | `ermine` | Gronostaj Dworski | 1 | 5 | 2 | 4 | chód | wręcz | Zza Zaspy: +1 A od tyłu (jak Zajście od tyłu) | — |
| 1 | `courtPage` | Szronowy Paź | 1 | 5 | 2 | 3 | chód | dyst. | Kryształowa Strzała: +1 obrażeń w cel z szronem | — |
| 2A | `blizzardWitch` | Wiedźma Zamieci | 1 | 7 | 3 | 3 | chód | dyst. | Klątwa Chłodu: raz na bitwę trafiony −1 A | Chata na Lodzie |
| 2B | `glacierYak` | Jak Lodowcowy | 1 | 10 | 3 | 3 | chód | wręcz | Gęste Futro: −1 obrażeń od strzał | Zagroda Jaków |
| 3A | `iceSentinel` | Rycerz Lodowej Zbroi | 1 | 9 | 3 | 3 | chód | wręcz | Mroźna Zbroja: kto go trafi wręcz, dostaje szron | Lodowa Strażnica |
| 3B | `frostSprite` | Rusałka Szronu | 1 | 6 | 3 | 4 | lot | dyst. | Szklany Dzwoneczek: raz na bitwę zamraża wroga ze szronem w zasięgu 4 | Sopelkowa Grota |
| 4A | `youngGiant` | Młody Olbrzym Szronu | 2 | 13 | 4 | 3 | chód | wręcz | Zmrażający Uścisk: raz na bitwę trafiony nie rusza się i dostaje szron | Obóz Olbrzymów |
| 4B | `windStrzyga` | Strzyga Wichru | 1 | 7 | 4 | 5 | lot | wręcz | Porwanie: raz na bitwę mały wróg w zasięgu 2 trafia 2–3 pola dalej, z dala od swoich | Wichrowy Szczyt |
| 5A | `elderGiant` | Olbrzym Gradu | 2 | 14 | 5 | 2 | chód | dyst. | Grad Głazów: cel i sąsiedzi dostają cios i szron | Gradowa Turnia |
| 5B | `auroraSpirit` | Duch Zorzy | 1 | 9 | 4 | 4 | lot | dyst. | Zimne Światło: wrogowie w promieniu 2 mają −1 S | Wieża Zorzy |
| 6 | `frostMammoth` | Mamut Wiecznej Zimy | 2 | 24 | 7 | 3 | chód | wręcz | Długa Noc: raz na bitwę każdy wróg dostaje szron; nie do odepchnięcia | Mamucia Grań |

## Osada
- **Pałac Szronu** (mechanika, rodzic: Wieża maga = `magic`; koszt jak Sala Tarcz): I: każdy cios jednostki Dworu nakłada 1 szron, przy 3 zamarza · II: przy 2 · III: zamrożony dostaje +1 obrażeń od następnego ciosu · IV: każdy szron to też −1 S.
- **Kryształowa Grota** (gospodarka, rodzic: Skarbiec): I: +1 rudy na rundę z każdej osady z nią · II: +1 Pyłu co 3 rundy (jak Głęboka Sztolnia).
- **Wieża Zamieci** (mapa, rodzic: Fosa i Mury; I: 4 zł + 2 rudy, II: 6 zł + 2 rudy + 1 Pył): wrodzy bohaterowie w promieniu 2 (II: 3) od osady mają na starcie tury −1 punkt ruchu (pozycja „Wieża Zamieci (wróg)” w rozbiciu ruchu).
- **Iskra:** Lodowy Tron Pierwotnej Iskry: wrogowie zaczynają każdą bitwę z 1 szronem.
- **Nazwy osad:** Szronowy Dwór, Biała Cytadela, Zamarzły Bród, Sopelkowa Wieża, Mroźna Przełęcz, Jezioro Ciszy, Śnieżna Brama, Gradowa Turnia, Dwór Marzanny, Zimowa Przystań, Szklany Las, Północne Wrota.

## Wygląd i dźwięk
Paleta: biel, srebro, perłowa szarość, zimne złoto, ciemna zieleń świerków, blady róż zorzy; **lód biały i srebrny, nigdy niebieski** (tło do wycinania to #0000FF); zastępcze grafiki w perłowej szaro-zielonej barwie. Herb: płatek śniegu w koronie. Arena: zamarznięte jezioro, ośnieżone świerki, lodowe kolce. Muzyka: dzwoneczki, wiolonczela, chór żeński, wiatr. Lista zastępczej grafiki: `BACKLOG.md`, sekcja 2a.

## Silnik: prymitywy użyte i dodane (G1)
- **Dodane** (`battle.ts`, `primitives.ts`, `types.ts`): szron jako licznik na jednostce (`status.frost`, `applyFrost`, `freezeUnit`, próg wg poziomu Pałacu), zamrożenie (ta sama logika co ogłuszenie `stunned`), kruchy lód (`brittle`), spowolnienie od szronu (`frostSlow`), premia za stan celu (Kryształowa Strzała), pancerz na typ ciosu (Gęste Futro), odbicie szronu (Mroźna Zbroja), stawianie przeszkody z czasem życia (`BattleState.ice`, `iceWallCells`), ślad na polach (`BattleState.trail`), przestawienie wroga (`abductCell`), aura osłabiająca (`status.auraChill`), obszar wokół celu (Grad, jak Ostrzał), szron globalny (Długa Noc, Iskra `sparkFrost`), kara ruchu na mapie (`blizzardSlow` w `game.ts`).
- **Powtórki:** Zajście od tyłu (Harpia), Złowroga Klątwa, Twardogłowy, Lament, dochód Sztolni (Grota).

## Balans (G2)
Cel 45–55% w każdej parze z Przymierzem i Hordą (`make sim-tabele`). Szybki pomiar G1 (`npx tsx scripts/sim/szron.ts 100`, 100 gier na komórkę, poziom Imperium, mapa długa prostokątna, miejsca na zmianę): Szron wygrywa z Przymierzem 44% (Kontrola) i 43% (Podbój), z Hordą 59% i 51%. Jedna korekta liczb po pierwszym pomiarze (35–39% z Przymierzem): +1 Ż pomocnikom poziomu 1, więcej Ż wyższym jednostkom i bohaterom, Jarl 5 A. Dalej bez strojenia (decyzja autora). Uwaga: partie botów trwają 4–6 rund, więc Pałac Szronu (a z nim szron od zwykłych ciosów) bywa budowany rzadko; do G2: tańszy lub wcześniejszy dostęp (jego rodzic to Wieża maga).

## Decyzje implementacyjne (G1, 19.11.2026; autor nieobecny, wybrane najprostsze rozwiązania zgodne z kartą)
- **Szron:** licznik do końca bitwy (nie opada). Zwykłe ciosy nakładają szron tylko gdy strona ma Pałac Szronu (poziom ≥ 1); zdolności (Mroźna Zbroja, Grad Głazów, Zmrażający Uścisk, Długa Noc) nakładają go zawsze. Próg (3, od II poziomu 2) liczy się wg Pałacu strony, która nakłada szron (bez Pałacu: 3). Cios nakłada szron, gdy cel przeżył i stracił Ż.
- **Zamrożenie:** `status.stunned` (jednostka traci najbliższą aktywację, szron znika). Poziom III: zamrożony dostaje +1 obrażeń (w skali) od następnego ciosu; kruchość kończy się po tym ciosie albo po utraconej aktywacji. Poziom IV: każdy szron to −1 S. Odporność Umarłych na statusy nie obejmuje szronu i zamrożenia; spowolnienie, unieruchomienie i klątwa ją respektują.
- **Lodowa Ściana:** pola wybiera silnik (3 w linii, w zasięgu 3 od Marzanny, jak najbliżej wroga, najbardziej w poprzek linii do niego), bez wyboru gracza; stoi w rundzie rzucenia i następnej, potem znika; rysowana jako `wall.webp`.
- **Ślad Zamieci:** nie zmienia kosztu ruchu: wróg, który przejdzie przez pole śladu albo na nim stanie (w tej samej rundzie), ma −1 S w następnej aktywacji; ślad nie jest rysowany.
- **Porwanie:** tylko jednostka jednopolowa i nie unieruchomiona; cel ląduje na wolnym polu 2–3 od starego, najdalej od swoich; zdolność wymaga celu w zasięgu 2.
- **Gęste Futro:** dotyczy ataków dystansowych, cios zadaje co najmniej 1. **Mroźna Zbroja:** szron dostaje atakujący wręcz, gdy cios zadał obrażenia. **Zimne Światło:** aura liczona na początku rundy i aktywacji, nie sumuje się. **Długa Noc:** każdy wróg +1 szron (może zamrozić); Mamut jest nieodpychalny.
- **Pałac Szronu:** rodzic `magic` (Wieża maga). **Wieża Zamieci:** efekt liczony raz na turę bohatera (nie sumuje się z kilku wież). **Iskra:** szron dostają wszystkie jednostki po drugiej stronie (też neutralni) na początku walki; na IV poziomie Pałacu ten szron też spowalnia.
- **Ziemia (mapa):** zastępczo łąki Przymierza. Arena zastępcza (obrazy Przymierza i Hordy w innym układzie, tło `arena/cyfrowa/frost.webp`).
- **Cele i tryby:** tylko rywalizacja cyfrowa (Kontrola, Podbój, Relikt); koop, arena i online odrzucają frakcję (backlog 51a). Przy stole najwyżej cztery frakcje.
- **Test na ekranie:** `npx tsx scripts/browser/szron.ts` (kreator oferuje frakcję, panel testowy buduje wszystko, trzy budynki stoją w oknie osady, Pałac Szronu otwiera się z opisem, w grze botów widać bitwę z jednostką Dworu, bez błędów w konsoli).

## Lista uproszczeń (do G4 albo decyzji autora)
1. Lodowa Ściana: pola wybiera silnik, nie gracz.
2. Ślad Zamieci: spowolnienie przy wejściu na pole, nie koszt ruchu; niewidoczny na arenie.
3. Porwanie tylko dla małych, nieunieruchomionych celów, bez wyboru pola.
4. Szron bez Pałacu nie powstaje od zwykłych ciosów; w krótkich partiach botów Pałac rzadko stoi.
5. Brak grafiki własnej (zastępcza: `make placeholders`; ikony zdolności pożyczone w `ABILITY_ART`), brak arenowych przeszkód i kafli Dworu, brak obrazu lodowej ściany innego niż `wall.webp`, brak znaczników szronu na figurach (jest odznaka w panelu statusu), brak muzyki.
6. Brak instrukcji gry PL/EN (G5) i koopu/online (51a).

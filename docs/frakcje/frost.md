# Karta frakcji: Dwór Wiecznego Szronu (`frost`) — G1 zrobiona, liczby czekają na G2

Stan: 19.11.2026. Karta powstała z `FRAKCJE_PROPOZYCJE.md` (sekcja 7, zatwierdzona przez autora) i z rozstrzygnięć z 19.11: **żadnych wilków ani psów (Ryś Śnieżny zamiast Wilczycy Zamieci, Mamut Wiecznej Zimy zamiast Białego Wilka Zimy; Mamut przeszedł ze Stad do Szronu)**.
Szablon: `KARTA_FRAKCJI_SZABLON.md`. Liczby Ż/A/S i koszty są przybliżone (skala Przymierza, Stad, Umarłych i Klanów; autor kazał się nimi nie przejmować) i zostaną dostrojone przy bramce G2. Szron był w backlogu jako DLC (po Klanach); wdrożony wcześniej na polecenie autora. Czego **nie** robić: `ODRZUCONE_POMYSLY.md`.

**Zmiana jednostki z 20.11.2026 (zatwierdzona przez autora):** Strzyga Wichru → Dziad Mróz (T4B, zdolność Uścisk Mrozu (zamiast Porwania); stary władca mrozu z brodą z sopli). Siedlisko: Chata Dziada Mroza. Strzyga przechodzi do Umarłych (zamiast Kościanej Wróżki).

## Tożsamość
- **Nazwa / id:** Dwór Wiecznego Szronu / `frost` (EN: Court of Everfrost).
- **Klimat:** dwór Marzanny, Pani Zimy, w lodowych salach na północy: olbrzymy, wiedźmy zamieci, śnieżny ryś, mamut, strzygi wichru. Zima nie jest zła, tylko nieubłagana.
- **Rola w grze:** kontrola.
- **Mechanika wyróżniająca: Szron** (budynek Pałac Szronu): cios jednostki Dworu nakłada szron, przy progu cel zamarza (traci aktywację); do tego izolowanie (lodowa ściana, porwanie).
- **Mocne strony / słabości:** zamrażanie dużych jednostek, dzielenie armii wroga; szron potrzebuje kilku ciosów, szybcy i agresywni (Stada, Horda) dobiegają, zanim zadziała.
- **Jak gra bot:** skupia ciosy na jednym celu, żeby go zamrozić (premia za szron na celu i za cios, który zamrozi), strzelcy i czarownice trzymają dystans, słabi wręcz się nie pchają; Lodową Ścianą odcina wroga, Dzwoneczkiem zamraża najbardziej oszronionego, Dziadem Mrozem porywa strzelców, Długą Noc używa, gdy w pobliżu są co najmniej dwaj wrogowie; na mapie buduje Wieżę maga i Pałac Szronu (przez ogólną logikę mechaniki), Kryształową Grotę.

## Bohaterowie (3 + czwarty + 3 dowódców)
| Id | Nazwa | Typ | Rozm. | Ż | A | S | Ruch | Zasięg | Zdolność |
|---|---|---|---:|---:|---:|---:|---|---|---|
| `marzanna` | Marzanna, Pani Zimy | mędrzec | 1 | 6 | 2 | 3 | chód | dyst. | **Lodowa Ściana** (raz na bitwę): 3 pola muru z lodu w linii na 2 rundy |
| `frostJarl` | Jarl Szronu | wojownik | 2 | 12 | 5 | 3 | chód | wręcz | **Lodowy Cios** (raz na bitwę): trafiony zamarza |
| `snowLynx` | Ryś Śnieżny | łowca | 1 | 7 | 3 | 5 | chód | wręcz | **Ślad Zamieci** (stała): pola, przez które przebiegł, spowalniają wrogów do końca rundy |
| `oldHailer` | Stary Gradowy (4. bohater, 7–8 graczy) | mędrzec | 1 | 5 | 2 | 3 | chód | dyst. | **Grad Głazów** (stała): strzał trafia cel i jego sąsiadów, każdy dostaje szron |
Specjalności (poziom 5): Marzanna: czary +1 (Oddech Zimy); Jarl: pomocnicy +1 Ż (Dwór Olbrzymów); Ryś: +1 ruchu (Biegnąca z Wiatrem); Stary Gradowy: czary +1.
Dowódcy z karczmy: Rycerz Lodowej Gwardii (`iceKnight`, wojownik, 8/4/3, Lodowa Gwardia jak Twardogłowy), Tropicielka Mroźnych Puszcz (`ermineHuntress`, dawniej Łowczyni z Gronostajem, łowca, 5/3/4, Strzała z Soplem), Szronowa Wiedźma (`frostWitch`, mędrzec, 5/2/3, Zimowy Lament jak Lament Płaczki).

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
| 4B | `dziadMroz` | Dziad Mróz | 1 | 7 | 4 | 5 | chód | wręcz | Uścisk Mrozu (zatwierdzone 20.11): raz na bitwę wróg w zasięgu 2 pól dostaje 2 szrony (przy progu zamarza); dotyk lodowej brody, bez lotu | Chata Dziada Mroza |
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
Cel autora w G2 (19.11): 45–55% w każdej parze (przyjmowane 42–58%). **Zastąpiony 20.11:** frakcje mają się kontrować (średnia 45–55%, kierunek pary wg tabeli „Kto z kim”; zob. BACKLOG punkt 52), więc G2 tych frakcji do powtórzenia w nowym kluczu. Pomiar: `make sim-nowe GAMES=600` (`scripts/sim/nowe-frakcje.ts`): 600 gier na komórkę (±4 pkt), poziom Imperium, mapa długa prostokątna, miejsca na zmianę, cele Kontrola / Podbój / Relikt. Pierwsza liczba to wygrane tej frakcji w %.

Zmierzone 19.11.2026, przed strojeniem i po (Kontrola / Podbój / Relikt):

| Para | Przed | Po |
|---|---|---|
| Szron – Przymierze | 47 / 42 / 44 | 44 / 41 / 41 |
| Szron – Horda | 63 / 61 / 61 | 62 / 58 / 59 |
| Szron – Stada | 63 / 67 / 62 | 49 / 52 / 51 |
| Szron – Umarli | 61 / 63 / 59 | 53 / 53 / 50 |
| Szron – Klany | 60 / 59 / 56 | 59 / 58 / 55 |

**Sufit pomiaru:** Przymierze wygrywa z Hordą 65% (Kontrola 65, Podbój 66, Relikt 65; obu frakcji nie wolno ruszać), więc frakcja, która ma 42–45% z Przymierzem, ma z Hordą ok. 58–62%. Oba końce pasma naraz (≥45% z Przymierzem i ≤55% z Hordą) są przy tej różnicy nieosiągalne; wybrałem środek: ok. 42–46% z Przymierzem i ok. 60% z Hordą (kilka punktów nad pasmem akceptowalnym, nie do usunięcia bez ruszania Hordy).

**Zmienione liczby (w `src/engine/data.ts`; tabele jednostek powyżej to nadal propozycja z karty):**
- **Wszyscy czterej bohaterowie Szronu: Ż −1** (Marzanna 5, Jarl 11, Ryś 6, Stary Gradowy 4). Szron wygrywał ze wszystkimi nowymi frakcjami (56–67%); lekki nerf bohaterów zbliżył go do reszty, a wynik z Przymierzem (ok. 42%) zostaje na dolnej granicy pasma.

**Obserwacja o botach:** w grach botów liczą się bohaterowie i trzej pomocnicy startowi; zmiana Ż jednostek rekrutowanych (poziomy 2–5) nie zmieniła wyniku ani jednej gry (sprawdzone na Klanach: 4 jednostki naraz, identyczne liczby wygranych; przypuszczalnie nie są rekrutowane w krótkich partiach botów), więc liczby tych jednostek zostają z karty, a strojenie dotyczy bohaterów i pomocników startowych.

**Zostaje do decyzji autora:** Pałac Szronu (szron od zwykłych ciosów) w krótkich partiach botów bywa budowany rzadko, więc „kontrola” to w botach głównie Chochlik, Lodowa Ściana i Ślad; progi Szronu (`frostThreshold`) nie były ruszane. Jeśli autor chce Szronu z pełną mechaniką w krótkich partiach, trzeba obniżyć koszt Pałacu albo zmienić rodzica (Wieża maga).

## Decyzje implementacyjne (G1, 19.11.2026; autor nieobecny, wybrane najprostsze rozwiązania zgodne z kartą)
- **Szron:** licznik do końca bitwy (nie opada). Zwykłe ciosy nakładają szron tylko gdy strona ma Pałac Szronu (poziom ≥ 1); zdolności (Mroźna Zbroja, Grad Głazów, Zmrażający Uścisk, Długa Noc) nakładają go zawsze. Próg (3, od II poziomu 2) liczy się wg Pałacu strony, która nakłada szron (bez Pałacu: 3). Cios nakłada szron, gdy cel przeżył i stracił Ż.
- **Zamrożenie:** `status.stunned` (jednostka traci najbliższą aktywację, szron znika). Poziom III: zamrożony dostaje +1 obrażeń (w skali) od następnego ciosu; kruchość kończy się po tym ciosie albo po utraconej aktywacji. Poziom IV: każdy szron to −1 S. Odporność Umarłych na statusy nie obejmuje szronu i zamrożenia; spowolnienie, unieruchomienie i klątwa ją respektują.
- **Lodowa Ściana:** pola wybiera silnik (3 w linii, w zasięgu 3 od Marzanny, jak najbliżej wroga, najbardziej w poprzek linii do niego), bez wyboru gracza; stoi w rundzie rzucenia i następnej, potem znika; rysowana jako `wall.webp`.
- **Ślad Zamieci:** nie zmienia kosztu ruchu: wróg, który przejdzie przez pole śladu albo na nim stanie (w tej samej rundzie), ma −1 S w następnej aktywacji; ślad nie jest rysowany.
- **Uścisk Mrozu (Dziad Mróz):** zdolność swobodna, raz na bitwę (`beardChill`): wybrany wróg w zasięgu 2 pól (`beardRange`) dostaje 2 szrony (`beardFrost`) przez `applyFrost`, więc przy progu Pałacu zamarza. Dziad Mróz chodzi (dawne Porwanie i lot usunięte); statystyki bez zmian do G2.
- **Gęste Futro:** dotyczy ataków dystansowych, cios zadaje co najmniej 1. **Mroźna Zbroja:** szron dostaje atakujący wręcz, gdy cios zadał obrażenia. **Zimne Światło:** aura liczona na początku rundy i aktywacji, nie sumuje się. **Długa Noc:** każdy wróg +1 szron (może zamrozić); Mamut jest nieodpychalny.
- **Pałac Szronu:** rodzic `magic` (Wieża maga). **Wieża Zamieci:** efekt liczony raz na turę bohatera (nie sumuje się z kilku wież). **Iskra:** szron dostają wszystkie jednostki po drugiej stronie (też neutralni) na początku walki; na IV poziomie Pałacu ten szron też spowalnia.
- **Ziemia (mapa):** zastępczo łąki Przymierza. Arena zastępcza (obrazy Przymierza i Hordy w innym układzie, tło `arena/cyfrowa/frost.webp`).
- **Cele i tryby:** tylko rywalizacja cyfrowa (Kontrola, Podbój, Relikt); koop, arena i online odrzucają frakcję (backlog 51a). Przy stole najwyżej cztery frakcje.
- **Test na ekranie:** `npx tsx scripts/browser/szron.ts` (kreator oferuje frakcję, panel testowy buduje wszystko, trzy budynki stoją w oknie osady, Pałac Szronu otwiera się z opisem, w grze botów widać bitwę z jednostką Dworu, bez błędów w konsoli).

## Lista uproszczeń (do G4 albo decyzji autora)
1. Lodowa Ściana: pola wybiera silnik, nie gracz.
2. Ślad Zamieci: spowolnienie przy wejściu na pole, nie koszt ruchu; niewidoczny na arenie.
3. Uścisk Mrozu: statystyki Dziada Mroza po zmianie lotu na chód do sprawdzenia na G2.
4. Szron bez Pałacu nie powstaje od zwykłych ciosów; w krótkich partiach botów Pałac rzadko stoi.
5. Brak grafiki własnej (zastępcza: `make placeholders`; ikony zdolności pożyczone w `ABILITY_ART`), brak arenowych przeszkód i kafli Dworu, brak obrazu lodowej ściany innego niż `wall.webp`, brak znaczników szronu na figurach (jest odznaka w panelu statusu), brak muzyki.
6. Brak instrukcji gry PL/EN (G5) i koopu/online (51a).

# Nowe frakcje — propozycje (8 nowych, razem 10)

Stan: 18.11.2026, uwagi autora z 19.11 i 20.11 naniesione (punkt 14). Dokument do przeczytania i skreślania. Rozwija macierz z `FRAKCJE_MACIERZ_I_PRYMITYWY.md` (role, prymitywy,
kolizje) i pomysły autora z `ROZBUDOWA_CYFROWA.md` (3.11) w pełne karty frakcji. **Nie ma tu kosztów budynków ani statystyk**
(Ż, A, S): te ustalają symulacje balansu przy bramce G2. Każda frakcja ma też sekcję **Alternatywy** (inne jednostki, budynki,
mechanika), a na końcu są **frakcje zapasowe**, gdyby któraś z ośmiu nie przypadła do gustu.

**19.11.2026: naniesione uwagi autora** (zmiany składu w Stadach, Umarłych, Klanach, Kompaniach, Szronie i Przypływach;
otwarte sprawy w punkcie 14). Odrzucone jednostki, nazwy i mechaniki trafiają do `docs/frakcje/ODRZUCONE_POMYSLY.md`, bo
mogą się przydać później. **Zasada: żadnych nowych wilków ani psów** (wilki mają już Przymierze i Horda).

Kolejność wdrażania zostaje jak w backlogu (punkty 52–55): **Dzikie Stado → Królestwo Umarłych → Żelazny Klan → DLC**.

**Jak czytać tabele**
- *Rozm.*: 1 albo 2 heksy (duża jednostka). *Ruch*: chód / lot. *Walka*: wręcz / dyst. (dystansowa).
- *Typ bohatera* (poziom 5): wojownik (+Ż z poziomem), łowca (+A co 2 poziomy), mędrzec (+mana, mocniejsze czary).
- *Specjalność* korzysta z pól, które silnik już zna (`heroTypes.ts`): `supportHp`, `move`, `spellPower`, `marksman`, `xp`, `gold`, `regen`.
- *Prymityw*: klocek silnika ze zdolności (`FRAKCJE_MACIERZ_I_PRYMITYWY.md`). **★ = nowy prymityw**, którego jeszcze nie ma
  ani w `battle.ts`, ani w `primitives.ts`. „reuse: X” = ta sama logika co istniejąca zdolność X, inna nazwa i wygląd.
- „N” w opisach to liczba do ustalenia przy balansie.

---

## Spis treści
1. [Przegląd 10 frakcji](#1-przegląd-10-frakcji)
2. [Co trzeba dostarczyć dla jednej frakcji](#2-co-trzeba-dostarczyć-dla-jednej-frakcji)
3. [Dzikie Stado](#3-dzikie-stada-herds)
4. [Królestwo Umarłych](#4-królestwo-umarłych-undead)
5. [Żelazny Klan](#5-żelazne-klany-clans)
6. [Wolna Kompania](#6-wolne-kompanie-free)
7. [Dwór Wiecznego Szronu](#7-dwór-wiecznego-szronu-frost)
8. [Pustynne Cesarstwo](#8-pustynne-cesarstwo-sands)
9. [Rój Puszczy](#9-rój-puszczy-swarm)
10. [Bractwo Przypływu](#10-bractwo-przypływu-tides)
11. [Nowe prymitywy silnika (zbiorczo)](#11-nowe-prymitywy-silnika-zbiorczo)
12. [Frakcje zapasowe](#12-frakcje-zapasowe-alternatywy-dla-całych-frakcji)
13. [Decyzje do podjęcia](#13-decyzje-do-podjęcia)

---

## 1. Przegląd 10 frakcji

| # | Frakcja (`id`) | EN | Rola | Mechanika frakcji (budynek) | Bonus Reliktu (Iskra) | Barwa w UI |
|---|---|---|---|---|---|---|
| 1 | Przymierze Świtu (`dawn`) | Dawn Alliance | obrona + wsparcie | Blask Świtu — leczenie co rundę (Kapliczka Świtu) | +2 Ż wszystkim | zieleń |
| 2 | Mroczna Horda (`horde`) | Dark Horde | agresja | Żądza Krwi — +A po zabiciu wroga (Jama Krwi) | +1 A wszystkim | bordo |
| 3 | **Dzikie Stado** (`herds`) | Wild Herd | agresja + mobilność | **Tętent** — rozpęd odpycha cel, zderzenie rani (Kamień Tętentu) | +1 S wszystkim | ochra / słoma |
| 4 | **Królestwo Umarłych** (`undead`) | Barrow Kingdom | wyczerpanie | **Wieczna Warta** — polegli pomocnicy wstają (Kurhan Wiecznej Warty) | odporność na trucizny, klątwy, spowolnienia | popielata zieleń |
| 5 | **Żelazny Klan** (`clans`) | Iron Clan | obrona | **Mur Tarcz** — pancerz w zwartym szyku (Sala Tarcz) | pancerz 1 wszystkim | stal / miedź |
| 6 | **Wolna Kompania** (`free`) | Free Company | kontrola + mobilność | **Sidła** — ukryte pułapki przed bitwą (Warsztat Sideł) | +2 pułapki w każdej bitwie | rdzawy pomarańcz |
| 7 | **Dwór Wiecznego Szronu** (`frost`) | Court of Everfrost | kontrola | **Szron** — ciosy nakładają szron, przy progu cel zamarza (Pałac Szronu) | wrogowie zaczynają bitwę z 1 szronem | biel / lodowy błękit |
| 8 | **Pustynne Cesarstwo** (`sands`) | Desert Empire | mobilność | **Miraż** — atrapy własnych jednostek (Pałac Mirażu) | przestawienie 2 jednostek po rozstawieniu | złoto / piasek |
| 9 | **Rój Puszczy** (`swarm`) | Swarm of the Wilds | wyczerpanie + kontrola | **Grzybnia** — zajmowanie pól areny (Serce Grzybni) | grzybnia na starcie bitwy | fiolet-brąz |
| 10 | **Bractwo Przypływu** (`tides`) | Brotherhood of the Tide | obrona + kontrola | **Przypływ** — zamiana miejsc z sojusznikiem (Świątynia Pływów) | Perłowa Tarcza (pochłania 2) | morska zieleń |

Barwa w UI to kolor miejsca w kreatorze (`SEAT_TINT`) i herbu. Niebieski jest tu dozwolony; zakaz niebieskiego dotyczy tylko
grafik jednostek (tło do wycinania #0000FF, `STYL_JEDNOSTEK.md`).

### Kto z kim (zamysł kontr; cel balansu wg decyzji autora z 20.11)

Balans nie dąży do 45–55% w każdej parze: średnia przeciw wszystkim ok. 45–55%, a kierunek pary ma zgadzać się z tabelą (kontra ok. 60–70%, kontrowana ok. 30–40%, bez relacji ok. 45–55%, nigdy poniżej 30% ani powyżej 70%).

| Frakcja | Kontruje (60–70%) | Jest kontrowana przez (30–40%) |
|---|---|---|
| Przymierze | Horda, Stada, Kompanie | Umarli, Piaski, Rój |
| Horda | Umarli, Szron, Piaski | Przymierze, Klany, Przypływy |
| Stada | Szron, Piaski, Kompanie | Przymierze, Klany, Przypływy |
| Umarli | Przymierze, Klany | Horda, Rój |
| Klany | Horda, Stada | Umarli, Kompanie, Szron |
| Kompanie | Klany, Przypływy | Przymierze, Stada, Rój |
| Szron | Klany, Przypływy, Rój | Horda, Stada, Piaski |
| Piaski | Przymierze, Szron, Rój | Horda, Stada |
| Rój | Przymierze, Umarli, Kompanie | Szron, Piaski |
| Przypływy | Horda, Stada | Szron, Kompanie |

**Zatwierdzone przez autora 20.11.2026** (symetryczna tabela: kto kontruje, ten jest po drugiej stronie kontrowany; pozostałe pary to „brak relacji”, 45–55%). Zmiany względem wcześniejszego szkicu: Przymierze kontruje też Stada i Kompanie (poza Hordą); Horda kontruje też Piaski; Rój kontruje Kompanie i Umarłych (Kompanie nie kontrują już Roju); Piaski kontrują Rój; pary Kompanie–Piaski i Kompanie–Rój bez wzajemnej przewagi poza wpisami wyżej. Dlaczego (zamysł): rozpęd Stad rozbija kontrolę i atrapy, ale Klany i Przypływy go nie przyjmują; szyk tarcz Klanów trzyma szarże, lecz wolnych rozbierają kontrola i wyczerpanie; pułapki Kompanii karzą wolny szyk, ale szybcy je przeskakują; zamrożenie Szronu karze wolnych; grzybnia Roju karze stojących; Piaski grają ruchem i atrapami; Przypływy rotują rannych.
---

## 2. Co trzeba dostarczyć dla jednej frakcji

Lista z kodu (`src/engine/factions/types.ts`, `tests/factionContract.test.ts`, `kingdom.ts`, `heroTypes.ts`, `empire.ts`).
Każda karta niżej wypełnia punkty 1–10, punkty 11–17 robi Claude po zatwierdzeniu karty (bramki G1–G5).

| # | Element | Gdzie w kodzie | Ile |
|---|---|---|---|
| 1 | Nazwa, id, klimat, rola, mechanika | `FactionPack.name`, `mechanic` | 1 |
| 2 | Bohaterowie główni (typ, zdolność, specjalność) | `UNITS`, `HERO_TYPES`, `SPECIALTIES` | 3 |
| 3 | Dowódcy z karczmy (wojownik, łowca-strzelec, mędrzec) | `UNITS` (kind `hero`), `realm.ts` | 3 |
| 4 | Czwarty bohater (gra 7–8 graczy, backlog 56) | `UNITS` | 1 (opcjonalnie) |
| 5 | Pomocnicy tieru 1 | `FactionPack.supports` | 3 |
| 6 | Jednostki tierów 2–5 i ich alternatywy | `tierUnits`, `altUnits` | 4 + 4 |
| 7 | Legenda (tier 6) | `legend` | 1 |
| 8 | Siedliska (nazwa + dopełniacz jednostki) | `DWELLING_NAMES`, `GENITIVE` | 9 |
| 9 | 3 budynki unikalne (pierwszy = mechanika, 4 poziomy) z rodzicem w drzewie | `buildings`, `BUILDING_NAMES`, `BUILDING_PARENT`, `ECONOMY.cost` | 3 |
| 10 | Budynek Iskry i bonus Reliktu; nazwy osad (≥10) | `sparkName`, `SPARK_TEXTS`, `settlementNames` | 1 + 12 |
| 11 | Zdolności w silniku + testy | `battle.ts`, `primitives.ts`, `tests/primitives.test.ts` | ok. 15–20 |
| 12 | Bot: mapa (dziś „po dobremu” / „po hordziemu”) i bitwa | `ai/adventureAi.ts`, AI bitwy | 1 profil |
| 13 | Grafika: karta, portret, arkusz klatek, dźwięk ataku i śmierci na jednostkę; herb, arena, kafle ziemi, okno osady (3 budynki + 9 siedlisk + Iskra), ikony zdolności i budynków | `public/assets`, `sprites.ts`, `assets.json` | ok. 22 postaci |
| 14 | Muzyka (2–3 utwory) | `public/assets/music` | 2–3 |
| 15 | Teksty angielskie | `src/i18n/en/*.ts` | wszystkie nowe |
| 16 | Instrukcja PL + EN, CHANGELOG | `src/content/instrukcja.*.md` | — |
| 17 | Balans: średnia 45–55%, pary wg kontr z tabeli „Kto z kim” (decyzja 20.11), golden świadomie | `make sim-tabele`, `tests/golden.test.ts` | — |

Frakcje z **ukrytą informacją** (Wolna Kompania: ukryte pułapki; Pustynne Cesarstwo: miraże) potrzebują dodatkowo: ekranu
przekazania w hotseacie, ukrywania stanu przed przeciwnikiem w grze przez internet (serwer) i bota, który nie podgląda.
To osobne zadanie, liczone przy tych frakcjach.

**Decyzja 19.11 (hot-seat):** robimy ukrytą informację. Zasłona „przekaż urządzenie” tylko wtedy, gdy właściciel robi coś ukrytego:
(1) przy rozstawianiu, (2) przy użyciu zdolności w trakcie bitwy (Fortel Atamanki, Lustro Wydm Tancerki), (3) przyciskiem „Podejrzyj”
dla własnych pułapek i mirażów. W turach przeciwnika zasłon nie ma, a dziennik walki nie podaje pól ukrytych obiektów. Trafiona
pułapka i rozbity miraż są jawne.

---

## 3. Dzikie Stado (`herds`)

**EN:** Wild Herd · **Rola:** agresja + mobilność · **Kolejność:** pierwsza (pilot procesu)

**Klimat.** Wędrowne stada stepów i puszcz: tury, żubry, nosorożce i łosie, prowadzone przez satyrów z rogami i dudami.
Nie mają osad w naszym rozumieniu: ich osady to obozowiska przy wodopojach i kamiennych kręgach. Walczą rozpędem: kto
stoi na drodze stada, ląduje na skale.

**Mechanika wyróżniająca: Tętent.** Przymierze ma już premie za bieg (Król Jednorożców, Odyniec, Biały Jeleń), więc
Stada różnią się **odepchnięciem i zderzeniem**: rozpędzona jednostka spycha cel, a cel, który uderzy w przeszkodę, krawędź
areny albo inną jednostkę, dostaje dodatkowe obrażenia. Arena Stad ma dużo głazów.

**Mocne strony:** inicjatywa, szybkie dojście do strzelców, rozbijanie szyków, podbój mapy.
**Słabości:** brak leczenia, słabi strzelcy, mury osad (potrzebują Nosorożca), jednostki niewzruszone (Klany).

### Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `greatAurochs` | Wielki Tur, Ojciec Stada | wojownik | 2 | chód | wręcz | **Rogi Przodków:** raz na bitwę szarża w linii prostej do N pól; mali wrogowie na drodze zepchnięci na bok, cel na końcu odepchnięty o 2 (zderzenie rani) | Przewodnik Stada: pomocnicy +1 Ż (`supportHp`) |
| `satyrHornlord` | Satyr Rogogłos | mędrzec | 1 | chód | dyst. | **Róg Wędrówki:** raz na bitwę wszyscy sojusznicy +N S w następnej aktywacji | Dzika Pieśń: czary +1 (`spellPower`) |
| `windAntelope` | Pędziwiatr, Wódz Antylop | łowca | 1 | chód | wręcz | **W Biegu:** raz na bitwę po ataku dokańcza ruch pozostałymi polami | Wędrowiec Stepu: +1 ruchu (`move`) |

**Dowódcy (karczma):** Turzy Zagończyk (wojownik), Orzeł Stepowy Łowca (łowca, dyst.), Płanetnik (mędrzec).
**Czwarty bohater (7–8 graczy):** Baran Gromowładny (wojownik, odepchnięcie po każdym ataku).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Satyr Dudziarz (`satyrPiper`) | satyr z dudami; atak dystansowy to fala dźwięku: drżenie powietrza i podmuch kurzu, bez kolorowych nut (decyzja 20.11) | 1 | chód | dyst. | Skoczny Rytm: raz na bitwę sojusznik +N S | spowolnienie (odwrotne) | — |
| 1 | Młody Tur (`youngAurochs`) | cielak tura | 1 | chód | wręcz | Byczy Łeb: po każdym ataku odpycha cel o 1 | odpychanie | — |
| 1 | Kulan Stepowy (`kulan`) | kozica z rogami | 1 | chód | wręcz | Skok po Turniach: ruch przez przeszkody i jednostki | ★ przeskok | — |
| 2A | Łucznik Stepowy (`steppeArcher`) | tarpan z łukiem (decyzja 20.11; otwarte: sam tarpan czy jeździec) | 1 | chód | dyst. | Strzała w Kolano: raz na bitwę trafiony −N S | spowolnienie | Łucznicze Błonia |
| 2B | Wół Piżmowy (`muskOx`) | wół piżmowy | 1 | chód | wręcz | Rozpęd: +N A po przebiegnięciu ≥M pól | premia za ruch | Piżmowe Zimowisko |
| 3A | Żubr Puszczański (`forestBison`) | żubr | 1 | chód | wręcz | Niewzruszony: pancerz; nie da się go odepchnąć, przyciągnąć ani przestawić | pancerz, ★ odporność na przesunięcie | Żubrza Ostoja |
| 3B | Arkar (`arkar`) | wielki dziki baran z zakręconymi rogami | 1 | chód | wręcz | Przebicie: cios trafia cel i jednostkę za nim | reuse: Ognisty Oddech (linia 2 pól) | Pasmo Arkarów |
| 4A | Łamignat Stepowy (`steppeLamignat`) | pół koń, pół orzeł, płowy jak step | 2 | lot | wręcz | Lot na Strzelców: +N A, jeśli cel był w tej rundzie odepchnięty; jedyny lotnik Stad, przejmuje rolę Tygrysa (dopada strzelców) | ★ premia za stan celu | Gniazdo na Urwisku |
| 4B | Słoń z Bębnem (`drumElephant`) | słoń niosący wielki bęben (decyzja 19.11: mniej bydła) | 2 | chód | wręcz | Bęben Wędrówki: aura, sojusznicy w promieniu 2 mają +1 S | aura | Krąg Bębnów |
| 5A | Nosorożec Bojowy (`warRhino`) | nosorożec w skórzanym rzędzie | 2 | chód | wręcz | Taran: po ≥N polach odepchnięcie o 2, zderzenie +N obrażeń; podwójne obrażenia bramom | odpychanie + ★ zderzenie | Błotne Brody |
| 5B | Łoś Rogacz (`bullMoose`) | olbrzymi łoś z łopatami rogów | 2 | chód | wręcz | Rykowisko: raz na bitwę wyzywa wroga w zasięgu N; ten w swojej następnej aktywacji może atakować tylko Łosia | ★ prowokacja | Łosie Mokradło |
| 6 | Indrik, Pan Zwierząt (`indrik`) | słowiański Indrik-zwierz, olbrzymi róg | 2 | chód | wręcz | Ziemia Drży: raz na bitwę wszyscy mali wrogowie w promieniu 2 odepchnięci o 1, zderzenia ranią; nie do odepchnięcia | odpychanie obszarowe | Źródło Indrika |

### Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Kamień Tętentu** (mechanika) | Koszary | I: jednostka Stad, która przed atakiem wręcz przebiegła ≥3 pola, odpycha cel o 1 · II: zderzenie +1 obrażeń · III: próg 2 pola · IV: zderzony cel −1 S w następnej aktywacji |
| **Wielkie Pastwiska** (gospodarka) | Targ | I: rekrutacja tierów 1–3 tańsza o 1 zł · II: wszystkich tierów |
| **Ostoja Wędrówek** (mapa) | Karczma | bohater stojący w osadzie z Ostoją może raz na rundę przenieść się do innej własnej osady z Ostoją |

**Iskra:** Ołtarz Rogów Pierwotnej Iskry — **+1 S wszystkim jednostkom Stad w każdej bitwie.**
**Nazwy osad:** Tętniący Bród, Rogaty Kamień, Turza Polana, Kopytnik, Wichrowy Step, Żubrza Ostoja, Pyłowy Szlak, Grzmiący Jar,
Słone Lizawisko, Dudniąca Dolina, Wodopój Trzech Rogów, Trawiaste Morze.

### Wygląd i dźwięk
- **Paleta jednostek:** płowa sierść, ochra, brąz, kość rogów, zgaszona zieleń stepu, czerwone wstęgi i koraliki na rogach.
- **Herb:** dwa skrzyżowane rogi nad odciskiem kopyta. **Arena:** step z wysoką trawą i głazami (przeszkody do zderzeń), kurz.
- **Muzyka:** bębny, róg, dudy, rytm galopu.

### Bot
Ustawia jednostki daleko od wroga, żeby mieć rozpęd; wybiera cele stojące przy głazach i krawędzi; szybcy idą po strzelców.
Na mapie: podbój kopalń i osad, Ostoja do przerzutu. **Nie wolno mu:** stać w miejscu (marnuje Tętent), szturmować murów bez
Nosorożca.

### Kolizje
- **Centaury i minotaury** z pomysłu autora już są: Centaur w Przymierzu, Herszt Minotaurów w Hordzie. Proponuję Stada bez
  nich (zamiast: tury, żubry, tarpany, antylopy). Alternatywa niżej.
- Premia za ruch jest w Przymierzu; Stada mają ją tylko u Wołu Piżmowego, ich znakiem jest odepchnięcie i zderzenie.
- Odpychanie w Przypływach: Przypływy odpychają w miejscu (Ściana Wody), bez rozpędu i bez zderzeń.

### Alternatywy
- **Jednostki:** Centaurzyca Stepu (zamiast Łucznika Stepowego, jeśli autor chce centaurów; wtedy Centaura Przymierza przemianować
  na Centaura Gaju), Minotaur Pasterz (zamiast Żubra), Bawół z Bębnem (zamiast Słonia, jeśli słoń nie pasuje do stepu), Młody Nosorożec
  (zamiast Młodego Tura, mniej bydła). Mamut przeszedł do Dworu Wiecznego Szronu (legenda).
- **Mechanika:** *Panika* — zderzony cel ucieka o 1 pole na początku swojej aktywacji (kontrola zamiast obrażeń).
- **Budynek mapy:** Ujeżdżalnia — bohaterowie +1 ruchu w rundzie po wygranej bitwie.

---

## 4. Królestwo Umarłych (`undead`)

**EN:** Barrow Kingdom · **Rola:** wyczerpanie · **Kolejność:** druga

**Klimat.** Baśniowo, nie makabrycznie: kurhany we mgle, latarnie, duchy dawnych strażników, którzy nie odeszli, bo pilnują
przysięgi. Szkielety są czyste i dumne, zbroje stoją same, płaczki zawodzą w wieżach. Bliżej „Ballady o Kościeju” niż horroru.

**Mechanika wyróżniająca: Wieczna Warta.** Polegli pomocnicy wracają na arenę. Feniks Przymierza odradza się sam; Umarli
podnoszą innych, ale słabszych, a bohaterowie nie wstają. Jednostki mają do tego osłabianie (−A, −S, mana).

**Mocne strony:** długa bitwa, przewaga liczebna w późnych rundach, odporność na statusy (Iskra).
**Słabości:** wolni, mało obrażeń naraz; Horda i Rój kończą zanim Warta zadziała.

### Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `barrowKing` | Król Kurhanu | wojownik | 1 | chód | wręcz | **Wezwanie z Kurhanu:** raz na bitwę poległy sojuszniczy pomocnik wstaje na sąsiednim polu z połową Ż | Pan Warty: pomocnicy +1 Ż (`supportHp`) |
| `lanternWraith` | Latarniczka Mgieł | mędrzec | 1 | lot | dyst. | **Zgaszone Światło:** raz na bitwę bohater wroga traci N many, trafiony cel −1 A | Wieczny Płomyk: +1 many na rundę (`regen`) |
| `headlessKnight` | Bezgłowy Jeździec | łowca | 2 | chód | wręcz | **Widmowa Szarża:** raz na bitwę przenika przez jednostki i atakuje cel od tyłu (+N) | Nocny Gościniec: +1 ruchu (`move`) |

**Dowódcy:** Kapitan Warty (wojownik), Upiorna Łuczniczka (łowca), Pokutny Mnich (mędrzec).
**Czwarty bohater:** Duch Starego Dzwonnika (mędrzec, dzwon spowalnia sąsiadów).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Szkielet Halabardnik (`skeletonSpear`) | szkielet w hełmie | 1 | chód | wręcz | Kości Wracają: raz na bitwę po śmierci składa się na końcu rundy z 1 Ż | odrodzenie (słabe) | — |
| 1 | Błędny Ognik (`willOWisp`) | zielonkawy płomyk | 1 | lot | dyst. | Zwodzenie: raz na bitwę trafiony −N S | spowolnienie | — |
| 1 | Zjawa Pokutnika (`penitentShade`) | półprzezroczysty mnich | 1 | chód | wręcz | Bezcielesna: pierwszy cios dystansowy w bitwie zadaje 0 | ★ tarcza jednorazowa (typ ciosu) | — |
| 2A | Szkielet Łucznik (`skeletonArcher`) | szkielet z łukiem | 1 | chód | dyst. | Grot Przez Zbroję: ignoruje pancerz | ★ ignorowanie pancerza | Zbrojownia Kości |
| 2B | Strach Polny (`scarecrow`) | ożywiony strach na wróble | 1 | chód | wręcz | Postrach: sąsiedni wrogowie −1 A | aura osłabiająca | Opuszczone Pole |
| 3A | Nawiedzona Zbroja (`hauntedArmor`) | pusta zbroja rycerza | 1 | chód | wręcz | Pusta w Środku: pancerz; trucizna i klątwy nie działają | pancerz, ★ odporność na statusy | Rycerska Krypta |
| 3B | Wampir (`vampire`) | zawodząca zjawa | 1 | lot | dyst. | Lament: raz na bitwę wrogowie w promieniu 2 −1 A do końca następnej aktywacji | aura osłabiająca | Krypta Wampira |
| 4A | Wij Podziemny (`viy`) | słowiański demon ziemi, powieki do samej ziemi, podnoszą je słudzy | 2 | chód | wręcz | Podnieście Mi Powieki: raz na bitwę wróg w zasięgu N, na którego spojrzy, zostaje unieruchomiony | unieruchomienie | Wielki Kurhan |
| 4B | Strzyga (`strzyga`) | blada, dzika strzyga z drugim obliczem na plecach i dwoma rzędami kłów (bez krwi i wnętrzności) | 1 | chód | dyst. | Ponowny Oddech: raz na bitwę wskrzesza poległego pomocnika tieru ≤3 na sąsiednim polu z połową Ż | ★ wskrzeszenie w polu | Dom Strzygi |
| 5A | Lisz (`lich`) | czarnoksiężnik w koronie | 1 | chód | dyst. | Żniwo Many: każde trafienie zabiera bohaterowi wroga 1 many i leczy Lisza o 1 | ★ wyczerpanie many | Biblioteka Umarłych |
| 5B | Kostucha (`kostucha`) | śmierć z kosą jak z ludowego drzeworytu: baśniowa, nie straszna | 1 | chód | wręcz | Kośba: każdy atak trafia cel i jednego jego sąsiada (zamach kosą) | reuse: Paszcze Otchłani | Kaplica Tańca Śmierci |
| 6 | Kościany Smok (`boneDragon`) | szkielet smoka z mchem i latarniami | 2 | lot | wręcz | Oddech Grobu: raz na bitwę linia 3 pól, obrażenia i −1 S | reuse: Ognisty Oddech + spowolnienie | Smocze Cmentarzysko |

### Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Kurhan Wiecznej Warty** (mechanika) | Szpital | I: raz na bitwę na końcu rundy najtańszy poległy pomocnik wstaje z 1 Ż (na swoim polu albo najbliższym wolnym) · II: wstaje z połową Ż · III: dwa razy na bitwę · IV: wstaje z pełnym Ż. Bohaterowie nie wstają |
| **Ossuarium** (gospodarka) | Skarbiec | I: wskrzeszenie w Szpitalu tańsze o 1 zł · II: tiery 1–2 wskrzeszane za darmo |
| **Dzwonnica Zaduszna** (mapa) | Koszary | po wygranej bitwie z neutralnymi jeden poległy pomocnik tieru 1–2 wraca do puli bez Szpitala (raz na rundę) |

**Iskra:** Krypta Pierwotnej Iskry — **jednostki Umarłych odporne na truciznę, klątwy, spowolnienie i unieruchomienie.**
**Nazwy osad:** Mglisty Kurhan, Szare Wrzosowisko, Zadumane Opactwo, Latarniany Gród, Popielne Wzgórze, Zaduszny Dwór,
Srebrny Całun, Cmentarne Sady, Siedem Kopców, Stary Dzwon, Wieczna Cisza, Krucza Kaplica.

### Wygląd i dźwięk
- **Paleta:** kość, popiel, mech, wosk świec, stare srebro, rdza; poświata duchów **zielonkawo-żółta albo biała, nie niebieska**.
- **Herb:** latarnia nad kopcem. **Arena:** kurhany we mgle, krzywe brzozy, kamienne latarnie (przeszkody).
- **Muzyka:** dzwony, chór bez słów, lira korbowa, cichy werbel.
- Prompty: unikać słów *corpse, blood, kill*; pisać *ancient guardian, spectral, barrow*.

### Bot
Gra na czas: chroni Lisza i Strzygę z tyłu, wystawia tanie szkielety na pierwszą linię (i tak wstaną), celuje Liszem
i Latarniczką w bohatera z maną. **Nie wolno mu:** rzucać bohaterów na pierwszą linię (oni nie wstają).

### Kolizje
- **Eliksir Odrodzenia / skarb „Wskrzeszenie”:** wskrzesza jednostkę na stałe i poza bitwą; Warta działa tylko w bitwie.
  Propozycja z macierzy: skarb nie działa w bitwie na jednostkę, która w tej bitwie już wstała przez Wartę.
- **Feniks Świtu:** odradza siebie; Umarli podnoszą innych. Zostaje.
- **Mumie** nie trafiają ani tu, ani do Piasków: Piaski mają kamiennych strażników grobowców, nie umarłych.

### Alternatywy
- **Jednostki:** Topielica (zamiast Wampira, przyciąga), Kościej Nieśmiertelny (legenda zamiast Smoka: wstaje, dopóki żyje
  któryś z jego sług), Ćma Trupia Główka (zamiast Kostuchy: wielka ćma z czaszką na grzbiecie, lot, usypiający pył;
  wtedy Rój traci Ćmę Pyłową), Bazyliszek (warszawska legenda, wzrok kamienieje; blisko Wija).
- **Mechanika:** *Chłód Grobu* — każdy cios Umarłych −1 S do końca następnej aktywacji, kumuluje się (czyste wyczerpanie,
  bez wskrzeszania; prostsze, ale bliskie Szronowi).
- **Budynek mapy:** Mgła Kurhanów — wrodzy bohaterowie w promieniu 2 od osady nie widzą jej garnizonu.

---

## 5. Żelazny Klan (`clans`)

**EN:** Iron Clan · **Rola:** obrona · **Kolejność:** trzecia

**Klimat.** Krasnoludy z gór, ich mechanizmy z brązu, opancerzone niedźwiedzie bojowe i duchy kopalń (Skarbnik). Krasnoludów
nie więcej niż połowa składu, reszta to mechanizmy i stworzenia gór. Każdy klan ma kuźnię i salę przodków,
a każdy wojownik nosi runy wybite przez kowala. Powolni, ale gdzie stanęli, tam się nie przejdzie.

**Mechanika wyróżniająca: Mur Tarcz** (w bitwie) i **Runiczna Kuźnia** (trwałe ulepszanie wyposażenia pomocników, jedyna taka
frakcja). Pancerz rośnie, gdy jednostki stoją obok siebie.

**Mocne strony:** odporność, obrona osad, oblężenia (Armata), kontrują szarże Stad.
**Słabości:** mała mobilność na mapie i w bitwie, bez jednostek latających; kontrola (Szron) i wyczerpanie (Umarli) ich rozbierają.

### Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `ironThane` | Tan Żelaznobrody | wojownik | 1 | chód | wręcz | **Przysięga Tarczy:** raz na bitwę do końca rundy sąsiedni sojusznicy mają +N pancerza | Tarcza Rodu: pomocnicy +1 Ż (`supportHp`) |
| `runeMatron` | Matka Run | mędrzec | 1 | chód | dyst. | **Runa Kamienia:** raz na bitwę sojusznik +1 pancerza do końca bitwy i nie da się go odepchnąć | Wiedza Przodków: czary +1 (`spellPower`) |
| `passWarden` | Strażniczka Przełęczy | łowca | 1 | chód | dyst. | **Bełt Przeszywający:** cios trafia cel i jednostkę za nim w linii | Oko Celownika: strzelcy +1 A (`marksman`) |

**Dowódcy:** Wojownik Klanu (wojownik), Kusznik Gór (łowca), Kapłan Kuźni (mędrzec).
**Czwarty bohater:** Stary Górmistrz (wojownik, Podkop).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Krasnoludzki Tarczownik (`shieldDwarf`) | krasnolud z pawężą | 1 | chód | wręcz | Pawęż: pancerz | pancerz | — |
| 1 | Kret z Brązu (`bronzeMole`) | mechaniczny kret z wiertłem zamiast nosa | 1 | chód | wręcz | Podkop: zamiast ruchu wyłania się na dowolnym polu w zasięgu | reuse: Podkop (Podkopnik) | — |
| 1 | Mosiężny Pająk (`brassSpider`) | krasnolud z kuszą | 1 | chód | dyst. | Ostrzał z Miejsca (Mosiężny Pająk; Kusznik Gór zostaje przy Salwie z Miejsca): +N A, gdy w tej aktywacji się nie ruszał | ★ premia za brak ruchu | — |
| 2A | Niedźwiedź w Zbroi (`armoredBear`) | niedźwiedź bojowy w blachach | 1 | chód | wręcz | Kolczuga: pancerz; bez osłaniania (to robi Prastary Niedźwiedź) | pancerz | Gawra Zbrojna |
| 2B | Kowal Bitewny (`battleSmith`) | krasnolud z młotem i kowadłem na plecach | 1 | chód | wręcz | Hartowanie: raz na bitwę sąsiad +1 A do końca bitwy | ★ wzmocnienie sąsiada | Polowa Kuźnia |
| 3A | Wartownik z Brązu (`bronzeSentinel`) | mechaniczny strażnik | 1 | chód | wręcz | Kolce Mechanizmu: atakujący wręcz traci N Ż; odporny na truciznę | reuse: Kolce | Warsztat Mechanizmów |
| 3B | Kozioł Taranowy (`ramGoat`) | górski kozioł bez jeźdźca (decyzje 19.11 i 20.11) | 1 | chód | wręcz | Skok po Turniach: raz na bitwę przeskakuje nad jednostką lub przeszkodą w zasięgu N (propozycja zdolności, do potwierdzenia) | reuse: przeskok (Kozica Stad) | Koźla Zagroda |
| 4A | Pogromca Olbrzymów (`giantSlayer`) | krasnolud z dwuręcznym toporem | 1 | chód | wręcz | Na Duże Cele: +N A przeciw dużym jednostkom | ★ premia przeciw rozmiarowi | Sala Pogromców |
| 4B | Skarbnik (`skarbnik`) | śląski duch kopalni: stary sztygar z lampką | 1 | chód | dyst. | Błędne Światło: raz na bitwę wróg w zasięgu N zostaje przestawiony o 2 pola (Skarbnik wodzi go po chodnikach) | ★ przestawienie wroga | Stary Szyb |
| 5A | Gwardia Młota (`hammerGuard`) | elitarny krasnolud w pełnej zbroi | 1 | chód | wręcz | Młot Przodków: raz na bitwę trafiony traci następną aktywację | ★ ogłuszenie | Sala Gwardii |
| 5B | Armata Klanów (`dwarfCannon`) | brązowa armata z obsługą | 2 | chód | dyst. | Ostrzał: cios w cel i sąsiadów; nie strzela w aktywacji, w której się ruszyła; podwójne obrażenia murom i bramom (przejęła rolę Tarana) | ★ obszar + premia za brak ruchu | Ludwisarnia |
| 6 | Kolos Kuźni (`clanColossus`) | olbrzymi mechanizm z kotłem | 2 | chód | wręcz | Fortyfikacja: raz na bitwę stawia 2 pola muru obok siebie; pancerz; nie do odepchnięcia | ★ stawianie przeszkody | Wielka Kuźnia Kolosa |

### Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Sala Tarcz** (mechanika) | Fosa i Mury | I: jednostka Klanów z ≥2 sąsiednimi sojusznikami ma −1 obrażeń z każdego ciosu · II: wystarczy 1 sąsiad · III: w szyku nie da się jej odepchnąć ani przyciągnąć · IV: kto atakuje wręcz jednostkę w szyku, traci 1 Ż |
| **Runiczna Kuźnia** (wyposażenie) | Kuźnia | I: raz na rundę jeden pomocnik dostaje trwałą runę (+1 A, +1 Ż albo pancerz 1; jedna na jednostkę) · II: dwie runy na jednostkę. ★ nowy stan: runy na pomocniku w puli. **Decyzja 19.11:** runa zostaje przy jednostce także po jej śmierci i powrocie do puli; trzymana w stanie frakcji pod `id` jednostki (jednostka danego rodzaju jest we frakcji tylko jedna, `kingdom.ts`) |
| **Głęboka Sztolnia** (gospodarka) | Skarbiec | I: +1 rudy na rundę (suma z osad) · II: także +1 Pyłu co 3 rundy |

**Iskra:** Kowadło Pierwotnej Iskry — **pancerz 1 (−1 obrażeń z każdego ciosu) wszystkim jednostkom Klanów.**
**Nazwy osad:** Żelazny Próg, Kowadło Gór, Głęboka Brama, Miedziany Szyb, Sala Siedmiu Młotów, Kamienna Twierdza,
Szara Grań, Brązowe Wrota, Dymny Komin, Runiczna Przełęcz, Ojcowski Kamień, Sztolnia Pod Gwiazdą.

### Wygląd i dźwięk
- **Paleta:** polerowana stal, mosiądz, miedź, szary kamień, ciepła skóra, złote runy. Odróżnić od Hordy: **bez żaru, lawy
  i rdzy**; czyste, zadbane metale. Runy złote albo pomarańczowe, **nie niebieskie**.
- **Herb:** młot na kowadle w kole z run. **Arena:** górska przełęcz z posągami przodków i mostem z kamienia.
- **Muzyka:** kowadła w rytmie, niski chór męski, rogi.

### Bot
Stoi w szyku (sąsiedzi), czeka na wroga na swojej połowie, strzela z miejsca. Na mapie: buduje Sztolnię i Runiczną Kuźnię, broni
osad, szturmuje z Armatą. **Nie wolno mu:** rozdzielać jednostek pojedynczo, ruszać Armatą i Kusznikami bez potrzeby.

### Kolizje
- **Prastary Niedźwiedź (Przymierze):** niedźwiedź Klanów jest jednostką z pancerzem, bez „przyjmij cios za sąsiada” (decyzja
  z macierzy).
- **Kamienny Golem (neutralny):** mechanizmy Klanów są z brązu i mają kotły, nie z kamienia z runami.
- Kuźnia (wspólna) daje +1 A pomocnikom całej frakcji; Runiczna Kuźnia daje ulepszenia pojedynczym jednostkom, na stałe.

### Alternatywy
- **Jednostki:** Wiropłat (`gyrocopter`; maszyna z wirnikiem i krasnoludem, lot, dyst., Zrzut: raz na bitwę cel i sąsiedzi po N; zamiast Jeźdźca, daje Klanom lotnika),
  Mechaniczny Pająk (zamiast Jeźdźca, jeśli maszyny pasują; uwaga: Horda ma Pająka Jaskiniowego),
  Golem Parowy (legenda zamiast Kolosa).
- **Mechanika:** *Runy Bitewne* — przed bitwą każdy pomocnik dostaje jedną runę do wyboru (bez budynku Runicznej Kuźni; prościej
  w stanie gry, więcej klikania).
- **Budynek:** Kolej Górska — bohater w osadzie Klanów przenosi się do innej osady Klanów (zamiast Sztolni; łata mobilność).

---

## 6. Wolna Kompania (`free`)

**EN:** Free Company · **Rola:** kontrola + mobilność · **DLC**

**Klimat.** Bractwo zwierzoludzi z lasów, rzek i obejść: koty, borsuki, kruki, wydry, kuny, ropuchy. Trochę zbójnicy spod
Tatr, trochę najemnicy, zawsze z planem. Każdy jest specjalistą: jeden zastawia sidła, drugi oznacza cel, trzeci wchodzi od tyłu.

**Odróżnienie od Przymierza (decyzja 19.11):** Przymierze to zwierzęta dzikie, magiczne i świetliste, bez ubrań. Kompanie to
**zwierzoludzie**: chodzą na dwóch nogach, noszą ubrania, mają narzędzia, sidła i **proch** (Świstak Petardnik, Ropuch
z Hakownicą). Bez magii natury. Paleta ciepła i rdzawa, Przymierze srebrno-zielone.

**Mechanika wyróżniająca: Sidła** (ukryte pułapki przed bitwą) i **kombinacje specjalistów** przez *oznaczenie* celu
(Kruk oznacza, reszta bije mocniej). Skarby: Kompanie mają z nich więcej (Paserka).

**Mocne strony:** karzą wolne i zwarte armie (Klany, Rój), zarabiają, omijają walki na mapie.
**Słabości:** krucha pierwsza linia; szybcy (Stada) przeskakują pułapki.

### Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `foxCaptain` | Ruda Atamanka | łowca | 1 | chód | dyst. | **Fortel:** raz na bitwę kładzie dodatkową ukrytą pułapkę albo przenosi jedną własną | Złota Łapa: +1 zł za wygraną (`gold`) |
| `badgerSapper` | Borsuk Saper | wojownik | 1 | chód | wręcz | **Okop:** raz na bitwę do końca następnej aktywacji +N pancerza i nie da się go odepchnąć | Stary Wiarus: pomocnicy +1 Ż (`supportHp`) |
| `ravenSeer` | Kruk Wieszczek | mędrzec | 1 | lot | dyst. | **Oko Kruka:** oznacza wroga (do końca rundy każdy atak w niego +1) i odsłania pułapki oraz miraże w promieniu 2 | Wróżba: +1 PD za wygraną (`xp`) |

**Dowódcy:** Kuna Rębajło (wojownik), **Żbiczka Bajdurka** (`bajka`, łowca; zwierzak autora Bajka: młoda, energiczna, głupiutka, wygląda jak żbik; **Szalony Skok:** raz na bitwę skacze o 3 pola ponad jednostkami, pułapkami i przeszkodami terenowymi i atakuje z +1 A, prymityw: przeskok ze Stad; decyzje 19.11 i 20.11, zamiast Wiewiórki Łuczniczki jako dowódcy), **Zajęczyca Zielarka** (mędrzec; decyzja 20.11, zamiast Ropuchy Zielarki).
**Czwarty bohater:** Wydra Przemytniczka (łowca, odskok).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Wydra Zwiadowczyni (`otterScout`) | wydra w kapturze | 1 | chód | wręcz | Wyślizg: raz na bitwę odskok po ataku | reuse: Powietrzny Zryw | — |
| 1 | Sroka Złodziejka (`magpieThief`) | sroka z sakwą | 1 | chód | wręcz | Kieszonkowiec: pierwszy cios w bohatera w bitwie daje frakcji +1 zł | ★ łup w bitwie | — |
| 1 | Wiewiórka Łuczniczka (`squirrelArcher`) | wiewiórka z krótkim łukiem | 1 | chód | dyst. | Strzał z Gałęzi: +1 A przeciw oznaczonemu celowi | ★ oznaczenie | — |
| 2A | Łasica Nożowniczka (`weaselKnife`) | łasica z dwoma nożami | 1 | chód | wręcz | Cios w Plecy: +N, gdy atakuje od tyłu | reuse: Zajście od tyłu | Kryjówka w Żywopłocie |
| 2B | Bóbr Inżynier (`beaverEngineer`) | bóbr z siekierką i planem | 1 | chód | wręcz | Tama: raz na bitwę stawia przeszkodę na sąsiednim polu | ★ stawianie przeszkody | Żeremie |
| 3A | Tchórz Smrodnik (`polecatPoisoner`) | tchórz w fartuchu z flaszami smrodu (decyzja 20.11, zamiast Ropuchy Truciciela; w Kompaniach zostaje jedna ropucha, Hakownik) | 1 | chód | dyst. | Smrodliwa Mikstura: raz na bitwę cel i sąsiedzi zatruci | trucizna (obszar) | Warzelnia |
| 3B | Kocur Fechmistrz (`catFencer`) | stary kocur z rapierem | 1 | chód | wręcz | Riposta: oddaje N każdemu, kto zaatakuje go wręcz i przeżyje | ★ kontratak | Fechtownia |
| 4A | Rosomak Zabijaka (`wolverine`) | rosomak z blizną | 1 | chód | wręcz | Furia Ran: +1 A za każde N brakujących Ż | ★ premia za rany | Rosomacza Nora |
| 4B | Świstak Petardnik (`marmotPetard`) | świstak z beczułką prochu | 1 | chód | wręcz | Ładunek: raz na bitwę zamienia własną pułapkę w wybuch (pole i sąsiedzi) | pułapka + obszar | Prochownia |
| 5A | Ropuch z Hakownicą (`toadGunner`) | wielka ropucha z hakownicą na podpórce | 2 | chód | dyst. | Huk Hakownicy: raz na bitwę trafiony traci następną aktywację (ogłuszony hukiem) | ★ ogłuszenie | Rusznikarnia |
| 5B | Jenot Szpieg (`raccoonDogSpy`) | jenot w masce i ciemnym płaszczu | 1 | chód | wręcz | Ukryty: zaczyna bitwę niewidoczny dla wroga; pierwszy atak +N | ★ ukrycie | Leśna Czatownia |
| 6 | Waran Wieżowy (`towerMonitor`) | olbrzymi waran z wieżyczką łuczników na grzbiecie | 2 | chód | wręcz | Ruchoma Twierdza: atakuje wręcz, a raz na rundę dodatkowo strzela wieżyczka | ★ drugi atak (dystansowy) | Wielka Stajnia Kompanii |

### Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Warsztat Sideł** (mechanika) | Targ | I: przed bitwą Kompanie kładą 1 ukrytą pułapkę na swojej połowie (wchodzący dostaje N obrażeń i kończy ruch) · II: 2 pułapki · III: pułapka unieruchamia do końca następnej aktywacji · IV: 3 pułapki |
| **Paserka** (skarby) | Targ | I: artefakty sprzedawane za pełną cenę, skrzynie dają +1 zł · II: raz na 3 rundy losowy skarb |
| **Szlaki Przemytnicze** (mapa) | Karczma | raz na rundę bohater Kompanii może przejść przez pole strażnika albo neutralnych bez walki |

**Iskra:** Skrytka Pierwotnej Iskry — **+2 ukryte pułapki na początku każdej bitwy.**
**Nazwy osad:** Lisia Jama, Zbójecki Wąwóz, Młyn Pod Krukiem, Borsucza Górka, Wydrza Przystań, Kuni Las, Przemytnicza Kładka,
Stara Karczma Pod Sową, Zielony Gościniec, Spalony Most, Sakwa i Łuk, Bractwo Trzech Dębów.

### Wygląd i dźwięk
- **Paleta:** rude i brązowe futra, butelkowa zieleń płaszczy, skóra, mosiądz sprzączek, len.
- **Herb:** lisia głowa na skrzyżowanych strzałach. **Arena:** leśny obóz przy zrujnowanym młynie, płoty, beczki.
- **Muzyka:** lutnia, flet, skrzypki, ballada zbójnicka.

### Bot
Pułapki na drogach do własnych strzelców, oznacza cel Krukiem i skupia na nim ataki, Ryś na bohatera. Na mapie: Szlaki do
omijania strażników, zbiera skrzynie. **Nie wolno mu:** znać pułapek i mirażów przeciwnika.

### Kolizje
- **Srebrny Lis (Przymierze):** duchowy, srebrny lis gaju; lisica Kompanii jest ruda, w płaszczu, z łukiem. Jeśli to za mało,
  Atamanką zostaje kuna, a lis znika z Kompanii.
- **Trzewiki Trapera (artefakt)** ignorują teren na mapie, więc Szlaki Przemytnicze omijają walki, nie teren.
- Ukryta informacja: patrz punkt 2.

### Alternatywy
- **Jednostki:** Sokolnik z Sokołem (zamiast Wiewiórki), Niedźwiadek Bartnik z rojem pszczół
  (zamiast Wozu; uwaga na niedźwiedzie w innych frakcjach).
- **Mechanika:** *Kontrakt* — przed bitwą wybierasz jedną wrogą jednostkę jako cel kontraktu; jej zabicie daje złoto i +A
  wszystkim (bez ukrytej informacji, łatwiej online).
- **Nazwa frakcji:** Zbójnickie Bractwo (bardziej swojsko).

---

## 7. Dwór Wiecznego Szronu (`frost`)

**EN:** Court of Everfrost · **Rola:** kontrola · **DLC**

**Klimat.** Dwór Marzanny, Pani Zimy, w lodowych salach na północy. Olbrzymi jarlowie, wiedźmy zamieci, śnieżne rysie, mamuty i strzygi
wichru. Zima nie jest tu zła, tylko nieubłagana: wszystko zwalnia i w końcu staje.

**Mechanika wyróżniająca: Szron.** Każdy cios jednostki Dworu nakłada szron; przy progu cel zamarza (traci aktywację).
To narastanie odróżnia Szron od zwykłego spowolnienia (Elf Druid, czar Spowolnienie). Do tego **izolowanie**: lodowe ściany
i przenoszenie wrogów z dala od sojuszników.

**Mocne strony:** kontrola, dzielenie armii wroga, zamrażanie dużych jednostek.
**Słabości:** szron potrzebuje kilku ciosów; szybcy i agresywni (Stada, Horda) dobiegają, zanim zadziała.

### Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `marzanna` | Marzanna, Pani Zimy | mędrzec | 1 | chód | dyst. | **Lodowa Ściana:** raz na bitwę 3 pola muru z lodu w linii na 2 rundy | Oddech Zimy: czary +1 (`spellPower`) |
| `frostJarl` | Jarl Szronu | wojownik | 2 | chód | wręcz | **Lodowy Cios:** raz na bitwę trafiony zamarza (traci następną aktywację) | Dwór Olbrzymów: pomocnicy +1 Ż (`supportHp`) |
| `snowLynx` | Ryś Śnieżny | łowca | 1 | chód | wręcz | **Ślad Zamieci:** pola, przez które przebiegł, do końca rundy dają wrogom −1 S | Biegnąca z Wiatrem: +1 ruchu (`move`) |

**Dowódcy:** Rycerz Lodowej Gwardii (wojownik), Tropicielka Mroźnych Puszcz (łowca; decyzja 20.11, zamiast Łowczyni z Gronostajem, która brzmiała jak dwie jednostki w jednej; specjalność Oko Tropicielki), Szronowa Wiedźma (mędrzec).
**Czwarty bohater:** Stary Gradowy (mędrzec, grad w obszarze).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Chochlik Szronu (`frostImp`) | mały duszek mrozu | 1 | lot | dyst. | Lodowa Igła: raz na bitwę trafiony −N S | spowolnienie | — |
| 1 | Gronostaj Dworski (`ermine`) | gronostaj w zimowym futrze | 1 | chód | wręcz | Zza Zaspy: +N od tyłu | reuse: Zajście od tyłu | — |
| 1 | Szronowy Paź (`courtPage`) | młody łucznik dworu | 1 | chód | dyst. | Kryształowa Strzała: +1 obrażeń w cel z szronem | ★ premia za stan celu | — |
| 2A | Wiedźma Zamieci (`blizzardWitch`) | wiedźma w futrze z kosturem | 1 | chód | dyst. | Klątwa Chłodu: raz na bitwę trafiony −N A | reuse: Złowroga Klątwa | Chata na Lodzie |
| 2B | Jak Lodowcowy (`glacierYak`) | kudłaty jak | 1 | chód | wręcz | Gęste Futro: −1 obrażeń od strzał | ★ pancerz na typ ciosu | Zagroda Jaków |
| 3A | Rycerz Lodowej Zbroi (`iceSentinel`) | rycerz w zbroi oszronionej | 1 | chód | wręcz | Mroźna Zbroja: kto atakuje go wręcz, dostaje szron | odbicie (szron) | Lodowa Strażnica |
| 3B | Rusałka Szronu (`frostSprite`) | skrzydlata panna z sopli | 1 | lot | dyst. | Szklany Dzwoneczek: raz na bitwę zamraża cel, który ma ≥1 szron | ★ zamrożenie | Sopelkowa Grota |
| 4A | Młody Olbrzym Szronu (`youngGiant`) | młody olbrzym w skórach | 2 | chód | wręcz | Zmrażający Uścisk: raz na bitwę unieruchomienie + szron | unieruchomienie | Obóz Olbrzymów |
| 4B | Dziad Mróz (`dziadMroz`) | stary władca mrozu z brodą z sopli | 1 | lot | wręcz | Porwanie: raz na bitwę unosi małego wroga i stawia go 2–3 pola dalej, z dala od jego sojuszników | ★ przestawienie wroga | Chata Dziada Mroza |
| 5A | Olbrzym Gradu (`elderGiant`) | stary olbrzym z bryłami lodu | 2 | chód | dyst. | Grad Głazów: cel i sąsiedzi po N, każdy dostaje szron | obszar | Gradowa Turnia |
| 5B | Duch Zorzy (`auroraSpirit`) | świetlista postać z zorzy | 1 | lot | dyst. | Zimne Światło: aura, wrogowie w promieniu 2 mają −1 S | aura osłabiająca | Wieża Zorzy |
| 6 | Mamut Wiecznej Zimy (`frostMammoth`) | mamut z kłami w szronie i sopli w sierści | 2 | chód | wręcz | Długa Noc: raz na bitwę każdy wróg dostaje szron; nie do odepchnięcia | szron (globalnie) | Mamucia Grań |

### Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Pałac Szronu** (mechanika) | Wieża maga | I: każdy cios jednostki Dworu nakłada 1 szron; przy 3 szronach cel zamarza (traci następną aktywację, szron znika) · II: zamarza przy 2 · III: zamrożony dostaje +1 obrażeń od następnego ciosu (pęka lód) · IV: każdy szron to także −1 S |
| **Kryształowa Grota** (gospodarka) | Skarbiec | I: +1 rudy na rundę · II: także +1 Pyłu co 3 rundy |
| **Wieża Zamieci** (mapa) | Fosa i Mury | wrodzy bohaterowie w promieniu 2 od osady mają −1 ruchu; II: promień 3 |

**Iskra:** Lodowy Tron Pierwotnej Iskry — **wrogowie zaczynają każdą bitwę z 1 szronem.**
**Nazwy osad:** Szronowy Dwór, Biała Cytadela, Zamarzły Bród, Sopelkowa Wieża, Mroźna Przełęcz, Jezioro Ciszy, Śnieżna Brama,
Gradowa Turnia, Dwór Marzanny, Zimowa Przystań, Szklany Las, Północne Wrota.

### Wygląd i dźwięk
- **Paleta:** biel, srebro, perłowa szarość, zimne złoto, ciemna zieleń świerków, blady róż zorzy. **Lód malowany na biało
  i srebrno, nigdy na niebiesko** (tło #0000FF). Do rozważenia: tło kluczowe zielone (#00FF00) tylko dla tej frakcji.
- **Herb:** płatek śniegu w koronie. **Arena:** zamarznięte jezioro, ośnieżone świerki, lodowe kolce (przeszkody).
- **Muzyka:** dzwoneczki, wiolonczela, chór żeński, wiatr.

### Bot
Skupia ciosy na jednym celu, żeby go zamrozić; Lodową Ścianą odcina bohatera wroga od pomocników; Dziadem Mrozem porywa strzelców.
Trzyma dystans. **Nie wolno mu:** rozpraszać szronu po wielu celach, pchać się wręcz ze słabymi.

### Kolizje
- **Śnieżne sowy** z pomysłu autora usunięte (Sowa Świtu w Przymierzu); w ich miejsce Rusałka Szronu i Duch Zorzy.
- **Bez wilków (decyzja 19.11):** wilki są już w Przymierzu (Srebrna Wilczyca) i Hordzie (Władca Wilkołaków, Piekielny Ogar).
  Wilczycę Zamieci zastąpił Ryś Śnieżny (Kompanie oddały swojego rysia, mają Jenota), Białego Wilka Mamut ze Stad.
- **Mamut** pasuje do zimy bardziej niż do stepu; Stada dostały w zamian Łosia, a Nosorożec awansował na poziom 5.
- **Spowolnienie** jest w grze (Splątane Korzenie, czar); Szron to narastanie i zamrożenie.

### Alternatywy
- **Jednostki:** Mroźny Niedźwiedź Polarny (zamiast Jaka; kolizja z niedźwiedziami), Lodowy Golem (zamiast Rycerza; kolizja
  z Golemem), Królowa Śniegu w Saniach (legenda zamiast Mamuta; blisko Marzanny).
- **Mechanika:** *Zamieć* — co 3 rundy cała arena: wszyscy poza jednostkami Dworu −1 S na rundę (globalna, prostsza).
- **Bohaterka:** Królowa Lodu (bez słowiańskiego kostiumu), jeśli Marzanna za mocno kojarzy się z topieniem kukły.

---

## 8. Pustynne Cesarstwo (`sands`)

**EN:** Desert Empire · **Rola:** mobilność · **DLC**

**Klimat.** Pustynne imperium z oazami, karawanami i grobowcami pełnymi strażników z kamienia. Rządzą nim dżinny i sfinksy,
a w piaskach czekają skorpiony. Nic nie jest tym, czym się wydaje: na wydmie stoi wojownik albo jego miraż.

**Mechanika wyróżniająca: Miraż.** Atrapy własnych jednostek, których przeciwnik nie odróżni od prawdziwych; atak w miraż
przepada. Do tego **przestawianie własnych jednostek** (Dżin, Rok, Czerw) i zasadzki spod piasku.

**Mocne strony:** zmylenie, ruch, rozstawienie po wrogu, dobrzy strzelcy.
**Słabości:** krucha pierwsza linia; Kruk Kompanii odsłania miraże; Stada przebiegają przez atrapy.

### Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `djinnVizier` | Dżin Wezyr | mędrzec | 1 | lot | dyst. | **Piaskowa Brama:** raz na bitwę przenosi sojusznika na dowolne wolne pole w promieniu N | Lampa Mocy: czary +1 (`spellPower`) |
| `sphinxWarden` | Sfinks Strażnik | wojownik | 2 | chód | wręcz | **Zagadka:** raz na bitwę wybrany wróg w zasięgu N nie atakuje w następnej aktywacji | Mądrość Wieków: +1 PD za wygraną (`xp`) |
| `scorpionQueen` | Królowa Skorpionów | łowca | 1 | chód | wręcz | **Zasadzka Spod Piasku:** zaczyna bitwę zakopana na dowolnym polu swojej połowy, niewidoczna do pierwszego ruchu; trafienie zatruwa | Szlaki Wydm: +1 ruchu (`move`) |

**Dowódcy:** **Bastia Cienista** (`bastia`, wojownik; zwierzak autora Brytania: gruba, leniwa, kocha jedzenie, czarna pantera; **Czujna Drzemka:** raz na bitwę zamiast ruchu kładzie się: do końca następnej aktywacji +N pancerza i nie da się jej odepchnąć, a pierwszy wróg, który wejdzie obok, dostaje cios od razu, prymitywy: brak ruchu i reakcja na wejście; decyzje 19.11 i 20.11, zamiast Gwardzisty Szakala), Łuczniczka Karawany (łowca), Astrolog Pustyni (mędrzec).
**Czwarty bohater:** Wielbłądzi Książę (łowca, Strzał i Galop). **Wygląd:** młody, wystawny dowódca na białym wielbłądzie w złoto-szkarłatnej uprzęży z dzwoneczkami i sakwami przy siodle; zawój ze zgaszonym karmazynem i jadeitowym klejnotem, długi płaszcz w ochrze, krótki łuk refleksyjny i zakrzywiona szabla; elegancki i trochę zadufany (jadeit zamiast niebieskiego). Wielbłąd występuje tylko u niego.

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Szakalogłowy Strażnik (`jackalGuard`) | wojownik z głową szakala | 1 | chód | wręcz | Czujność: pierwszy wróg, który wejdzie obok, dostaje cios od razu (raz na rundę) | ★ reakcja na wejście | — |
| 1 | Mangusta Faraona (`pharaohMongoose`) | zwinna mangusta w złotej obroży, wróg kobr (decyzja 20.11, zamiast Skorpiona Piaskowego na tierze 1) | 1 | chód | wręcz | Odporność na Jad: nie działają na nią trucizna i unieruchomienie (statystyki do symulacji) | reuse: odporność na statusy | — |
| 1 | Łucznik Wydm (`duneArcher`) | łucznik w zawoju | 1 | chód | dyst. | Strzał zza Wydmy: +1 A, gdy stoi przy przeszkodzie | ★ premia za osłonę | — |
| 2A | Beduin Nomada (`bedouinNomad`) | człowiek pustyni w burnusie z szablą, zwinny, bez konia (decyzja 20.11) | 1 | chód | wręcz | Zwinny Wojownik (zdolność do ustalenia na G2) | ruch / unik | Namiot Nomadów |
| 2B | Kobra Królewska (`cobra`) | wielka kobra z kapturem | 1 | chód | wręcz | Hipnoza: raz na bitwę trafiony unieruchomiony | unieruchomienie | Wężowa Studnia |
| 3A | Tancerka Fata Morgany (`mirageDancer`) | tancerka z welonami | 1 | chód | dyst. | Lustro Wydm: raz na bitwę tworzy miraż sojusznika | ★ miraż | Dom Tancerek |
| 3B | Skorpion Piaskowy (`sandScorpion`) | skorpion wielkości psa (decyzja 20.11, awans z tieru 1) | 1 | chód | wręcz | Jad: raz na bitwę trafiony traci N Ż w kolejnych aktywacjach | trucizna | Gniazdo Skorpionów |
| 4A | Kamienny Strażnik Grobowca (`ushabti`) | posąg strażnika | 1 | chód | wręcz | Przebudzenie: stoi, dopóki wróg nie wejdzie obok albo go nie trafi; wtedy +N A; pancerz | ★ uśpienie do bodźca | Grobowiec Strażników |
| 4B | Krokodyl Oazowy (`oasisCrocodile`) | olbrzymi krokodyl z oazy (decyzja 20.11, zamiast Olbrzymiego Skorpiona, zbyt podobnego do Królowej Skorpionów) | 2 | chód | wręcz | Chwyt Szczęk: trafiony unieruchomiony | reuse: Chwyt | Rozlewisko Krokodyli |
| 5A | Lamassu (`lamassu`) | skrzydlaty byk z ludzką głową | 2 | lot | wręcz | Strażnik Bram: pancerz; sąsiednich sojuszników nie da się przestawić ani odepchnąć | pancerz, aura | Brama Lamassu |
| 5B | Ptak Rok (`roc`) | olbrzymi ptak pustyni | 2 | lot | wręcz | Lot ze Skrzydłem: raz na bitwę przenosi sąsiedniego sojusznika ze sobą | ★ ruch z pasażerem | Gniazdo Roka |
| 6 | Czerw Pustyni (`sandWyrm`) | olbrzymi czerw z piasku | 2 | chód | wręcz | Spod Piasku: zamiast ruchu zakopuje się i wynurza na polu w zasięgu N, odpychając sąsiadów o 1 | reuse: Podkop + odpychanie | Ruchome Piaski |

### Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Pałac Mirażu** (mechanika) | Targ | I: na początku bitwy jedna jednostka (nie bohater) dostaje miraż: atrapę z 1 Ż na wolnym polu własnej strefy; nie atakuje, znika po trafieniu (atak przepada) · II: dwa miraże · III: raz na bitwę jednostka zamienia się miejscami ze swoim mirażem · IV: rozbity miraż oślepia atakującego (−1 A w następnej aktywacji) |
| **Szlak Karawan** (gospodarka) | Targ | I: +1 zł na rundę za każde 2 kopalnie frakcji · II: wymiana surowców na Targu bez straty |
| **Brama Wydm** (mapa) | Karczma | raz na 3 rundy bohater w osadzie przenosi się na dowolne odkryte, wolne pole w odległości N |

**Iskra:** Złota Piramida Pierwotnej Iskry — **po rozstawieniu obu stron Piaski przestawiają do 2 swoich jednostek w swojej strefie.**
**Nazwy osad:** Złota Oaza, Brama Słońca, Studnia Siedmiu Palm, Miedziany Bazar, Grobowiec Królów, Szepczące Wydmy, Karawanseraj
Pod Gwiazdą, Kamienny Lew, Pałac Wiatru, Sucha Rzeka, Szafranowy Gród, Lustrzana Przystań.

### Wygląd i dźwięk
- **Paleta:** piasek, ochra, terakota, złoto, kość słoniowa, zgaszony karmazyn, **zieleń jadeitu zamiast turkusu i lapis
  lazuli** (to niebieskie).
- **Herb:** złote oko nad piramidą. **Arena:** oaza z ruinami kolumn, wydmy, palmy (przeszkody).
- **Muzyka:** oud, darbuka, ney, chór na jednym tonie.

### Bot
Rozstawia miraże przy najcenniejszych jednostkach, zasadza Królową przy strzelcach wroga, przestawia ranne jednostki do tyłu.
**Nie wolno mu:** wiedzieć, który miraż przeciwnika jest prawdziwy (wybór losowy z ziarna).

### Kolizje
- **Mumie** nie: grobowce pilnują kamienni strażnicy, nie umarli (rozdzielenie z Królestwem Umarłych).
- **Król Burzy** (neutralny) teleportuje siebie; Piaski przenoszą sojuszników.
- **Dziad Mróz** przenosi wrogów (izolowanie), Piaski tylko swoich.
- Ukryta informacja: patrz punkt 2.

### Alternatywy
- **Jednostki:** Ifryt (zamiast Dżina Burzy; uwaga na ogień Hordy), Mantykora (zamiast Krokodyla Oazowego; ma ogon skorpiona, więc zbliżona do Królowej Skorpionów).
  Olbrzymiego Skorpiona).
- **Mechanika bez ukrytej informacji:** *Wędrowne Piaski* — raz na rundę jedna jednostka Piasków może zamienić się miejscami
  z dowolną inną jednostką Piasków (proste, jawne; ale bliskie Przypływom).
- **Budynek:** Wielki Bazar (zamiast Szlaku Karawan) — dodatkowe miejsce na artefakt w ofercie Targu.

---

## 9. Rój Puszczy (`swarm`)

**EN:** Swarm of the Wilds · **Rola:** wyczerpanie + kontrola · **DLC**

**Klimat.** Podziemne królestwo grzybni, chrząszczy i modliszek pod korzeniami starego lasu. Jedna wola, wiele ciał. Baśniowo
i poważnie zarazem: muchomory jak latarnie, chitynowe pancerze jak lakier, świetliki zamiast pochodni. Bez obrzydliwości.

**Mechanika wyróżniająca: Grzybnia** — zajmowanie pól areny. Pola, na których stały, zginęły albo atakowały jednostki Roju,
porasta grzybnia: Rój jest na niej mocniejszy, wrogowie na niej słabną. Do tego premie w grupie i trucizna.

**Mocne strony:** wygrywa długie bitwy w miejscu, liczny i tani, karze stojących (Klany, Przymierze).
**Słabości:** odcięty od grzybni słabnie; ruchliwi (Piaski) i zamrażający (Szron) wyciągają go z własnego terenu.

### Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `mantisQueen` | Królowa Modliszek | łowca | 1 | chód | wręcz | **Ostatnie Cięcie:** +N A przeciw celowi, który ma co najwyżej połowę Ż | Łowczyni Głębin: +1 PD za wygraną (`xp`) |
| `elderMycelium` | Śniący Muchomor | mędrzec | 1 | chód | dyst. | **Zarodniki Snu:** raz na bitwę cel i sąsiedzi −1 S i zatruci | Pulsująca Grzybnia: +1 many na rundę (`regen`) |
| `goliathBeetle` | Chrząszcz Goliat | wojownik | 2 | chód | wręcz | **Chitynowa Ściana:** pancerz; +1 A za każdego sąsiadującego sojusznika z Roju | Matka Roju: pomocnicy +1 Ż (`supportHp`) |

**Dowódcy:** Żuk Gwardzista (wojownik), Świetlikowa Łuczniczka (łowca), Grzybowy Wróżbita (mędrzec).
**Czwarty bohater:** Pszczoła Królowa (łowca, lot).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Purchawka (`sporeling`) | chodzący grzybek | 1 | chód | wręcz | Pyłek: po śmierci zatruwa sąsiadów | reuse: Rozprysk + trucizna | — |
| 1 | Mrówka Wojowniczka (`soldierAnt`) | mrówka z żuwaczkami | 1 | chód | wręcz | Mrowisko: +1 A za każdego sąsiadującego sojusznika z Roju | premia grupowa | — |
| 1 | Świetlik (`firefly`) | świecący chrząszczyk | 1 | lot | dyst. | Błysk: raz na bitwę trafiony −1 A | reuse: Złowroga Klątwa | — |
| 2A | Gąsienica Korzenna (`rootCaterpillar`) | gruba gąsienica spod korzeni (decyzja 20.11, zamiast Ryjkowca Kopacza; jeden chrząszcz mniej) | 1 | chód | wręcz | Przepoczwarzenie: gdy po raz pierwszy spadnie do połowy Ż (raz na bitwę), zmienia się w Motyla Korzennego: odzyskuje N Ż i zyskuje lot | ★ zmiana formy | Zielony Kokon |
| 2B | Ćma Pyłowa (`dustMoth`) | duża ćma o szarych skrzydłach | 1 | lot | dyst. | Pył ze Skrzydeł: raz na bitwę cel i sąsiedzi zatruci | trucizna (obszar) | Kokonownia |
| 3A | Muchomor Gwardzista (`mushroomGuard`) | grzybolud z tarczą z kapelusza | 1 | chód | wręcz | Na Swojej Ziemi: na grzybni odzyskuje N Ż na początku aktywacji | leczenie + ★ grzybnia | Krąg Muchomorów |
| 3B | Żuk Bombardier (`bombardier`) | żuk strzelający gorącą mgłą | 1 | chód | dyst. | Wrzący Strumień: ignoruje pancerz | ★ ignorowanie pancerza | Żwirowisko |
| 4A | Ważka Łowczyni (`dragonfly`) | olbrzymia ważka o szklistych skrzydłach (decyzja 20.11, zamiast Modliszki Ostrzy; modliszka zostaje bohaterką) | 1 | lot | wręcz | Polowanie w Locie: +N A przeciw jednostkom latającym i dystansowym | ★ premia za typ celu | Staw Ważek |
| 4B | Matka Grzybni (`mycoMother`) | wysoka grzybowa postać z welonem | 1 | chód | dyst. | Rozsiew: raz na bitwę 3 pola grzybni wokół wskazanego pola | ★ grzybnia | Wilgotna Piwnica |
| 5A | Skolopendra Głębin (`centipede`) | olbrzymia skolopendra | 2 | chód | wręcz | Oplot: trafiony unieruchomiony i zatruty | unieruchomienie + trucizna | Skalna Szczelina |
| 5B | Ślimak Pancerny (`armoredSnail`) | olbrzymi ślimak z muszlą jak lakierowana tarcza (decyzja 20.11, zamiast Chmary Os) | 2 | chód | wręcz | Śluzowy Szlak: pancerz; zostawia grzybnię na polach, przez które przeszedł | pancerz + ★ grzybnia | Mszysty Głaz |
| 6 | Cesarska Cykada (`emperorCicada`) | olbrzymia cykada wychodząca spod ziemi (decyzja 20.11, zamiast Królowej Termitów) | 2 | lot | wręcz | Wielki Chór: raz na bitwę wszyscy wrogowie w promieniu 2 tracą następną aktywację (łagodniejsza wersja do symulacji: −2 S i −1 A) | ★ ogłuszenie (obszar) | Komora Cykady |

### Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Serce Grzybni** (mechanika) | Szpital | I: pola rozstawienia Roju i pola, na których zginęła jakakolwiek jednostka, porasta grzybnia; jednostka Roju na grzybni +1 A · II: grzybnia także na polach, z których Rój atakował · III: wróg kończący ruch na grzybni zostaje zatruty · IV: jednostka Roju na grzybni +1 Ż na początku aktywacji |
| **Ogród Grzybów** (gospodarka) | Skarbiec | I: +1 drewna i +1 rudy co drugą rundę · II: co rundę |
| **Podziemne Korytarze** (mapa) | Koszary | kopalnie w promieniu 2 od osady należą do Roju, dopóki nie wejdzie na nie wrogi bohater; II: promień 3 |

**Iskra:** Matecznik Pierwotnej Iskry — **grzybnia pokrywa strefę Roju i środek areny od początku każdej bitwy.**
**Nazwy osad:** Mroczny Kopiec, Grzybowa Grota, Korzenny Labirynt, Świetlikowa Pieczara, Wilgotny Gród, Chitynowa Brama,
Kapeluszowy Las, Głęboki Matecznik, Szepczące Korytarze, Bursztynowa Komora, Czerwony Muchomor, Pod Starym Dębem.

### Wygląd i dźwięk
- **Paleta:** brąz, umbra, ochra, mech, kremowe blaszki, czerwień muchomora, bioluminescencja zielonożółta, fiolet tylko
  ciepły (z czerwienią, bez niebieskiego).
- **Herb:** muchomor w kole z chrząszczy. **Arena:** podziemna grota z grzybami wielkości drzew i korzeniami (przeszkody).
- **Muzyka:** niski dron, klekot drewna, marimba, szept chóru.

### Bot
Trzyma jednostki razem, walczy na grzybni i wciąga wroga na swoje pola; Królowa Modliszek dobija ranne cele. Na mapie: osady
blisko kopalń (Korytarze). **Nie wolno mu:** rozpraszać jednostek i gonić wroga daleko od grzybni.

### Kolizje
- **Pająk Jaskiniowy (Horda), Bagienny Pełzacz (neutralny):** Rój nie ma pająków; Podkop zniknął razem z Ryjkowcem Kopaczem (Podkopnik jest neutralny).
- **Trucizna** jest w Hordzie (Szczurołak, Wiwerna); znakiem Roju jest grzybnia i grupa, trucizna to dodatek.
- **Modliszka:** tylko jedna, bohaterka Królowa Modliszek (Ostatnie Cięcie); Modliszka Ostrzy odpadła. Królowych w Roju jest jedna (Pszczoła Królowa, czwarty bohater).

### Alternatywy
- **Jednostki:** Pszczoła Wojowniczka (zamiast Mrówki), Żuk Jeleń (zamiast Bombardiera, wręcz, odpycha).
- **Mechanika:** *Rój* — +1 A za każdego sąsiadującego sojusznika z Roju dla wszystkich jednostek (bez grzybni; prostsza,
  ale bliska Obławie Hordy).
- **Budynek:** Ul (zamiast Ogrodu) — +1 zł na rundę i miód: raz na 3 rundy leczy drużynę bohatera w osadzie.

---

## 10. Bractwo Przypływu (`tides`)

**EN:** Brotherhood of the Tide · **Rola:** obrona + kontrola · **DLC**

**Klimat.** Lud rafy i odpływu: trytoni z trójzębami, syreny, kraboludy i żółwie, a w głębi węże morskie. Wychodzą na ląd
z przypływem i zabierają go ze sobą. Zdolności działają też na mapach bez wody.

**Mechanika wyróżniająca: Przypływ** — zamiana miejsc z sojusznikiem (ranny cofa się, świeży wchodzi), do tego osłona
i przyciąganie wrogów. Rozdzielenie ze Stadami: Przypływy nie szarżują, przestawiają i ściągają.

**Mocne strony:** rotacja rannych, ściąganie strzelców wroga, wytrzymałe żółwie.
**Słabości:** mało obrażeń; pułapki (Kompanie) i grzybnia (Rój) karzą przesuwanie.

### Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `tritonKing` | Król Trytonów | wojownik | 1 | chód | wręcz | **Ściana Wody:** raz na bitwę odpycha wszystkich sąsiednich wrogów o 1, sąsiedni sojusznicy −1 obrażeń do końca rundy | Pan Rafy: pomocnicy +1 Ż (`supportHp`) |
| `sirenSinger` | Syrena Pieśniarka | mędrzec | 1 | chód | dyst. | **Pieśń Syreny:** raz na bitwę wróg w zasięgu przyciągnięty o N pól ku niej | Głos Głębin: czary +1 (`spellPower`) |
| `seaSerpent` | Wąż Morski | łowca | 2 | chód | wręcz | **Oplot Głębin:** przyciąga cel o 1 i unieruchamia (raz na bitwę) | Prąd Morski: +1 ruchu (`move`) |

**Dowódcy:** Trytoński Strażnik (wojownik), Harpunniczka (łowca), **Sefiran Plamisty** (`sefiran`, mędrzec; zwierzak autora Stefan: wąż zbożowy, szary z czarnymi plamami na grzbiecie jak paski, lubi wodę, płochliwy, sympatyczny; **Wylinka:** raz na bitwę zrzuca skórę: traci wszystkie statusy i odzyskuje N Ż; decyzje 19.11 i 20.11, zamiast Kapłana Pływów).
**Czwarty bohater:** Stary Mors Kapitan (wojownik, odpychanie).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Żółw Skorupiak (`shellTurtle`) | żółw z rafą na skorupie (decyzja 20.11, awans z tieru 2A; jedyny żółw w frakcji) | 1 | chód | wręcz | Skorupa: raz na bitwę chowa się — 0 obrażeń do swojej następnej aktywacji, nie atakuje | ★ pełna osłona czasowa | — |
| 1 | Trytoński Harpunnik (`tritonHarpoon`) | tryton z harpunem na linie | 1 | chód | dyst. | Harpun: raz na bitwę trafiony przyciągnięty o 2 | przyciąganie | — |
| 1 | Żabi Skoczek (`frogLeaper`) | żabolud z krótką włócznią (z frakcji zapasowej) | 1 | chód | wręcz | Susem w Tył: raz na bitwę odskok po ataku | reuse: Powietrzny Zryw | — |
| 2A | Krabolud Tarczownik (`crabShield`) | krabolud z tarczą z pancerza kraba (decyzja 20.11, wraca z odrzuconych; mocniejszy od Żółwia, więc tier 2) | 1 | chód | wręcz | Twarda Skorupa: pancerz | pancerz | Krabia Skała |
| 2B | Ośmiornica Atramentowa (`inkOctopus`) | mała ośmiornica, która w odpływie przełazi po kamieniach rafy | 1 | chód | dyst. | Atrament: raz na bitwę cel i jego sąsiedzi −N A do końca następnej aktywacji (zalani atramentem) | aura osłabiająca (obszar) | Atramentowa Grota |
| 3A | Rekinołak (`sharkman`) | wojownik z głową rekina | 1 | chód | wręcz | Wir: raz na bitwę po ataku zamienia się miejscami z celem | zamiana miejsc (z wrogiem) | Rekinia Grota |
| 3B | Kapłanka Pereł (`pearlPriestess`) | trytonka z perłowym kosturem | 1 | chód | dyst. | Perłowa Tarcza: raz na bitwę sojusznik dostaje tarczę pochłaniającą N obrażeń | ★ tarcza punktowa | Perłowy Ołtarz |
| 4A | Homar Pancerny (`lobsterKnight`) | homar w pozie rycerza | 1 | chód | wręcz | Szczypce: trafiony nie rusza się do końca swojej następnej aktywacji; pancerz | reuse: Chwyt | Homarza Rafa |
| 4B | Albatros (`albatross`) | wielki morski ptak (decyzja 20.11, zamiast Morsa Kłowego) | 2 | lot | wręcz | Uderzenie Skrzydeł: po ataku odpycha cel o 1 (bez zderzenia) | odpychanie, lotny | Gniazdo Albatrosa |
| 5A | Rafowy Golem (`reefGolem`) | żywa rafa na dwóch nogach, z koralami i muszlami (decyzja 20.11, zamiast Żółwia-Wyspy) | 2 | chód | wręcz | Żywa Rafa: sąsiedni sojusznicy mają pancerz 1; nie do odepchnięcia | aura | Koralowa Jaskinia |
| 5B | Morska Wiedźma (`seaWitch`) | stara wiedźma w płaszczu z sieci i muszli | 1 | chód | dyst. | Odpływ: raz na bitwę zamienia miejscami dwie dowolne jednostki w zasięgu N | zamiana miejsc | Zatopiona Chata |
| 6 | Lewiatan (`leviathan`) | pradawny potwór morski | 2 | chód | wręcz | Wir Głębin: raz na bitwę wszyscy wrogowie w promieniu 3 przyciągnięci o 2 ku niemu | przyciąganie obszarowe | Rów Głębinowy |

### Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Świątynia Pływów** (mechanika) | Fosa i Mury | I: raz na bitwę jednostka Przypływów przed swoją aktywacją zamienia się miejscami z sojusznikiem w zasięgu 2 · II: raz na rundę · III: jednostka, która weszła na miejsce rannego, ma −1 obrażeń do końca rundy · IV: obie po zamianie +1 Ż |
| **Perłowe Ławice** (gospodarka) | Skarbiec | I: +1 zł na rundę · II: także +1 Pyłu co 4 rundy |
| **Latarnia Morska** (mapa) | Targ | odkrywa mapę w promieniu 3 wokół osady i pokazuje ruchy wrogich bohaterów w tym zasięgu; II: promień 5 |

**Iskra:** Perłowa Świątynia Pierwotnej Iskry — **każda jednostka zaczyna bitwę z Perłową Tarczą (pochłania 2 obrażenia).**
**Nazwy osad:** Perłowa Zatoka, Koralowa Brama, Latarnia Odpływu, Słona Przystań, Muszlowy Gród, Rafa Trytonów, Zatopione
Schody, Mewia Skała, Port Siedmiu Fal, Bursztynowy Brzeg, Lagunowy Dwór, Przylądek Syren.

### Wygląd i dźwięk
- **Paleta:** zieleń morska, jadeit, koral, perła, piasek, brąz, oliwkowe wodorosty, róż muszli. **Bez błękitu i turkusu
  w jednostkach.** Morska frakcja bez niebieskiego jest trudna: **zalecam dla niej inne tło kluczowe** (magenta #FF00FF,
  wtedy unikać czystego różu) albo wycinanie maską; sprawdzić w `PRZEPIS_JEDNOSTKI.md` przy próbce G3.
- **Herb:** trójząb w muszli. **Arena:** plaża przy rafie w czasie odpływu, skały, sieci, kałuże (przeszkody).
- **Muzyka:** harfa, chór, szum fal, róg z muszli.

### Bot
Trzyma szyk wokół żółwi, harpunami i Syreną ściąga strzelców wroga, rannych cofa zamianą miejsc. **Nie wolno mu:** zamieniać
się na pola obok pułapek i grzybni (jeśli je widzi), wysuwać Syreny na przód.

### Kolizje
- **Szczypiec (neutralny, Chwyt)** to krab: Homar ma chwyt (inny wygląd); Krabolud Tarczownik ma pancerz, bez chwytu. Mewa Rozbójniczka odpadła (patrz `ODRZUCONE_POMYSLY.md`).
- **Kraken i Hydra z Zatopionych Ruin (neutralni):** Przypływy bez wielogłowych; jedyne macki ma mała
  Ośmiornica (poziom 2), wyraźnie inna niż olbrzymi Kraken. Morska Wiedźma bez macek.
- **Wydra** jest w Kompaniach; Przypływy bez wydr.
- Odpychanie u Stad: patrz Stada.

### Alternatywy
- **Jednostki:** brak (Mewa Rozbójniczka odpadła 20.11, Nalot był zbyt podobny do Gryfa i Pegaza).
- **Mechanika:** *Fala* — co 3 rundy fala przyciąga wszystkich wrogów o 1 pole w stronę Przypływów (globalna, efektowna,
  zmienia całą arenę; łatwa do pokazania animacją).
- **Budynek mapy:** Przystań — bohater w osadzie przenosi się do innej osady Przypływów leżącej przy wodzie.

---

## 11. Nowe prymitywy silnika (zbiorczo)

To, czego brakuje w `battle.ts` i `primitives.ts` (dziś są: odpychanie, przyciąganie, zamiana miejsc, premia grupowa, aura,
spowolnienie, unieruchomienie, trucizna, wyczerpanie many, pola z efektem). Każdy nowy prymityw = funkcja + test + tekst z liczbami.

| Prymityw | Frakcje | Trudność | Uwagi |
|---|---|---|---|
| Zderzenie (obrażenia, gdy odepchnięty cel uderzy w przeszkodę) | Stada | mała | `pushAway` już zwraca `blocked` |
| Przeskok / ruch przez jednostki | Stada, Umarli | średnia | szukanie ścieżki z wyjątkiem |
| Odporność na przesunięcie / na statusy | Stada, Klany, Umarli | mała | flaga na jednostce |
| Premia za stan celu (odepchnięty, z szronem, ranny ≤½ Ż) | Stada, Szron, Rój | mała | jedna funkcja z warunkiem |
| Wskrzeszenie w polu | Umarli | średnia | trup → żywa jednostka na wolnym polu |
| Ignorowanie pancerza | Umarli, Rój | mała | |
| Tarcza jednorazowa / punktowa (pochłania N, typ ciosu) | Umarli, Przypływy, Szron | mała | |
| Premia za brak ruchu | Klany | mała | |
| Ogłuszenie (utrata aktywacji) | Klany, Szron, Kompanie | mała | zamrożenie to ta sama logika |
| Prowokacja (cel może atakować tylko prowokującego) | Stada (Łoś) | mała | filtr celów w AI i UI |
| Stawianie przeszkody (mur, tama, lodowa ściana) | Klany, Kompanie, Szron | średnia | `placeGround` z blokowaniem ruchu |
| Premia przeciw rozmiarowi | Klany | mała | |
| Oznaczenie celu | Kompanie | mała | status na jednostce do końca rundy |
| Ukryte pułapki | Kompanie | **duża** | ukryta informacja: UI, online, bot |
| Ukrycie jednostki | Kompanie, Piaski | **duża** | jak wyżej |
| Kontratak (riposta) | Kompanie | mała | |
| Premia za rany | Kompanie | mała | |
| Drugi atak (dystansowy) | Kompanie | średnia | |
| Szron (stosy i zamrożenie) | Szron | średnia | licznik na jednostce |
| Przestawienie wroga | Szron, Klany (Skarbnik) | mała | `swapPlaces` / teleport celu |
| Miraż (atrapa) | Piaski | **duża** | ukryta informacja |
| Reakcja na wejście obok | Piaski | średnia | wymaga przerwania ruchu |
| Uśpienie do bodźca | Piaski | mała | |
| Ruch z pasażerem | Piaski | średnia | |
| Grzybnia (zajęcie terenu) | Rój | średnia | `placeGround` + warunki |
| Zmiana formy jednostki (Przepoczwarzenie) | Rój | średnia | jednostka zmienia się po progu Ż: Ż i lot |

Najdroższe są trzy prymitywy z ukrytą informacją (pułapki, ukrycie, miraż). Jeśli trzeba ciąć: Kompanie i Piaski mają
w Alternatywach mechaniki jawne.

---

## 12. Frakcje zapasowe (alternatywy dla całych frakcji)

Gdyby któraś z ośmiu odpadła, tu są zamienniki z inną rolą lub innym klimatem.

| Frakcja | Klimat | Rola i mechanika | Może zastąpić | Uwagi |
|---|---|---|---|---|
| **Biesy Starego Boru** (`bies`) | słowiańskie demony: Leszy, Licho, Utopiec, Południca, Kikimora, Bies | wyczerpanie; **Licho** — klątwy przeskakujące na sąsiadów | Królestwo Umarłych albo Rój | najbardziej swojski klimat; Marzanna mogłaby przejść tutaj |
| **Podniebne Gniazda** (`skies`) | ptasi lud: orły, sokoły, żurawie, czaple | mobilność; **Wiatr** — wszyscy latają, ataki z góry +A, ignorują przeszkody | Pustynne Cesarstwo | proste w silniku, bez ukrytej informacji; kolizja z Orłem Skalnym i Gryfem |
| **Gwiezdny Zakon** (`stars`) | astrolodzy, gwiezdne jelenie, zegarowe sowy | **tempo**; **Gwiazdozbiór** — przesuwanie kolejki inicjatywy, dodatkowe aktywacje | Wolna Kompania | nowa rola, której nie ma nikt; mocno zależy od UI kolejki |
| **Bagienne Plemiona** (`marsh`) | żabolud, jaszczuroludzie, czaple, utopce | kontrola; **Moczary** — pola bagna spowalniają wrogów, Plemiona przez nie przechodzą | Rój albo Przypływy | blisko grzybni Roju i wody Przypływów |
| **Dwór Snów** (`dreams`) | wróżki, ćmy, jednorożce nocy | kontrola; **Sen** — usypianie jednostek (budzi je cios) | Pustynne Cesarstwo | blisko mirażu i Przymierza (jednorożce) |

---

## 13. Decyzje (stan 19.11.2026)

Rozstrzygnięte:
1. **Skład ośmiu** zostaje (frakcje zapasowe czekają w rezerwie).
2. **Kolizje stworów:** Stada bez centaurów i minotaurów; bez nowych wilków i psów.
3. **Ukryta informacja:** robimy (pułapki, miraże, ukrycie), hot-seat z zasłonami w trzech momentach (punkt 2).
4. **Tło kluczowe** zostaje niebieskie; w postaciach Szronu i Przypływów bez błękitów (lód biały/szary, morze zielone).
5. **Runiczna Kuźnia** Klanów (trwała), runa zostaje przy jednostce po śmierci.
6. **Bonusy Reliktu** mogą być różnej natury (jak w kartach).
7. **Czwarci bohaterowie** wdrażamy razem z frakcją.
8. **Układ jednostek:** tiery 2–5 z wersjami A i B; na poziomie 6 siedlisko jednego wyklucza drugie (jak Przymierze i Horda).
9. Po akceptacji kart: przenoszę karty do `docs/frakcje/<id>.md` (bramka G0) i ruszam z G1 dla Dzikiego Stada.

---

## 14. Rozstrzygnięte po uwagach z 19.11 i 20.11

**Rozstrzygnięte:**
- Zwierzaki autora jako **dowódcy z karczmy**: **Żbiczka Bajdurka** (łowca, Kompanie, Szalony Skok), **Bastia Cienista** (wojownik, Piaski, Czujna Drzemka), **Sefiran Plamisty** (mędrzec, Przypływy, Wylinka). Odróżnienie Sefirana od Węża Morskiego: mały, szary, w plamy.
- Wij: **Wij Podziemny**. Kozioł Taranowy (Skok po Turniach): Klany 3B zamiast Wiropłatu, zdolność zatwierdzona.
- Kompanie: jedna ropucha (Hakownik); Tchórz Smrodnik (3A) i Zajęczyca Zielarka (dowódca). Gronostaj jest w Szronie, więc odpadł.
- Szron: dowódca-łowca to **Tropicielka Mroźnych Puszcz** (zamiast Łowczyni z Gronostajem). Zmiana w kodzie i kartach `frost.md` w osobnym commicie.
- Przypływy: Mewa odpadła; Żółw Skorupiak na tier 1, **Krabolud Tarczownik na 2A** (pancerz poziomu 1: pokrywa osłona Żółwia), **Rafowy Golem** zamiast Żółwia-Wyspy (jeden żółw).
- Stada: Dudziarz atakuje falą dźwięku bez kolorowych nut; trzej pomocnicy startowi zatwierdzeni (Dudziarz, Młody Tur, Kulan); zderzenie rani też jednostkę, w którą uderza.
- Piaski (przegląd autora 20.11): Mangusta Faraona (tier 1, Odporność na Jad), Skorpion Piaskowy na 2A, Krokodyl Oazowy zamiast Olbrzymiego Skorpiona, bez Łucznika na Wielbłądzie i bez Hieny; wielbłąd tylko u Wielbłądziego Księcia.
- Rój (przegląd autora 20.11): Królowa Modliszek zostaje bohaterką; Gąsienica Korzenna (2A, po przemianie Motyl Korzenny) zamiast Ryjkowca, Ważka Łowczyni (4A) zamiast Modliszki Ostrzy, Ślimak Pancerny (5B), **Cesarska Cykada** (6); Śniący Muchomor zamiast Prastarego Muchomora.

**Otwarte (drobne):**
1. Liczby zdolności nowych jednostek i bohaterów (N) ustala balans przy G2; Mangusta może dostać statystyki zgodnie z symulacjami.
2. Przegląd nazw w całej grze pod kątem powtórzeń słów „prastary” i „pradawny”.

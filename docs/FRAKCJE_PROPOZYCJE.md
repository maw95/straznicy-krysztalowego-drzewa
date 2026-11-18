# Nowe frakcje — propozycje (8 nowych, razem 10)

Stan: 18.11.2026. Dokument do przeczytania i skreślania. Rozwija macierz z `FRAKCJE_MACIERZ_I_PRYMITYWY.md` (role, prymitywy,
kolizje) i pomysły autora z `ROZBUDOWA_CYFROWA.md` (3.11) w pełne karty frakcji. **Nie ma tu kosztów budynków ani statystyk**
(Ż, A, S): te ustalają symulacje balansu przy bramce G2. Każda frakcja ma też sekcję **Alternatywy** (inne jednostki, budynki,
mechanika), a na końcu są **frakcje zapasowe**, gdyby któraś z ośmiu nie przypadła do gustu.

Kolejność wdrażania zostaje jak w backlogu (punkty 52–55): **Dzikie Stada → Królestwo Umarłych → Żelazne Klany → DLC**.

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
3. [Dzikie Stada](#3-dzikie-stada-herds)
4. [Królestwo Umarłych](#4-królestwo-umarłych-undead)
5. [Żelazne Klany](#5-żelazne-klany-clans)
6. [Wolne Kompanie](#6-wolne-kompanie-free)
7. [Dwór Wiecznego Szronu](#7-dwór-wiecznego-szronu-frost)
8. [Imperium Piasków](#8-imperium-piasków-sands)
9. [Rój Głębin](#9-rój-głębin-swarm)
10. [Władcy Przypływów](#10-władcy-przypływów-tides)
11. [Nowe prymitywy silnika (zbiorczo)](#11-nowe-prymitywy-silnika-zbiorczo)
12. [Frakcje zapasowe](#12-frakcje-zapasowe-alternatywy-dla-całych-frakcji)
13. [Decyzje do podjęcia](#13-decyzje-do-podjęcia)

---

## 1. Przegląd 10 frakcji

| # | Frakcja (`id`) | EN | Rola | Mechanika frakcji (budynek) | Bonus Reliktu (Iskra) | Barwa w UI |
|---|---|---|---|---|---|---|
| 1 | Przymierze Świtu (`dawn`) | Dawn Alliance | obrona + wsparcie | Blask Świtu — leczenie co rundę (Kapliczka Świtu) | +2 Ż wszystkim | zieleń |
| 2 | Mroczna Horda (`horde`) | Dark Horde | agresja | Żądza Krwi — +A po zabiciu wroga (Jama Krwi) | +1 A wszystkim | bordo |
| 3 | **Dzikie Stada** (`herds`) | Wild Herds | agresja + mobilność | **Tętent** — rozpęd odpycha cel, zderzenie rani (Kamień Tętentu) | +1 S wszystkim | ochra / słoma |
| 4 | **Królestwo Umarłych** (`undead`) | Barrow Kingdom | wyczerpanie | **Wieczna Warta** — polegli pomocnicy wstają (Kurhan Wiecznej Warty) | odporność na trucizny, klątwy, spowolnienia | popielata zieleń |
| 5 | **Żelazne Klany** (`clans`) | Iron Clans | obrona | **Mur Tarcz** — pancerz w zwartym szyku (Sala Tarcz) | pancerz 1 wszystkim | stal / miedź |
| 6 | **Wolne Kompanie** (`free`) | Free Companies | kontrola + mobilność | **Sidła** — ukryte pułapki przed bitwą (Warsztat Sideł) | +2 pułapki w każdej bitwie | rdzawy pomarańcz |
| 7 | **Dwór Wiecznego Szronu** (`frost`) | Court of Everfrost | kontrola | **Szron** — ciosy nakładają szron, przy progu cel zamarza (Pałac Szronu) | wrogowie zaczynają bitwę z 1 szronem | biel / lodowy błękit |
| 8 | **Imperium Piasków** (`sands`) | Sand Empire | mobilność | **Miraż** — atrapy własnych jednostek (Pałac Mirażu) | przestawienie 2 jednostek po rozstawieniu | złoto / piasek |
| 9 | **Rój Głębin** (`swarm`) | Deep Swarm | wyczerpanie + kontrola | **Grzybnia** — zajmowanie pól areny (Serce Grzybni) | grzybnia na starcie bitwy | fiolet-brąz |
| 10 | **Władcy Przypływów** (`tides`) | Tide Lords | obrona + kontrola | **Przypływ** — zamiana miejsc z sojusznikiem (Świątynia Pływów) | Perłowa Tarcza (pochłania 2) | morska zieleń |

Barwa w UI to kolor miejsca w kreatorze (`SEAT_TINT`) i herbu. Niebieski jest tu dozwolony; zakaz niebieskiego dotyczy tylko
grafik jednostek (tło do wycinania #0000FF, `STYL_JEDNOSTEK.md`).

### Kto z kim (zamysł kontr, do sprawdzenia symulacją)

| Frakcja | Ma przewagę nad | Ma trudno z | Dlaczego |
|---|---|---|---|
| Stada | Szron, Piaski, Kompanie | Klany, Przypływy | rozpęd rozbija kontrolę i atrapy; Klany i Przypływy nie dają się odepchnąć albo cofają rannych |
| Umarli | Przymierze, Klany | Horda, Rój | długa bitwa i powroty; Horda kończy szybko, Rój zatruwa wstających |
| Klany | Stada, Horda | Umarli, Szron | szyk tarcz trzyma szarże; wolni, więc kontrola i wyczerpanie ich rozbierają |
| Kompanie | Klany, Rój | Stada, Piaski | pułapki karzą wolny szyk; szybcy przeskakują pułapki, miraże marnują Fortel |
| Szron | Klany, Przypływy | Stada, Horda | zamrażanie wolnych; szybcy dobiegają zanim szron się nazbiera |
| Piaski | Szron, Przymierze | Stada, Kompanie | ruch i atrapy; Kruk Kompanii odsłania miraże |
| Rój | Przymierze, Kompanie | Szron, Piaski | grzybnia karze stojących; ruch i zamrożenie odcinają od grzybni |
| Przypływy | Horda, Stada | Kompanie, Rój | rotacja rannych; pułapki i grzybnia karzą przesuwanie |

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
| 17 | Balans 45–55% przeciw panelowi wzorcowemu, golden świadomie | `make sim-tabele`, `tests/golden.test.ts` | — |

Frakcje z **ukrytą informacją** (Wolne Kompanie: ukryte pułapki; Imperium Piasków: miraże) potrzebują dodatkowo: ekranu
przekazania w hotseacie, ukrywania stanu przed przeciwnikiem w grze przez internet (serwer) i bota, który nie podgląda.
To osobne zadanie, liczone przy tych frakcjach.

---

## 3. Dzikie Stada (`herds`)

**EN:** Wild Herds · **Rola:** agresja + mobilność · **Kolejność:** pierwsza (pilot procesu)

**Klimat.** Wędrowne stada stepów i puszcz: tury, żubry, nosorożce i mamuty, prowadzone przez satyrów z rogami i dudami.
Nie mają osad w naszym rozumieniu: ich osady to obozowiska przy wodopojach i kamiennych kręgach. Walczą rozpędem: kto
stoi na drodze stada, ląduje na skale.

**Mechanika wyróżniająca: Tętent.** Przymierze ma już premie za bieg (Król Jednorożców, Odyniec, Biały Jeleń), więc
Stada różnią się **odepchnięciem i zderzeniem**: rozpędzona jednostka spycha cel, a cel, który uderzy w przeszkodę, krawędź
areny albo inną jednostkę, dostaje dodatkowe obrażenia. Arena Stad ma dużo głazów.

**Mocne strony:** inicjatywa, szybkie dojście do strzelców, rozbijanie szyków, podbój mapy.
**Słabości:** brak leczenia, słabi strzelcy, mury osad (potrzebują Nosorożca albo Mamuta), jednostki niewzruszone (Klany).

### Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `greatAurochs` | Wielki Tur, Ojciec Stada | wojownik | 2 | chód | wręcz | **Rogi Przodków:** raz na bitwę szarża w linii prostej do N pól; mali wrogowie na drodze zepchnięci na bok, cel na końcu odepchnięty o 2 (zderzenie rani) | Przewodnik Stada: pomocnicy +1 Ż (`supportHp`) |
| `satyrHornlord` | Satyr Rogogłos | mędrzec | 1 | chód | dyst. | **Róg Wędrówki:** raz na bitwę wszyscy sojusznicy +N S w następnej aktywacji | Dzika Pieśń: czary +1 (`spellPower`) |
| `windAntelope` | Pędziwiatr, Wódz Antylop | łowca | 1 | chód | wręcz | **W Biegu:** raz na bitwę po ataku dokańcza ruch pozostałymi polami | Wędrowiec Stepu: +1 ruchu (`move`) |

**Dowódcy (karczma):** Turzy Zagończyk (wojownik), Faun Oszczepnik (łowca, dyst.), Satyr Wróżbita (mędrzec).
**Czwarty bohater (7–8 graczy):** Baran Gromowładny (wojownik, odepchnięcie po każdym ataku).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Satyr Dudziarz (`satyrPiper`) | satyr z dudami | 1 | chód | dyst. | Skoczny Rytm: raz na bitwę sojusznik +N S | spowolnienie (odwrotne) | — |
| 1 | Młody Tur (`youngAurochs`) | cielak tura | 1 | chód | wręcz | Byczy Łeb: po każdym ataku odpycha cel o 1 | odpychanie | — |
| 1 | Kozica Skalna (`rockGoat`) | kozica z rogami | 1 | chód | wręcz | Skok po Turniach: ruch przez przeszkody i jednostki | ★ przeskok | — |
| 2A | Faun Procarz (`faunSlinger`) | faun z procą | 1 | chód | dyst. | Kamień w Kolano: raz na bitwę trafiony −N S | spowolnienie | Fauni Zagajnik |
| 2B | Tarpan (`tarpan`) | dziki koń stepowy | 1 | chód | wręcz | Rozpęd: +N A po przebiegnięciu ≥M pól | premia za ruch | Tarpanie Błonia |
| 3A | Żubr Puszczański (`forestBison`) | żubr | 1 | chód | wręcz | Niewzruszony: pancerz; nie da się go odepchnąć, przyciągnąć ani przestawić | pancerz, ★ odporność na przesunięcie | Żubrza Ostoja |
| 3B | Satyr Kopijnik (`satyrLancer`) | satyr z długą kopią | 1 | chód | wręcz | Przebicie: cios trafia cel i jednostkę za nim | reuse: Ognisty Oddech (linia 2 pól) | Obóz Kopijników |
| 4A | Nosorożec Bojowy (`warRhino`) | nosorożec w skórzanym rzędzie | 2 | chód | wręcz | Taran: po ≥N polach odepchnięcie o 2, zderzenie +N obrażeń; podwójne obrażenia bramom | odpychanie + ★ zderzenie | Błotne Brody |
| 4B | Bawół z Bębnem (`drumBuffalo`) | bawół niosący wielki bęben | 2 | chód | wręcz | Bęben Wędrówki: aura, sojusznicy w promieniu 2 mają +1 S | aura | Krąg Bębnów |
| 5A | Mamut Wojenny (`warMammoth`) | mamut z kłami w brązie | 2 | chód | wręcz | Stratowanie: idzie przez pola małych wrogów, każdego spycha na bok i rani o N | ★ przejście z odepchnięciem | Mamucie Wzgórze |
| 5B | Tygrys Szablozęby (`sabertooth`) | drapieżnik stepu | 1 | chód | wręcz | Skok na Kark: skacze do celu w zasięgu N nad jednostkami; +N A, jeśli cel był w tej rundzie odepchnięty | ★ przeskok, ★ premia za stan celu | Skalna Pieczara |
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
Nosorożca albo Mamuta.

### Kolizje
- **Centaury i minotaury** z pomysłu autora już są: Centaur w Przymierzu, Herszt Minotaurów w Hordzie. Proponuję Stada bez
  nich (zamiast: tury, żubry, tarpany, antylopy). Alternatywa niżej.
- Premia za ruch jest w Przymierzu; Stada mają ją tylko u Tarpana, ich znakiem jest odepchnięcie i zderzenie.
- Odpychanie w Przypływach: Przypływy odpychają w miejscu (Ściana Wody), bez rozpędu i bez zderzeń.

### Alternatywy
- **Jednostki:** Centaurzyca Stepu (zamiast Fauna Procarza, jeśli autor chce centaurów; wtedy Centaura Przymierza przemianować
  na Centaura Gaju), Minotaur Pasterz (zamiast Żubra), Łoś Rogacz (zamiast Tarpana), Hipogryf Stepowy (lot, zamiast Tygrysa).
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
| 3B | Płaczka (`banshee`) | zawodząca zjawa | 1 | lot | dyst. | Lament: raz na bitwę wrogowie w promieniu 2 −1 A do końca następnej aktywacji | aura osłabiająca | Wieża Płaczek |
| 4A | Kurhanowy Olbrzym (`barrowGiant`) | olbrzym z kamieni i darni | 2 | chód | wręcz | Ciężar Ziemi: raz na bitwę trafiony unieruchomiony | unieruchomienie | Wielki Kurhan |
| 4B | Kościana Wróżka (`boneOracle`) | wróżka z koroną z kości | 1 | chód | dyst. | Ponowny Oddech: raz na bitwę wskrzesza poległego pomocnika tieru ≤3 na sąsiednim polu z połową Ż | ★ wskrzeszenie w polu | Kaplica Wróżb |
| 5A | Licz (`lich`) | czarnoksiężnik w koronie | 1 | chód | dyst. | Żniwo Many: każde trafienie zabiera bohaterowi wroga 1 many i leczy Licza o 1 | ★ wyczerpanie many | Biblioteka Umarłych |
| 5B | Jeździec na Zmorze (`nightmareRider`) | widmowy rycerz na czarnym koniu | 2 | chód | wręcz | Strach Nocy: trafiony cofa się o 1 i ma −1 A | odpychanie + osłabienie | Stajnia Zmór |
| 6 | Kościany Smok (`boneDragon`) | szkielet smoka z mchem i latarniami | 2 | lot | wręcz | Oddech Grobu: raz na bitwę linia 3 pól, obrażenia i −1 S | reuse: Ognisty Oddech + spowolnienie | Smocze Cmentarzysko |

### Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Kurhan Wiecznej Warty** (mechanika) | Szpital | I: raz na bitwę na końcu rundy najtańszy poległy pomocnik wstaje z 1 Ż (na swoim polu albo najbliższym wolnym) · II: wstaje z połową Ż · III: dwa razy na bitwę · IV: wskrzeszony +1 A do końca bitwy. Bohaterowie nie wstają |
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
Gra na czas: chroni Licza i Kościaną Wróżkę z tyłu, wystawia tanie szkielety na pierwszą linię (i tak wstaną), celuje Liczem
i Latarniczką w bohatera z maną. **Nie wolno mu:** rzucać bohaterów na pierwszą linię (oni nie wstają).

### Kolizje
- **Eliksir Odrodzenia / skarb „Wskrzeszenie”:** wskrzesza jednostkę na stałe i poza bitwą; Warta działa tylko w bitwie.
  Propozycja z macierzy: skarb nie działa w bitwie na jednostkę, która w tej bitwie już wstała przez Wartę.
- **Feniks Świtu:** odradza siebie; Umarli podnoszą innych. Zostaje.
- **Mumie** nie trafiają ani tu, ani do Piasków: Piaski mają kamiennych strażników grobowców, nie umarłych.

### Alternatywy
- **Jednostki:** Topielica (zamiast Płaczki, przyciąga), Kościej Nieśmiertelny (legenda zamiast Smoka: wstaje, dopóki żyje
  któryś z jego sług), Wilkołak-widmo (zamiast Jeźdźca, jeśli Jeździec za duży w produkcji).
- **Mechanika:** *Chłód Grobu* — każdy cios Umarłych −1 S do końca następnej aktywacji, kumuluje się (czyste wyczerpanie,
  bez wskrzeszania; prostsze, ale bliskie Szronowi).
- **Budynek mapy:** Mgła Kurhanów — wrodzy bohaterowie w promieniu 2 od osady nie widzą jej garnizonu.

---

## 5. Żelazne Klany (`clans`)

**EN:** Iron Clans · **Rola:** obrona · **Kolejność:** trzecia

**Klimat.** Krasnoludy z gór, ich mechanizmy z brązu i opancerzone niedźwiedzie bojowe. Każdy klan ma kuźnię i salę przodków,
a każdy wojownik nosi runy wybite przez kowala. Powolni, ale gdzie stanęli, tam się nie przejdzie.

**Mechanika wyróżniająca: Mur Tarcz** (w bitwie) i **Kuźnia Run** (trwałe ulepszanie wyposażenia pomocników, jedyna taka
frakcja). Pancerz rośnie, gdy jednostki stoją obok siebie.

**Mocne strony:** odporność, obrona osad, oblężenia (Taran, Armata), kontrują szarże Stad.
**Słabości:** mała mobilność na mapie i w bitwie, jeden latający; kontrola (Szron) i wyczerpanie (Umarli) ich rozbierają.

### Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `ironThane` | Tan Żelaznobrody | wojownik | 1 | chód | wręcz | **Przysięga Tarczy:** raz na bitwę do końca rundy sąsiedni sojusznicy mają +N pancerza | Tarcza Rodu: pomocnicy +1 Ż (`supportHp`) |
| `runeMatron` | Matka Run | mędrzec | 1 | chód | dyst. | **Runa Kamienia:** raz na bitwę sojusznik +1 pancerza do końca bitwy i nie da się go odepchnąć | Wiedza Przodków: czary +1 (`spellPower`) |
| `ballistaMaster` | Mistrz Balisty | łowca | 1 | chód | dyst. | **Bełt Przeszywający:** cios trafia cel i jednostkę za nim w linii | Oko Celownika: strzelcy +1 A (`marksman`) |

**Dowódcy:** Wojownik Klanu (wojownik), Kusznik Gór (łowca), Kapłan Kuźni (mędrzec).
**Czwarty bohater:** Stary Górmistrz (wojownik, Podkop).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Krasnoludzki Tarczownik (`shieldDwarf`) | krasnolud z pawężą | 1 | chód | wręcz | Pawęż: pancerz | pancerz | — |
| 1 | Górnik (`dwarfMiner`) | krasnolud z kilofem | 1 | chód | wręcz | Podkop: zamiast ruchu wyłania się na dowolnym polu w zasięgu | reuse: Podkop (Podkopnik) | — |
| 1 | Kusznik Klanu (`clanCrossbow`) | krasnolud z kuszą | 1 | chód | dyst. | Salwa z Miejsca: +N A, gdy w tej aktywacji się nie ruszał | ★ premia za brak ruchu | — |
| 2A | Niedźwiedź w Zbroi (`armoredBear`) | niedźwiedź bojowy w blachach | 1 | chód | wręcz | Kolczuga: pancerz; bez osłaniania (to robi Prastary Niedźwiedź) | pancerz | Gawra Zbrojna |
| 2B | Kowal Bitewny (`battleSmith`) | krasnolud z młotem i kowadłem na plecach | 1 | chód | wręcz | Hartowanie: raz na bitwę sąsiad +1 A do końca bitwy | ★ wzmocnienie sąsiada | Polowa Kuźnia |
| 3A | Wartownik z Brązu (`bronzeSentinel`) | mechaniczny strażnik | 1 | chód | wręcz | Kolce Mechanizmu: atakujący wręcz traci N Ż; odporny na truciznę | reuse: Kolce | Warsztat Mechanizmów |
| 3B | Wiropłat (`gyrocopter`) | maszyna z wirnikiem i krasnoludem | 1 | lot | dyst. | Zrzut: raz na bitwę cel i jego sąsiedzi po N | reuse: Pożoga | Lądowisko Wiropłatów |
| 4A | Pogromca Olbrzymów (`giantSlayer`) | krasnolud z dwuręcznym toporem | 1 | chód | wręcz | Na Duże Cele: +N A przeciw dużym jednostkom | ★ premia przeciw rozmiarowi | Sala Pogromców |
| 4B | Taran Klanów (`siegeRam`) | taran na kołach pod dachem | 2 | chód | wręcz | Burzyciel: podwójne obrażenia murom i bramom; pancerz | pancerz, oblężenie | Wozownia Oblężnicza |
| 5A | Gwardia Młota (`hammerGuard`) | elitarny krasnolud w pełnej zbroi | 1 | chód | wręcz | Młot Przodków: raz na bitwę trafiony traci następną aktywację | ★ ogłuszenie | Sala Gwardii |
| 5B | Armata Klanów (`dwarfCannon`) | brązowa armata z obsługą | 2 | chód | dyst. | Ostrzał: cios w cel i sąsiadów; nie strzela w aktywacji, w której się ruszyła | ★ obszar + premia za brak ruchu | Ludwisarnia |
| 6 | Kolos Kuźni (`clanColossus`) | olbrzymi mechanizm z kotłem | 2 | chód | wręcz | Fortyfikacja: raz na bitwę stawia 2 pola muru obok siebie; pancerz; nie do odepchnięcia | ★ stawianie przeszkody | Wielka Kuźnia Kolosa |

### Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Sala Tarcz** (mechanika) | Fosa i Mury | I: jednostka Klanów z ≥2 sąsiednimi sojusznikami ma −1 obrażeń z każdego ciosu · II: wystarczy 1 sąsiad · III: w szyku nie da się jej odepchnąć ani przyciągnąć · IV: kto atakuje wręcz jednostkę w szyku, traci 1 Ż |
| **Kuźnia Run** (wyposażenie) | Kuźnia | I: raz na rundę jeden pomocnik dostaje trwałą runę (+1 A, +1 Ż albo pancerz 1; jedna na jednostkę) · II: dwie runy na jednostkę. ★ nowy stan: runy na pomocniku w puli |
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
Stoi w szyku (sąsiedzi), czeka na wroga na swojej połowie, strzela z miejsca. Na mapie: buduje Sztolnię i Kuźnię Run, broni
osad, szturmuje z Taranem. **Nie wolno mu:** rozdzielać jednostek pojedynczo, ruszać Armatą i Kusznikami bez potrzeby.

### Kolizje
- **Prastary Niedźwiedź (Przymierze):** niedźwiedź Klanów jest jednostką z pancerzem, bez „przyjmij cios za sąsiada” (decyzja
  z macierzy).
- **Kamienny Golem (neutralny):** mechanizmy Klanów są z brązu i mają kotły, nie z kamienia z runami.
- Kuźnia (wspólna) daje +1 A pomocnikom całej frakcji; Kuźnia Run daje ulepszenia pojedynczym jednostkom, na stałe.

### Alternatywy
- **Jednostki:** Jeźdźcy Kozłów Górskich (zamiast Niedźwiedzia, trochę mobilności), Mechaniczny Pająk (zamiast Wiropłatu, jeśli
  maszyny latające nie pasują), Golem Parowy (legenda zamiast Kolosa).
- **Mechanika:** *Runy Bitewne* — przed bitwą każdy pomocnik dostaje jedną runę do wyboru (bez budynku Kuźni Run; prościej
  w stanie gry, więcej klikania).
- **Budynek:** Kolej Górska — bohater w osadzie Klanów przenosi się do innej osady Klanów (zamiast Sztolni; łata mobilność).

---

## 6. Wolne Kompanie (`free`)

**EN:** Free Companies · **Rola:** kontrola + mobilność · **DLC**

**Klimat.** Bractwo zwierząt z lasów i rzek: lisy, borsuki, kruki, wydry, kuny. Trochę zbójnicy spod Tatr, trochę najemnicy,
zawsze z planem. Każdy jest specjalistą: jeden zastawia sidła, drugi oznacza cel, trzeci wchodzi od tyłu.

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

**Dowódcy:** Kuna Rębajło (wojownik), Wiewiórka Łuczniczka (łowca), Ropucha Zielarka (mędrzec).
**Czwarty bohater:** Wydra Przemytniczka (łowca, odskok).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Wydra Zwiadowczyni (`otterScout`) | wydra w kapturze | 1 | chód | wręcz | Wyślizg: raz na bitwę odskok po ataku | reuse: Powietrzny Zryw | — |
| 1 | Kuna Złodziejka (`martenThief`) | kuna z sakwą | 1 | chód | wręcz | Kieszonkowiec: pierwszy cios w bohatera w bitwie daje frakcji +1 zł | ★ łup w bitwie | — |
| 1 | Wiewiórka Łuczniczka (`squirrelArcher`) | wiewiórka z krótkim łukiem | 1 | chód | dyst. | Strzał z Gałęzi: +1 A przeciw oznaczonemu celowi | ★ oznaczenie | — |
| 2A | Łasica Nożowniczka (`weaselKnife`) | łasica z dwoma nożami | 1 | chód | wręcz | Cios w Plecy: +N, gdy atakuje od tyłu | reuse: Zajście od tyłu | Kryjówka w Żywopłocie |
| 2B | Bóbr Inżynier (`beaverEngineer`) | bóbr z siekierką i planem | 1 | chód | wręcz | Tama: raz na bitwę stawia przeszkodę na sąsiednim polu | ★ stawianie przeszkody | Żeremie |
| 3A | Ropucha Truciciel (`toadPoisoner`) | ropucha z flaszkami | 1 | chód | dyst. | Mętna Mikstura: raz na bitwę cel i sąsiedzi zatruci | trucizna (obszar) | Warzelnia |
| 3B | Ryś Skrytobójca (`lynxAssassin`) | ryś w ciemnym płaszczu | 1 | chód | wręcz | Ukryty: zaczyna bitwę niewidoczny dla wroga; pierwszy atak +N | ★ ukrycie | Leśna Czatownia |
| 4A | Rosomak Zabijaka (`wolverine`) | rosomak z blizną | 1 | chód | wręcz | Furia Ran: +1 A za każde N brakujących Ż | ★ premia za rany | Rosomacza Nora |
| 4B | Borsuk Petardnik (`badgerBomber`) | borsuk z beczułką prochu | 1 | chód | wręcz | Ładunek: raz na bitwę zamienia własną pułapkę w wybuch (pole i sąsiedzi) | pułapka + obszar | Prochownia |
| 5A | Wóz Taborowy (`wagonFort`) | wóz z palisadą ciągnięty przez woły | 2 | chód | dyst. | Tabor: sąsiedni sojusznicy mają pancerz 1 | aura | Obóz Taborowy |
| 5B | Kocur Fechmistrz (`catFencer`) | stary kocur z rapierem | 1 | chód | wręcz | Riposta: oddaje N każdemu, kto zaatakuje go wręcz i przeżyje | ★ kontratak | Fechtownia |
| 6 | Łoś Wieżowy (`towerMoose`) | olbrzymi łoś z wieżyczką łuczników | 2 | chód | wręcz | Ruchoma Twierdza: atakuje wręcz, a raz na rundę dodatkowo strzela wieżyczka | ★ drugi atak (dystansowy) | Wielka Stajnia Kompanii |

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
- **Jednostki:** Jenot Szpieg (zamiast Rysia), Sokolnik z Sokołem (zamiast Wiewiórki), Niedźwiadek Bartnik z rojem pszczół
  (zamiast Wozu; uwaga na niedźwiedzie w innych frakcjach).
- **Mechanika:** *Kontrakt* — przed bitwą wybierasz jedną wrogą jednostkę jako cel kontraktu; jej zabicie daje złoto i +A
  wszystkim (bez ukrytej informacji, łatwiej online).
- **Nazwa frakcji:** Zbójnickie Bractwo (bardziej swojsko).

---

## 7. Dwór Wiecznego Szronu (`frost`)

**EN:** Court of Everfrost · **Rola:** kontrola · **DLC**

**Klimat.** Dwór Marzanny, Pani Zimy, w lodowych salach na północy. Olbrzymi jarlowie, wiedźmy zamieci, białe wilki i strzygi
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
| `blizzardWolf` | Wilczyca Zamieci | łowca | 1 | chód | wręcz | **Ślad Zamieci:** pola, przez które przebiegła, do końca rundy dają wrogom −1 S | Biegnąca z Wiatrem: +1 ruchu (`move`) |

**Dowódcy:** Rycerz Lodowej Gwardii (wojownik), Łowczyni z Gronostajem (łowca), Szronowa Wiedźma (mędrzec).
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
| 4B | Strzyga Wichru (`windStrzyga`) | słowiańska strzyga z wichru | 1 | lot | wręcz | Porwanie: raz na bitwę unosi małego wroga i stawia go 2–3 pola dalej, z dala od jego sojuszników | ★ przestawienie wroga | Wichrowy Szczyt |
| 5A | Olbrzym Gradu (`elderGiant`) | stary olbrzym z bryłami lodu | 2 | chód | dyst. | Grad Głazów: cel i sąsiedzi po N, każdy dostaje szron | obszar | Gradowa Turnia |
| 5B | Duch Zorzy (`auroraSpirit`) | świetlista postać z zorzy | 1 | lot | dyst. | Zimne Światło: aura, wrogowie w promieniu 2 mają −1 S | aura osłabiająca | Wieża Zorzy |
| 6 | Biały Wilk Zimy (`winterWolf`) | olbrzymi biały wilk | 2 | chód | wręcz | Długa Noc: raz na bitwę każdy wróg dostaje szron | szron (globalnie) | Jaskinia Zimy |

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
Skupia ciosy na jednym celu, żeby go zamrozić; Lodową Ścianą odcina bohatera wroga od pomocników; Strzygą porywa strzelców.
Trzyma dystans. **Nie wolno mu:** rozpraszać szronu po wielu celach, pchać się wręcz ze słabymi.

### Kolizje
- **Śnieżne sowy** z pomysłu autora usunięte (Sowa Świtu w Przymierzu); w ich miejsce Rusałka Szronu i Duch Zorzy.
- **Białe wilki** a Horda (Władca Wilkołaków, Piekielny Ogar): wilki Dworu są białe, smukłe, dworskie, bez ognia. Jeśli to za
  blisko, Wilczycę zastępuje Ryś Śnieżny, a legendę Lodowy Tur.
- **Spowolnienie** jest w grze (Splątane Korzenie, czar); Szron to narastanie i zamrożenie.

### Alternatywy
- **Jednostki:** Mroźny Niedźwiedź Polarny (zamiast Jaka; kolizja z niedźwiedziami), Lodowy Golem (zamiast Rycerza; kolizja
  z Golemem), Królowa Śniegu w Saniach (legenda zamiast Wilka).
- **Mechanika:** *Zamieć* — co 3 rundy cała arena: wszyscy poza jednostkami Dworu −1 S na rundę (globalna, prostsza).
- **Bohaterka:** Królowa Lodu (bez słowiańskiego kostiumu), jeśli Marzanna za mocno kojarzy się z topieniem kukły.

---

## 8. Imperium Piasków (`sands`)

**EN:** Sand Empire · **Rola:** mobilność · **DLC**

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

**Dowódcy:** Gwardzista Szakal (wojownik), Łuczniczka Karawany (łowca), Astrolog Pustyni (mędrzec).
**Czwarty bohater:** Wielbłądzi Książę (łowca, Strzał i Galop).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Szakalogłowy Strażnik (`jackalGuard`) | wojownik z głową szakala | 1 | chód | wręcz | Czujność: pierwszy wróg, który wejdzie obok, dostaje cios od razu (raz na rundę) | ★ reakcja na wejście | — |
| 1 | Skorpion Piaskowy (`sandScorpion`) | skorpion wielkości psa | 1 | chód | wręcz | Jad: raz na bitwę trafiony traci N Ż w kolejnych aktywacjach | trucizna | — |
| 1 | Łucznik Wydm (`duneArcher`) | łucznik w zawoju | 1 | chód | dyst. | Strzał zza Wydmy: +1 A, gdy stoi przy przeszkodzie | ★ premia za osłonę | — |
| 2A | Łucznik na Wielbłądzie (`camelArcher`) | wielbłąd z jeźdźcem | 1 | chód | dyst. | Strzał i Galop: raz na bitwę po strzale cofa się | reuse: Strzał i Galop | Wielbłądzi Postój |
| 2B | Kobra Królewska (`cobra`) | wielka kobra z kapturem | 1 | chód | wręcz | Hipnoza: raz na bitwę trafiony unieruchomiony | unieruchomienie | Wężowa Studnia |
| 3A | Tancerka Fata Morgany (`mirageDancer`) | tancerka z welonami | 1 | chód | dyst. | Lustro Wydm: raz na bitwę tworzy miraż sojusznika | ★ miraż | Dom Tancerek |
| 3B | Kamienny Strażnik Grobowca (`ushabti`) | posąg strażnika | 1 | chód | wręcz | Przebudzenie: stoi, dopóki wróg nie wejdzie obok albo go nie trafi; wtedy +N A; pancerz | ★ uśpienie do bodźca | Grobowiec Strażników |
| 4A | Lamassu (`lamassu`) | skrzydlaty byk z ludzką głową | 2 | lot | wręcz | Strażnik Bram: pancerz; sąsiednich sojuszników nie da się przestawić ani odepchnąć | pancerz, aura | Brama Lamassu |
| 4B | Olbrzymi Skorpion (`giantScorpion`) | skorpion jak wóz | 2 | chód | wręcz | Kleszcze i Żądło: chwyt (unieruchomienie) i jad | reuse: Chwyt + trucizna | Gniazdo Skorpionów |
| 5A | Dżin Burzy Piaskowej (`stormDjinn`) | dżin z wirem piasku | 1 | lot | dyst. | Burza Piaskowa: raz na bitwę strzelcy wroga −N A do końca rundy | aura osłabiająca | Lampa Dżina |
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
- **Strzyga Szronu** przenosi wrogów (izolowanie), Piaski tylko swoich.
- Ukryta informacja: patrz punkt 2.

### Alternatywy
- **Jednostki:** Ifryt (zamiast Dżina Burzy; uwaga na ogień Hordy), Hiena Śmiejąca się (zamiast Skorpiona), Mantykora (zamiast
  Olbrzymiego Skorpiona).
- **Mechanika bez ukrytej informacji:** *Wędrowne Piaski* — raz na rundę jedna jednostka Piasków może zamienić się miejscami
  z dowolną inną jednostką Piasków (proste, jawne; ale bliskie Przypływom).
- **Budynek:** Wielki Bazar (zamiast Szlaku Karawan) — dodatkowe miejsce na artefakt w ofercie Targu.

---

## 9. Rój Głębin (`swarm`)

**EN:** Deep Swarm · **Rola:** wyczerpanie + kontrola · **DLC**

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
| `elderMycelium` | Prastary Muchomor | mędrzec | 1 | chód | dyst. | **Zarodniki Snu:** raz na bitwę cel i sąsiedzi −1 S i zatruci | Pulsująca Grzybnia: +1 many na rundę (`regen`) |
| `goliathBeetle` | Chrząszcz Goliat | wojownik | 2 | chód | wręcz | **Chitynowa Ściana:** pancerz; +1 A za każdego sąsiadującego sojusznika z Roju | Matka Roju: pomocnicy +1 Ż (`supportHp`) |

**Dowódcy:** Żuk Gwardzista (wojownik), Świetlikowa Łuczniczka (łowca), Grzybowy Wróżbita (mędrzec).
**Czwarty bohater:** Pszczoła Królowa (łowca, lot).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Purchawka (`sporeling`) | chodzący grzybek | 1 | chód | wręcz | Pyłek: po śmierci zatruwa sąsiadów | reuse: Rozprysk + trucizna | — |
| 1 | Mrówka Wojowniczka (`soldierAnt`) | mrówka z żuwaczkami | 1 | chód | wręcz | Mrowisko: +1 A za każdego sąsiadującego sojusznika z Roju | premia grupowa | — |
| 1 | Świetlik (`firefly`) | świecący chrząszczyk | 1 | lot | dyst. | Błysk: raz na bitwę trafiony −1 A | reuse: Złowroga Klątwa | — |
| 2A | Ryjkowiec Kopacz (`weevilDigger`) | ryjkowiec z długim ryjem | 1 | chód | wręcz | Podkop: zamiast ruchu wyłania się w zasięgu, zostawia grzybnię | reuse: Podkop | Korytarze Ryjkowców |
| 2B | Ćma Pyłowa (`dustMoth`) | duża ćma o szarych skrzydłach | 1 | lot | dyst. | Pył ze Skrzydeł: raz na bitwę cel i sąsiedzi zatruci | trucizna (obszar) | Kokonownia |
| 3A | Muchomor Gwardzista (`mushroomGuard`) | grzybolud z tarczą z kapelusza | 1 | chód | wręcz | Na Swojej Ziemi: na grzybni odzyskuje N Ż na początku aktywacji | leczenie + ★ grzybnia | Krąg Muchomorów |
| 3B | Żuk Bombardier (`bombardier`) | żuk strzelający gorącą mgłą | 1 | chód | dyst. | Wrzący Strumień: ignoruje pancerz | ★ ignorowanie pancerza | Żwirowisko |
| 4A | Modliszka Ostrzy (`bladeMantis`) | modliszka jak szermierz | 1 | chód | wręcz | Podwójne Cięcie: każdym atakiem może trafić dwa sąsiednie cele | reuse: Paszcze Otchłani | Gniazdo Modliszek |
| 4B | Matka Grzybni (`mycoMother`) | wysoka grzybowa postać z welonem | 1 | chód | dyst. | Rozsiew: raz na bitwę 3 pola grzybni wokół wskazanego pola | ★ grzybnia | Wilgotna Piwnica |
| 5A | Skolopendra Głębin (`centipede`) | olbrzymia skolopendra | 2 | chód | wręcz | Oplot: trafiony unieruchomiony i zatruty | unieruchomienie + trucizna | Skalna Szczelina |
| 5B | Chmara Os (`waspCloud`) | chmara os z królową | 1 | lot | wręcz | Chmara: atak rani cel i wszystkich jego sąsiadów po 1; −1 obrażeń od strzał | ★ obszar wokół celu | Gniazdo Os |
| 6 | Królowa Termitów (`termiteQueen`) | ogromna królowa w kopcu | 2 | chód | wręcz | Wylęg: raz na rundę przywołuje Mrówkę Robotnicę (słaba, znika po bitwie) na sąsiednim polu | ★ przywołanie | Wielki Kopiec |

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
- **Pająk Jaskiniowy (Horda), Bagienny Pełzacz i Podkopnik (neutralni):** Rój nie ma pająków; Podkop zostaje jako reuse.
- **Trucizna** jest w Hordzie (Szczurołak, Wiwerna); znakiem Roju jest grzybnia i grupa, trucizna to dodatek.
- **Paszcze Otchłani** (Hydra, Behemot): Modliszka używa tej samej logiki, inny wygląd.

### Alternatywy
- **Jednostki:** Pszczoła Wojowniczka (zamiast Mrówki), Żuk Jeleń (zamiast Bombardiera, wręcz, odpycha), Grzybowy Olbrzym
  (legenda zamiast Królowej Termitów, jeśli przywołanie za trudne).
- **Mechanika:** *Rój* — +1 A za każdego sąsiadującego sojusznika z Roju dla wszystkich jednostek (bez grzybni; prostsza,
  ale bliska Obławie Hordy).
- **Budynek:** Ul (zamiast Ogrodu) — +1 zł na rundę i miód: raz na 3 rundy leczy drużynę bohatera w osadzie.

---

## 10. Władcy Przypływów (`tides`)

**EN:** Tide Lords · **Rola:** obrona + kontrola · **DLC**

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

**Dowódcy:** Trytoński Strażnik (wojownik), Harpunniczka (łowca), Kapłan Pływów (mędrzec).
**Czwarty bohater:** Stary Mors Kapitan (wojownik, odpychanie).

### Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Krabolud Tarczownik (`crabShield`) | krab z ludzkim tułowiem | 1 | chód | wręcz | Twarda Skorupa: pancerz | pancerz | — |
| 1 | Trytoński Harpunnik (`tritonHarpoon`) | tryton z harpunem na linie | 1 | chód | dyst. | Harpun: raz na bitwę trafiony przyciągnięty o 2 | przyciąganie | — |
| 1 | Konik Morski (`seahorse`) | wielki konik morski | 1 | chód | wręcz | Fala Odpływu: raz na bitwę odskok po ataku | reuse: Powietrzny Zryw | — |
| 2A | Żółw Skorupiak (`shellTurtle`) | żółw z rafą na skorupie | 1 | chód | wręcz | Skorupa: raz na bitwę chowa się — 0 obrażeń do swojej następnej aktywacji, nie atakuje | ★ pełna osłona czasowa | Żółwia Plaża |
| 2B | Meduza Parząca (`jellyfish`) | unosząca się meduza | 1 | lot | wręcz | Parzące Nici: kto atakuje ją wręcz, traci N Ż i ma −1 S | reuse: Kolce + spowolnienie | Laguna Meduz |
| 3A | Rekinołak (`sharkman`) | wojownik z głową rekina | 1 | chód | wręcz | Wir: raz na bitwę po ataku zamienia się miejscami z celem | zamiana miejsc (z wrogiem) | Rekinia Grota |
| 3B | Kapłanka Pereł (`pearlPriestess`) | trytonka z perłowym kosturem | 1 | chód | dyst. | Perłowa Tarcza: raz na bitwę sojusznik dostaje tarczę pochłaniającą N obrażeń | ★ tarcza punktowa | Perłowy Ołtarz |
| 4A | Homar Pancerny (`lobsterKnight`) | homar w pozie rycerza | 1 | chód | wręcz | Szczypce: trafiony nie rusza się do końca swojej następnej aktywacji; pancerz | reuse: Chwyt | Homarza Rafa |
| 4B | Mors Kłowy (`walrus`) | mors z okutymi kłami | 2 | chód | wręcz | Natarcie Kłów: po ataku odpycha cel o 1 (bez zderzenia) | odpychanie | Morsowa Ławica |
| 5A | Żółw-Wyspa (`islandTurtle`) | żółw z wysepką na grzbiecie | 2 | chód | wręcz | Schronienie: sąsiedni sojusznicy mają pancerz 1; nie do odepchnięcia | aura | Wyspa Żółwia |
| 5B | Morska Wiedźma (`seaWitch`) | wiedźma z mackami zamiast nóg | 1 | chód | dyst. | Odpływ: raz na bitwę zamienia miejscami dwie dowolne jednostki w zasięgu N | zamiana miejsc | Zatopiona Chata |
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
- **Szczypiec (neutralny, Chwyt)** to krab: Krabolud ma tylko pancerz, chwyt ma Homar (inny wygląd).
- **Kraken i Hydra z Zatopionych Ruin (neutralni):** Przypływy bez macek i wielogłowych.
- **Wydra** jest w Kompaniach; Przypływy bez wydr.
- Odpychanie u Stad: patrz Stada.

### Alternatywy
- **Jednostki:** Delfin Zwiadowca (zamiast Konika; kolor!), Ośmiornica Atramentowa (zamiast Meduzy, atrament −A strzelcom),
  Wieloryb Wojenny (legenda zamiast Lewiatana).
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
| Ogłuszenie (utrata aktywacji) | Klany, Szron | mała | zamrożenie to ta sama logika |
| Stawianie przeszkody (mur, tama, lodowa ściana) | Klany, Kompanie, Szron | średnia | `placeGround` z blokowaniem ruchu |
| Premia przeciw rozmiarowi | Klany | mała | |
| Oznaczenie celu | Kompanie | mała | status na jednostce do końca rundy |
| Ukryte pułapki | Kompanie | **duża** | ukryta informacja: UI, online, bot |
| Ukrycie jednostki | Kompanie, Piaski | **duża** | jak wyżej |
| Kontratak (riposta) | Kompanie | mała | |
| Premia za rany | Kompanie | mała | |
| Drugi atak (dystansowy) | Kompanie | średnia | |
| Szron (stosy i zamrożenie) | Szron | średnia | licznik na jednostce |
| Przestawienie wroga | Szron | mała | `swapPlaces` / teleport celu |
| Miraż (atrapa) | Piaski | **duża** | ukryta informacja |
| Reakcja na wejście obok | Piaski | średnia | wymaga przerwania ruchu |
| Uśpienie do bodźca | Piaski | mała | |
| Ruch z pasażerem | Piaski | średnia | |
| Grzybnia (zajęcie terenu) | Rój | średnia | `placeGround` + warunki |
| Przywołanie jednostki | Rój | średnia | jednostka spoza puli, znika po bitwie |

Najdroższe są trzy prymitywy z ukrytą informacją (pułapki, ukrycie, miraż). Jeśli trzeba ciąć: Kompanie i Piaski mają
w Alternatywach mechaniki jawne.

---

## 12. Frakcje zapasowe (alternatywy dla całych frakcji)

Gdyby któraś z ośmiu odpadła, tu są zamienniki z inną rolą lub innym klimatem.

| Frakcja | Klimat | Rola i mechanika | Może zastąpić | Uwagi |
|---|---|---|---|---|
| **Biesy Starego Boru** (`bies`) | słowiańskie demony: Leszy, Licho, Utopiec, Południca, Kikimora, Bies | wyczerpanie; **Licho** — klątwy przeskakujące na sąsiadów | Królestwo Umarłych albo Rój | najbardziej swojski klimat; Marzanna mogłaby przejść tutaj |
| **Podniebne Gniazda** (`skies`) | ptasi lud: orły, sokoły, żurawie, czaple | mobilność; **Wiatr** — wszyscy latają, ataki z góry +A, ignorują przeszkody | Imperium Piasków | proste w silniku, bez ukrytej informacji; kolizja z Orłem Skalnym i Gryfem |
| **Gwiezdny Zakon** (`stars`) | astrolodzy, gwiezdne jelenie, zegarowe sowy | **tempo**; **Gwiazdozbiór** — przesuwanie kolejki inicjatywy, dodatkowe aktywacje | Wolne Kompanie | nowa rola, której nie ma nikt; mocno zależy od UI kolejki |
| **Bagienne Plemiona** (`marsh`) | żabolud, jaszczuroludzie, czaple, utopce | kontrola; **Moczary** — pola bagna spowalniają wrogów, Plemiona przez nie przechodzą | Rój albo Przypływy | blisko grzybni Roju i wody Przypływów |
| **Dwór Snów** (`dreams`) | wróżki, ćmy, jednorożce nocy | kontrola; **Sen** — usypianie jednostek (budzi je cios) | Imperium Piasków | blisko mirażu i Przymierza (jednorożce) |

---

## 13. Decyzje do podjęcia

1. **Skład ośmiu**: zostają te z pomysłów autora, czy któraś wymiana na frakcję zapasową (punkt 12)?
2. **Kolizje stworów**: Stada bez centaurów i minotaurów? Kompanie z rudą lisicą obok Srebrnego Lisa? Białe wilki w Szronie?
3. **Ukryta informacja** (pułapki Kompanii, miraże Piasków): robimy (duży koszt w online i bocie) czy wersje jawne z Alternatyw?
4. **Tło kluczowe** dla Szronu i Przypływów: zostaje niebieskie (lód biały, morze zielone) czy inne tło dla tych frakcji?
5. **Kuźnia Run** Klanów to nowy stan gry (runy na pomocnikach): zgoda, czy prostsza wersja „runa przed bitwą”?
6. **Bonusy Reliktu**: czy mogą być różnej natury (S, pancerz, odporność, pułapki), czy wolisz proste liczby jak +2 Ż / +1 A?
7. **Czwarci bohaterowie** od razu z frakcją, czy dopiero gdy wejdzie gra 7–8 graczy na poziomach 5–6?
8. Po akceptacji karty: przenoszę kartę do `docs/frakcje/<id>.md` (bramka G0) i ruszam z G1 dla Dzikich Stad.

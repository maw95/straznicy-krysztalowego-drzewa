# Karta frakcji: Pustynne Cesarstwo (`sands`) — G0 zatwierdzona wstępnie (20.11.2026), G1 w toku

**Zmiany z 20.11.2026 (zatwierdzone przez autora):** nazwa frakcji Pustynne Cesarstwo; Dżin Burzy Piaskowej usunięty z T5A; nowy Beduin Nomada (T2A; człowiek pustyni w burnusie z szablą, zwinny, bez konia); Skorpion Piaskowy na T3B; Kamienny Strażnik Grobowca na T4A; Lamassu na T5A; Dżin Wezyr zostaje bohaterem. Karta bez kodu (G0).

Stan: 20.11.2026. Autor wstępnie zatwierdził kartę (skład, dowódcy, mechanika); **liczby Ż/A/S, koszty i zdolności „N” ustali balans przy bramce G2**. Treść przeniesiona z `FRAKCJE_PROPOZYCJE.md` (sekcja 8) po uwagach autora z 19.11 i 20.11; ta karta jest teraz źródłem prawdy. Szablon: `KARTA_FRAKCJI_SZABLON.md`. Odrzucone pomysły: `ODRZUCONE_POMYSLY.md`. Bramki: G1 dane i paczka, G2 balans, G3 próbka jednostki (autor), G4 grafika, G5 instrukcja.


**EN:** Desert Empire · **Rola:** mobilność · **DLC**

**Klimat.** Pustynne imperium z oazami, karawanami i grobowcami pełnymi strażników z kamienia. Rządzą nim dżinny i sfinksy,
a w piaskach czekają skorpiony. Nic nie jest tym, czym się wydaje: na wydmie stoi wojownik albo jego miraż.

**Mechanika wyróżniająca: Miraż.** Atrapy własnych jednostek, których przeciwnik nie odróżni od prawdziwych; atak w miraż
przepada. Do tego **przestawianie własnych jednostek** (Dżin, Rok, Czerw) i zasadzki spod piasku.

**Mocne strony:** zmylenie, ruch, rozstawienie po wrogu, dobrzy strzelcy.
**Słabości:** krucha pierwsza linia; Kruk Kompanii odsłania miraże; Stada przebiegają przez atrapy.

## Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `djinnVizier` | Dżin Wezyr | mędrzec | 1 | lot | dyst. | **Piaskowa Brama:** raz na bitwę przenosi sojusznika na dowolne wolne pole w promieniu N | Lampa Mocy: czary +1 (`spellPower`) |
| `sphinxWarden` | Sfinks Strażnik | wojownik | 2 | chód | wręcz | **Zagadka:** raz na bitwę wybrany wróg w zasięgu N nie atakuje w następnej aktywacji | Mądrość Wieków: +1 PD za wygraną (`xp`) |
| `scorpionQueen` | Królowa Skorpionów | łowca | 1 | chód | wręcz | **Zasadzka Spod Piasku:** zaczyna bitwę zakopana na dowolnym polu swojej połowy, niewidoczna do pierwszego ruchu; trafienie zatruwa | Szlaki Wydm: +1 ruchu (`move`) |

**Dowódcy:** **Bastia Cienista** (`bastia`, wojownik; zwierzak autora Brytania: gruba, leniwa, kocha jedzenie, czarna pantera; **Czujna Drzemka:** raz na bitwę zamiast ruchu kładzie się: do końca następnej aktywacji +N pancerza i nie da się jej odepchnąć, a pierwszy wróg, który wejdzie obok, dostaje cios od razu, prymitywy: brak ruchu i reakcja na wejście; decyzje 19.11 i 20.11, zamiast Gwardzisty Szakala), Łuczniczka Karawany (łowca), Astrolog Pustyni (mędrzec).
**Czwarty bohater:** Wielbłądzi Książę (łowca, Strzał i Galop). **Wygląd:** młody, wystawny dowódca na białym wielbłądzie w złoto-szkarłatnej uprzęży z dzwoneczkami i sakwami przy siodle; zawój ze zgaszonym karmazynem i jadeitowym klejnotem, długi płaszcz w ochrze, krótki łuk refleksyjny i zakrzywiona szabla; elegancki i trochę zadufany (jadeit zamiast niebieskiego). Wielbłąd występuje tylko u niego.

## Jednostki
| Tier | Jednostka (`id`) | Kim jest | Rozm. | Ruch | Walka | Zdolność | Prymityw | Siedlisko |
|---|---|---|---|---|---|---|---|---|
| 1 | Szakalogłowy Strażnik (`jackalGuard`) | wojownik z głową szakala | 1 | chód | wręcz | Czujność: pierwszy wróg, który wejdzie obok, dostaje cios od razu (raz na rundę) | ★ reakcja na wejście | — |
| 1 | Mangusta Faraona (`pharaohMongoose`) | zwinna mangusta w złotej obroży, wróg kobr (decyzja 20.11, zamiast Skorpiona Piaskowego na tierze 1) | 1 | chód | wręcz | Odporność na Jad: nie działają na nią trucizna i unieruchomienie (statystyki do symulacji) | reuse: odporność na statusy | — |
| 1 | Łucznik Wydm (`duneArcher`) | łucznik w zawoju | 1 | chód | dyst. | Strzał zza Wydmy: +1 A, gdy stoi przy przeszkodzie | ★ premia za osłonę | — |
| 2A | Beduin Nomada (`bedouinNomad`) | człowiek pustyni w burnusie z szablą, zwinny, bez konia (decyzja 20.11, zamiast awansu Skorpiona na 2A) | 1 | chód | wręcz | Rzut Sztyletem (zatwierdzone 20.11): raz na bitwę zamiast ataku wręcz wykonuje atak dystansowy (jak strzelec, pełne A) w widoczny cel, bez ripost wręcz; potem może dokończyć aktywację normalnie | atak dystansowy jednostki wręcz (raz), bez riposty | Namiot Nomadów |
| 2B | Kobra Królewska (`cobra`) | wielka kobra z kapturem | 1 | chód | wręcz | Hipnoza: raz na bitwę trafiony unieruchomiony | unieruchomienie | Wężowa Studnia |
| 3A | Tancerka Fata Morgany (`mirageDancer`) | tancerka z welonami | 1 | chód | dyst. | Lustro Wydm: raz na bitwę tworzy miraż sojusznika | ★ miraż | Dom Tancerek |
| 3B | Skorpion Piaskowy (`sandScorpion`) | skorpion wielkości psa (decyzja 20.11, awans z tieru 1; po zmianie z 20.11 na 3B) | 1 | chód | wręcz | Jad: raz na bitwę trafiony traci N Ż w kolejnych aktywacjach | trucizna | Gniazdo Skorpionów |
| 4A | Kamienny Strażnik Grobowca (`ushabti`) | posąg strażnika | 1 | chód | wręcz | Przebudzenie: stoi, dopóki wróg nie wejdzie obok albo go nie trafi; wtedy +N A; pancerz | ★ uśpienie do bodźca | Grobowiec Strażników |
| 4B | Krokodyl Oazowy (`oasisCrocodile`) | olbrzymi krokodyl z oazy (decyzja 20.11, zamiast Olbrzymiego Skorpiona, zbyt podobnego do Królowej Skorpionów) | 2 | chód | wręcz | Chwyt Szczęk: trafiony unieruchomiony | reuse: Chwyt | Rozlewisko Krokodyli |
| 5A | Lamassu (`lamassu`) | skrzydlaty byk z ludzką głową | 2 | lot | wręcz | Strażnik Bram: pancerz; sąsiednich sojuszników nie da się przestawić ani odepchnąć | pancerz, aura | Brama Lamassu |
| 5B | Ptak Rok (`roc`) | olbrzymi ptak pustyni | 2 | lot | wręcz | Lot ze Skrzydłem: raz na bitwę przenosi sąsiedniego sojusznika ze sobą | ★ ruch z pasażerem | Gniazdo Roka |
| 6 | Czerw Pustyni (`sandWyrm`) | olbrzymi czerw z piasku | 2 | chód | wręcz | Spod Piasku: zamiast ruchu zakopuje się i wynurza na polu w zasięgu N, odpychając sąsiadów o 1 | reuse: Podkop + odpychanie | Ruchome Piaski |

## Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Pałac Mirażu** (mechanika) | Targ | I: na początku bitwy jedna jednostka (nie bohater) dostaje miraż: atrapę z 1 Ż na wolnym polu własnej strefy; nie atakuje, znika po trafieniu (atak przepada) · II: dwa miraże · III: raz na bitwę jednostka zamienia się miejscami ze swoim mirażem · IV: rozbity miraż oślepia atakującego (−1 A w następnej aktywacji) |
| **Szlak Karawan** (gospodarka) | Targ | I: +1 zł na rundę za każde 2 kopalnie frakcji · II: wymiana surowców na Targu bez straty |
| **Brama Wydm** (mapa) | Karczma | raz na 3 rundy bohater w osadzie przenosi się na dowolne odkryte, wolne pole w odległości N |

**Iskra:** Złota Piramida Pierwotnej Iskry — **po rozstawieniu obu stron Piaski przestawiają do 2 swoich jednostek w swojej strefie.**
**Nazwy osad:** Złota Oaza, Brama Słońca, Studnia Siedmiu Palm, Miedziany Bazar, Grobowiec Królów, Szepczące Wydmy, Karawanseraj
Pod Gwiazdą, Kamienny Lew, Pałac Wiatru, Sucha Rzeka, Szafranowy Gród, Lustrzana Przystań.

## Wygląd i dźwięk
- **Wygląd wzorcowy Bastii (kot autora Brytania):** `docs/frakcje/ZWIERZAKI_AUTORA.md`.
- **Paleta:** piasek, ochra, terakota, złoto, kość słoniowa, zgaszony karmazyn, **zieleń jadeitu zamiast turkusu i lapis
  lazuli** (to niebieskie).
- **Herb:** złote oko nad piramidą. **Arena:** oaza z ruinami kolumn, wydmy, palmy (przeszkody).
- **Muzyka:** oud, darbuka, ney, chór na jednym tonie.

## Bot
Rozstawia miraże przy najcenniejszych jednostkach, zasadza Królową przy strzelcach wroga, przestawia ranne jednostki do tyłu.
**Nie wolno mu:** wiedzieć, który miraż przeciwnika jest prawdziwy (wybór losowy z ziarna).

## Kolizje
- **Mumie** nie: grobowce pilnują kamienni strażnicy, nie umarli (rozdzielenie z Królestwem Umarłych).
- **Król Burzy** (neutralny) teleportuje siebie; Piaski przenoszą sojuszników.
- **Dziad Mróz** przenosi wrogów (izolowanie), Piaski tylko swoich.
- Ukryta informacja: patrz punkt 2.

## Alternatywy
- **Jednostki:** Ifryt (zamiast Dżina Burzy; uwaga na ogień Hordy), Mantykora (zamiast Krokodyla Oazowego; ma ogon skorpiona, więc zbliżona do Królowej Skorpionów).
  Olbrzymiego Skorpiona).
- **Mechanika bez ukrytej informacji:** *Wędrowne Piaski* — raz na rundę jedna jednostka Piasków może zamienić się miejscami
  z dowolną inną jednostką Piasków (proste, jawne; ale bliskie Przypływom).
- **Budynek:** Wielki Bazar (zamiast Szlaku Karawan) — dodatkowe miejsce na artefakt w ofercie Targu.

## Rozstrzygnięcia autora (19–20.11)
- Zwierzaki autora jako **dowódcy z karczmy**: **Żbiczka Bajdurka** (łowca, Kompanie, Szalony Skok), **Bastia Cienista** (wojownik, Piaski, Czujna Drzemka), **Sefiran Plamisty** (mędrzec, Przypływy, Wylinka). Odróżnienie Sefirana od Węża Morskiego: mały, szary, w plamy.
- Piaski (przegląd autora 20.11): Mangusta Faraona (tier 1, Odporność na Jad), Skorpion Piaskowy na 2A, Krokodyl Oazowy zamiast Olbrzymiego Skorpiona, bez Łucznika na Wielbłądzie i bez Hieny; wielbłąd tylko u Wielbłądziego Księcia.

## Stan G1 (20.11.2026, praca w gałęzi `g1-four-factions`)
Zrobione: paczka `src/engine/factions/sands.ts` według tabeli wyżej (A: Beduin Nomada, Tancerka, Kamienny Strażnik, Lamassu; B: Kobra, Skorpion Piaskowy, Krokodyl Oazowy, Rok; legenda Czerw); Dżin Burzy Piaskowej usunięty (dane, grafika zastępcza, `assets.json`); 3 bohaterów, 3 dowódców, Wielbłądzi Książę; siedliska (Namiot Nomadów i reszta); budynki Pałac Mirażu (I-IV), Szlak Karawan (I-II), Brama Wydm (akcja `gateHero` i przycisk na mapie).
- **Miraż** (`setUpMirages`, `makeMirage`, `dispelMirage` w `battle.ts`): atrapy z 1 trafieniem, rozstawiane jak jednostki; atak w miraż przepada, IV oślepia; III zamiana (`battleMirageSwap`). Ukryta informacja: `redactHidden` (`src/engine/hidden.ts`) przebiera miraże wroga za ich jednostki i miesza id, `unmaskId` odwraca id w akcjach przeciwnika; serwer używa tego samego przez `visibleTo` (zmiana backendu niepotrzebna). Bot wroga planuje na widoku swojej strony (`chooseBattleAction`), więc który z bliźniaków atakuje, zależy od ziarna, nigdy od prawdy (test „bliźniaczej gry” w `tests/sands.test.ts`).
- **Zdolności:** Piaskowa Brama, Zagadka, Zasadzka Spod Piasku (ukrycie jak Jenot, rozstawienie w swojej połowie, trucizna), Czujna Drzemka, Czujność, Odporność na Jad, Strzał zza Wydmy, Rzut Sztyletem, Hipnoza, Lustro Wydm, Jad, Przebudzenie, Chwyt Szczęk, Strażnik Bram, Lot ze Skrzydłem, Spod Piasku; Strzał i Galop, Celny Strzał z Postoju, Woda z Oazy z istniejących.
- **Iskra:** dodatkowy krok rozstawienia po obu stronach (najwyżej 2 jednostki).
- **Bot:** miraże dostają najcenniejsze jednostki, Królowa leży najbliżej strzelców wroga (i przenosi się tam Iskrą, gdy wróg już stoi), Iskra odsuwa rannych i strzelców od wrogiej piechoty, ranna jednostka zamienia się z mirażem, Wezyr wynosi rannych i stawia wojowników przy strzelcach wroga, Czerw wynurza się przy wrogu, Brama Wydm skraca drogę.
- **Ekran:** odznaka „Miraż” tylko u właściciela, przyciski zdolności (dwa kroki: sojusznik, potem pole), „Zamiana z mirażem”, Rzut Sztyletem jako przełącznik zdolności, Królowa na całej połowie przy rozstawieniu, podpowiedź kroku Iskry; przy jednym ekranie zasłona rozstawienia i „Podejrzyj miraże”.
- Angielski `src/i18n/en/sands.ts`; testy `tests/sands.test.ts`; próbka `scripts/sim/piaski.ts`; przeglądarka `scripts/browser/piaski.ts` (`SKD_BROWSER_PORT`).
- Decyzje do przejrzenia: `NOTATKI_DLA_AGENTA_PLANSZOWKI.md`, sekcja 17. Zostaje: liczby (G2), wybór jednostki z mirażem w interfejsie, grafika (lista w `BACKLOG.md` 2a), instrukcja (G5).

## Grafika (wypełnia Claude od G4)
- Lista zasobów w `docs/BACKLOG.md`, sekcja 2a, po G1.

## Balans (wypełnia Claude)
- Cel (decyzja autora 20.11): frakcje się kontrują, więc **nie** celujemy w 45–55% w każdej parze. (1) Średnia wygranych przeciw wszystkim pozostałym ok. 45–55%. (2) Kierunek każdej pary zgodny z tabelą „Kto z kim” w `FRAKCJE_PROPOZYCJE.md`: kontra ok. 60–70%, kontrowana ok. 30–40%, brak relacji ok. 45–55% (progi potwierdzone przez autora 20.11). (3) Żadna para poniżej 30% ani powyżej 70%. Narzędzie: `make sim-nowe`; wyniki i zmiany liczb po G2.

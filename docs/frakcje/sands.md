# Karta frakcji: Imperium Piasków (`sands`) — G0 zatwierdzona wstępnie (20.11.2026)

Stan: 20.11.2026. Autor wstępnie zatwierdził kartę (skład, dowódcy, mechanika); **liczby Ż/A/S, koszty i zdolności „N” ustali balans przy bramce G2**. Treść przeniesiona z `FRAKCJE_PROPOZYCJE.md` (sekcja 8) po uwagach autora z 19.11 i 20.11; ta karta jest teraz źródłem prawdy. Szablon: `KARTA_FRAKCJI_SZABLON.md`. Odrzucone pomysły: `ODRZUCONE_POMYSLY.md`. Bramki: G1 dane i paczka, G2 balans, G3 próbka jednostki (autor), G4 grafika, G5 instrukcja.


**EN:** Sand Empire · **Rola:** mobilność · **DLC**

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
| 2A | Skorpion Piaskowy (`sandScorpion`) | skorpion wielkości psa (decyzja 20.11, awans z tieru 1) | 1 | chód | wręcz | Jad: raz na bitwę trafiony traci N Ż w kolejnych aktywacjach | trucizna | Gniazdo Skorpionów |
| 2B | Kobra Królewska (`cobra`) | wielka kobra z kapturem | 1 | chód | wręcz | Hipnoza: raz na bitwę trafiony unieruchomiony | unieruchomienie | Wężowa Studnia |
| 3A | Tancerka Fata Morgany (`mirageDancer`) | tancerka z welonami | 1 | chód | dyst. | Lustro Wydm: raz na bitwę tworzy miraż sojusznika | ★ miraż | Dom Tancerek |
| 3B | Kamienny Strażnik Grobowca (`ushabti`) | posąg strażnika | 1 | chód | wręcz | Przebudzenie: stoi, dopóki wróg nie wejdzie obok albo go nie trafi; wtedy +N A; pancerz | ★ uśpienie do bodźca | Grobowiec Strażników |
| 4A | Lamassu (`lamassu`) | skrzydlaty byk z ludzką głową | 2 | lot | wręcz | Strażnik Bram: pancerz; sąsiednich sojuszników nie da się przestawić ani odepchnąć | pancerz, aura | Brama Lamassu |
| 4B | Krokodyl Oazowy (`oasisCrocodile`) | olbrzymi krokodyl z oazy (decyzja 20.11, zamiast Olbrzymiego Skorpiona, zbyt podobnego do Królowej Skorpionów) | 2 | chód | wręcz | Chwyt Szczęk: trafiony unieruchomiony | reuse: Chwyt | Rozlewisko Krokodyli |
| 5A | Dżin Burzy Piaskowej (`stormDjinn`) | dżin z wirem piasku | 1 | lot | dyst. | Burza Piaskowa: raz na bitwę strzelcy wroga −N A do końca rundy | aura osłabiająca | Lampa Dżina |
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
- **Strzyga Szronu** przenosi wrogów (izolowanie), Piaski tylko swoich.
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

## Grafika (wypełnia Claude od G4)
- Lista zasobów w `docs/BACKLOG.md`, sekcja 2a, po G1.

## Balans (wypełnia Claude)
- Cel (decyzja autora 20.11): frakcje się kontrują, więc **nie** celujemy w 45–55% w każdej parze. (1) Średnia wygranych przeciw wszystkim pozostałym ok. 45–55%. (2) Kierunek każdej pary zgodny z tabelą „Kto z kim” w `FRAKCJE_PROPOZYCJE.md`: kontra ok. 60–70%, kontrowana ok. 30–40%, brak relacji ok. 45–55% (progi potwierdzone przez autora 20.11). (3) Żadna para poniżej 30% ani powyżej 70%. Narzędzie: `make sim-nowe`; wyniki i zmiany liczb po G2.

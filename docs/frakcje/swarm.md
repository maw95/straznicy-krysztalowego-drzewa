# Karta frakcji: Rój Puszczy (`swarm`) — G0 zatwierdzona wstępnie (20.11.2026)

Stan: 20.11.2026. Autor wstępnie zatwierdził kartę (skład, dowódcy, mechanika); **liczby Ż/A/S, koszty i zdolności „N” ustali balans przy bramce G2**. Treść przeniesiona z `FRAKCJE_PROPOZYCJE.md` (sekcja 9) po uwagach autora z 19.11 i 20.11; ta karta jest teraz źródłem prawdy. Szablon: `KARTA_FRAKCJI_SZABLON.md`. Odrzucone pomysły: `ODRZUCONE_POMYSLY.md`. Bramki: G1 dane i paczka, G2 balans, G3 próbka jednostki (autor), G4 grafika, G5 instrukcja.


**Zmiana z 20.11.2026 (zatwierdzona przez autora):** nazwa frakcji Rój Puszczy.

**EN:** Swarm of the Wilds · **Rola:** wyczerpanie + kontrola · **DLC**

**Klimat.** Podziemne królestwo grzybni, chrząszczy i modliszek pod korzeniami starego lasu. Jedna wola, wiele ciał. Baśniowo
i poważnie zarazem: muchomory jak latarnie, chitynowe pancerze jak lakier, świetliki zamiast pochodni. Bez obrzydliwości.

**Mechanika wyróżniająca: Grzybnia** — zajmowanie pól areny. Pola, na których stały, zginęły albo atakowały jednostki Roju,
porasta grzybnia: Rój jest na niej mocniejszy, wrogowie na niej słabną. Do tego premie w grupie i trucizna.

**Mocne strony:** wygrywa długie bitwy w miejscu, liczny i tani, karze stojących (Klany, Przymierze).
**Słabości:** odcięty od grzybni słabnie; ruchliwi (Piaski) i zamrażający (Szron) wyciągają go z własnego terenu.

## Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `mantisQueen` | Królowa Modliszek | łowca | 1 | chód | wręcz | **Ostatnie Cięcie:** +N A przeciw celowi, który ma co najwyżej połowę Ż | Łowczyni Głębin: +1 PD za wygraną (`xp`) |
| `elderMycelium` | Śniący Muchomor | mędrzec | 1 | chód | dyst. | **Zarodniki Snu:** raz na bitwę cel i sąsiedzi −1 S i zatruci | Pulsująca Grzybnia: +1 many na rundę (`regen`) |
| `goliathBeetle` | Chrząszcz Goliat | wojownik | 2 | chód | wręcz | **Chitynowa Ściana:** pancerz; +1 A za każdego sąsiadującego sojusznika z Roju | Matka Roju: pomocnicy +1 Ż (`supportHp`) |

**Dowódcy:** Żuk Gwardzista (wojownik), Świetlikowa Łuczniczka (łowca), Grzybowy Wróżbita (mędrzec).
**Czwarty bohater:** Pszczoła Królowa (łowca, lot).

## Jednostki
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

## Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Serce Grzybni** (mechanika) | Szpital | I: pola rozstawienia Roju i pola, na których zginęła jakakolwiek jednostka, porasta grzybnia; jednostka Roju na grzybni +1 A · II: grzybnia także na polach, z których Rój atakował · III: wróg kończący ruch na grzybni zostaje zatruty · IV: jednostka Roju na grzybni +1 Ż na początku aktywacji |
| **Ogród Grzybów** (gospodarka) | Skarbiec | I: +1 drewna i +1 rudy co drugą rundę · II: co rundę |
| **Podziemne Korytarze** (mapa) | Koszary | kopalnie w promieniu 2 od osady należą do Roju, dopóki nie wejdzie na nie wrogi bohater; II: promień 3 |

**Iskra:** Matecznik Pierwotnej Iskry — **grzybnia pokrywa strefę Roju i środek areny od początku każdej bitwy.**
**Nazwy osad:** Mroczny Kopiec, Grzybowa Grota, Korzenny Labirynt, Świetlikowa Pieczara, Wilgotny Gród, Chitynowa Brama,
Kapeluszowy Las, Głęboki Matecznik, Szepczące Korytarze, Bursztynowa Komora, Czerwony Muchomor, Pod Starym Dębem.

## Wygląd i dźwięk
- **Paleta:** brąz, umbra, ochra, mech, kremowe blaszki, czerwień muchomora, bioluminescencja zielonożółta, fiolet tylko
  ciepły (z czerwienią, bez niebieskiego).
- **Herb:** muchomor w kole z chrząszczy. **Arena:** podziemna grota z grzybami wielkości drzew i korzeniami (przeszkody).
- **Muzyka:** niski dron, klekot drewna, marimba, szept chóru.

## Bot
Trzyma jednostki razem, walczy na grzybni i wciąga wroga na swoje pola; Królowa Modliszek dobija ranne cele. Na mapie: osady
blisko kopalń (Korytarze). **Nie wolno mu:** rozpraszać jednostek i gonić wroga daleko od grzybni.

## Kolizje
- **Pająk Jaskiniowy (Horda), Bagienny Pełzacz (neutralny):** Rój nie ma pająków; Podkop zniknął razem z Ryjkowcem Kopaczem (Podkopnik jest neutralny).
- **Trucizna** jest w Hordzie (Szczurołak, Wiwerna); znakiem Roju jest grzybnia i grupa, trucizna to dodatek.
- **Modliszka:** tylko jedna, bohaterka Królowa Modliszek (Ostatnie Cięcie); Modliszka Ostrzy odpadła. Królowych w Roju jest jedna (Pszczoła Królowa, czwarty bohater).

## Alternatywy
- **Jednostki:** Pszczoła Wojowniczka (zamiast Mrówki), Żuk Jeleń (zamiast Bombardiera, wręcz, odpycha).
- **Mechanika:** *Rój* — +1 A za każdego sąsiadującego sojusznika z Roju dla wszystkich jednostek (bez grzybni; prostsza,
  ale bliska Obławie Hordy).
- **Budynek:** Ul (zamiast Ogrodu) — +1 zł na rundę i miód: raz na 3 rundy leczy drużynę bohatera w osadzie.

## Rozstrzygnięcia autora (19–20.11)
- Rój (przegląd autora 20.11): Królowa Modliszek zostaje bohaterką; Gąsienica Korzenna (2A, po przemianie Motyl Korzenny) zamiast Ryjkowca, Ważka Łowczyni (4A) zamiast Modliszki Ostrzy, Ślimak Pancerny (5B), **Cesarska Cykada** (6); Śniący Muchomor zamiast Prastarego Muchomora.

## Grafika (wypełnia Claude od G4)
- Lista zasobów w `docs/BACKLOG.md`, sekcja 2a, po G1.

## Balans (wypełnia Claude)
- Cel (decyzja autora 20.11): frakcje się kontrują, więc **nie** celujemy w 45–55% w każdej parze. (1) Średnia wygranych przeciw wszystkim pozostałym ok. 45–55%. (2) Kierunek każdej pary zgodny z tabelą „Kto z kim” w `FRAKCJE_PROPOZYCJE.md`: kontra ok. 60–70%, kontrowana ok. 30–40%, brak relacji ok. 45–55% (progi potwierdzone przez autora 20.11). (3) Żadna para poniżej 30% ani powyżej 70%. Narzędzie: `make sim-nowe`; wyniki i zmiany liczb po G2.

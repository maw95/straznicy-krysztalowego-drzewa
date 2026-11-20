# Karta frakcji: Bractwo Przypływu (`tides`) — G0 zatwierdzona wstępnie (20.11.2026)

Stan: 20.11.2026. Autor wstępnie zatwierdził kartę (skład, dowódcy, mechanika); **liczby Ż/A/S, koszty i zdolności „N” ustali balans przy bramce G2**. Treść przeniesiona z `FRAKCJE_PROPOZYCJE.md` (sekcja 10) po uwagach autora z 19.11 i 20.11; ta karta jest teraz źródłem prawdy. Szablon: `KARTA_FRAKCJI_SZABLON.md`. Odrzucone pomysły: `ODRZUCONE_POMYSLY.md`. Bramki: G1 dane i paczka, G2 balans, G3 próbka jednostki (autor), G4 grafika, G5 instrukcja.


**EN:** Brotherhood of the Tide · **Rola:** obrona + kontrola · **DLC**

**Zmiany z 20.11.2026 (zatwierdzone przez autora):** nazwa frakcji Bractwo Przypływu; Mors Kłowy (4B) zastąpiony przez Albatrosa (lotny, odpycha uderzeniem skrzydeł, rola Morsa); Stary Mors Kapitan zostaje czwartym bohaterem.

**Klimat.** Lud rafy i odpływu: trytoni z trójzębami, syreny, kraboludy i żółwie, a w głębi węże morskie. Wychodzą na ląd
z przypływem i zabierają go ze sobą. Zdolności działają też na mapach bez wody.

**Mechanika wyróżniająca: Przypływ** — zamiana miejsc z sojusznikiem (ranny cofa się, świeży wchodzi), do tego osłona
i przyciąganie wrogów. Rozdzielenie ze Stadami: Przypływy nie szarżują, przestawiają i ściągają.

**Mocne strony:** rotacja rannych, ściąganie strzelców wroga, wytrzymałe żółwie.
**Słabości:** mało obrażeń; pułapki (Kompanie) i grzybnia (Rój) karzą przesuwanie.

## Bohaterowie
| `id` | Bohater | Typ | Rozm. | Ruch | Walka | Zdolność | Specjalność |
|---|---|---|---|---|---|---|---|
| `tritonKing` | Król Trytonów | wojownik | 1 | chód | wręcz | **Ściana Wody:** raz na bitwę odpycha wszystkich sąsiednich wrogów o 1, sąsiedni sojusznicy −1 obrażeń do końca rundy | Pan Rafy: pomocnicy +1 Ż (`supportHp`) |
| `sirenSinger` | Syrena Pieśniarka | mędrzec | 1 | chód | dyst. | **Pieśń Syreny:** raz na bitwę wróg w zasięgu przyciągnięty o N pól ku niej | Głos Głębin: czary +1 (`spellPower`) |
| `seaSerpent` | Wąż Morski | łowca | 2 | chód | wręcz | **Oplot Głębin:** przyciąga cel o 1 i unieruchamia (raz na bitwę) | Prąd Morski: +1 ruchu (`move`) |

**Dowódcy:** Trytoński Strażnik (wojownik), Harpunniczka (łowca), **Sefiran Plamisty** (`sefiran`, mędrzec; zwierzak autora Stefan: wąż zbożowy, szary z czarnymi plamami na grzbiecie jak paski, lubi wodę, płochliwy, sympatyczny; **Wylinka:** raz na bitwę zrzuca skórę: traci wszystkie statusy i odzyskuje N Ż; decyzje 19.11 i 20.11, zamiast Kapłana Pływów).
**Czwarty bohater:** Stary Mors Kapitan (wojownik, odpychanie).

## Jednostki
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
| 4B | Albatros (`albatross`) | wielki morski ptak (decyzja 20.11, zamiast Morsa Kłowego) | 2 | lot | wręcz | Uderzenie Skrzydeł: po ataku odpycha cel o 1 (bez zderzenia); rola Morsa Kłowego | odpychanie, lotny | Gniazdo Albatrosa |
| 5A | Rafowy Golem (`reefGolem`) | żywa rafa na dwóch nogach, z koralami i muszlami (decyzja 20.11, zamiast Żółwia-Wyspy) | 2 | chód | wręcz | Żywa Rafa: sąsiedni sojusznicy mają pancerz 1; nie do odepchnięcia | aura | Koralowa Jaskinia |
| 5B | Morska Wiedźma (`seaWitch`) | stara wiedźma w płaszczu z sieci i muszli | 1 | chód | dyst. | Odpływ: raz na bitwę zamienia miejscami dwie dowolne jednostki w zasięgu N | zamiana miejsc | Zatopiona Chata |
| 6 | Lewiatan (`leviathan`) | pradawny potwór morski | 2 | chód | wręcz | Wir Głębin: raz na bitwę wszyscy wrogowie w promieniu 3 przyciągnięci o 2 ku niemu | przyciąganie obszarowe | Rów Głębinowy |

## Osada
| Budynek | Rodzic | Poziomy i efekt |
|---|---|---|
| **Świątynia Pływów** (mechanika) | Fosa i Mury | I: raz na bitwę jednostka Przypływów przed swoją aktywacją zamienia się miejscami z sojusznikiem w zasięgu 2 · II: raz na rundę · III: jednostka, która weszła na miejsce rannego, ma −1 obrażeń do końca rundy · IV: obie po zamianie +1 Ż |
| **Perłowe Ławice** (gospodarka) | Skarbiec | I: +1 zł na rundę · II: także +1 Pyłu co 4 rundy |
| **Latarnia Morska** (mapa) | Targ | odkrywa mapę w promieniu 3 wokół osady i pokazuje ruchy wrogich bohaterów w tym zasięgu; II: promień 5 |

**Iskra:** Perłowa Świątynia Pierwotnej Iskry — **każda jednostka zaczyna bitwę z Perłową Tarczą (pochłania 2 obrażenia).**
**Nazwy osad:** Perłowa Zatoka, Koralowa Brama, Latarnia Odpływu, Słona Przystań, Muszlowy Gród, Rafa Trytonów, Zatopione
Schody, Mewia Skała, Port Siedmiu Fal, Bursztynowy Brzeg, Lagunowy Dwór, Przylądek Syren.

## Wygląd i dźwięk
- **Wygląd wzorcowy Sefirana (wąż zbożowy autora Stefan):** `docs/frakcje/ZWIERZAKI_AUTORA.md`.
- **Paleta:** zieleń morska, jadeit, koral, perła, piasek, brąz, oliwkowe wodorosty, róż muszli. **Bez błękitu i turkusu
  w jednostkach.** Morska frakcja bez niebieskiego jest trudna: **zalecam dla niej inne tło kluczowe** (magenta #FF00FF,
  wtedy unikać czystego różu) albo wycinanie maską; sprawdzić w `PRZEPIS_JEDNOSTKI.md` przy próbce G3.
- **Herb:** trójząb w muszli. **Arena:** plaża przy rafie w czasie odpływu, skały, sieci, kałuże (przeszkody).
- **Muzyka:** harfa, chór, szum fal, róg z muszli.

## Bot
Trzyma szyk wokół żółwi, harpunami i Syreną ściąga strzelców wroga, rannych cofa zamianą miejsc. **Nie wolno mu:** zamieniać
się na pola obok pułapek i grzybni (jeśli je widzi), wysuwać Syreny na przód.

## Kolizje
- **Szczypiec (neutralny, Chwyt)** to krab: Homar ma chwyt (inny wygląd); Krabolud Tarczownik ma pancerz, bez chwytu. Mewa Rozbójniczka odpadła (patrz `ODRZUCONE_POMYSLY.md`).
- **Kraken i Hydra z Zatopionych Ruin (neutralni):** Przypływy bez wielogłowych; jedyne macki ma mała
  Ośmiornica (poziom 2), wyraźnie inna niż olbrzymi Kraken. Morska Wiedźma bez macek.
- **Wydra** jest w Kompaniach; Przypływy bez wydr.
- Odpychanie u Stad: patrz Stada.

## Alternatywy
- **Jednostki:** brak (Mewa Rozbójniczka odpadła 20.11, Nalot był zbyt podobny do Gryfa i Pegaza).
- **Mechanika:** *Fala* — co 3 rundy fala przyciąga wszystkich wrogów o 1 pole w stronę Przypływów (globalna, efektowna,
  zmienia całą arenę; łatwa do pokazania animacją).
- **Budynek mapy:** Przystań — bohater w osadzie przenosi się do innej osady Przypływów leżącej przy wodzie.

## Rozstrzygnięcia autora (19–20.11)
- Zwierzaki autora jako **dowódcy z karczmy**: **Żbiczka Bajdurka** (łowca, Kompanie, Szalony Skok), **Bastia Cienista** (wojownik, Piaski, Czujna Drzemka), **Sefiran Plamisty** (mędrzec, Przypływy, Wylinka). Odróżnienie Sefirana od Węża Morskiego: mały, szary, w plamy.
- Przypływy: Mewa odpadła; Żółw Skorupiak na tier 1, **Krabolud Tarczownik na 2A** (pancerz poziomu 1: pokrywa osłona Żółwia), **Rafowy Golem** zamiast Żółwia-Wyspy (jeden żółw).

## Grafika (wypełnia Claude od G4)
- Lista zasobów w `docs/BACKLOG.md`, sekcja 2a, po G1.

## Balans (wypełnia Claude)
- Cel (decyzja autora 20.11): frakcje się kontrują, więc **nie** celujemy w 45–55% w każdej parze. (1) Średnia wygranych przeciw wszystkim pozostałym ok. 45–55%. (2) Kierunek każdej pary zgodny z tabelą „Kto z kim” w `FRAKCJE_PROPOZYCJE.md`: kontra ok. 60–70%, kontrowana ok. 30–40%, brak relacji ok. 45–55% (progi potwierdzone przez autora 20.11). (3) Żadna para poniżej 30% ani powyżej 70%. Narzędzie: `make sim-nowe`; wyniki i zmiany liczb po G2.

# Nowi pomocnicy poziomu 3 „Królestwo”: propozycja do akceptacji

Stan na 13.11.2026. **To propozycja Claude'a (decyzja autora z 13.11: „Ty zaproponuj, ja akceptuję”). Dopóki autor jej nie zaakceptuje albo nie poprawi, nie generuję grafiki** (to 8 jednostek po ok. 70–110 CU Scenario każda, patrz `POTOK_ANIMACJI.md`, `PRZEPIS_JEDNOSTKI.md`).

Założenia z decyzji autora: każda frakcja ma docelowo **7 pomocników**: trzech obecnych to **poziom 1**, dochodzą **poziomy 2, 3, 4 i 5**, każdy silniejszy i droższy od poprzedniego; w armii jest po jednej jednostce danego typu; cenę wyznaczą symulacje (użyteczność w walce), nie mnożenie liczb. Rekrutacja jest w koszarach osady własnej frakcji, a poziomy 4 i 5 w koszarach rozbudowanych (silnik: `RECRUITS` w `src/engine/kingdom.ts`, dziś tylko poziom 1).

Skala liczb jak na kartach pomocników (Życie / Atak / Szybkość; silnik mnoży je jak resztę). Dla porównania obecni pomocnicy mają Ż 4–6, A 1–2, S 3–4; bohaterowie Ż 7–11, A 4–5, S 4–8. Nowi mają zostać pod bohaterami, ale najsilniejsi dorównują im Życiem.

## Przymierze Świtu (zieleń i złoto, światło, las, niebo)

| Poz. | Jednostka | Rola | Ż / A / S | Zdolność (raz na bitwę) |
|------|-----------|------|-----------|-------------------------|
| 2 | **Wartownik Kryształowej Straży** | zwarcie, tarcza drużyny | 7 / 2 / 4, chodzi | *Tarcza Światła*: sąsiedni sojusznik dostaje −2 obrażeń do końca rundy |
| 3 | **Łuczniczka Zorzy** | strzelec | 6 / 3 / 4, chodzi, strzela | *Strzała Zorzy*: trafiony wróg ma −2 Szybkości w swoich dwóch następnych aktywacjach |
| 4 | **Gryf Przymierza** | szybki napastnik | 9 / 4 / 6, lata | *Zryw Gryfa*: po przelocie co najmniej 4 pól jego cios zadaje +2 A |
| 5 | **Opiekun Drzewa** (żywy ent) | duży obrońca, 2 pola | 14 / 5 / 3, chodzi | *Korzenie Drzewa*: na początku rundy leczy sąsiednich sojuszników o 2 Ż |

## Mroczna Horda (czerwień i żelazo, ogień, ciemność)

| Poz. | Jednostka | Rola | Ż / A / S | Zdolność (raz na bitwę) |
|------|-----------|------|-----------|-------------------------|
| 2 | **Ogrzy Najemnik** | zwarcie, ranny groźniejszy | 8 / 2 / 3, chodzi | *Wściekłość*: gdy ma mniej niż połowę Życia, jego cios zadaje +2 A |
| 3 | **Wilczy Jeździec** | szybki napastnik | 7 / 3 / 6, chodzi | *Skok na grzbiet*: przeskakuje nad jedną jednostką i atakuje za nią |
| 4 | **Troll Bagienny** | wytrzymały, leczy się sam | 12 / 4 / 3, chodzi | *Regeneracja*: na początku rundy odzyskuje 2 Ż |
| 5 | **Wywerna Popiołów** | duży latający, 2 pola | 14 / 5 / 5, lata | *Jadowy Ogon*: trafiony wróg traci 1 Ż na początku każdej swojej aktywacji do końca bitwy |

## Ceny (robocze, do symulacji)

Poziom 1: 2 zł (jak dziś w `RECRUITS`); poziomy 2 do 5 na start 3, 5, 8, 12 zł. Wskrzeszenie w szpitalu kosztuje 1/2 ceny (po ulepszeniu 1/3). Docelową cenę wyznacza symulacja: kolejno rozgrywamy bitwy drużyn z daną jednostką i bez niej i ustawiamy cenę tak, żeby zakup jednostki dawał podobny wzrost szans na złoto wydane (stroiciel w `scripts/sim/`, do dopisania po grafice).

## Co trzeba zrobić po akceptacji

1. Dane w `src/engine/data.ts` (`UNITS`, `FACTION_SUPPORTS` rozszerzone o poziomy), zdolności w silniku bitew, testy.
2. Dla każdej jednostki: karta (grafika + ramka), portret, ikona zdolności, klipy ruchu, ataku i śmierci (potok z `POTOK_ANIMACJI.md`), wpis w `assets.json`.
3. `RECRUITS` z poziomami 2–5, ceny z symulacji, boty (`botPurchase` już rekrutuje najtańszego brakującego), karty w „Zasady i karty”.

# Nowi pomocnicy poziomu 3 „Królestwo”: propozycja do akceptacji

Stan na 13.11.2026 (skład wybrany przez autora, liczby i zdolności robocze). **To propozycja Claude'a (decyzja autora z 13.11: „Ty zaproponuj, ja akceptuję”). Dopóki autor jej nie zaakceptuje albo nie poprawi, nie generuję grafiki** (to 8 jednostek po ok. 70–110 CU Scenario każda, patrz `POTOK_ANIMACJI.md`, `PRZEPIS_JEDNOSTKI.md`).

Założenia z decyzji autora: każda frakcja ma docelowo **7 pomocników**: trzech obecnych to **poziom 1**, dochodzą **poziomy 2, 3, 4 i 5**, każdy silniejszy i droższy od poprzedniego; w armii jest po jednej jednostce danego typu; cenę wyznaczą symulacje (użyteczność w walce), nie mnożenie liczb. Rekrutacja jest w koszarach osady własnej frakcji, a poziomy 4 i 5 w koszarach rozbudowanych (silnik: `RECRUITS` w `src/engine/kingdom.ts`, dziś tylko poziom 1).

Skala liczb jak na kartach pomocników (Życie / Atak / Szybkość; silnik mnoży je jak resztę). Dla porównania obecni pomocnicy mają Ż 4–6, A 1–2, S 3–4; bohaterowie Ż 7–11, A 4–5, S 4–8. Nowi mają zostać pod bohaterami, ale najsilniejsi dorównują im Życiem.

## Przymierze Świtu (zieleń i złoto, światło, las, niebo)

Skład i nazwy wg autora z 13.11.2026 (liczby robocze). Nazwy jednostek nie muszą mieć dwóch słów.

| Poz. | Jednostka | Rola | Ż / A / S | Zdolność |
|------|-----------|------|-----------|----------|
| 2 | **Jeżozwierz** | zwarcie, kara za bicie | 6 / 2 / 3, chodzi | *Kolce* (stała): każdy, kto zaatakuje go wręcz, dostaje 1 obrażenie |
| 3 | **Centaur** | szybki strzelec | 6 / 3 / 5, chodzi, strzela | *Strzał i Galop* (raz na bitwę): po ataku może się cofnąć o maks. 3 pola (wybór autora) |
| 4 | **Złotokły Odyniec** (dzik; nazwa w formie „przymiotnik + Dzik/Odyniec”; inne: Świetlisty Dzik, Gromowy Odyniec, Pradawny Odyniec) | napastnik czołowy | 10 / 4 / 5, chodzi | *Czołowe Natarcie* (stała): +2 obrażenia, gdy atakuje cel od przodu (przeciwieństwo ataku z tyłu Harpii) |
| 5 | **Opiekun Drzewa** (żywy ent) | duży obrońca, 2 pola | 14 / 5 / 3, chodzi | *Korzenie Drzewa* (raz na bitwę): na początku rundy leczy sąsiednich sojuszników o 2 Ż |

Odrzucone: Wartownik Kryształowej Straży (człowiek nie pasuje do klimatu), Gryf Przymierza (gryf jest neutralny), Łowczyni Gajów (strzelca gra Centaur).

## Mroczna Horda (czerwień i żelazo, ogień, ciemność)

| Poz. | Jednostka | Rola | Ż / A / S | Zdolność |
|------|-----------|------|-----------|----------|
| 2 | **Szczurołak** | szybki, podstępny, trucizna | 5 / 2 / 5, chodzi | *Zatruty Pazur* (raz na bitwę): trafiony wróg traci 1 Ż na początku swoich dwóch następnych aktywacji |
| 3 | **Piekielny Ogar** | szybki napastnik | 7 / 3 / 6, chodzi | *Płonący Ślad* (raz na bitwę): pola, przez które przebiegł, płoną do końca rundy i ranią o 1 **każdego**, kto na nie wejdzie, także Hordę (decyzja autora: taktyczne ryzyko; ogar musi uważać, którędy biegnie) |
| 4 | **Salamandra Popiołu** | strzelec, obszar | 9 / 3 / 3, chodzi, strzela | *Pożoga* (raz na bitwę): trafiony cel i jego sąsiedzi dostają 1 obrażenie |
| 5 | **Herszt Minotaurów** | duży, pancerny, krwiożerczy, 2 pola | 15 / 5 / 4, chodzi | *Bitewny Szał* (nazwa wg autora): pancerz (stale −1 obrażeń z każdego ciosu); po zabiciu wroga jego następny cios zadaje +2 A |

Odrzucone: Ogrzy Najemnik (ogr jest w hordzie), Wilczy Jeździec (kopia z Heroesów), Troll Bagienny i Wywerna Popiołów (rezerwa).

## Ceny (robocze, do symulacji)

Poziom 1: 2 zł (jak dziś w `RECRUITS`); poziomy 2 do 5 na start 3, 5, 8, 12 zł. Wskrzeszenie w szpitalu kosztuje 1/2 ceny (po ulepszeniu 1/3). Docelową cenę wyznacza symulacja: kolejno rozgrywamy bitwy drużyn z daną jednostką i bez niej i ustawiamy cenę tak, żeby zakup jednostki dawał podobny wzrost szans na złoto wydane (stroiciel w `scripts/sim/`, do dopisania po grafice).

## Co trzeba zrobić po akceptacji

1. Dane w `src/engine/data.ts` (`UNITS`, `FACTION_SUPPORTS` rozszerzone o poziomy), zdolności w silniku bitew, testy.
2. Dla każdej jednostki: karta (grafika + ramka), portret, ikona zdolności, klipy ruchu, ataku i śmierci (potok z `POTOK_ANIMACJI.md`), wpis w `assets.json`.
3. `RECRUITS` z poziomami 2–5, ceny z symulacji, boty (`botPurchase` już rekrutuje najtańszego brakującego), karty w „Zasady i karty”.

# Diagnoza mechanik frakcji (20.11.2026)

Pomiar, nie zmiana zasad: czy zamierzone mechaniki 7 frakcji (Przymierze, Horda, Stada, Umarli, Klany, Szron, Kompanie) w ogóle
uruchamiają się w partiach botów, jak często i czy bot z nich korzysta. Silnik, liczby i bot bez zmian.

**Narzędzie:** `scripts/sim/diagnoza.ts` (`make sim-diagnoza GAMES=500 FORCE=0|1|3 OUT=.tmp/x.json`, raport:
`node --import tsx scripts/sim/diagnoza.ts --report .tmp/x.json`, zestawienie wielu plików: `--compare a.json b.json ...`).
Partie jak w `make sim-nowe` (pvp, boty po obu stronach, Kontrola i Podbój, mapa długa prostokątna, Imperium). Liczniki z `state.log`,
`state.battle`, `state.kingdom` oraz z przeliczenia obrażeń na klonie stanu (kontrfaktycznie: ile Ż pochłonął Mur Tarcz, ile dołożył
Grot Przez Zbroję).

**Próby (każda: 21 par × 2 cele × 500 partii = 21 000 partii, w parze ok. 1000 partii i ok. 700 bitew pvp; błąd pary ±3 pkt):**
- **baza** (domyślna kolejność budowy bota), miejsca wymieniane wg drugiego bitu ziarna;
- **baza-parzystość** — to samo, ale z regułą miejsc z `nowe-frakcje.ts` (parzystość ziarna), czyli to, co mierzy dziś `make sim-nowe`;
- **L1 / L3** — eksperyment: oboje gracze mają od startu budynek mechaniki na poziomie 1 albo 3 (nie ma tego w grze; pokazuje, co mechanika
  daje, gdy już stoi, i czy bot z niej korzysta).

## 1. Cztery ustalenia ogólne

1. **Mechaniki frakcji w partiach botów prawie nie istnieją.** Partia trwa średnio 8,9 rundy (ok. 158 akcji), bitew pvp jest 0,69 na
   partię (plus 1,2 z neutralnymi i 0,4 oblężenia), a bot stawia budynek mechaniki dopiero w rundzie 7 (Umarli) do 18 (Szron). W chwili bitwy pvp budynek
   mechaniki ma: Przymierze 0%, Horda 1%, Stada 1%, Klany 0%, Szron 0%, Kompanie 1%, Umarli 12% (poziom ≥1). Do końca partii stawia go 1–4% partii (Umarli 17%).
   Czyli dotychczasowe strojenie (`tuneFactions.ts`, `sim-nowe`) mierzyło prawie wyłącznie liczby Ż/A/S i zdolności jednostek, nie mechaniki.
2. **Gdy budynek stoi, mechaniki działają (liczniki rosną o rzędy wielkości), ale są skrajnie nierówne:** Blask Świtu leczy 20 Ż na bitwę
   (L1) i 53 Ż (L3), Szron nakłada 8–9 szronów i zamraża 2,1 (L1) / 4,1 (L3) razy na bitwę, a Żądza Krwi odpala 0,9–2,0 razy z jednym
   +1 A, Tętent daje ok. 1,3–1,5 odepchnięć i 1,3–1,4 zderzeń (ok. 6–10 Ż obrażeń) na bitwę, Sidła 0,67 trafienia na bitwę.
3. **Pre-budowa mechaniki nie zbliża par do tabeli „Kto z kim”**, tylko przesuwa je w stronę Przymierza i Szronu (tabela w pkt 2). To nie błąd
   bota, tylko kolejność: najpierw trzeba, żeby bot budował mechanikę, potem wyrównać siłę mechanik.
4. **Błąd metody w `sim-nowe` (i, jak sądzę, `tuneFactions`):** miejsca zamieniane są wg parzystości ziarna, a bot wybiera linię A/B jednostek
   tierów 2–5 wzorem `(ziarno + tier + miejsce) % 2` (`kingdom.ts`, `botPurchase`). Parzystości się znoszą, więc **frakcja wymieniona w parze jako
   pierwsza zawsze rekrutuje te same jednostki, a druga zawsze drugą linię** (np. Umarli jako „A” nigdy nie mają Szkieleta Łucznika, jako „B” zawsze).
   Różnica sięga 8 pkt (tabela niżej: Umarli–Klany 48 → 56, Klany–Szron 43 → 48, Horda–Stada 56 → 50). Poprawka w skrypcie pomiarowym to jedna linia
   (`(seed >> 1) & 1` zamiast `seed % 2`); w `diagnoza.ts` jest domyślnie (`DIAG_ORDER=parity` przywraca stare).

Typ bitwy: pvp 5,97 rundy średnio, 98% kończy się wybiciem, 2% limitem rund bitwy (do 7–8% w parach Szron–Kompanie i Szron–Klany); oblężenie 2,05 rundy;
neutralni 5,43 rundy. Partie: limit rund partii trafiony w 8%, remisy 3%.

## 2. Odsetek wygranych par (pierwsza frakcja, Kontrola + Podbój razem, ok. 1000 partii)

Cel: kontra 65, kontrowana 35, brak relacji 50 (środek pasm z `FRAKCJE_PROPOZYCJE.md`). Różnica = baza − cel.

| para (A vs B) | cel A | baza-parzystość | **baza** | L1 | L3 | różnica (baza) |
|---|---|---|---|---|---|---|
| Klany vs Kompanie | 35 | 57 | 61 | 61 | 64 | **+26** |
| Przymierze vs Umarli | 35 | 56 | 56 | 61 | 66 | **+21** |
| Horda vs Szron | 65 | 49 | 48 | 43 | 36 | **−17** |
| Stada vs Klany | 35 | 50 | 52 | 52 | 47 | **+17** |
| Horda vs Umarli | 65 | 49 | 48 | 49 | 49 | **−17** |
| Przymierze vs Horda | 65 | 53 | 49 | 51 | 58 | **−16** |
| Stada vs Szron | 65 | 50 | 49 | 42 | 37 | **−16** |
| Klany vs Szron | 35 | 43 | 48 | 44 | 42 | **+13** |
| Horda vs Klany | 35 | 49 | 48 | 50 | 50 | **+13** |
| Umarli vs Kompanie | 50 | 58 | 62 | 63 | 66 | +12 |
| Szron vs Kompanie | 50 | 58 | 61 | 67 | 72 | +11 |
| Horda vs Kompanie | 50 | 61 | 59 | 61 | 61 | +9 |
| Umarli vs Klany | 65 | 48 | 56 | 56 | 55 | −9 |
| pozostałe: Przymierze–Stada 60 (cel 65), Przymierze–Kompanie 64 (65), Przymierze–Klany 49 (50), Przymierze–Szron 54 (50), Stada–Kompanie 60 (65), Stada–Umarli 45 (50), Horda–Stada 50 (50), Umarli–Szron 51 (50) | | | | | | w paśmie |

Liczby z poprzedniego strojenia (Kompanie–Klany 43, Horda–Umarli 43 itd.) różnią się o kilka punktów, bo pochodzą z innego stanu liczb i z reguły miejsc „parzystość”.
Wygrane bitwy pvp wg frakcji (baza): Horda 58%, Klany 56%, Szron 54%, Przymierze 51%, Umarli 50%, Stada 44%, Kompanie 37%. Pod L3: Szron 65%, Przymierze 65%, Horda 55%, Klany 51%, Umarli 50%, Stada 35%, Kompanie 28%.

## 3. Liczniki mechanik (bitwy pvp; na bitwę danej frakcji)

| mechanika | baza | L1 | L3 | uwagi |
|---|---|---|---|---|
| Przymierze: Blask Świtu, Ż wyleczone | 0,15 | 20,4 | 53,2 | ok. połowa obrażeń zadawanych w bitwie (ok. 90) |
| Horda: odpalenia Żądzy Krwi | 0,01 | 0,85 | 2,0 | jedno +1 A; wygrana bitew Hordy bez zmiany (58 → 58 → 55%) |
| Stada: bieg ≥ progu przed atakiem wręcz | 0,06 | 4,4 | 4,3 | 80% ataków wręcz po przebiegu: bot z rozpędu korzysta |
| Stada: odepchnięcia (wszystkie źródła) / zderzenia | 0,80 / 0,73 | 1,55 / 1,43 | 1,33 / 1,28 | w bazie to Byczy Łeb i Rogi (zdolności), nie Kamień Tętentu (0,02) |
| Stada: obrażenia ze zderzeń (Ż), w tym własne | 3,1 / 0,4 | 5,9 / 0,5 | 9,9 / 0,9 | 9% zderzeń rani własnych |
| Umarli: wstania Wiecznej Warty | 0,08 | 0,63 | 1,07 | limit 1–2 na bitwę zależnie od poziomu |
| Umarli: Grot Przez Zbroję (trafienia z bonusem na bitwę) | 0,51 | 0,56 | 0,64 | wzrasta tylko przy pancernym przeciwniku (Klany L3: 4,1 Ż/bitwę) |
| Umarli: Żniwo Many (Lisz) | 0 trafień | 0 | 0 | Lisz był w 0 z 4167 bitew Umarłych; wróg z manią w bitwach praktycznie nie ma |
| Klany: aktywacje jednostek w szyku | 0,03 z 0,03 | 2,3 z 13,1 (18%) | 7,8 z 13,4 (58%) | |
| Klany: Ż pochłonięte pancerzem Muru (kontrfaktycznie) | 0,02 | 2,2 | 10,7 | ok. 11% obrażeń otrzymanych |
| Klany: uniknięte odepchnięcia / kolce Muru | 0,01 / 0 | 0,02 / 0,02 | 0,37 / 0,07 | zakotwiczenie od poziomu 3, kolce od 4 |
| Szron: nałożone szrony / zamrożenia | 0,10 / 0,27 | 8,5 / 2,1 | 9,1 / 4,1 | w bazie zamrożenia pochodzą ze zdolności (Jarl, Rusałka), nie z Pałacu |
| Szron: kruche lody pęknięte / ściany lodu / porwania | 0 / 0,26 / 0,00 | 0,01 / 0,26 / 0 | 1,63 / 0,26 / 0 | ściana używana w 75% bitew z Marzanną; porwań praktycznie brak (Strzyga rzadka) |
| Kompanie: pułapki położone (Warsztat+Iskra / razem z Fortelem) | 0,01 / 0,31 | 0,97 / 1,27 | 1,87 / 2,17 | w bazie pułapki to prawie tylko Fortel Atamanki |
| Kompanie: pułapki, które zadziałały / niewykorzystane | 0,13 / 0,17 | 0,44 / 0,83 | 0,67 / 1,50 | 70% pułapek leży do końca; trafiają wyłącznie jednostki wręcz (2 trafienia strzelców na 3500) |
| Kompanie: unieruchomienia sidłami | 0 | 0 | 0,62 | od poziomu 3 |
| Kompanie: oznaczenia Kruka / odsłonięte ślady | 0,19 / 0 | 0,19 / 0 | 0,19 / 0 | Kruk oznacza, ale wróg prawie nie ma pułapek ani ukrytych |
| Kompanie: riposty, kradzież | 0 / 0,01 | | | Kocur w 1 bitwie; kradzież 1 na 100 bitew |

Pułapki Kompanii: średnia odległość pułapki od najbliższego wroga na starcie to ok. 10 pól (12 kolumn areny); tylko 3% leży w promieniu 3 pól.
Pułapki lecą w rundach 2–5. Skuteczność pod L3 (trafione / położone): Stada 51%, Przymierze 52%, Umarli 32–43%, Horda 26%, **Klany 11%, Szron 11%**.

## 4. Pary o największej rozbieżności: czy kontra się uruchamia

Wszystkie wartości „L3” = mechaniki obu stron już stoją. „Klasa” wg listy z zadania: (a) liczba zdolności/liczby, (b) logika bota, (c) projekt mechaniki,
(d) budynek, którego bot nie buduje. Wnioski oznaczone *hipoteza* nie wynikają wprost z liczników.

| para | mechanika kontry: czy się uruchamia | czy bot korzysta | wniosek / klasa |
|---|---|---|---|
| **Klany–Kompanie** (Kompanie mają kontrować, mają 39%) | w bazie Sidła praktycznie nie ma (0,31 pułapki/bitwę, same Fortele); pod L3 jest 2,2 pułapki, ale zadziałało **0,24 na 2,2 (11%)**; Klany wygrywają 64% | Klany stoją w szyku i czekają (formacja 56% aktywacji), Kompanie kładą pułapki ok. 10 pól od wroga; wróg wręcz nie wchodzi, strzelcy omijają | (b) rozmieszczanie pułapek i pasywność obu botów + (c) pułapka karze tylko szarżę. Kompanie wygrywają 28–37% bitew z każdym: słabe też bez Klanów (a). *Hipoteza:* bez zmiany miejsc pułapek (na drodze wroga, np. przy jego strzelcach) sama liczba pułapek nic nie da |
| **Przymierze–Umarli** (Umarli mają kontrować, Przymierze 56%) | Wieczna Warta: 0,08 wstania/bitwę w bazie (budynek w 12% bitew), 1,2 pod L3; Przymierze jednocześnie leczy 54 Ż/bitwę | bot Umarłych buduje Kurhan najwcześniej ze wszystkich (średnio runda 6,8) | (c) wstania (1–2 na bitwę) są o rząd mniejsze niż Blask (54 Ż); pod L3 Przymierze rośnie do 66%. Mechanika kontry vs Przymierze nie istnieje w liczbach: Grot (0,64 Ż/bitwę) nie dotyka leczenia. Wymaga zmiany projektu (np. przeciw-leczenie) albo osłabienia Blasku |
| **Horda–Szron** (Horda ma kontrować, ma 48%) | Żądza Krwi 0,01/bitwę w bazie, 1,4 pod L3; Szron L3: 3,9 zamrożeń na bitwę | Horda nie ma w bocie nic pod Szron; ofiarą zamrożenia są jej szybcy wręcz | (c) Horda nie ma mechanizmu kontry Szronu: mechanika to +1 A raz. Pod L3 Szron wygrywa 64% (cel: 35%). Klasa: projekt + liczba (Szron L3 za mocny) |
| **Stada–Klany** (Klany mają kontrować, Stada 52%) | Tętent działa (4,3 biegi/bitwę, 1,2 odepchnięć, 1,0 zderzeń), Mur L3: odepchnięcia uniknięte 0,37/bitwę, pochłanianie 12,8 Ż/b w tej parze | tak, bot Stad robi rozpęd i bije w formację | (c) Mur L3 pochłania, ale nie odwraca wyniku: Stada 47% (cel 35). Zakotwiczenie unika tylko ok. 0,4 odepchnięć na bitwę, przy 1,2 wykonanych (bot odpycha głównie jednostki poza szykiem). Poprawka: liczby Muru / kolce; mała |
| **Horda–Umarli** (Horda ma kontrować, ma 48%) | Żądza 2,4/bitwę pod L3, wstania Umarłych ok. 1,0 | tak | (c) wynik niezmienny od L0 do L3 (48–49%): nie ma w zasadach mechanizmu kontry (Żądza Krwi nie zabija szkieletów dwa razy). Umarli odzyskują jednostki, Horda dostaje +1 A od pierwszej śmierci; sensowny projekt: wstała jednostka nie liczy się do Żądzy albo Horda zabija stojących |
| **Przymierze–Horda** (Przymierze ma kontrować, ma 49%) | Blask 43,7 Ż/b pod L3 (leczenie), Żądza 1,7 | bot buduje Kapliczkę w 2% partii | (d) bot nie buduje; po zbudowaniu Przymierze rośnie do 58% (cel 65): dobry kierunek, mechanika tu działa |
| **Stada–Szron** (Stada mają kontrować, mają 49%) | Szron L3: 3,8 zamrożeń/b; Stada: odepchnięcia 1,1 i zderzenia 1,6 na bitwę | bot Stad nie ma reakcji na szron (atakuje szybciej niż zamrożony reaguje, ale traci tury) | (c) zamrożony jest „stały” (nie rusza się), więc odepchnięcia nie liczą się podwójnie; pod L3 Stada 37% (cel 65). Klasa: projekt (np. kruchy zamrożony: kolizje zadają więcej) + zdolności |
| **Klany–Szron** (Szron ma kontrować, Klany 48%) | Szron L3: 4,0 zamrożeń/b i 9,0 szronów; Klany L3 pochłaniają 14,6 Ż/b | Klany nie mają nic przeciw zamrożeniu | działa: pod L3 Klany 42%, pod L1 44%, baza 48% (cel 35). (d) bot nie buduje Pałacu (Szron 1% partii) i zdolności |
| **Umarli–Klany** (Umarli mają kontrować, mają 56%) | Grot Przez Zbroję: 1,3 Ż/b w bazie, 4,1 Ż/b pod L3 (pomija pancerz Muru) | tak (Łucznik rekrutowany w pętli A/B) | częściowo działa; pod L3 formacja absorbuje 9,9 Ż/b, a Grot odzyskuje ok. 4 — wynik stały 55–56%. (a) Łucznik wymaga linii A (błąd miejsc w punkcie 4 rozmywa wynik) |
| **Umarli–Kompanie, Szron–Kompanie, Horda–Kompanie** (brak relacji, mają 59–62) | n/d | | Kompanie są za słabe wszędzie (28–37% bitew): (a) |

Uwaga do Stad: gdy Kamień Tętentu stoi, ok. 80% ataków wręcz poprzedza bieg o wymaganej długości, choć `docs/frakcje/herds.md` mówi, że bot nie ustawia pod rozpęd (bieg wynika, jak sądzę, z samego pościgu za wrogiem; *hipoteza*). W bazie
(bez Kamienia Tętentu) odepchnięcia to 0,80/bitwę ze zdolności Byczego Łba i Rogów.

## 5. Zdolności jednorazowe: czy bot z nich korzysta

(`abilityUsed` w bitwach pvp na koniec bitwy; niektóre flagi mogą nie odpowiadać użyciu — oznaczone)
Prawie wszystkie jednostki startowe używają zdolności w 75–99% obecności. Niskie użycie: **Król Jednorożców 0%** (1154 obecności, Szarża Światła), **Władca Wilkołaków 0%** (Zew Krwi; *flaga może
nie być ustawiana*), **Jeździec na Koźle 0%** (331 obecności, Skok po Turniach), **Rusałka Szronu 1%** (Szklany Dzwoneczek wymaga wroga z szronem, a szronów prawie nie ma bez Pałacu), Szronowa Wiedźma 9%, Płaczka 20%, Pokutny Mnich 19%, Król
Kurhanu 43% (Wezwanie z Kurhanu), Zjawa 39%, Czarny Smok 45%, Kruk Wieszczek 62%. Klasa: (b), małe poprawki w `battleAi.ts`. Pełna tabela: raport z `--report`.

## 6. Czego nie dało się zmierzyć bez zmiany silnika (i minimalny licznik)

- Czy bot układa pułapki „sensownie”: mierzę tylko odległość od wroga w rundzie 1 oraz skuteczność. Brak: **gdzie wróg faktycznie szedł**. Licznik: `BattleState.stats.trapPassed` (ile razy jednostka wroga stała w sąsiedztwie pułapki).
- Dokładny wpływ Żądzy Krwi: mierzę odpalenia, nie to, ile obrażeń dodała (licznik `bloodlustDamage` w `dealDamage`).
- Czas życia jednostek po wstaniu (Wieczna Warta) i ich obrażenia (`damageBy` nie rozróżnia).
- Ile obrażeń Mur Tarcz pochłonął dokładnie: mam oszacowanie kontrfaktyczne (`predictDamage` bez Sali Tarcz), bez kości; nie odtwarza zaokrągleń.
- Użycie zdolności: flaga `abilityUsed` dla części zdolności nie jest ustawiana (np. Zew Krwi) — licznik użyć w `battleAbility` (`stats.abilityUses[id]`).
- Wpływ Iskry (bonus Reliktu frakcji) na pary: celowo poza zakresem.
- Czy partia jest rozstrzygana bitwą pvp: nie mierzone (0,69 bitwy pvp na partię; ile partii obywa się bez żadnej, nie liczyłem). Licznik: bitwy pvp i wynik partii razem w `GameStats` (dziś `battles` łączy wszystkie rodzaje).

## 7. Priorytety poprawek (wg przewidywanego zysku na jednostkę pracy)

| # | Poprawka | Klasa | Praca | Zysk (dane) |
|---|---|---|---|---|
| 1 | Zmienić regułę miejsc w `nowe-frakcje.ts` i `tuneFactions.ts` na `(seed >> 1) & 1` (albo uśredniać dwie kolejności). Przed jakimkolwiek dalszym strojeniem | metoda | 1 linia | usuwa błąd do 8 pkt na parze (Umarli–Klany, Klany–Szron, Horda–Stada); wszystkie dalsze wnioski zależą od tego |
| 2 | Bot buduje budynek mechaniki zaraz po koszarach (dziś po rynku, tawernie, wieży maga; `botPurchase` w `kingdom.ts`) | bot (d) | mała | mechanika w 90% bitew zamiast 1%; ale najpierw patrz 3, bo wynik pójdzie w stronę Przymierza i Szronu |
| 3 | Wyrównać siłę mechanik na poziomach 1–3: Blask (20/53 Ż na bitwę) i Szron (zamrożenia 2/4 na bitwę) są o rząd silniejsze niż Żądza (+1 A raz), Tętent i Sidła; ta różnica sama psuje pary Przymierze–Umarli (+10 pkt L3), Szron–Horda/Stada (−12 pkt pod L3) | liczby mechanik (a) | mała–średnia | największa dźwignia po kroku 2; `make sim-diagnoza FORCE=1/3` + `--compare` mierzy efekt w 3 minuty |
| 4 | Sidła: miejsca pułapek na drodze wroga (okolice jego strzelców, linia natarcia), a nie tuż przy własnych; rozważyć pułapkę, która reaguje także na strzelców | bot + projekt (b,c) | średnia | Kompanie wygrywają 28–37% bitew; Klany–Kompanie +26 pkt od celu; skuteczność pułapek 11% vs Klany, 70% niewykorzystanych |
| 5 | Przymierze–Umarli / Horda–Umarli: Umarli nie mają mechanizmu kontry (Warta 1 wstanie, Żniwo Many 0 — Lisz niewystawiany, wróg bez many) | projekt (c) | średnia–duża | pary +21 / −17; wymaga decyzji autora (przeciw-leczenie, wskrzeszenie skraca Żądzę) |
| 6 | Horda: kontra Szronu i Umarłych nie ma mechanizmu (Żądza to jedno +1 A) | projekt (c) | duża | −17 (Szron), −17 (Umarli); decyzja autora |
| 7 | Klany: Mur Tarcz pochłania 11% obrażeń, ale nie kontruje Stad i Hordy; zakotwiczenie działa 0,37/b; Stada–Klany +17 | liczby Muru + bot (a,b) | mała | małe poprawki: próg sąsiadów, kolce wcześniej |
| 8 | Stada–Szron i Horda–Szron: Szron L3 nie ma słabości, której Stada/Horda mogłyby użyć | projekt (c) | średnia | −16 / −17 pkt |
| 9 | Bot: niskie użycie zdolności (Król Jednorożców 0%, Jeździec na Koźle 0%, Rusałka 1%, Płaczka/Pokutny Mnich 20%) | bot (b) | mała każda | niewielki, ale tanie |
| 10 | Dodać do silnika licznik użycia zdolności i trafień sideł (pkt 6) | pomiar | mała | usuwa hipotezy z tej diagnozy |

Kolejność robocza: **1 → 2+3 razem (z powtórką pomiaru L0/L1/L3 po każdej zmianie) → 7 → 4 → 9 → 5/6/8 (po decyzji autora)**.

## 8. Jak odtworzyć

```
make sim-diagnoza GAMES=500 OUT=.tmp/base.json              # baza (miejsca (seed>>1)&1), ok. 2,5 min
make sim-diagnoza GAMES=500 FORCE=3 OUT=.tmp/f3.json         # mechanika od startu na poziomie 3 (eksperyment)
DIAG_ORDER=parity make sim-diagnoza OUT=.tmp/par.json        # reguła miejsc z sim-nowe
node --import tsx scripts/sim/diagnoza.ts --compare .tmp/base.json .tmp/f1.json .tmp/f3.json
node --import tsx scripts/sim/diagnoza.ts --report .tmp/base.json > raport.md
```
Pliki z tego pomiaru (nie w repo): `.tmp/base.json`, `.tmp/f1.json`, `.tmp/f3.json`, `.tmp/parity/base.json`.

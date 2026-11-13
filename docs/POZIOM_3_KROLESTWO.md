# Poziom 3 „Królestwo”: szkic projektu

Stan na 12.11.2026. **To szkic do akceptacji: kodu nie ruszam, dopóki autor nie odpowie na pytania z końca.** Szkic opiera się na
`ROZBUDOWA_CYFROWA.md` (drabinka poziomów, etap 2), `MECHANIKI_I_POZIOMY.md` (poziom 3), `DECYZJE.md` i na tym, co gra ma dziś
(`ZASADY_CYFROWE.md`). Liczby są robocze: ustalają je symulacje, tak jak przy poziomie 2.

## Decyzje autora z 13.11.2026 (mają pierwszeństwo nad treścią poniżej)

Pełna lista: `BACKLOG.md` (sekcja „STAN”) i `DECYZJE.md`. Najważniejsze zmiany względem szkicu:
- **Termin:** poziom 3 przed premierą, premiera po poziomie 5. Odpowiedzi na pytania z sekcji 12: 1 przed premierą, 2 tak (tylko złoto), 3 patrz niżej, 4 maks. 5, 5 kasa per frakcja, 6 „Podbój” na poziom 4, 7 patrz niżej, 8 bez utraty złota, 9 tak (posiłki, realne zagrożenie), 10 trudność z symulacji po wdrożeniu, 11 nazwy bez zmian.
- **Złoto:** mała skala (najtańsze 1, dochód osady 1–2, kopalnia +1); złoto tylko z osad, kopalń i skrzyń (artefakt albo złoto); bez łupów z pokonanego bohatera i bez nagród złotem ze strażników.
- **Osady:** frakcja narzucona połową mapy (2/4/4/6 osad); wejście = przejęcie, budynki zostają; obcy właściciel: dochód, targ, szpital, bez rekrutacji; obrońcy trochę silniejsi niż strażnicy kryształów; obrona tylko stojąc na polu. Każda osada ma nazwę i widok z krajobrazem i budynkami (jak Heroes III).
- **Budynki kupowane:** koszary (poziomy dają miejsca), targ, szpital (ulepszenie: wskrzeszanie za 1/3), budynek dochodu.
- **Rekrutacja:** bez kopii (odpada droga A z instancjami i krok K3 jako przebudowa); 7 pomocników na frakcję w poziomach 1–5, maks. 5 w drużynie (miejsca: start 2, +1 na 3. i 6. poziomie bohatera, +1 koszary); cena z symulacji; bez limitu zakupów na turę.
- **Online:** oszczędny ruch (przegląd B13 przed K1).

## 1. Skąd startujemy

Poziom 2 „Wyprawa” (cyfrowa) daje: rozwój bohatera (PD, poziomy 1–10, umiejętności), artefakty w 5 miejscach i 3 rzadkościach, plecak,
obiekty na mapie (kapliczka, obóz najemników, skrzynia), spotkania z neutralnymi, 5 celów i kilka kształtów mapy. Armia to wciąż
**bohater + 2 pomocników** wybieranych przed bitwą z puli 3 pomocników frakcji (`FACTION_SUPPORTS`, `SUPPORTS_PER_BATTLE = 2`); polegli pomocnicy
wracają tylko przez Eliksir Odrodzenia albo obóz najemników. Skarby są wspólne dla frakcji, nie ma żadnej waluty.

Uzgodnione wcześniej i obowiązujące tu: **model drużyny, nie stosów** (bohater prowadzi N pojedynczych jednostek, arena i bitwy zostają bez
przebudowy), jedna waluta w tym poziomie (złoto), kryształy zostają celem, a nie walutą.

## 2. Co nowego względem poziomu 2 (w skrócie)

1. **Złoto**: jedna waluta, jedna liczba na frakcję, widoczna na pasku.
2. **Osady**: osada startowa każdej frakcji i osady do zdobycia na mapie.
3. **Rekrutacja**: w osadzie za złoto kupuje się jednostki do drużyny.
4. **Drużyna większa niż 2 pomocników**: N rośnie z poziomem bohatera i z rozwojem osady.
5. **Sklep artefaktów** w osadzie: artefakt za złoto zamiast samego losowania ze skrzyń.
6. **Zestawy artefaktów** (3 przedmioty z jednego zestawu = premia).

Nie wchodzi tu (to poziom 4 „Imperium”): drewno, ruda, Gwiezdny Pył, budynki jeden na rundę, cykl tygodniowy, drzewka umiejętności.
Poziom 3 ma więc **osadę prostą**: kilka stałych usług i dwa płatne ulepszenia, bez drzewa budynków.

## 3. Złoto

**Skąd:**
- stały dochód osady: ok. 100 złota na rundę z osady startowej, +100 za każdą zdobytą;
- nowy obiekt na mapie, **kopalnia złota** (obok kapliczki, obozu i skrzyni): trzyma ją ten, kto stoi na jej polu (kontrola jak przy punktach kontrolnych, bez bitwy), dochód +50 na rundę;
- nagrody: strażnik daje złoto obok skarbu (wartość rośnie z jego poziomem), skrzynia może dać złoto zamiast artefaktu;
- pokonany bohater wroga zostawia część swojego złota (nie całe, żeby wygrana nie była lawiną).

**Na co:** rekrutacja, artefakty w sklepie, ulepszenia osady, wskrzeszenie poległej jednostki w osadzie (tańsze niż Eliksir, ale tylko tam).

**Zasady wspólne:** złoto jest wspólne dla frakcji (jak skarby): w koopie wszyscy gracze Przymierza mają jedną kasę, w rywalizacji każda frakcja swoją. Hotseat w rywalizacji ukrywa ją ekranem przekazania razem ze skarbami.

## 4. Osady

- **Osada startowa** stoi w bazie frakcji (dziś to pola `baseDawn` i `baseHorde`). Bohater, który na niej stoi, może w swojej turze skorzystać z usług.
- **Osady do zdobycia**: kilka pól na mapie (2 / 3 / 4 / 5 na krótkiej, średniej, długiej, bardzo długiej), każda **bronią neutralni** (strażnik albo spotkanie jak dziś, słabsze niż przy kryształach). Zdobyta zmienia właściciela, daje dochód i usługi; wróg może ją odbić, wchodząc na nią z wygraną walką.
- **Usługi osady** (stałe, bez budowania):
  1. *Koszary*: rekrutacja (sekcja 5).
  2. *Targ*: 3 artefakty w ofercie, nowa oferta co 3 rundy; cena zależy od rzadkości (np. zwykły 150, rzadki 400, legendarny 1000 złota; do strojenia).
  3. *Szpital*: **wskrzeszanie** poległych pomocników bohatera za połowę ceny jednostki (tańsze niż Eliksir Odrodzenia, ale tylko w osadzie).
- **Ulepszenia osady** (płatne, każde raz): *Rozbudowane koszary* (+1 miejsce w drużynie i dostęp do mocniejszych jednostek), *Duży targ* (5 ofert zamiast 3). To pomost do poziomu 4, gdzie z tego powstaną budynki.
- Na mapie osada to medal na polu (jak obiekty z `sites.ts`); okno osady otwiera się, gdy bohater stoi na polu i kliknie ikonę (albo prawy przycisk: podgląd bez wchodzenia).

## 5. Rekrutacja i drużyna

To najtrudniejsza część i tu potrzebna jest decyzja autora (pytanie 3).

**Dziś:** pomocnik jest jedną z 3 stałych jednostek frakcji, każdy ma id (`elfDruid`…); jednostka w bitwie jest rozpoznawana po tym id, więc jeden gracz **nie może mieć dwóch tych samych**.

**Model drużyny** (proponowany): drużyna bohatera ma **N miejsc**: dziś 2; w Królestwie 2 na start, +1 na 3. poziomie bohatera, +1 po *Rozbudowanych koszarach*, +1 na 6. poziomie; **maksimum 5 pomocników** (bitwa 6 na 6; arena 13 × 9 to mieści, ale rośnie czas bitwy i koszt botów). Przed bitwą gracz nadal wybiera, kto idzie (do N z puli posiadanych), jak dziś wybiera 2 z 3.

**Skąd jednostki — dwie drogi:**
- **A. Bez nowej grafiki:** rekrutacja = *odkupienie i uzupełnienie* tego, co frakcja już ma (3 pomocników swoich + neutralni, których dziś widać tylko jako strażników). Problem: potrzeba **kopii** jednostki (dwa Elfy Druidy), czyli w silniku bitew identyfikator instancji zamiast id typu jednostki (zmiana w `BattleUnit`, `supportsAlive/Dead`, interfejsie wyboru i botach). Koszt: jednorazowa przebudowa, ale potem każda jednostka z poziomu 4 i frakcje DLC z niej korzystają.
- **B. Z nowymi jednostkami** (jak w szablonie frakcji: ok. 7 na frakcję, `KARTA_FRAKCJI_SZABLON.md`): każda ma kartę, portret, ikonę zdolności, klipy animacji. To 14 jednostek dla dwóch frakcji. Z doświadczenia potoku (`POTOK_ANIMACJI.md`) jednostka kosztuje rzędu 70–110 CU Scenario i kilka godzin pracy. To docelowy kierunek, ale to **grafika jest wąskim gardłem** (zapis w `ROZBUDOWA_CYFROWA.md`).

**Rekomendacja:** zacząć od **A**, z przebudową na instancje, i dołożyć do puli rekrutowanej **po 2–3 nowe jednostki na frakcję** (B w małej dawce), żeby osada miała co dawać. Pełne 7 na frakcję dopiero przy poziomie 4.
- Cena jednostki zależy od siły (Życie × Atak × Szybkość z `UNITS`), a koszary podnoszą limit miejsc, nie obniżają ceny. Początkowo bez cyklu tygodniowego: jednostka jest do kupienia od razu, w limicie 1 zakupu jednostki na bohatera na turę (żeby kasa nie zamieniała się w armię w jedną turę).

## 6. Cel gry

Cele zostają te same (kryształy, kontrola, przetrwanie, boss, artefakt): poziom 3 to **ekonomia dokładana do dowolnego celu**, jak rozwój bohatera. Dla kontroli i przetrwania osady dają dodatkowy sens (kto trzyma osady, ten ma pieniądze). **Pytanie 6:** czy dodać cel „Podbój” (w rywalizacji wygrywa, kto zajmie osadę startową wroga)? Rekomendacja: nie w pierwszej wersji; sprawdzić po tygodniu grania, czy kto trzyma osady, wygrywa za często.

## 7. Wpływ na boty i balans

- **Boty mapy** (`adventureAi.ts`): muszą umieć (a) wracać do osady, gdy mają złoto i miejsce w drużynie, (b) wybierać zakupy według priorytetów (najpierw drużyna do limitu, potem artefakty według `DRAFT_VALUE`/rzadkości), (c) iść po osady i kopalnie, (d) bronić swojej osady przed odbiciem. Dla automatu zła (koopa Horda) prosta reguła: stałe **posiłki co kilka rund** zamiast wydawania złota, tak jak dziś odradza się bohater.
- **Boty bitwy** (`battleAi.ts`): większe drużyny to dłuższe bitwy; rozstawienie i wybór celu muszą sobie radzić z 6 na 6 (testy czasu ruchu bota; limit `battleRoundLimit`).
- **Wskaźnik trudności** walki (`difficulty.ts`) rozgrywa walkę botami, więc działa bez zmian, ale jest wolniejszy przy większych drużynach (do zmierzenia).
- **Balans:** cała tabela strojenia powstaje na nowo dla poziomu 3 (cele × kształty × mapy × tryby), bo ekonomia przechyla grę w stronę strony, która szybciej zdobędzie osady. Pasma autora (Łatwy 65–85, Normalny 45–65, Trudny 30–45) zostają. Zakładam nowy zestaw dźwigni stroiciela (cena jednostek, dochód, liczba osad) i osobne wpisy w `DIGITAL_TUNING` dla poziomu `kingdom`. Czas symulacji rośnie (ekonomia wydłuża partie): limit 3 minut na tabelę może wymagać mniejszej liczby gier.
- **Punkty rankingowe** (`scoring.ts`): nowa kolumna trudności dla poziomu 3 na podstawie symulacji; do czasu zmierzenia gry tego poziomu nie liczą się do rankingu (tak jak „Własne”).
- **Autopilot** dla dziecka (zatwierdzony 4.11): zarządza złotem i osadami według reguł bota (zakupy automatyczne, za zgodą rodzica w ustawieniach).

## 8. Wpływ na grę online i serwer

- Nowy poziom stołu `kingdom` w `TableTier` (backend `table.ts`, klient `OnlineScreen`); serwer **nie potrzebuje nowej logiki** poza walidacją: wszystkie nowe akcje (`recruit`, `buyArtifact`, `upgradeSettlement`, `useSettlement`) wykonuje silnik, który serwer i tak odtwarza z listy akcji.
- Stan gry rośnie (złoto, osady, drużyny, oferta targu): sprawdzić rozmiar wiadomości `game` przy największej mapie (dziś cały stan idzie do klienta).
- Partie trwające w chwili wdrożenia nowego silnika są odtwarzane nowym silnikiem (znana zasada z `INFRASTRUKTURA.md`); nowy poziom nie psuje starych akcji, bo dopisuje typy akcji, ale **zmiana identyfikatorów jednostek na instancje (droga A)** zmienia stan i może uniemożliwić odtworzenie trwających partii: wdrażać, gdy nikt nie gra.
- Hotseat w rywalizacji online nie dotyczy (każdy ma swój ekran); w koopie wspólna kasa.

## 9. Interfejs

- Pasek frakcji: ikona złota z liczbą i dochodem na rundę (podpowiedź: skąd).
- **Okno osady** (modalne, na telefonie pełnoekranowe): trzy karty usług (Koszary, Targ, Szpital), na dole ulepszenia. W Koszarach lista jednostek z ceną i przyciskiem; w Targu 3 artefakty w ramce rzadkości (te same karty co dziś).
- Karta bohatera: lista drużyny z miejscami (puste szare), przycisk wyboru, kto idzie do bitwy.
- Mapa: medal osady (kolor frakcji lub szary), medal kopalni; podpowiedź nad polem mówi, co daje.
- Nowe akcje działają z klawiatury i dotykiem; sprawdzenie na układzie telefonu obowiązkowe (CLAUDE.md).

## 10. Podział na kroki i szacunek pracy

Jednostka pracy: **sesja** = jedna zamknięta porcja pracy Claude'a między `/clear` (kilka commitów, `make check`, wpis w CHANGELOG). Szacunki zgrubne; K3 jest największą niewiadomą.

| Krok | Zakres | Sesje |
|------|--------|-------|
| K1 | Złoto: pole stanu, dochód, kopalnia jako obiekt na mapie, pasek w UI, nagrody ze strażników; boty zbierają kopalnie. Przełącznik `RulesConfig.kingdom`, preset poziomu | 1–2 |
| K2 | Osada startowa i okno osady: Targ (artefakty za złoto), Szpital; akcje i walidacja; boty kupują | 2 |
| K3 | Drużyna N i instancje jednostek (droga A): `BattleUnit` po instancji, wybór drużyny w UI, boty bitwy, testy, golden poziomu; rekrutacja w Koszarach z kopiami istniejących jednostek | 3–4 |
| K4 | Osady do zdobycia (generator mapy, neutralni strażnicy osad, odbijanie, dochód) i ulepszenia osady | 2 |
| K5 | Zestawy artefaktów (3 zestawy, premie) i nowe jednostki rekrutowane (po 2–3 na frakcję): dane, karty, balans | 2 (+ grafika) |
| K6 | Boty i balans całości: strojenie tabel poziomu 3, `scoring.ts`, wskaźnik trudności, automat zła (posiłki) | 3 |
| K7 | Online: poziom `kingdom` w serwerze i lobby, test dwóch kont w przeglądarce, wydanie silnika i wdrożenie | 1 |
| K8 | Grafika: ikona złota, medale osady i kopalni, tło okna osady, nowe jednostki (K5), dźwięki (zakup, monety) przez Scenario/ElevenLabs | 2 (+ kredyty) |
| K9 | Instrukcja (rozdział o ekonomii), samouczek poziomu 3, kronika zmian, tryb rodzinny i autopilot | 1–2 |
| **Razem** | | **ok. 17–21 sesji** (bez grafiki nowych jednostek: ok. 70–110 CU na jednostkę) |

Kolejność: K1 → K2 → K3 → K6 (pierwsza grywalna wersja z ekonomią) → K4 → K5 → K7 → K8 → K9. Po każdym kroku gra jest grywalna i przetestowana (zasada nadrzędna z `ROZBUDOWA_CYFROWA.md`), a poziom 3 jest za przełącznikiem, dopóki nie przejdzie strojenia.

## 11. Ryzyka

1. **Przebudowa na instancje jednostek (K3)** dotyka silnika bitew, botów, interfejsu i zapisów: największe ryzyko regresji. Zabezpieczenie: golden poziomów 1–2 się nie zmienia; nowy golden dla poziomu 3.
2. **Czas bitwy i botów** przy 6 na 6. Zabezpieczenie: limit N, pomiar czasu ruchu bota przed K3.
3. **Lawina ekonomii:** strona, która pierwsza zdobędzie osady, wygrywa. Zabezpieczenia: dochód stały i niski, limit zakupów jednostek na turę, ograniczone łupy z pokonanego bohatera.
4. **Grafika nowych jednostek** wydłuża harmonogram (patrz K5, K8). Droga A pozwala wydać poziom bez niej.
5. **Rozjazd z zasadą „premiera = poziomy 1–2”** (`DECYZJE.md` 4.11), a w `MECHANIKI_I_POZIOMY.md` poziom 3 ma opis „decyzja autora: wchodzi do premiery”. Do rozstrzygnięcia (pytanie 1).

## 12. Pytania do autora

1. **Termin:** czy Królestwo wchodzi do premiery, czy po niej? Dwa dokumenty mówią co innego (patrz ryzyko 5). Od tego zależy, czy robić to przed zakupem domen i Steamem.
2. **Waluta:** potwierdzenie, że poziom 3 ma **tylko złoto**, a drewno/rudę zostawiamy na Imperium (rekomendacja: tak).
3. **Rekrutacja:** droga A (kopie istniejących jednostek + instancje w silniku), B (nowe jednostki) czy A z 2–3 nowymi na frakcję? (rekomendacja: A + 2–3 nowe).
4. **Wielkość drużyny:** maksimum 5 pomocników (bitwa 6 na 6) czy mniej, np. 3–4 (szybsze bitwy)? (rekomendacja: start od 4, bo 6 na 6 wydłuża bitwy i boty).
5. **Wspólna kasa** frakcji w koopie i rywalizacji (jak skarby) czy osobna dla każdego gracza? (rekomendacja: wspólna).
6. **Cel „Podbój”** (zajęcie osady wroga): w pierwszej wersji tak czy nie? (rekomendacja: nie).
7. **Osady do zdobycia:** czy wróg może odbić zdobytą osadę (rekomendacja: tak) i czy osada zdobyta daje też własne usługi, czy tylko dochód (rekomendacja: usługi też, ale Targ tylko w osadzie startowej, żeby nie mnożyć okien).
8. **Strata złota po porażce bohatera** (część złota dla zwycięzcy): tak czy nie? (rekomendacja: tak, 25%, żeby wygrana w walce bohaterów miała cenę poza zdobyciem artefaktów).
9. **Automat zła w koopie:** posiłki co kilka rund zamiast prawdziwej ekonomii (rekomendacja: tak; prawdziwa ekonomia automatu to osobny, duży projekt).
10. **Ranking:** czy do czasu zmierzenia trudności poziom 3 nie daje punktów (rekomendacja: tak, jak „Własne”)?
11. **Nazwa poziomu:** zostaje „Królestwo” (tak w drabince)? W grze obecnie są „Poziom 1: Przygoda”, „Poziom 2: Wyprawa”.

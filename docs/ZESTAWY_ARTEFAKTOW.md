# Zestawy artefaktów (poziom 3 „Królestwo” i wyższe)

Stan na 13.11.2026: **4 zestawy zaakceptowane przez autora** (nazwy, elementy i efekty); liczby są robocze i trafią do strojenia symulacjami.

## Zasady

- Zestawy występują **tylko na poziomie 3 i wyższych** (w poziomach 1–2 elementów zestawowych nie ma w skrzyniach ani w ofercie).
- Element zestawu ma rzadkość **„rzadki”**: ta sama cena w Targu i ta sama szansa dropu na element co zwykły rzadki (pula rzadkich rośnie o 12 elementów).
- Zestaw ma 3 elementy w różnych slotach (hełm, broń, zbroja, tarcza, buty). **Premia działa dopiero przy 3 z 3.** Bohater nosi najwyżej jeden zestaw naraz (5 slotów).
- Wymiana artefaktów jest ręczna w interfejsie, więc zestawowy element nie przepada po automatycznym podmienieniu na lepszą rzadkość.
- Przejęcie artefaktów po pokonaniu bohatera dotyczy też elementów zestawów (ryzyko kuli śnieżnej do sprawdzenia symulacją).
- Interfejs: karta bohatera pokazuje „2/3 zestawu …”; Targ i skrzynia oznaczają elementy zestawowe.
- Efekty ekonomiczne działają, gdy bohater nosi element i żyje; premia dochodowa działa raz na frakcję.
- Żaden efekt nie powtarza efektu artefaktu z poziomu 2 (sprawdzone 13.11 z `ARTIFACTS` w `src/engine/sites.ts`).

## 1. Strój Gajowego (las, drużyna)

| Slot | Element | Efekt |
|------|---------|-------|
| hełm | Wianek Gajowy | pomocnicy mają +1 S w bitwie |
| zbroja | Płaszcz z Mchu | na początku każdej rundy bohater odzyskuje 1 Ż |
| buty | Trzewiki z Kory | bohater jest odporny na korzenie (Elf Druid), sidła (Pająk) i chwyt (Szczypiec) |
| premia | 3/3 | pole widzenia +1 (dodawane do innych źródeł) i pomocnicy +2 Ż |

## 2. Rynsztunek Brzasku (światło, atak)

| Slot | Element | Efekt |
|------|---------|-------|
| hełm | Diadem Brzasku | pierwszy atak bohatera w bitwie zadaje +2 A |
| broń | Miecz Jutrzenki | *Fala Ostrza*: cios rani też o 1 Ż jednego innego wroga sąsiadującego z celem |
| tarcza | Tarcza Zorzy | ataki z dystansu zadają bohaterowi o 2 mniej |
| premia | 3/3 | pierwszy atak każdej jednostki drużyny w bitwie zadaje +1 A |

## 3. Pancerz Wartownika (obrona)

| Slot | Element | Efekt |
|------|---------|-------|
| zbroja | Zbroja Wartownika | *Ostatnia Szansa*: raz na bitwę, gdy bohater miałby paść, zostaje mu 1 Ż |
| tarcza | Tarcza Wartownika | wróg, który trafi bohatera w zwarciu, ma −1 S w swojej następnej aktywacji |
| buty | Buty Wartownika | *Zakotwiczenie*: jeśli bohater nie ruszał się w swojej aktywacji, otrzymuje ciosy o 1 słabsze do swojej następnej aktywacji |
| premia | 3/3 | sąsiedni pomocnicy otrzymują ciosy o 1 słabsze (min. 1), dopóki bohater stoi |

## 4. Strój Kupca (ekonomia, tylko poziom 3)

| Slot | Element | Efekt |
|------|---------|-------|
| hełm | Kapelusz Kupca | artefakty w Targu są o 1 zł tańsze (nie mniej niż 1 zł) |
| zbroja | Kaftan Poborcy | otwarcie skrzyni daje dodatkowo +1 zł, także gdy gracz wybiera artefakt |
| buty | Buty Handlarza | za pierwsze zajęcie osady lub kopalni bohater dostaje jednorazowo +1 zł |
| premia | 3/3 | dochód frakcji +1 zł na rundę (raz na frakcję) |

## Zapamiętane na przyszłość (nie wdrażane)

- **Krwiopijca** (wariant B Miecza Jutrzenki): po zabiciu wroga bohater odzyskuje 2 Ż. Autor chce go użyć w przyszłości (np. jako osobny artefakt lub element zestawu na poziomach 4–5).
- **Odpychający Cios** (wariant C): cios odpycha wroga o 1 pole.

## Do zrobienia

(Stan 13.11: punkty 1–3 zrobione w kodzie: silnik, UI, boty; zostają ikony i strojenie.)

1. Silnik: pole `set` w `ArtifactDef`, nowe efekty (pomocnicy +S, regeneracja, odporność na spowolnienia, pierwszy atak +A, zadawanie obrażeń sąsiadowi celu, Obrona przed dystansem, Ostatnia Szansa, −S po trafieniu, Zakotwiczenie, pole widzenia +1, efekty złota), premie 3/3, losowanie elementów tylko na poziomie 3+, testy.
2. UI: licznik zestawu na karcie bohatera, znacznik w Targu i przy skrzyni.
3. Boty: `DRAFT_VALUE` i zakupy w Targu rozumieją zestawy.
4. Grafika: 12 ikon elementów (potok Scenario).
5. Strojenie: symulacje, w tym ryzyko kuli śnieżnej i siła premii Kupca.

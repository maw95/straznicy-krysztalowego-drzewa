# Figurki do druku 3D — specyfikacja

Specyfikacja 15 figurek *Strażników Kryształowego Drzewa* do druku na drukarce żywicznej (MSLA). Służy do trzech rzeczy: do szukania gotowych modeli, jako opis dla generatora 3D z obrazka i jako zlecenie dla rzeźbiarza.

---

## 1. Założenia (do potwierdzenia)

W materiałach gry nie ma jeszcze fizycznych wymiarów plansz, więc przyjąłem:

| Element | Założenie | Skąd |
|---|---|---|
| Plansza areny | **A3 (420 × 297 mm)**, dwustronna | grafika areny ma proporcje ok. 4:3 |
| Pole areny | ok. **33 mm** szerokości, **27 mm** między płaskimi bokami | 13 kolumn heksów na grafice 1448 px |
| Kafelek mapy | **50 mm** między płaskimi bokami | bardzo długa mapa (14 rzędów) zajmie ok. 70 × 60 cm stołu |

**Najważniejsza zasada: na jednym polu stoi jedna figurka.** Podstawka musi się więc zmieścić w polu areny, czyli mieć poniżej 27 mm. Jeśli arena będzie mniejsza niż A3, zmniejszamy podstawki.

---

## 2. Wspólne dla wszystkich figurek

### Podstawka

- **Kształt:** sześciokąt, **24 mm między płaskimi bokami**, ustawiony tak jak pola areny. Na kafelku mapy (50 mm) jest dużo miejsca.
- **Wysokość:** 3 mm, z fazką 0,5 mm na górnej krawędzi.
- **Kolor frakcji na obrzeżu:**

  | Frakcja | Kolor | Przykład |
  |---|---|---|
  | Przymierze | zieleń | `#177147` |
  | Horda | bordo | `#8B2238` |
  | Strażnicy | granat | `#1D63A6` |

  Malowane albo jako osobny pierścień z innej żywicy.
- **Herb frakcji** wytłoczony z przodu podstawki (0,4 mm w głąb):

  | Frakcja | Herb |
  |---|---|
  | Przymierze | Drzewo |
  | Horda | rogaty hełm |
  | Strażnicy | kryształ |

  Dzięki niemu nawet 5-latek od razu wie, czyja to figurka.
- **Opcjonalnie:** nazwa jednostki wytłoczona na tylnej ściance, pismem min. 2,5 mm wysokości.
- Postać modeluje się **bez własnej podstawki**. Stopy i łapy łączy się z podstawką kołkiem Ø 3 mm albo się je skleja. Gotowe modele z serwisów zwykle mają okrągłą podstawkę 25 mm: można ją zostawić albo odciąć i postawić figurkę na naszej podstawce.

### Wymiary postaci

- **Rzut postaci** (to, co wystaje poza podstawkę z góry) najwyżej **30 mm**, żeby skrzydła i ogony nie wchodziły na sąsiednie pola. Smoki i Gryf mają skrzydła złożone albo uniesione w górę, a nie rozłożone na boki.
- **Wysokość** zależy od roli, żeby wielkość mówiła o sile:

  | Rola | Wysokość figurki (bez podstawki) |
  |---|---|
  | pomocnik / poplecznik | 22–30 mm |
  | bohater / wódz | 32–42 mm |
  | strażnik | 45–55 mm |

### Pod druk żywiczny i dla dzieci

- **Najcieńsze elementy** (rogi, kolce, ogony, palce, broń): min. **1,5 mm**, bo figurki będą w rękach dzieci. Szczegóły dekoracyjne: min. 0,5 mm wypukłości.
- **Końcówki** kolców i rogów zaokrąglone (promień ≥ 0,5 mm), bez ostrych igieł.
- Brak długich, wolno wiszących elementów: włócznie, ogony i skrzydła mają się opierać o ciało albo podstawkę.
- **Modele powyżej ok. 35 mm wydrążone**, ścianka 2 mm, 2 otwory odpływowe Ø 3 mm od spodu.
- **Druk:** warstwa 0,05 mm, model przechylony o 30–45°, podpory na niewidocznych stronach.
- **Po druku:** mycie w IPA, pełne utwardzanie UV i lakier matowy. Nieutwardzona żywica drażni skórę, więc figurki dla dzieci muszą być w pełni utwardzone i polakierowane.
- **Skala i styl:** stylizowany „heroiczny”, czytelne sylwetki i lekko powiększone głowy. Ten sam styl dla wszystkich 15 postaci, najlepiej z jednego źródła albo od jednego twórcy.

---

## 3. Postacie

Pozy i cechy wziąłem z ilustracji na kartach (`docs/grafika/karty`, `public/assets/cards/art`). Te ilustracje warto wgrać do generatora jako obraz wejściowy. Frazy po angielsku przydają się do szukania w serwisach z modelami i jako opis dla generatora.

### Przymierze Świtu

| Postać | Rola · typ | Wysokość | Wygląd i poza | Szukaj / opis po angielsku |
|---|---|---|---|---|
| **Złoty Smok** | bohater · latający | 40 mm | złote łuski, skrzydła uniesione nad grzbietem, łeb dumnie w górze; stoi na czterech łapach | *golden dragon, wings raised, heroic pose, 28mm scale miniature* |
| **Król Jednorożców** | bohater · wręcz | 38 mm | biały jednorożec w ozdobnym rzędzie z zielenią i złotem, długa grzywa, jedna przednia noga uniesiona | *unicorn king, ornate barding, rearing slightly, fantasy miniature* |
| **Prastary Niedźwiedź** | bohater · wręcz | 34 mm | potężny brunatny niedźwiedź z mchem i liśćmi na grzbiecie, talizman na szyi, ryczący | *ancient forest bear, moss on back, druidic amulet, roaring* |
| **Elf Druid** | pomocnik · strzelec | 30 mm | elf w zielonych szatach z kosturem zakończonym kryształem, druga ręka wyciągnięta (czar) | *elf druid with staff, casting, leaf robes, 28mm* |
| **Nimfa** | pomocnik · wręcz | 28 mm | nimfa wodna o morskich włosach, zwiewna suknia, dłonie nad kulą wody | *water nymph, flowing hair, holding water orb* |
| **Pegaz** | pomocnik · latający | 30 mm | biały pegaz, skrzydła uniesione, stoi na tylnych nogach albo w skoku z oparciem o chmurkę | *pegasus, wings up, leaping, supported on cloud base* |

### Mroczna Horda

| Postać | Rola · typ | Wysokość | Wygląd i poza | Szukaj / opis po angielsku |
|---|---|---|---|---|
| **Czarny Smok** | wódz · latający | 42 mm | czarno-czerwony smok z kolcami i świecącymi pęknięciami, paszcza otwarta (ogień), skrzydła w górę | *black red dragon, spikes, fire breath, wings raised* |
| **Władca Wilkołaków** | wódz · wręcz | 38 mm | wilkołak w zbroi z kolcami i czaszkami, przygarbiony, pazury przed sobą | *werewolf lord, spiked armor, skulls, hunched* |
| **Ogr Żelazna Pięść** | wódz · wręcz | 36 mm | ogr w ciężkiej zbroi, ogromna żelazna rękawica, szeroka sylwetka | *armored ogre, giant iron gauntlet, brute* |
| **Goblin Szaman** | poplecznik · strzelec | 24 mm | goblin w czerwonym kapturze z kosturem, czaszki przy pasie, magiczny płomień w dłoni | *goblin shaman, red hood, skull staff* |
| **Pająk Jaskiniowy** | poplecznik · wręcz | 22 mm (wysokość), 28 mm rozstaw nóg | wielki czarno-czerwony pająk, nogi zwarte, żeby zmieścić się na podstawce | *giant cave spider, red stripes, compact legs* |
| **Nietoperz Cienia** | poplecznik · latający | 28 mm | czerwono-czarny nietoperz, skrzydła rozłożone w górę, na kamieniu albo gałęzi wychodzącej z podstawki | *giant vampire bat, wings up, perched on rock* |

### Strażnicy kryształów

| Postać | Typ | Wysokość | Wygląd i poza | Szukaj / opis po angielsku |
|---|---|---|---|---|
| **Cyklop Błyskotek** | strzelec | 50 mm | jednooki olbrzym obwieszony złotem i klejnotami, trzyma kryształ, obok kamień do rzucania | *cyclops with treasure, holding crystal, boulder* |
| **Gryf Złodziej Skarbów** | latający | 50 mm | gryf (orli łeb, lwie ciało) na stosie złota, skrzydła uniesione | *griffin on treasure pile, wings raised* |
| **Hydra z Zatopionych Ruin** | wręcz | 48 mm | trzy zielono-niebieskie głowy na zwartej szyi, wynurzona z wody i ruin, przy niej kryształ | *three headed hydra, emerging from ruins, water base* |

---

## 4. Elementy dodatkowe (geometryczne — mogę je zaprojektować)

| Element | Ile | Wymiary | Uwagi |
|---|---|---|---|
| Podstawka sześciokątna z herbem | 15 | 24 mm między bokami, 3 mm | 6 Przymierza, 6 Hordy, 3 strażników |
| Kryształy | 3 | graniastosłup sześciokątny 10 mm, wys. 18 mm, z ostrym czubkiem | druk z przezroczystej żywicy, najlepiej niebieskiej |
| Znacznik rundy | 1 | jak kryształ, 8 mm, wys. 14 mm, lekko zwężany ku dołowi | wchodzi w gniazda toru rund |
| Tor rund | 1 | sześciokąt ok. 100 mm, 20 gniazd | z grafiki `grafika/ikony/tor_rund_20_pol.png` |

---

## 5. Skąd wziąć modele — trzy drogi

1. **Gotowe modele** z serwisów z modelami do druku: MyMiniFactory, Cults3D, Printables, Thingiverse, płatne paczki fantasy na Patreonie.
   - **Licencja:** do druku na własny użytek wystarcza zwykła. Jeśli gra kiedyś będzie sprzedawana, potrzebna jest licencja komercyjna.
   - Wybierajcie modele „presupported”, czyli z gotowymi podporami do żywicy.
2. **Generator 3D z obrazka** (np. Meshy, Tripo, Rodin). Wgrywasz ilustrację z karty i opis z tabeli, a dostajesz siatkę 3D.
   - Wynik niemal zawsze wymaga obróbki: naprawy siatki, pogrubienia elementów do 1,5 mm, zwarcia skrzydeł, wydrążenia i podpór.
   - To najszybsza droga do figurek w stylu Twoich kart. Najlepiej najpierw przetestować kilka narzędzi na jednej postaci.
3. **Rzeźbiarz 3D na zlecenie.** Ta specyfikacja i ilustracje z kart to gotowy brief. Najdroższa droga, ale daje najbardziej spójny styl.

---

## 6. Jak sprawdzić model przed drukiem

- [ ] Rzut z góry mieści się w 30 mm, a podstawka ma 24 mm.
- [ ] Wysokość zgodna z tabelą (± 3 mm).
- [ ] Najcieńsze elementy ≥ 1,5 mm.
- [ ] Siatka zamknięta (manifold), bez dziur i podwójnych ścianek.
- [ ] Modele ≥ 35 mm wydrążone, z otworami odpływowymi.
- [ ] Wszystkie figurki w jednej skali: wydrukuj próbnie dwie (np. Złoty Smok i Elf Druid) i postaw je obok siebie.
- [ ] Licencja pozwala na planowane użycie.

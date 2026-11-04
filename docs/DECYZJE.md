# Decyzje

Kolejka decyzji autora. Zasada: rzeczy odwracalne Claude robi na rekomendowanej opcji i zapisuje to w „Przyjęte domyślnie”;
pyta tylko o rzeczy nieodwracalne albo artystyczne (styl, nazwy, kierunek zasad). Po decyzji wpis przechodzi do „Podjęte”.

## Podjęte (3.11.2026)

- Wydanie cyfrowe jest rozszerzane niezależnie od planszówki; zasady planszówki zamrożone jako tryb „Klasyczny” (`ROZBUDOWA_CYFROWA.md`).
- Cztery kierunki: mapy i cele, pełna ekonomia jak w Heroesach, nowe frakcje, kampania + wyprawa roguelike.
- Armia to drużyna pojedynczych jednostek (bez stosów); lista jednostek każdej frakcji zostaje rozszerzona (ok. 3 bohaterów + 7 jednostek).
- Zasoby: złoto, drewno, ruda/kamień + jeden rzadki, magiczny (nazwa niżej).
- Frakcje na premierę: Przymierze Świtu, Mroczna Horda + Żelazne Klany, Dzikie Stada, Królestwo Umarłych.
  Pozostałe (Wolne Kompanie, Dwór Wiecznego Szronu, Imperium Piasków, Rój Głębin, Władcy Przypływów) jako DLC / aktualizacje.
- Workflow: ta kolejka decyzji, karta frakcji jako specyfikacja (`KARTA_FRAKCJI_SZABLON.md`), automatyczny balans symulacjami,
  przewodnik stylu i manifest zasobów (`assets.json`), arkusz kontaktowy do wyboru grafik, równoległe gałęzie z bramką jakości.

- Rzadki zasób nazywa się **Gwiezdny Pył**.
- Animacja jednostek: próbujemy animacji proceduralnej (warstwy, deformacja siatki, efekty, ruch w kodzie); ulepszenie
  bohaterów prawdziwą animacją dopiero po teście. Figurki 3D są zastępowane jednostkami 2D (potwierdzone po teście ze Smokiem, patrz niżej).
- Styl: mroczniejszy tylko dla jednostek Hordy i neutralnych (strażnicy); pozostałe grafiki (karty, kafle, interfejs, Przymierze) zostają.
- Usługa AI do grafik: wybór pozostawiony Claude'owi, z wymogiem taniej subskrypcji (nie płatności za zużycie).
  Wybrane: **Scenario** (plan płatny, miesięczny kredyt, oficjalny serwer MCP). Do sprawdzenia przed dłuższym użyciem:
  czy MCP/API działa na najtańszym planie, licencja komercyjna, spójność postaci. Plan awaryjny: Leonardo.ai (tańszy), fal.ai (płatność za użycie).

- **Pozycjonowanie rodzinne:** „przygoda w stylu Heroesów, która rośnie razem z dziećmi”; priorytet: hotseat, tryb rodzinny,
  wspólna gra rodzic + dziecko (`KONKURENCJA_I_FILARY.md`).
- **Drabinka złożoności** (Przygoda → Wyprawa → Królestwo → Imperium → Legenda), każdy poziom jako preset przełączników;
  najprostszy poziom jest flagowy, wyższe jako aktualizacje (`ROZBUDOWA_CYFROWA.md`).

## Podjęte (4.11.2026)

- **Autopilot dla warstw:** zatwierdzony (rodzic na wyższym poziomie, dziecko na tej samej mapie z automatycznie zarządzanymi warstwami).
- **Zakres premiery:** poziomy 1–2 drabinki (Przygoda, Wyprawa) + hotseat i tryb rodzinny; poziomy 3–5 jako aktualizacje.
- **Styl mroczniejszych jednostek:** poważniejszy, nie kreskówkowy.
- **Workflow usług AI, po jednej naraz:** najpierw Scenario (grafiki, test ze Smokiem). ElevenLabs (efekty dźwiękowe, muzyka, głosy)
  sprawdzamy dopiero przy dźwięku, najpierw na próbce. Higgsfield (wideo) odłożony do trailera.
  Scenario to źródło statycznych grafik; ruch jednostek zostaje animacją proceduralną w kodzie.
- **Scenario, plany (ustalenia z 4.11):** trening własnego modelu tylko na Pro/Max/Enterprise (25 obrazów treningowych na model
  na Pro, 1 trening naraz). API i MCP działają od Startera (15 $/mies., 1500 CU wspólnych dla aplikacji, API i MCP; na Starterze
  po wyczerpaniu CU generowanie staje do odnowienia). Wszystkie płatne plany mają pełną licencję komercyjną bez tantiem; Free
  tylko do testów. Support (wstępna odpowiedź, prawdopodobnie automatyczna; nie potwierdzona jeszcze przez człowieka): po spadku
  z Pro na Starter wytrenowane modele zostają w bibliotece i można ich używać (też przez API/MCP); nowych modeli nie wytrenujemy
  bez powrotu na Pro. Plan: Starter teraz; Pro na miesiąc dopiero do treningu stylu, po przygotowaniu 20–25 obrazów treningowych.
  Anulowanie do Free kasuje zasoby i modele po 30 dniach, a klucze API przestają działać: nie schodzimy do Free.
  Animacje: Scenario ma metodę sprite sheetów z wideo (Seedance/Pixverse + ręczny wybór klatek), traktowaną jako plan B dla bohaterów.
- **Animacja szkieletowa** (2D skeletal, np. Spine/DragonBones) zamiast proceduralnej: rozważona, odłożona. Lepsza jakość ruchu, ale
  każda postać wymaga pocięcia na części i rigu (ok. 40 postaci na premierę). Wracamy do niej tylko dla bohaterów, jeśli po teście
  ruch proceduralny wyda się zbyt sztywny.

- **Test Scenario ze Złotym Smokiem (4.11): pozytywny.** MCP podłączone (OAuth, plan Starter). Model GPT Image 2.5 Flare
  (ok. 2 CU za obraz 1024 px, jakość „high”, tło „transparent”) daje czysty PNG z prawdziwą przezroczystością, bez wycinania tła.
  Na arenie sylwetka jest czytelna już w rozmiarze jednego pola, a złoto dobrze odcina się od ciemnej areny. Droższy model
  (Sunburst, ok. 12 CU) niepotrzebny na razie. Otwarte: spójność całej frakcji (trening stylu na Pro) i animacja.
- **Animacja przez deformację jednego obrazu: odrzucona (4.11).** Siatka 32×32 z ruchem skrzydeł, ogona i głowy na pojedynczym
  PNG daje rozciąganie rogów, łap i ogona (ogon schowany pod skrzydłem się wydłuża i kurczy), bo obraz nie ma osobnych części.
  Poprawki masek nie pomogły. Nie wracamy do tej metody. Do sprawdzenia: postać w osobnych warstwach (skrzydła, tułów, głowa,
  ogon) animowana jak lalka, z warstwami z generatora AI (edycja obrazu) lub z ręcznej separacji.
- **Duże jednostki zajmują 2 heksy** (jak w Heroesach); jednostka może być większa niż pole. Mechanika zajmowania dwóch pól
  do zaprojektowania osobno (zasady planszówki zamrożone w trybie „Klasycznym”).
- **Widok z boku** (jak postacie w Heroes III) jest w porządku; nie dążymy do widoku z góry.
- **Figurki 3D znikają z wersji komputerowej:** zastępują je grafiki 2D z AI (figurki zostają tylko w wersji planszowej).
  Stare figurki i nowe grafiki nie mogą współistnieć w jednej frakcji, więc wymiana idzie frakcjami, nie pojedynczymi jednostkami.

## Czekają na decyzję

0. **Przegląd konkurencji na Steamie ręcznie** (tagi Family Friendly, Local Co-Op, Turn-Based Strategy) i test z 5–10 parami
   rodzic + dziecko: odłożone, na razie się tym nie przejmujemy.


1. **Animacja jednostek 2D z osobnych warstw:** test na Złotym Smoku (patrz „Podjęte 4.11”); wybór metody czeka na decyzję.
2. **Odniesienia wizualne do mrocznego stylu** dla Hordy i neutralnych: Claude dobiera propozycje, autor ocenia.
   Kierunek: bardziej poważny, mroczny.

## Przyjęte domyślnie (do przejrzenia)

- Zasoby na mapie: kopalnie dają dochód co rundę; cykl tygodniowy = 7 rund (etap 2 w `ROZBUDOWA_CYFROWA.md`).
- Kolejność prac: etap 0 (pole `ruleset`) → pierwszy cel (punkty kontrolne) → generator map (prostokąt).

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
  bohaterów prawdziwą animacją dopiero po teście. Figurki 3D są do zastąpienia jednostkami 2D (do potwierdzenia po teście na jednej jednostce).
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
- **Animacja szkieletowa** (2D skeletal, np. Spine/DragonBones) zamiast proceduralnej: rozważona, odłożona. Lepsza jakość ruchu, ale
  każda postać wymaga pocięcia na części i rigu (ok. 40 postaci na premierę). Wracamy do niej tylko dla bohaterów, jeśli po teście
  ruch proceduralny wyda się zbyt sztywny.

## Czekają na decyzję

0. **Przegląd konkurencji na Steamie ręcznie** (tagi Family Friendly, Local Co-Op, Turn-Based Strategy) i test z 5–10 parami
   rodzic + dziecko: odłożone, na razie się tym nie przejmujemy.


1. **Test na jednej jednostce** (Złoty Smok albo jednostka Hordy): po założeniu konta Scenario i autoryzacji MCP ocenić
   (a) jakość i spójność obrazu, (b) czy postać da się dostać w warstwach lub na czystym tle do animacji proceduralnej,
   (c) czy Scenario ma coś użytecznego do animacji (sprite sheety). Plan jest zatwierdzony; czeka na konto autora.
2. **Odniesienia wizualne do mrocznego stylu** dla Hordy i neutralnych: Claude dobiera propozycje, autor ocenia.
   Kierunek: bardziej poważny, mroczny.

## Przyjęte domyślnie (do przejrzenia)

- Zasoby na mapie: kopalnie dają dochód co rundę; cykl tygodniowy = 7 rund (etap 2 w `ROZBUDOWA_CYFROWA.md`).
- Kolejność prac: etap 0 (pole `ruleset`) → pierwszy cel (punkty kontrolne) → generator map (prostokąt).

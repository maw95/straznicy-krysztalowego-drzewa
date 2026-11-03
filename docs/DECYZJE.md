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

## Czekają na decyzję

1. **Nazwa rzadkiego zasobu.** Autor: nie „Klejnoty” (za bliskie Kryształom), raczej magiczny pył. Propozycje:
   *Gwiezdny Pył* (rekomendacja, neutralny wobec fabuły), *Pył Drzewa* (łączy z fabułą), *Esencja*, *Poświata*.
2. **Animacja jednostek.** Do omówienia: 3D vs 2D; animacja proceduralna (warstwy, deformacja siatki, efekty) vs klatki
   z AI vs szkielet (rig). Plan: krótki test na jednej jednostce (Złoty Smok).
3. **Usługa AI do grafik** (portrety, jednostki, kafle, interfejs), z którą Claude może pracować bez ręcznego
   przepisywania promptów: kandydaci to Scenario (oficjalny serwer MCP), fal.ai (API, wiele modeli), PixelLab (tylko pixel art).
   Do sprawdzenia: licencja komercyjna, własność wyników, koszt, spójność postaci.
4. **Styl graficzny: mroczniejszy niż dziś.** Pytania: odniesienia wizualne, czy nowa stylistyka obejmie też istniejące
   karty, kafle i interfejs (spójność), czy tylko nowe frakcje.

## Przyjęte domyślnie (do przejrzenia)

- Zasoby na mapie: kopalnie dają dochód co rundę; cykl tygodniowy = 7 rund (etap 2 w `ROZBUDOWA_CYFROWA.md`).
- Kolejność prac: etap 0 (pole `ruleset`) → pierwszy cel (punkty kontrolne) → generator map (prostokąt).

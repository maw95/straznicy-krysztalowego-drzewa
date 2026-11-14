# Poziom 0 (dzisiejszy „Łatwy”): plan i koszt (14.11.2026)

Decyzja autora (BACKLOG, C2): poziom trudności nie zmienia mechanik, tylko warunki startowe komputera. Dzisiejszy „Łatwy” z poziomu 1 (pojedynki planszowe, bez zdolności i kości, z zastępowaniem bohatera, bez rytuału) staje się osobnym **poziomem 0**, obok Przygody (1), Wyprawy (2) i Królestwa (3). Poziomy 1–3 dostają trzy trudności (Łatwy, Normalny, Trudny), wszystkie na arenie.

## Co trzeba zmienić

1. **Silnik.** `LEVEL_RULES` w `types.ts` ma dziś trzy zestawy reguł (kids/normal/hard). Poziom 0 przejmuje zestaw „kids” (plansza, bez zdolności i kości); poziomy 1–3 dostają własną skalę trudności jako *warunki startowe* (dźwignie stroiciela: skarby startowe, siła i liczba bohaterów Hordy, złoto), nie jako reguły. Dotknięte pliki: `types.ts`, `scoring.ts` (`levelOf`, nowa kolumna punktów poziomu 0), `tuning.ts` / `tuningAuto.ts` (nowe wiersze dla Łatwego na arenie), `difficulty.ts`.
2. **Kreator i lobby.** Strona „tier” dostaje czwartą kartę „Poziom 0” (tryb rodzinny); trudność (z królikiem/wilkiem/smokiem) jest wybierana dla poziomów 1–3. `OnlineScreen`/serwer: `tier` ma nową wartość (zgodność zapisów i protokołu).
3. **Dane trwałe.** Zapisy trwających partii i ranking (`scoring.ts`, `StatsDialog`) zmieniają kształt: potrzebna migracja (stary `level: kids` na poziomie 1 → poziom 0) albo wdrożenie, gdy nikt nie gra.
4. **Strojenie.** Łatwy dla poziomów 1, 2 i 3 na arenie ma wejść w pasmo 65–85%: ponowne uruchomienie `tuneLevels.ts` i `tuneKingdom.ts` (dziś Przymierze na arenie wygrywa na Łatwym tylko 35–67%, więc trzeba je wzmocnić warunkami startowymi). Zmienia `golden.test.ts` (osobny commit z `-u`).
5. **Dokumenty.** Instrukcja, samouczki, `ZASADY_CYFROWE.md`.

## Koszt i ryzyko

- Silnik + kreator + testy: ok. 1 dzień pracy; strojenie: kilka godzin symulacji w tle (każdy stroiciel to minuty do dziesiątek minut).
- Ryzyko: zmiana kształtu zapisów i rankingu oraz zgodność z serwerem (wdrożenie serwera razem z grą). Dlatego nie robię tego bez nadzoru razem z wydaniem.
- Rekomendacja: osobne wydanie (2.7.0) po akceptacji autora; kolejność: silnik i testy → kreator → migracja zapisów → strojenie → dokumenty.

## Pytania do autora

- Czy stare zapisy partii z „Łatwym” mają się wczytywać jako poziom 0 (migracja), czy można je porzucić?
- Czy poziom 0 ma mieć własny ranking w tabeli „Twoje partie”, czy tylko kolumnę punktów (tak zapisano w C2)?

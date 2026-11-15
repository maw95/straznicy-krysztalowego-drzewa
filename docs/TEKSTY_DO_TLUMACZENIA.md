# Teksty do tłumaczenia: inwentaryzacja

Stan: 15.11.2026 (backlog, punkt 16). To tylko **spis**: tłumaczenia i mechanizm języków powstaną po premierze (backlog, punkt 21). Liczby poniżej generuje `python3 scripts/teksty.py` (szuka w `src/` napisów i tekstów JSX, które wyglądają na polskie; komentarze pomija). Liczba znaków jest przybliżona: napisy z wstawkami `${…}` liczą się razem z wstawką, a tekst JSX rozbity na kilka linii liczy się częściowo.

## Skąd biorą się teksty

1. **Kod gry (`src/`)**: tabele niżej. Wszystkie napisy są wpisane wprost w kod (nie ma jeszcze słownika).
   - **Dane i opisy silnika** (`src/engine/data.ts`, `kingdom.ts`, `economy.ts`, `magic.ts`, `realm.ts`, `empire.ts`, `heroTypes.ts`, `growth.ts`, `sites.ts`, `objectives.ts`, `customMaps.ts`, `story.ts`): nazwy jednostek, zdolności, skarbów, artefaktów, budynków, czarów, umiejętności, celów, map, osad (losowane nazwy), imiona dowódców. To one trafiają na karty.
   - **Dziennik gry** (`log(...)` w silniku): zdania składane z nazw i liczb, z polską odmianą wpisaną ręcznie („poległ(a)”, „kryształ(y)”). Dziennik jest częścią stanu gry (zapisy, powtórki, serwer online), więc przy wielu językach trzeba zdecydować: tłumaczyć przy wyświetlaniu (dziennik jako klucz + parametry) albo zostawić język partii.
   - **Komunikaty odmowy** (`throw new Error('…')` w silniku): pokazywane graczowi; serwer online przekazuje je klientowi.
   - **Interfejs** (`src/ui/`): ekrany, przyciski, podpowiedzi (`title`), samouczek (`Tutorial.tsx`), wstęp (`Intro.tsx`), okno zasad (`RulesDialog.tsx`), kreator gry, okno osady.
   - **Teksty z liczbami w skali** (`scaleText` w `data.ts`): wyrażenie regularne rozpoznaje polskie „N Ż”, „N A”, „N obrażeń”, „N punktów obrażeń”; inny język potrzebuje własnego wzorca albo liczb jako parametrów.
2. **Instrukcja gracza** `docs/INSTRUKCJA.md` (ok. 64 tys. znaków, 20 rozdziałów) i jej wersje: PDF, DOCX (`scripts/assets/manual*.py`, `manual_docx.cjs`).
3. **Historia zmian** `CHANGELOG.md` (ok. 76 tys. znaków; gra czyta ten plik i pokazuje go w oknie „Co nowego”). Do tłumaczenia sensownie tylko od wersji premierowej.
4. **Serwer online** (repo `straznicy-krysztalowego-drzewa-backend`): komunikaty błędów i odmów po polsku w 12 plikach (`src/errors.ts`, `rooms/`, `auth/`), ok. 45 napisów. Klient pokazuje je bez zmian.
5. **Grafiki z napisami:** logo i okładka (`ui/logo.png`, `ui/cover.jpg`), slajdy wstępu (`public/assets/intro/`: do sprawdzenia, czy napisy są na obrazie, czy nakładane przez `Intro.tsx`), strony instrukcji (`public/assets/manual/`), tor rund i znaczniki, jeśli mają słowa. Ramki kart nie mają napisów (tekst kładzie `UnitCard.tsx`).
6. **Dźwięk:** brak nagrań głosowych; muzyka i efekty bez słów.
7. **Nazwy własne do decyzji (tłumaczyć czy zostawić):** Gleamroot, Strażnicy Kryształowego Drzewa, Przymierze Świtu, Mroczna Horda, imiona bohaterów i dowódców, nazwy osad, Gwiezdny Pył, Pierwotna Iskra, nazwy poziomów (Spacer … Imperium).

## Trudności językowe do rozwiązania przed tłumaczeniem
- **Odmiana i liczba mnoga** składana w kodzie (`punkt${n === 1 ? '' : 'y'}`, „poległ(a)”, „jednostki/jednostek”): potrzebne reguły liczby mnogiej na język (np. `Intl.PluralRules`).
- **Sklejanie zdań z kawałków** (`${FACTION_NAMES[f]} rekrutuje: …`, „należy do Przymierze Świtu”): już dziś daje błędy odmiany po polsku; w słowniku całe zdania z parametrami.
- **Skróty statystyk** Ż / A / S na kartach i w opisach zdolności.
- **Długość tekstów:** przyciski i karty są ciasne (karty jednostek, okno osady, pasek aktywacji); angielski zwykle się mieści, niemiecki nie zawsze.
- **Teksty w stanie gry:** dziennik, `endReason`, nazwy osad i imiona dowódców losowane przy tworzeniu gry.

## Proponowana kolejność (po premierze)
1. Słownik interfejsu (`src/ui/`) z kluczami: największy i najprostszy kawałek.
2. Dane silnika (nazwy i opisy) jako tabele na język.
3. Komunikaty odmowy i dziennik jako klucz + parametry.
4. Instrukcja, serwer, grafiki z napisami.

## Podsumowanie (wygenerowane: `python3 scripts/teksty.py`)

Razem: **1290 tekstów**, około **71199 znaków** w 58 plikach `src/`.

| Rodzaj | Tekstów | Znaków | Przykłady |
|---|---:|---:|---|
| interfejs | 609 | 38966 | `src/ui/ActivationBar.tsx:13` „Wskaż złote pole w swojej kolumnie”; `src/ui/ActivationBar.tsx:13` „Kliknij jednostkę, potem pole” |
| dane i opisy silnika | 421 | 18955 | `src/engine/battle.ts:1191` „Pole Naładowane”; `src/engine/customMaps.ts:57` „Dwie cieśniny oddzielają brzegi od wyspy z Drzewem; przez każdą prowadzą trzy mosty.” |
| dziennik gry (log) | 107 | 7624 | `src/engine/battle.ts:434` „Bitwa się rozpoczyna.”; `src/engine/battle.ts:556` „Bitwa trwa zbyt długo — strona z mniejszą sumą Ż przegrywa.” |
| komunikaty odmowy (Error) | 141 | 5185 | `src/engine/battle.ts:479` „Teraz nie ustawia ta frakcja.”; `src/engine/battle.ts:489` „Jednostki można ustawić tylko w swoich kolumnach startowych.” |
| klient online | 12 | 469 | `src/online/api.ts:145` „Brak połączenia z serwerem gry. Spróbuj za chwilę.”; `src/online/api.ts:148` „Serwer gry odpowiedział błędem.” |

## Pliki (od największego)

| Plik | Tekstów | Znaków |
|---|---:|---:|
| `src/ui/RulesDialog.tsx` | 62 | 7639 |
| `src/engine/data.ts` | 145 | 6650 |
| `src/ui/Tutorial.tsx` | 34 | 5214 |
| `src/engine/kingdom.ts` | 117 | 4914 |
| `src/ui/Intro.tsx` | 35 | 4228 |
| `src/engine/battle.ts` | 83 | 4051 |
| `src/ui/setupShared.tsx` | 37 | 3686 |
| `src/engine/objectives.ts` | 46 | 3008 |
| `src/engine/game.ts` | 67 | 2910 |
| `src/engine/sites.ts` | 52 | 2751 |
| `src/engine/growth.ts` | 43 | 2271 |
| `src/ui/AdventureView.tsx` | 52 | 1979 |
| `src/ui/NewGameWizard.tsx` | 28 | 1634 |
| `src/ui/growthUi.tsx` | 27 | 1552 |
| `src/ui/OnlineScreen.tsx` | 40 | 1546 |
| `src/ui/SettlementDialog.tsx` | 30 | 1484 |
| `src/engine/empire.ts` | 22 | 1333 |
| `src/ui/App.tsx` | 40 | 1228 |
| `src/engine/presets.ts` | 17 | 1197 |
| `src/ui/CustomSwitchRows.tsx` | 17 | 1109 |
| `src/engine/magic.ts` | 19 | 1000 |
| `src/ui/SetupScreen.tsx` | 23 | 997 |
| `src/engine/heroTypes.ts` | 24 | 716 |
| `src/ui/TesterDialog.tsx` | 17 | 713 |
| `src/ui/gameDialogs.tsx` | 18 | 640 |
| `src/ui/hint.ts` | 13 | 612 |
| `src/ui/ArenaBoard.tsx` | 10 | 583 |
| `src/ui/battleStatus.tsx` | 12 | 563 |
| `src/ui/CreditsDialog.tsx` | 11 | 524 |
| `src/engine/customMaps.ts` | 9 | 496 |
| `src/online/api.ts` | 12 | 469 |
| `src/ui/BugReportDialog.tsx` | 8 | 370 |
| `src/ui/BattleView.tsx` | 7 | 358 |
| `src/ui/ActivationBar.tsx` | 15 | 350 |
| `src/ui/ItemsPanel.tsx` | 13 | 331 |
| `src/ui/ArenaPrep.tsx` | 3 | 234 |
| `src/ui/BattleSummary.tsx` | 8 | 227 |
| `src/engine/realm.ts` | 9 | 200 |
| `src/ui/TitleScreen.tsx` | 4 | 189 |
| `src/ui/saves.ts` | 5 | 184 |
| `src/engine/economy.ts` | 10 | 171 |
| `src/ui/DuelView.tsx` | 4 | 168 |
| `src/ui/StatsDialog.tsx` | 4 | 107 |
| `src/ui/fightBadges.tsx` | 5 | 97 |
| `src/engine/map.ts` | 2 | 66 |
| `src/ui/common.tsx` | 1 | 64 |
| `src/ui/RoundTrack.tsx` | 2 | 61 |
| `src/ui/resources.tsx` | 1 | 57 |
| `src/ui/markers.tsx` | 5 | 56 |
| `src/ui/UnitCard.tsx` | 7 | 52 |
| `src/ui/fullscreen.tsx` | 2 | 30 |
| `src/engine/difficulty.ts` | 4 | 30 |
| `src/ui/sprites.ts` | 1 | 28 |
| `src/ui/ChangelogDialog.tsx` | 2 | 20 |
| `src/ui/journal.ts` | 3 | 19 |
| `src/ui/BattleSidePanel.tsx` | 1 | 15 |
| `src/ui/CardBack.tsx` | 1 | 9 |
| `src/ui/details.tsx` | 1 | 9 |

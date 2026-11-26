# Przepis: jednostka w nowej grafice (obrazy + animacje ze Scenario)

Sprawdzony na Złotym Smoku i Prastarym Niedźwiedziu. Potok i lekcje: `POTOK_ANIMACJI.md`, zasady: `ZASADY_CYFROWE.md`.
Konto: zespół `team_zDf2maTQWeujYog6ZCYKPQia`, projekt `proj_uSX9K6bwwMNRjZA1FdLS5Wit` (podawaj w każdym wywołaniu MCP Scenario).
Modele: obrazy `model_openai-gpt-image-2-5-flare`, wideo `model_pruna-p-video-2`.
Koszt jednostki: ok. 75–90 CU (obraz bazowy ~14, trup ~4, cztery klipy 15 + 15 + 15 + 10). **Limit na jednostkę: 100 CU.** Jeden ponowny
podejście na zasób (zablokowane przez filtr treści też kosztuje!), potem raport „nie wyszło” i następna jednostka.

## Pliki robocze (poza gitem)

Wszystko w `.tmp/zrodla/<idJednostki>/` (np. `.tmp/zrodla/unicornKing/`): `stoi.png`, `martwy.png` oraz klipy `.mp4` o nazwach:
- jednostka chodząca: `chod`, `atak`, `smierc`, `trafienie`;
- jednostka latająca (zawisa w powietrzu, bez wzbicia): `lot`, `atak`, `smierc`, `trafienie`. Obraz `stoi` to wtedy poza zawisu w powietrzu
  (skrzydła rozpostarte, w locie), `martwy` leży na ziemi, pętla `lot` to trzepot w miejscu.

## Krok po kroku

1. **Odniesienie:** portret karty `public/assets/cards/portraits/<id>.jpg` (obejrzyj go narzędziem Read, żeby opisać postać).
   Wgraj: `upload_asset` (file_name, content_type `image/jpeg`, kind `image`, file_size) → `curl -fS -X PUT -T <plik> '<upload_url>'`
   (URL w całości, bez dodatkowych nagłówków) → `upload_asset_complete` (upload_id). Dostajesz `asset_...`.
2. **Obraz bazowy `stoi`** (`model_run`, Flare, `width 1024`, `height 1024`, `quality high`, `background opaque`,
   `referenceImages: ["asset_..."]`). Prompt (po angielsku), szablon:
   > Use the reference image only for the character design (<krótki opis z portretu>). Draw this same character as a full-body game
   > sprite in a strict side view, <poza: standing on all fours / standing upright / hovering in the air with wings spread>, facing right,
   > in a serious painterly realistic style with muted <paleta z portretu> tones, no blue anywhere on the character. The whole figure is
   > fully inside the frame with a generous empty margin: it occupies at most 50% of the frame width and height, centred horizontally,
   > its feet (or lowest point) on a horizontal line about 84% of the way down. Plain solid pure blue background (#0000FF) everywhere,
   > no ground, no shadow, no text.

   Obejrzyj wynik (`asset_display`): jednostka z boku, zwrócona w prawo, cała w kadrze, bez niebieskiego w paletę, poprawna liczba
   kończyn. Jeśli nie: jedna poprawka promptu.
3. **Obraz `martwy`** (Flare, 1024², `quality medium`, `referenceImages: [stoi]`): ta sama postać leży nieruchomo na ziemi
   (łagodnie: „lying still ... as if fast asleep, defeated and motionless”), ta sama grafika, wielkość i położenie poziome, dolna linia ciała
   na tej samej linii co stopy. Niebieskie tło #0000FF.
4. **Klipy** (`model_run`, P-Video 2: `image` = stoi, `duration` 3 (trafienie 2), `resolution 720p`, `fps 24`, `saveAudio false`,
   `promptUpsampling false`; dla śmierci dodatkowo `lastFrameImage` = martwy). Prompt zawsze zaczyna się od
   „Side view, locked static camera.” i kończy „Plain solid blue background stays unchanged, no camera movement.”
   - chód: idzie w miejscu miarowym krokiem „as if on a treadmill”, zawsze zwrócony w prawo;
   - lot (zawis): trzepocze skrzydłami w miejscu, unosząc się w powietrzu, zawsze zwrócony w prawo;
   - atak: opis ruchu (łapa/ogon/laska/zionięcie/rzut) w prawo i powrót do pozy;
   - śmierć: „sinks down / settles down ... lies still. Defeat animation.” (łagodnie);
   - trafienie: „is startled: it flinches and rocks backwards a little ... then steadies itself” (2 s).
   **Filtr treści** blokuje (i nalicza koszt): slash/slashing, strike/struck, kill, blood, crash, collapse, final, „strength gives out”.
   Działa: sweeping motion, swings, settles down, sinks down heavily, defeat animation, rears up with a roar, exhales a stream of fire.
5. **Pobranie:** `asset_download` daje podpisany URL; pobierz go `curl -sL -o <plik> "<url>"` (URL cały, dokładnie skopiowany) do
   `.tmp/zrodla/<id>/`. Sprawdź `file <plik>` (PNG lub „ISO Media”, nie XML z błędem).
6. **Pakowanie arkuszy** (z korzenia repozytorium):
   `WEBP_Q=80 python3 scripts/animacje/pack_unit.py $(cat .tmp/ffpath) .tmp/zrodla/<id> public/assets/jednostki/<folder> 512 8`
   (`<folder>` to nazwa po polsku z podkreślnikami, np. `krol_jednorozcow`). Powstają `stoi.webp`, `martwy.webp`, arkusze klipów i
   `anim.json`. Całość powinna ważyć ok. 5–9 MB (od 5.11 klatki mają 512 px, jakość 80; wcześniej 320 px: obraz był miękki). Źródłowe filmy mają 960 px. Uwaga: w katalogu źródłowym nie zostawiaj dodatkowych `.png`/`.mp4` (arkusze kontaktowe), bo skrypt je też spakuje.
7. **Kontrola:** zrób arkusz kontaktowy kilku klatek każdego klipu (PIL, tło ciemne) i obejrzyj: postać cała w kadrze, brak niebieskiej
   obwódki, pętla chodu/lotu się domyka, śmierć kończy się jak `martwy`. Drobne wady zapisz w raporcie, nie ponawiaj bez potrzeby.
8. **Manifest:** zapisz `.tmp/zrodla/<id>/manifest.json` (format: nagłówek `scripts/animacje/manifest.py`, wzór:
   `.tmp/zrodla/ancientBear/manifest.json`) z identyfikatorami zasobów i **pełnymi promptami**. Nie uruchamiaj `manifest.py`
   i **nie edytuj ani nie commituj niczego w `src/`, `assets.json`, `docs/`** (robi to koordynator, żeby nie było konfliktów).
9. **Raport** w `.tmp/zrodla/<id>/RAPORT.txt`: foldery, zużyte CU (policz z cen), ID zasobów, uwagi jakościowe (do poprawy / ryzyka).

## Lekcje z kolejnych jednostek (5.11.2026)

- Zablokowane przez filtr treści zadania kosztują tyle co udane (ogr: 45 CU na trzy próby). **Nie używaj** w promptach: fist, gauntlet,
  claw, slash, strike, kill, blood, crash, collapse, final. Zamiast „fist”: „swings its arm forward”; zamiast „death/lies dead”: „settles
  down and rests”, „sinks down”, „defeat animation”. Przy śmierci filtr bywa wrażliwy także na `lastFrameImage` z trupem: jeśli
  zablokuje, spróbuj prostszego opisu („sits down and rests”) i tej samej klatki końcowej, a w ostateczności bez klatki końcowej.
- Klip `trafienie` ma kończyć się w tej samej pozie i zwrócony w prawo jak `stoi`. Jeśli postać po klipie stoi przodem do kamery albo
  w innej pozie, **pomiń ten klip** (nie pakuj go): kod użyje wtedy drgnięcia i błysku.
- `martwy` ma leżeć na boku/brzuchu z głową w prawo; trup na plecach z nogami w lewo wygląda źle, więc jedna poprawka promptu.

## Jednostka latająca, która w spoczynku stoi (10.11.2026: Nietoperz, Pegaz, Czarny Smok)

- `stoi` to poza na ziemi (siedzi / stoi, skrzydła złożone), generowana z dawnym obrazem zawisu jako odniesieniem („the same ... but now it is NOT flying”).
- Dochodzi klip `wzbicie` (2 s, `image` = nowe `stoi`, `lastFrameImage` = dawna poza zawisu); lądowanie to ten sam klip od tyłu. Pętla `lot` zostaje dawna.
  Kod (`SpriteLayer`) sam gra wzbicie → lot → lądowanie, gdy `anim.json` ma oba klipy.
- `atak`, `smierc` (z `lastFrameImage` = dawny `martwy`) i `trafienie` trzeba zrobić od nowa z nowego `stoi`, bo stare zaczynały się w powietrzu.
- Atak ma być **uderzeniem w miejscu** (staje dęba i bije kopytami, kąsa, dźga rogiem), nie biegiem do przodu: „does not run or walk forward”, „hind hooves stay at the same spot”.
- Filtr treści zablokował (i policzył 15 CU) „rakes both front talons ... swipe ... screech”; przeszło „reaches both front legs sharply forward ... sweeping motion ... loud call”.
- Pocisk rysowany przez arenę (głaz Cyklopa: `.projectile.boulder` w `styles.css`) startuje z opóźnieniem dobranym do chwili wyrzutu w klipie (prędkość klipu w `sprites.ts`).

## Rozmiary i rola na planszy (ustala koordynator w `sprites.ts` i `data.ts`)

Duże (2 pola): smoki, niedźwiedź, ogr, cyklop, hydra, gryf, jednorożec. Małe (1 pole): reszta. Rozmiar ciała na planszy: ok. 140 px dla
dużych, ok. 70 px dla małych (`bodyW`).

## Lekcje z poprawek (5.11.2026, wieczór)

- **Ogień i fale ucięte prawą krawędzią:** nie pomaga prompt „krótki płomień” ani zmniejszenie obrazu startowego (płomień i tak sięga krawędzi, bo postać zajmuje 2/3 kadru).
  Pomaga wygaszanie prawej krawędzi przy pakowaniu: `FADE_RIGHT="atak=0.12" WEBP_Q=80 python3 scripts/animacje/pack_unit.py ...`.
- **Trup niezgodny z końcem klipu śmierci:** najtaniej użyć ostatniej klatki klipu jako `martwy.png` (`ffmpeg -sseof -0.045 -i smierc.mp4 -frames:v 1 martwy.png`), 0 CU.
- **Kolor włosów i szczegóły:** portret karty jako odniesienie nie wystarcza; opisz barwy słowami (nimfa: miętowo-seledynowe włosy, bez błękitu); wtedy `stoi` pasuje do portretu.
- **Pobieranie w tle:** `cd` w złożonej komendzie z `&` rozwala ścieżki; pobieraj kolejno albo z pełnymi ścieżkami.
- **Skrypty pomocnicze** (nie w repo): w `.tmp/neu/` leżą `shrink.py`, `post.py`, `sheet.py`, `check.py` (zmniejszenie obrazu startowego, przeskalowanie klatek, arkusz kontaktowy).

## Lekcje z poprawek Dzikiego Stada (24.11.2026)

- **Tryb `draft: true` P-Video 2** daje ten sam rozmiar (960×960) i wygląda jak finał po zmniejszeniu do 512 px, a kosztuje 9 CU zamiast 15 (klip 2 s: 6 zamiast 10). Używać go dla wszystkich klipów, finał tylko gdy draft ma widoczne wady.
- **Śmierć „na bok”:** prompt `The X becomes tired, its legs fold under it and it lowers itself sideways to the ground, rolling gently onto its side, then rests completely still, as if fast asleep.` BEZ `lastFrameImage`; `martwy.png` to ostatnia klatka klipu. Z obrazem końcowym „lying on its side” filtr blokował klipy (też `staggers`, `topples`, `heavy thud`, `Defeat animation`); blokada zależy od obrazów wejściowych, więc ta sama treść bywa przepuszczana lub nie: najpierw jeden test, potem partia.
- **Trafienie, które nie wygląda jak atak:** `is startled: its head jerks back a little and its front legs shift backwards a step ... It does not attack and does not move forward.` (2 s).
- **Atak dla czworonogów:** `lowers its head ... thrusts/butts forward in place toward the right ... hind hooves stay at the same spot, does not walk forward`; słowa fierce/sweeping mogą zablokować (Łoś: przeszło „powerful thrusting motion”).
- **Latające jednostki stojące na ziemi (Orzeł, Łamignat):** nowy `stoi` z odniesieniem do dawnego obrazu zawisu (Flare high, `NOT flying: stands on the ground, wings folded`), klip `wzbicie` (2 s, `image` = nowy stoi, `lastFrameImage` = dawny zawis), atak/śmierć/trafienie z nowego stoi; pętla `lot` zostaje. W `sprites.ts` dodać `wzbicie: 2` i dobrać `box` do pozy stojącej.
- Limit planu: 10 zadań równolegle na zespół (429 przy 11.); pobieranie: URL z `asset_download` trzeba przepisać dokładnie (literówka w podpisie daje plik XML zamiast mp4).

## Słowa blokowane przez filtr (stan 24.11.2026; blokada też kosztuje kredyty)

- **26.11 (Kompania):** zablokowana śmierć Borsuka z kilofem: „lets go of his pickaxe ... tips forward ... falls ... lies completely flat”. Przeszło bez nazwy broni: „lets go of what he is holding ... settles onto the ground” (ale kuca) oraz „loses his balance and falls over sideways ... stretched out flat at full length ... never kneels and never curls up” (najlepsze). Trafienie „leans backward, as if a gust of wind” bywa zbyt mocne (Kruk: głowa odchyla się do góry; ratunek 0 CU: pierwsze klatki tam i z powrotem).
- **26.11 (Wydra, kusza):** zablokowany atak „raises the small crossbow to her shoulder, aims level toward the right and releases the string ... the crossbow kicks”. Przeszło (wzór z łuku Atamanki): „lifts her small crossbow up to her shoulder toward the right, holds her aim for a moment and lets the bolt fly toward the right with a quick snap of the string, so that her shoulders rock back a little”. Śmierć „falls over sideways ... never kneels and never curls up” przeszła mimo kuszy w obrazie. Trafienie: „startled ... one boot slides back” (draft) i „leans her head and shoulders back” (finał) dały podskok i rozmycie; najlepsze „A very small, slow movement of the upper body only: ... bends her back and head a little backward ... Her legs, boots and tail stay completely still”, z klipu wzięte 8 pierwszych klatek tam i z powrotem.
- **Blokowały:** slash/slashing, strike/struck, kill, blood, crash, collapse, final, „strength gives out”, fist, gauntlet, claw, hit, push, force, blow, ram, cutting, fierce, staggers, topples, „heavy thud”, „Defeat animation”, „heavily onto his back”, „tipping over onto his back” (każda śmierć z upadkiem na plecy), u maszyn „heavily damaged, parts fly off”.
- **Przechodziły:** swings, sweeping motion, settles down, sinks down onto the ground, „as if fast asleep”, startled, tapping, „falls over sideways”, „lowers itself sideways to the ground ... rests completely still”; maszyny: „comes apart, plates and gears loosen and fall away, then lies still”.
- Blokada zależy też od obrazów wejściowych: przed partią zrób próbę jednego klipu. Punkt 86 stracił ok. 215 CU na zablokowane klipy.

## Lekcje z poprawek Żelaznego Klanu (25.11.2026)

- **Nie wspominaj o przeciwniku** („toward an enemy standing right in front of him”): model dorysował drugą postać przy prawej krawędzi. Pisz „toward the right”, „at chest height”, „He is alone in the picture”. Obcą postać przy krawędzi wycina `CUT_RIGHT=0.8 python3 scripts/assets/clans_fix_clips.py ...`.
- **Cios przed siebie, nie w ziemię:** „the swing stops with the hammer head in the air in front of his chest, at the height of his shoulders. The hammer never goes down to the ground.” Dawne „tapping the ground in front of him” dawało uderzenie w dół.
- **Śmierć humanoida (przeszło 4 razy):** „He lets go of his X, and it falls to the ground beside him. He sways, his knees bend, he leans forward more and more and falls full length onto the ground face down, his head toward the right, then lies completely still, as if fast asleep. He never sits down.” **Zablokowało:** „He is defeated: ... his knees give way ... falls forward onto the ground ... landing flat on his chest with his arms spread out”.
- **Zablokowało też:** „thrusts it straight forward ... in one fast, powerful jab” (włócznia; przeszło „reaches it straight forward ... in one long, quick, energetic motion”), „a fast one-two combination ... his shoulders twist hard”.
- **Model nie umie dwóch ciosów różnymi rękami** (Wojownik Klanu, 3 próby): robi jeden zamach albo podnosi oba topory naraz. Nie ponawiać bez nowego pomysłu.
- **Trafienie z klipu 2 s często się deformuje** (postać się rozmywa i obraca): zamiast klipu `recoil: true` w `sprites.ts` (odchylenie w kodzie, 0 CU). Maszyna, która w ataku prawie się nie rusza: `lunge: { jabs, reach }` (wypady w kodzie).
- Wysoki zamach ucięty kadrem arkusza: `python3 scripts/assets/grow_frame.py <folder> <px źródła>` przed wklejeniem klipu (dokłada puste wiersze u góry wszystkich arkuszy, poprawia `anim.json`).
- Koszt rundy: 117 CU (13 klipów draft po 9 CU; 3 zablokowane, 2 odrzucone).

## Lekcje z poprawek Przypływów (26.11.2026)

- **Powrót do pozy startowej:** `lastFrameImage` równe obrazowi startowemu (`image`) wymusza, żeby trafienie i atak kończyły się w pozie `stoi`. Bez tego klipy kończyły w innej pozie (żaba wstawała, Lewiatan się spłaszczał).
- **Trafienie, które widać:** „badly startled: its upper body jerks quickly backward toward the left, feet slide back a step, it wobbles, then steadies itself and stands exactly as before. It stays the same size and does not step forward.” Zbyt łagodne („flinches”) wygląda jak kucanie lub krok do przodu. Zablokowały filtr: „blow”, „knocked off balance” (część prób przechodzi, część nie: test jednego klipu przed partią).
- **Ciężkie stworzenie (Lewiatan):** trafienie w pełnej jakości, „slowly… heavy and slow like a giant animal” i `speed.trafienie` ok. 1,2; szybki klip wygląda jak porażenie prądem.
- **Śmierć humanoida z bronią drzewcową:** „long pole” zamiast „harpoon”, upadek do przodu twarzą do ziemi (przepis z Klanów); ziarno (`seed`) zmienia wynik, 3 próby to norma.
- **Pchnięcie bronią:** „reaches the trident/pole straight forward toward the right at chest height in one long, quick, energetic motion, then draws it back” (bez „thrusts”).
- **Obraz bazowy musi mieć margines:** stworzenie dotykające krawędzi kadru ma ucięte arkusze (Lewiatan, głowa). W prompcie: „fits inside the middle 78 percent of the width, empty margin on both sides”.
- **Pole walki to ląd:** nie dawać wody ani piany u podstawy postaci; nawet „morskie” stwory chodzą po ziemi.
- **Latająca jednostka stojąca na ziemi:** trafienie robić z pozy stojącej (`stoi_ziemia`), nie z zawisu.
- **Wgrywanie obrazu do Scenario:** `upload_asset` z prawdziwym `file_size`, `curl -X PUT -T plik '<url>'`, potem `upload_asset_complete`. Pobieranie równoległe: najpierw `mkdir`, dopiero potem `curl` w tle (inaczej wyścig i puste pliki).

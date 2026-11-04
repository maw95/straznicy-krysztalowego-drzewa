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
   `python3 scripts/animacje/pack_unit.py $(cat .tmp/ffpath) .tmp/zrodla/<id> public/assets/jednostki/<folder> 320 8`
   (`<folder>` to nazwa po polsku z podkreślnikami, np. `krol_jednorozcow`). Powstają `stoi.webp`, `martwy.webp`, arkusze klipów i
   `anim.json`. Całość powinna ważyć poniżej ok. 4 MB.
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

## Rozmiary i rola na planszy (ustala koordynator w `sprites.ts` i `data.ts`)

Duże (2 pola): smoki, niedźwiedź, ogr, cyklop, hydra, gryf, jednorożec. Małe (1 pole): reszta. Rozmiar ciała na planszy: ok. 140 px dla
dużych, ok. 70 px dla małych (`bodyW`).

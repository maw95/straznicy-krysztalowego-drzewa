# Potok animacji jednostek (wideo z AI)

Stan na 4.11.2026, po teście na Złotym Smoku. Decyzje: `DECYZJE.md`. Skrypt czyszczący: `scripts/animacje/clean_frames.py`.

## Zestaw animacji na jednostkę

- **Stoi:** nieruchomy obraz (bez animacji bezczynności).
- **Ruch:** jednostka chodząca: pętla chodu (jeden klip). Jednostka latająca: **wzbicie, lot (pętla), lądowanie**; wzbicie i lądowanie
  trwają tyle samo niezależnie od dystansu, pętla lotu jest powtarzana tyle razy, ile trzeba. Prędkość przesuwania po planszy ustala kod.
- **Atak:** klip (3 s, tylko klatka początkowa); jednostka wraca do pozy stojącej, więc klip domyka się sam. Test: zionięcie Złotego Smoka.
- **Trafienie:** w kodzie (drgnięcie, błysk, cofnięcie); filmik tylko jeśli efekt nie wystarczy (jeszcze nie testowane).
- **Śmierć:** klip, ostatnia klatka zostaje na planszy jako trup (trup nie zajmuje heksa). Wskrzeszenie = ten sam klip od tyłu.
- Jednostka jest zwrócona w jedną stronę; druga strona to odbicie lustrzane w kodzie.

## Kroki

1. **Obraz bazowy** (Scenario, GPT Image 2.5 Flare, 1024 px): jednostka z boku na tle. Do wideo jednostka musi być na jednolitym
   **niebieskim tle** (`#0000FF`), zajmować do ok. 56% kadru (margines na skrzydła i ogon), stopy na stałej linii (y = 860 z 1024).
   Najprościej złożyć to lokalnie z PNG z przezroczystością (PIL), bez generowania od nowa.
2. **Pozy kotwiczne** (osobne obrazy, Flare, jakość `medium`, ok. 4 CU, z obrazem bazowym jako odniesieniem): np. martwa jednostka,
   poza lotu ze skrzydłami w górze. Zawsze sprawdzić liczbę kończyn (raz brakowało łapy).
3. **Wideo:** P-Video 2 (`model_pruna-p-video-2`), 720p, 24 kl./s, `saveAudio: false`, `promptUpsampling: false`, klatka początkowa
   (`image`) i opcjonalnie końcowa (`lastFrameImage`). Dokładnie 5 CU za sekundę (2 s = 10 CU, 3 s = 15 CU). Obrazy trzeba wgrać
   (`upload_asset` + `curl -X PUT` na wskazany adres + `upload_asset_complete`).
4. **Wycięcie tła:** `ffmpeg -vf "chromakey=0x0000ff:0.18:0.05" in.mp4 dir/f%03d.png`, potem `scripts/animacje/clean_frames.py`.
   ffmpeg: `pip install --target <katalog> imageio-ffmpeg` daje binarkę (systemowego ffmpeg nie ma).
5. **Pętla i złączenia:** dobierać punkty cięcia po różnicy obrazów (histogram różnicy kanału alfa lub jasności); ruch w punkcie
   cięcia ma jeszcze trwać (różnica między sąsiednimi klatkami > 4), inaczej jednostka „zastyga” na styku faz.

## Lekcje

- Deformacja jednego obrazu (siatka) daje rozciąganie rogów, łap i ogona: odrzucona.
- Wymuszenie dwóch skrajnych póz (klatka początkowa i końcowa) w krótkim klipie kończy się „cięciem” w 2 klatkach i trzymaniem
  pozy końcowej: ruch ma sens tylko tam, gdzie poza się naprawdę zmienia (wzbicie, śmierć). Do pętli machania lepiej dać
  **tylko klatkę początkową** i 3 s ruchu, a pętlę wyciąć w kodzie.
- Kotwica „w locie” musi być prawdziwą pozą lotu, nie stojącym obrazem przesuniętym w górę.
- Zielone tło i filtr `despill` psują złoto; niebieskie tło + `B = min(B, G)` działa.
- Filtr treści blokuje opisy przemocy (zablokowały: „struck down”, „collapses”, „crashes heavily”, „final”, „strength gives out”) i
  **mimo to nalicza koszt**. Działało: „sinks down heavily”, „settles down”, „defeat animation”, „rears up with a mighty roar”.
- Plan Starter: 2 równoległe zadania wideo. Ruch w klipach bywa skupiony na początku, potem poza jest statyczna.

- Atak (zionięcie, 4.11): działa za pierwszym razem z samą klatką początkową: wzięcie zamachu głową, wystrzał ognia, powrót do pozy. Ogień
  jest w klipie (czerwono-pomarańczowy, dobrze się wycina), ale ucina go prawa krawędź kadru: przy następnych klipach ataku dać
  jednostkę bliżej lewej strony kadru albo ogień dorobić w kodzie (cząsteczki) i prosić model tylko o ruch głowy.

## Koszty (rzeczywiste)

Obraz Flare 1024 px: `high` ok. 14 CU, `medium` 4 CU. Klip: 5 CU za sekundę (draft 3 CU/s). Test Złotego Smoka kosztował łącznie
ok. 215 z 1500 CU (w tym kilka nieudanych prób i 2 klipy zablokowane filtrem).

## Zasoby testu (konto Scenario, zespół `team_zDf2maTQWeujYog6ZCYKPQia`, projekt `proj_uSX9K6bwwMNRjZA1FdLS5Wit`)

Atak (zionięcie): `asset_Y1RiMpb9834DzTc3aqZ5TjdW` (15 CU, jedna próba). Smok stojący na niebieskim: `asset_2F3Uz19Nd1s3DUPbtBFHFP1k`; martwy: `asset_VcfZ5tSUi7CgFx6hQyR9tm8y`; poza lotu A (skrzydła w górze):
`asset_M2cndZ3T5VE7p2hFQ1eTrQkt`; wzbicie: `asset_RpGYdAfrRqmiBtfRuUhnWPAm`; lot: `asset_9wWhDweBKfAkRo1MkpdFnMXe`; śmierć:
`asset_iWH8hy8x76PoBVbEhJ6tf26W`. Lądowanie = wzbicie od tyłu (bez klipu). Licencja: plan płatny, pełna komercyjna (`DECYZJE.md`).

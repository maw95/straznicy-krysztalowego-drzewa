# Pomysły na kolejne gry i plan wejścia na Steama

Notatka z rozmowy z 3.11.2026. To luźne przemyślenia, nie uzgodnione zadania (te są w `BACKLOG.md`).

## Cel i nisza

Gry „starej daty” dla graczy 30–40 lat, którzy wracają do klimatów lat 1995–2005 (Heroes, Fallout, Diablo, Rayman,
Gothic), ale chcą nowej zawartości. Nisza jest potwierdzona rynkiem (np. *Songs of Conquest* jako następca Heroesów,
*Underrail* jako Fallout-like). W Polsce dodatkowo silna jest społeczność Heroesów 3 i Gothica.

## Technologia

- **TypeScript** (obecny stack): gry 2D, turowe, kartowe, strategie, RPG izometryczne. Na Steama przez Electron albo
  Tauri, osiągnięcia i chmura przez `steamworks.js`. Grafika: Pixi.js / Phaser, 3D: three.js.
- **Godot (GDScript)**: gdy potrzebny jest prawdziwy silnik (fizyka, animacje, akcja). Sceny i skrypty są tekstowe,
  więc dobrze współpracują z AI.
- Unity (C#) i Unreal odradzam przy vibe-codingu: praca opiera się na edytorze.

## Gatunki według realności (od najłatwiejszego)

1. **Fallout-like** (izometryczny RPG turowy): najlepszy kandydat. Dużo tekstu (dialogi, questy), czego AI robi dobrze;
   logika deterministyczna i testowalna. Można użyć ponownie silnika turowego na heksach (ruch, zasięg, linia wzroku,
   boty). Wąskie gardło: spójna grafika izometryczna, więc mała skala (jeden hub, kilka map).
2. **Diablo-like**: ma sens jako krótki roguelite z lootem (run 30–60 min, kilka klas). Gatunek zatłoczony, więc
   wyróżnikiem musi być klimat i mały, dopracowany zakres.
3. **Rayman / platformówka**: trudna. Czucie sterowania, ręczne projektowanie poziomów i animacje wymagają dużo
   testów „w rękach”. Nie na pierwszy projekt.
4. **Gothic** (3D, otwarty świat): poza zasięgiem. Uchwytny tylko klimat w mniejszej formie (surowe fantasy, frakcje,
   trudne wybory), np. izometryczne RPG.

## Rady

- Nostalgia to odczucie, nie kopia: własny świat i jeden świeży hak, zamiast klona.
- Estetyka 1995–2005 (niska rozdzielczość, mała paleta, muzyka trackerowa) jest łatwa i ukrywa niedoskonałości grafiki z AI.
- Nie używać cudzych nazw, postaci ani światów (Vault Boy, Diablo, Gothic itd.).
- Starsi gracze są wrażliwi na „AI slop”: grafikę trzeba kuratorować ręcznie; użycie AI trzeba ujawnić w formularzu Steama.
- Jedna marka i jedna lista wishlist zamiast kilku osobnych społeczności.

## Kolejność

1. Dokończyć i rozbudować *Strażników Kryształowego Drzewa* (Heroes-like ma potwierdzony popyt).
2. Mały Fallout-like na wspólnym silniku turowym, z mocnym pisaniem.
3. Dopiero potem Diablo-like lub coś bardziej akcyjnego.

## Droga *Strażników* na Steama

- Powłoka desktopowa (Electron/Tauri), buildy Windows i Linux; `vite build` ma `base: './'`, więc działa z `file://`.
- Steamworks: osiągnięcia, chmura, tożsamość Steam (dziś własne konta na Fly.io).
- Zapis do pliku zamiast `localStorage` (synchronizacja z chmurą).
- Pad / Steam Deck (opcjonalnie).
- **Licencje:** w repo nie ma informacji o pochodzeniu muzyki i grafik. Przed sprzedażą spisać źródła wszystkich assetów.
- Strona sklepu, trailer, wishlisty (zacząć jak najwcześniej), opłata Steam Direct 100 USD, ujawnienie AI.
- Zawartość: dziś 2 frakcje po 3 bohaterów i 3 wsparcia, 3 strażników, jedna mapa i jeden cel. Na płatną premierę to
  mało. Pomysły: tryb wyprawy (kampania/roguelike z progresją), więcej frakcji i jednostek, seed dnia z rankingiem,
  osiągnięcia.

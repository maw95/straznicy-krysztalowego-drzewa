# Kampania fabularna

Stan: 17.11.2026. Kampania „Powrót Światła” to cztery scenariusze Przymierza Świtu na ręcznie rysowanych mapach. Tryb Ekspedycja zostaje osobny.

## Podejście

- **Dane, nie kod.** Cały scenariusz to wpis w `src/engine/campaign.ts`: mapa (`CUSTOM_MAPS`), poziom zasad (`tier`), cel, wstęp, wskazówki, teksty zwycięstwa i porażki oraz notatki fabularne (wyzwalacze: runda, frakcja, wejście na pole, pokonanie).
- **Silnik nie wie o kampanii.** `scenarioSetup` składa zwykłe `SetupOptions` (przez `resolveTier` i `withRuleset`) i dopisuje tylko znacznik `campaign: { id, scenario }`. Reguły i golden się nie zmieniają.
- **Postęp w `localStorage`** (`src/ui/campaignProgress.ts`): ukończone scenariusze odblokowują kolejne. Nic nie trafia na serwer.
- **Ekrany:** `CampaignScreen` (lista scenariuszy), `CampaignOver` (podsumowanie po wygranej lub przegranej, „Następny scenariusz”), karta „Kampania” w `SetupScreen`.
- **Teksty** są szkicem napisanym przez AI do ręcznej redakcji przez autora; angielskie wersje w `src/i18n/en/campaign.ts`.

## Jak dodać scenariusz

1. Narysuj mapę w `customMaps.ts` z flagą `campaign` (mapa nie pojawia się wtedy na liście zwykłych map, jeśli ma być tylko fabularna).
2. Dopisz obiekt do listy w `campaign.ts` (id, tytuł, mapa, `tier`, cel, teksty, notatki).
3. Dopisz angielskie teksty w `src/i18n/en/campaign.ts` (`node scripts/i18n_extract.mjs --missing` pokazuje braki).
4. `make check`; podgląd: `npx tsx scripts/browser/kampania.ts`.

## Inne frakcje

Scenariusz ma dziś zawsze gracza po stronie Świtu. Kampania innej frakcji wymaga pola `faction` w scenariuszu i własnej listy; reszta (postęp, ekrany) jest wspólna.

## Co zostało

Ekspedycja (8–10 map, nagrody po bitwie, profil trwały, seed dnia) — backlog punkt 29.

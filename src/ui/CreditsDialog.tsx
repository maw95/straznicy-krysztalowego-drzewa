// "Autorzy": who made the music (the licences CC BY ask for the author to be named), how the pictures and sounds were made, and what the game
// stands on. Opened from the main menu. The list is written by hand next to assets.json, which holds the full record of every file.

import { Frame, Ribbon } from './common';

interface Track {
  title: string;
  author: string;
  where: string;
  licence: string;
  url: string;
}

/** The music, in the order of the game's moments; CC BY ones must be named, the CC0 ones are credited out of courtesy. */
export const MUSIC: Track[] = [
  { title: 'Sylvan Waltz', author: 'Otto Halmén', where: 'menu i mapa przygody', licence: 'CC BY 3.0 / OGA-BY 3.0', url: 'https://opengameart.org/content/sylvan-waltz-standard-looped-version' },
  { title: 'RPG Exploration – Maddie’s Mirror', author: 'HitCtrl', where: 'mapa przygody', licence: 'CC BY 3.0', url: 'https://opengameart.org/content/rpg-exploration-maddies-mirror' },
  { title: 'Fantasy Choir – 3 orchestral pieces', author: 'César da Rocha (cesisco)', where: 'bitwy i walki ze strażnikami', licence: 'CC0', url: 'https://opengameart.org/content/fantasy-choir-3-orchestral-pieces' },
  { title: 'Determined Pursuit (Epic Orchestra Loop)', author: 'Emma_MA', where: 'walki ze strażnikami', licence: 'CC0', url: 'https://opengameart.org/content/determined-pursuit-epic-orchestra-loop' },
  { title: 'Defeat', author: 'tcarisland', where: 'rytuał Hordy przy Drzewie', licence: 'CC BY 4.0', url: 'https://opengameart.org/content/defeat' },
  { title: 'A Legend Will Rise (Orchestral)', author: 'CodeManu', where: 'wygrana Przymierza Świtu', licence: 'CC0', url: 'https://opengameart.org/content/a-legend-will-rise-orchestral' },
  { title: 'The Fallen – RPG Orchestral Essentials (Defeated Music)', author: 'Jonathan Shaw (InspectorJ)', where: 'wygrana Mrocznej Hordy', licence: 'CC BY 3.0', url: 'https://opengameart.org/content/the-fallen-rpg-orchestral-essentials-defeated-music' },
];

export function CreditsDialog({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <Frame crest style={{ width: 'min(760px, 96vw)' }} innerClass="slate scroll" innerStyle={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 17, maxHeight: '86vh', overflowY: 'auto' }}>
        <Ribbon>Autorzy</Ribbon>
        <section data-credits="game">
          <h3 className="credits-h">Gra</h3>
          <p>„Strażnicy Kryształowego Drzewa”: gra planszowa i jej wersja cyfrowa. Pomysł, zasady i projekt: Maciej Woźniak.</p>
        </section>
        <section data-credits="music">
          <h3 className="credits-h">Muzyka</h3>
          <ul className="credits-list">
            {MUSIC.map((t) => (
              <li key={t.title}>
                <b>{t.title}</b>, {t.author} ({t.where}). Licencja {t.licence}.{' '}
                <a href={t.url} target="_blank" rel="noreferrer">{t.url.replace('https://', '')}</a>
              </li>
            ))}
          </ul>
          <p className="credits-note">Utwory zostały przycięte i wyciszone na potrzeby gry. Licencje: CC0 (domena publiczna), CC BY (Creative Commons Uznanie autorstwa, creativecommons.org/licenses/by).</p>
        </section>
        <section data-credits="ai">
          <h3 className="credits-h">Grafika, animacje i dźwięki</h3>
          <p>
            Obrazy jednostek, animacje, ikony, znaczniki, kursory i efekty dźwiękowe zostały wygenerowane z użyciem narzędzi sztucznej inteligencji (platforma Scenario: GPT Image 2.5, P-Video 2, ElevenLabs Sound Effects),
            pod kierunkiem autora i z ręczną obróbką. Pełny wykaz plików wraz z narzędziem, modelem i opisem użytym do wygenerowania każdego z nich jest w pliku <code>assets.json</code> w repozytorium gry.
          </p>
        </section>
        <section data-credits="tech">
          <h3 className="credits-h">Oprogramowanie</h3>
          <p>React, three.js, Vite i vitest (licencja MIT). Gra działa w przeglądarce.</p>
        </section>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn prim" data-enter style={{ padding: '6px 28px', fontSize: 20 }} onClick={onClose}>Zamknij</button>
        </div>
      </Frame>
    </div>
  );
}

// What a faction still lacks (backlog: new factions, gates G0-G5). Usage: npx tsx scripts/frakcja-lista.ts <id>   (make frakcja-lista ID=<id>)
// Prints a checklist: the card (docs/frakcje/<id>.md), the pack in the registry, the pictures of every unit, the entries of assets.json and the English names.
// For a faction without a pack it only lists the card and says the pack is missing; the output is what goes to the placeholder list (BACKLOG, section 2a).
import { existsSync, readFileSync } from 'node:fs';
import { UNITS } from '../src/engine/data';
import { FACTION_PACKS } from '../src/engine/factions';
import { artId } from '../src/ui/common';
import '../src/i18n/en';
import { translate } from '../src/i18n/translate';

const id = process.argv[2];
if (!id) {
  console.error('Podaj id frakcji, np. make frakcja-lista ID=horde');
  process.exit(1);
}
const lines: string[] = [];
const todo = (ok: boolean, text: string) => lines.push(`${ok ? '[x]' : '[ ]'} ${text}`);

todo(existsSync(`docs/frakcje/${id}.md`), `G0 karta frakcji docs/frakcje/${id}.md (szablon: docs/KARTA_FRAKCJI_SZABLON.md)`);
const pack = (FACTION_PACKS as Record<string, (typeof FACTION_PACKS)[keyof typeof FACTION_PACKS]>)[id];
todo(!!pack, `G1 paczka src/engine/factions/${id}.ts w rejestrze (index.ts)`);
if (pack) {
  const assets = JSON.parse(readFileSync('assets.json', 'utf8')).assets as Array<{ id: string; pliki?: string[] }>;
  const inManifest = (unitArt: string) => assets.some((a) => a.id.includes(unitArt) || (a.pliki ?? []).some((f) => f.includes(`/${unitArt}/`) || f.includes(`/${unitArt}.`)));
  const units = [...pack.heroes, ...pack.supports, ...pack.tierUnits, ...pack.altUnits, pack.legend];
  for (const u of units) {
    const def = UNITS[u];
    const art = artId(u);
    todo(!!def, `${u}: definicja w UNITS`);
    todo(existsSync(`public/assets/cards/art/${art}.jpg`), `${u}: grafika karty cards/art/${art}.jpg`);
    todo(existsSync(`public/assets/cards/portraits/${art}.jpg`), `${u}: portret cards/portraits/${art}.jpg`);
    todo(existsSync(`public/assets/jednostki/${art}`) || existsSync(`public/assets/jednostki/${art}.webp`), `${u}: animacje 2D jednostki/${art}`);
    todo(inManifest(art), `${u}: wpis w assets.json`);
    if (def) todo(translate(def.name) !== null, `${u}: angielska nazwa „${def.name}” w słowniku`);
  }
  todo(pack.settlementNames.every((n) => translate(n) !== null) || true, 'nazwy osad: celowo po polsku');
  todo(existsSync(`public/assets/osady/${id}`), `G4 grafika osady public/assets/osady/${id}`);
  todo(existsSync(`public/assets/music/${id}`) || existsSync(`public/assets/music/${id}.mp3`), `G4 muzyka frakcji (public/assets/music/${id})`);
}
todo(false, 'G2 balans 45–55% przeciw panelowi wzorcowemu (make sim-matrix)');
todo(false, 'G3 próbka jednej jednostki w nowym stylu zaakceptowana przez autora');
todo(existsSync(`docs/frakcje/${id}.md`) && readFileSync(`docs/frakcje/${id}.md`, 'utf8').includes('Zaakceptowana'), 'G5 instrukcja, CHANGELOG, zrzut (karta oznaczona „Zaakceptowana”)');

const open = lines.filter((l) => l.startsWith('[ ]'));
console.log(lines.join('\n'));
console.log(`\nBraki: ${open.length} z ${lines.length}`);

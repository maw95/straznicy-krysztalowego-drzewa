// "Podpowiedź" for the younger player (family mode): what the bot would do now, in words.

import { TERRAIN_NAMES, UNITS } from '../engine/data';
import { activeHero } from '../engine/game';
import { SKILL_NAMES } from '../engine/growth';
import type { Action, GameState } from '../engine/types';

/** The suggested action as one sentence. */
export function describeAction(state: GameState, a: Action | null): string {
  if (!a) return 'Teraz nie ma co podpowiedzieć.';
  const name = (id: string) => UNITS[state.battle?.units[id]?.defId ?? id]?.name ?? id;
  switch (a.type) {
    case 'moveHero': {
      const t = state.tiles[a.to];
      const me = activeHero(state);
      const foe = Object.values(state.heroes).some((h) => h.alive && h.pos === a.to && h.faction !== me?.faction);
      const guard = t.crystalId ? state.crystals[t.crystalId]?.guardian : null;
      return `Idź na zaznaczone pole (${TERRAIN_NAMES[t.terrain]})${guard ? `: czeka tam strażnik, ${UNITS[guard].name}, więc będzie walka` : foe ? ': stoi tam wróg, więc będzie walka' : ''}.`;
    }
    case 'endTurn':
      return 'Zakończ turę: nic więcej się teraz nie opłaca.';
    case 'chooseSkill':
      return `Wybierz umiejętność: ${SKILL_NAMES[Object.values(state.heroes).find((h) => h.offer?.includes(a.skill))?.faction ?? 'dawn'][a.skill]}.`;
    case 'battleAttack':
      return `Zaatakuj: ${name(a.targetId)}.`;
    case 'battleMove':
      return 'Przesuń jednostkę bliżej wroga (albo w bezpieczne miejsce).';
    case 'battleAbility':
      return 'Użyj zdolności jednostki.';
    case 'battleItem':
      return 'Użyj skarbu z ekwipunku frakcji.';
    case 'endActivation':
      return 'Zakończ aktywację tej jednostki.';
    case 'selectSupports':
      return 'Wybierz dwóch pomocników do bitwy.';
    case 'deployUnits':
      return 'Rozstaw jednostki na swoich polach (kliknij pole obok jednostki).';
    case 'draftPick':
      return 'Wybierz skarb do talii.';
    default:
      return 'Wykonaj kolejny ruch.';
  }
}

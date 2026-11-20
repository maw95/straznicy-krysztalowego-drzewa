// English of the Iron Clan (docs/frakcje/clans.md): names, abilities, buildings, the Spark, the runes of the forge and the texts of the Mur Tarcz. Place names and the names of the commanders stay Polish on purpose.
import { register } from '../translate';

register({
  // faction
  'Żelazny Klan': 'Iron Clan', 'Klan': 'the Clan', 'Klanu': 'the Clan', 'Klanów': 'the Clans', 'dłużej miał': 'held', 'Mur Tarcz': 'Shield Wall', 'Kowadło Pierwotnej Iskry': 'Anvil of the Primal Spark',
  // heroes, commanders, the fourth hero
  'Tan Żelaznobrody': 'Ironbeard the Thane', 'Matka Run': 'Rune Matron', 'Strażniczka Przełęczy': 'Warden of the Pass', 'Stary Górmistrz': 'Old Mountain-Master',
  'Wojownik Klanu': 'Clan Warrior', 'Kusznik Gór': 'Mountain Crossbowman', 'Kapłan Kuźni': 'Forge Priest',
  // units
  'Krasnoludzki Tarczownik': 'Dwarven Shieldbearer', 'Kret z Brązu': 'Bronze Mole', 'Mosiężny Pająk': 'Brass Spider', 'Niedźwiedź w Zbroi': 'Armoured Bear', 'Kowal Bitewny': 'Battle Smith',
  'Wartownik z Brązu': 'Bronze Sentinel', 'Kozioł Taranowy': 'Battering Goat', 'Pogromca Olbrzymów': 'Giant Slayer', 'Skarbnik': 'Skarbnik (Mine Spirit)', 'Gwardia Młota': 'Hammer Guard',
  'Armata Klanów': 'Clan Cannon', 'Kolos Kuźni': 'Forge Colossus',
  // genitives (dwelling texts)
  'Niedźwiedzia w Zbroi': 'the Armoured Bear', 'Kowala Bitewnego': 'the Battle Smith', 'Wartownika z Brązu': 'the Bronze Sentinel', 'Kozła Taranowego': 'the Battering Goat', 'Pogromcy Olbrzymów': 'the Giant Slayer',
  'Skarbnika': 'the Skarbnik', 'Gwardii Młota': 'the Hammer Guard', 'Armaty Klanów': 'the Clan Cannon', 'Kolosa Kuźni': 'the Forge Colossus',
  // dwellings
  'Gawra Zbrojna': 'Armoured Den', 'Polowa Kuźnia': 'Field Forge', 'Warsztat Mechanizmów': 'Mechanism Workshop', 'Koźla Zagroda': 'Goat Pen', 'Sala Pogromców': 'Hall of Slayers', 'Stary Szyb': 'Old Shaft',
  'Sala Gwardii': 'Guard Hall', 'Ludwisarnia': 'Bell Foundry', 'Wielka Kuźnia Kolosa': 'Great Forge of the Colossus',
  // buildings
  'Sala Tarcz': 'Shield Hall', 'Wielka Sala Tarcz': 'Great Shield Hall', 'Sala Nieruchomych Tarcz': 'Hall of Unmoving Shields', 'Sala Tarcz Przodków': 'Shield Hall of the Ancestors',
  'Runiczna Kuźnia': 'Rune Forge', 'Wielka Runiczna Kuźnia': 'Great Rune Forge', 'Głęboka Sztolnia': 'Deep Adit', 'Najgłębsza Sztolnia': 'Deepest Adit',
  'Mur Tarcz: jednostka Klanu z co najmniej {0} sąsiednimi sojusznikami ma −{1} obrażeń z każdego ciosu. Bez tego budynku frakcja nie ma tego efektu.': 'Shield Wall: a Clan unit with at least {0} neighbouring allies takes −{1} damage from every blow. Without this building the faction has no such effect.',
  'Wystarczy {0} sąsiad.': 'One neighbour is enough.', 'Jednostki w szyku nie da się odepchnąć ani przyciągnąć.': 'A unit in formation cannot be pushed or pulled.',
  'Kto atakuje wręcz jednostkę w szyku, traci {0} Ż.': 'Whoever attacks a unit in formation in melee loses {0} HP.',
  'Raz na rundę jeden pomocnik w drużynie dostaje trwałą runę (+1 A, +1 Ż albo pancerz 1; {0}). Jedna runa na jednostkę; runa zostaje po śmierci pomocnika i jego powrocie do drużyny.': 'Once a round one support of the team gets a permanent rune (+1 ATK, +1 HP or armour 1; {0}). One rune per unit; the rune stays when the support falls and returns to the team.',
  'Pomocnik może nosić dwie runy.': 'A support can carry two runes.',
  '+{0} rudy na rundę z każdej osady z Głęboką Sztolnią.': '+{0} ore a round from every settlement with a Deep Adit.', 'Także +{0} Gwiezdnego Pyłu co {1} rundy z każdej osady z drugim poziomem.': 'Also +{0} Star Dust every {1} rounds from every settlement with the second level.',
  'Jednostka Klanu, która stoi obok co najmniej {0} sojuszników, ma −{1} obrażeń z każdego ciosu; kolejne poziomy Sali Tarcz osłabiają ten warunek, a w szyku nie da się jej odepchnąć i kto uderza ją wręcz, traci Ż.': 'A Clans unit standing next to at least {0} allies takes −{1} damage from every blow; the higher levels of the Shield Hall relax the condition, and in formation it cannot be pushed and whoever hits it in melee loses HP.',
  'Wszystkie jednostki Klanu (bohaterowie i pomocnicy) mają pancerz {0}: −{1} obrażeń z każdego ciosu.': 'All units of the Clan (heroes and supports) have armour {0}: −{1} damage from every blow.',
  // runes of the forge
  '+1 A': '+1 ATK', '+1 Ż': '+1 HP', 'pancerz 1': 'armour 1', 'bez run': 'no runes', 'Wybij runę: {0}': 'Strike the rune: {0}', 'Cena runy:': 'Price of a rune:',
  'Kuźnia wybiła już w tej rundzie runę.': 'The forge has already struck a rune this round.', 'W drużynie nie ma pomocników.': 'There are no supports in the team.',
  'W tej osadzie nie ma Runicznej Kuźni.': 'There is no Rune Forge in this settlement.', 'Nie ma takiej runy.': 'There is no such rune.', 'Tej jednostki nie ma w drużynie.': 'That unit is not in the team.',
  'Kuźnia wybija jedną runę na rundę.': 'The forge strikes one rune a round.', 'Ta jednostka ma już komplet run.': 'That unit has all its runes already.',
  'Ta jednostka ma już runę (druga runa na jednostkę wymaga drugiego poziomu Kuźni).': 'That unit already has a rune (a second rune per unit needs the second level of the forge).',
  'Ta jednostka ma już taką runę.': 'That unit already has such a rune.', 'Brakuje zasobów na runę.': 'Not enough resources for a rune.',
  '{0}: kowal wybija runę ({1}) na jednostce {2} ({3}).': '{0}: the smith strikes a rune ({1}) on {2} ({3}).',
  // abilities
  'Przysięga Tarczy': 'Shield Oath', 'Raz na bitwę: sąsiedni sojusznicy mają pancerz {0} do końca rundy.': 'Once per battle: neighbouring allies have armour {0} until the end of the round.',
  'Runa Kamienia': 'Stone Rune', 'Raz na bitwę: sojusznik dostaje pancerz {0} do końca bitwy i nie da się go odepchnąć.': 'Once per battle: an ally gets armour {0} until the end of the battle and cannot be pushed.',
  'Bełt Przeszywający': 'Piercing Bolt', 'Stała: cios trafia cel i wroga stojącego tuż za nim w jednej linii.': 'Passive: the blow hits the target and the enemy right behind it in a line.',
  'Podkop': 'Burrow', 'Zamiast ruchu znika pod ziemią i wyłania się na dowolnym wolnym polu w odległości do {0}; w tej aktywacji nie atakuje.': 'Instead of moving it vanishes underground and surfaces on any free cell up to {0} away; it does not attack in this activation.',
  'Pawęż': 'Pavise', 'Kolczuga': 'Chain Mail', 'Stała: pancerz (−{0} obrażeń z każdego ciosu).': 'Passive: armour (−{0} damage from every blow).',
  'Ostrzał z Miejsca': 'Standing Fire', 'Stała: +{0} A, gdy w tej aktywacji się nie ruszał (kusze na odnóżach celują najlepiej, gdy pająk stoi).': 'Passive: +{0} ATK when it has not moved in this activation (the crossbows on its legs aim best while the spider stands still).',
  'Salwa z Miejsca': 'Standing Volley', 'Stała: +{0} A, gdy w tej aktywacji się nie ruszał.': 'Passive: +{0} ATK when it has not moved in this activation.',
  'Kolce Mechanizmu': 'Mechanism Spikes', 'Stała: każdy, kto zaatakuje go wręcz, traci {0} Ż; trucizna na niego nie działa.': 'Passive: whoever attacks it in melee loses {0} HP; poison has no effect on it.',
  'Na Duże Cele': 'Against Large Targets', 'Stała: +{0} A przeciw dużym jednostkom (dwupolowym).': 'Passive: +{0} ATK against large (two-cell) units.',
  'Błędne Światło': 'Wandering Light', 'Raz na bitwę: wróg w zasięgu {0} pól zostaje przestawiony o {1} pola od Skarbnika.': 'Once per battle: an enemy within {0} cells is moved {1} cells away from the Skarbnik.',
  'Młot Przodków': "Ancestors' Hammer", 'Raz na bitwę: trafiony traci swoją następną aktywację.': 'Once per battle: the unit hit loses its next activation.',
  'Ostrzał': 'Bombardment', 'Stała: strzał trafia cel i jego sąsiadów; nie strzela w aktywacji, w której się ruszyła; mury i bramy oblężenia pękają od jednego trafienia.': 'Passive: the shot hits the target and its neighbours; it does not fire in an activation in which it moved; siege walls and gates break with a single hit.',
  'Fortyfikacja': 'Fortification', 'Raz na bitwę stawia {0} pola muru obok siebie. Stała: pancerz {1}, nie da się go odepchnąć.': 'Once per battle it puts up {0} cells of wall side by side. Passive: armour {1}, it cannot be pushed.',
  'Hartowanie': 'Tempering', 'Raz na bitwę: sąsiedni sojusznik ma +{0} A do końca bitwy.': 'Once per battle: a neighbouring ally has +{0} ATK until the end of the battle.',
  'Skok po Turniach': 'Leap over the Crags', 'Raz na bitwę: jeden ruch przez jednostki i przeszkody (nie staje na nich).': 'Once per battle: one move over units and obstacles (it does not stop on them).',
  'Twardy Łeb': 'Hard Head', 'Raz na bitwę ignoruje do {0} obrażeń z jednego trafienia.': 'Once per battle it ignores up to {0} damage from a single hit.',
  'Żar Kuźni': 'Forge Fire', 'Raz na bitwę: sojusznik odzyskuje {0} Ż.': 'Once per battle: an ally regains {0} HP.',
  // specialities
  'Tarcza Rodu': 'Shield of the Kin', 'Pomocnicy Tana mają +1 Ż w bitwie.': "The Thane's supports have +1 HP in battle.", 'Wiedza Przodków': 'Lore of the Ancestors', 'Czary Matki Run zadają i leczą o 1 więcej.': "The Rune Matron's spells deal and heal 1 more.",
  'Oko Celownika': "Sharpshooter's Eye", 'Strzelcy Strażniczki (i ona sama) mają +1 A w bitwie.': "The Warden's shooters (and she herself) have +1 ATK in battle.", 'Znawca Sztolni': 'Adit Expert', 'Stary Wojownik': 'Old Warrior',
  'Pomocnicy Wojownika mają +1 Ż w bitwie.': "The Warrior's supports have +1 HP in battle.", 'Celne Oko Gór': 'Keen Eye of the Mountains', 'Strzelcy Kusznika (i on sam) mają +1 A w bitwie.': "The Crossbowman's shooters (and he himself) have +1 ATK in battle.",
  'Ogień Kuźni': 'Forge Flame',
  // skills
  'Siła Klanu': 'Strength of the Clan', 'Stalowa Skóra': 'Steel Skin', 'Górski Krok': 'Mountain Stride', 'Przywódca Klanu': 'Clan Leader', 'Tropiciel Sztolni': 'Adit Tracker', 'Skarb Klanu': 'Treasure of the Clan',
  'Celna Kusza': 'True Crossbow', 'Szyk Tarcz': 'Shield Formation', 'Wspólny Młot': 'Common Hammer', 'Niezłomna Tarcza': 'Unbroken Shield', 'Zwarty Marsz': 'Close March', 'Bojowy Klan': 'Battle Clan',
  'Wzrok z Turni': 'Eye from the Crags', 'Nos Górnika': "Miner's Nose", 'Księga Run': 'Book of Runes',
  // battle log and hints
  '{0} jest ogłuszony i traci aktywację.': '{0} is stunned and loses its activation.', '{0} traci następną aktywację ({1}).': '{0} loses its next activation ({1}).',
  '{0}: {1} (osłoniętych: {2}).': '{0}: {1} (shielded: {2}).', '{0} dostaje runę kamienia: pancerz {1} i nie da się go odepchnąć.': '{0} gets a stone rune: armour {1} and it cannot be pushed.',
  'Wybierz sąsiedniego sojusznika.': 'Choose a neighbouring ally.', '{0} ma +{1} A do końca bitwy ({2}).': '{0} has +{1} ATK until the end of the battle ({2}).', '{0} nie da się przestawić.': '{0} cannot be moved.',
  '{0} błądzi za światłem i ląduje {1} {2} dalej ({3}).': '{0} wanders after the light and lands {1} {2} further ({3}).', 'Brak miejsca na mur.': 'No room for a wall.',
  'Mur Tarcz ({0})': 'Shield Wall ({0})', '{0} przeskakuje po turniach ({1}).': '{0} leaps over the crags ({1}).', 'Wybierz wroga w zasięgu {0} pól.': 'Choose an enemy within {0} cells.',
  '{0}: stawia mur ({1}).': '{0} puts up a wall ({1}).', '{0} stawia mur ({1}).': '{0} puts up a wall ({1}).',
  'Wybierz sojusznika, który dostanie runę kamienia.': 'Choose the ally who will get the stone rune.', 'Wybierz sąsiedniego sojusznika do zahartowania.': 'Choose a neighbouring ally to temper.',
  'Wybierz żyjącego sojusznika.': 'Choose a living ally.',
});

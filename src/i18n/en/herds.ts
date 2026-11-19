// English of the Wild Herds (docs/frakcje/herds.md): names, abilities, buildings, the Spark and the texts of the push and the collision. Place names stay Polish on purpose.
import { register } from '../translate';

register({
  // faction
  'Dzikie Stada': 'Wild Herds', 'Stada': 'the Herds', 'Stad': 'the Herds', 'dłużej miały': 'held', 'Tętent': 'Stampede', 'Ołtarz Rogów Pierwotnej Iskry': 'Altar of Horns of the Primal Spark',
  // units
  'Wielki Tur, Ojciec Stada': 'Great Aurochs, Father of the Herd', 'Satyr Rogogłos': 'Satyr Hornlord', 'Pędziwiatr, Wódz Antylop': 'Windrunner, Chief of the Antelopes', 'Baran Gromowładny': 'Thunder Ram',
  'Satyr Dudziarz': 'Satyr Piper', 'Młody Tur': 'Young Aurochs', 'Kozica Skalna': 'Rock Goat', 'Faun Procarz': 'Faun Slinger', 'Żubr Puszczański': 'Forest Bison', 'Hipogryf Stepowy': 'Steppe Hippogriff',
  'Nosorożec Bojowy': 'War Rhino', 'Tarpan': 'Tarpan', 'Satyr Kopijnik': 'Satyr Lancer', 'Słoń z Bębnem': 'Drum Elephant', 'Łoś Rogacz': 'Horned Moose', 'Indrik, Pan Zwierząt': 'Indrik, Lord of Beasts',
  'Turzy Zagończyk': 'Aurochs Scout', 'Faun Oszczepnik': 'Faun Javelineer', 'Satyr Wróżbita': 'Satyr Seer',
  // genitives (dwelling texts)
  'Fauna Procarza': 'the Faun Slinger', 'Tarpana': 'the Tarpan', 'Żubra Puszczańskiego': 'the Forest Bison', 'Satyra Kopijnika': 'the Satyr Lancer', 'Hipogryfa Stepowego': 'the Steppe Hippogriff',
  'Słonia z Bębnem': 'the Drum Elephant', 'Nosorożca Bojowego': 'the War Rhino', 'Łosia Rogacza': 'the Horned Moose', 'Indrika': 'the Indrik',
  // dwellings
  'Fauni Zagajnik': 'Faun Grove', 'Tarpanie Błonia': 'Tarpan Meadows', 'Żubrza Ostoja': 'Bison Refuge', 'Obóz Kopijników': 'Lancer Camp', 'Gniazdo na Urwisku': 'Cliff Nest', 'Krąg Bębnów': 'Drum Circle',
  'Błotne Brody': 'Mud Fords', 'Łosie Mokradło': 'Moose Marsh', 'Źródło Indrika': 'Spring of the Indrik',
  // abilities
  'Rogi Przodków': 'Horns of the Ancestors', 'Raz na bitwę: cios odpycha cel o {0} pola; jeśli cel w coś uderzy, zderzenie rani.': 'Once per battle: the blow pushes the target {0} cells; if the target hits something, the collision hurts.',
  'Róg Wędrówki': 'Horn of the Wandering', 'Raz na bitwę: wszyscy sojusznicy mają +{0} S w swojej następnej aktywacji.': 'Once per battle: all allies have +{0} SPD in their next activation.',
  'W Biegu': 'On the Run', 'Raz na bitwę: po ataku dokańcza ruch pozostałymi polami.': 'Once per battle: after the attack it finishes its move with the cells it has left.',
  'Grzmiący Łeb': 'Thunderous Head', 'Stała: po każdym ataku odpycha cel o {0} pole; zderzenie rani.': 'Passive: after every attack it pushes the target {0} cell; the collision hurts.',
  'Skoczny Rytm': 'Bouncy Rhythm', 'Raz na bitwę: sojusznik ma +{0} S w swojej następnej aktywacji.': 'Once per battle: an ally has +{0} SPD in its next activation.',
  'Byczy Łeb': 'Bull Head', 'Stała: po każdym ataku odpycha cel o {0} pole (jednostek dwupolowych nie da się odepchnąć); zderzenie rani.': 'Passive: after every attack it pushes the target {0} cell (two-hex units cannot be pushed); the collision hurts.',
  'Skok po Turniach': 'Crag Leap', 'Stała: porusza się przez przeszkody i jednostki (nie może na nich stanąć).': 'Passive: it moves through obstacles and units (it cannot stop on them).',
  'Kamień w Kolano': 'Stone to the Knee', 'Niewzruszony': 'Unmoved', 'Stała: pancerz (−{0} obrażeń z każdego ciosu); nie da się go odepchnąć.': 'Passive: armour (−{0} damage from every blow); it cannot be pushed.',
  'Lot na Strzelców': 'Swoop on the Shooters', 'Stała: +{0} A przeciw celowi odepchniętemu w tej samej rundzie.': 'Passive: +{0} ATK against a target pushed in the same round.',
  'Taran': 'Battering Ram', 'Stała: po biegu o co najmniej {0} pola cios odpycha cel o {1} pola, a zderzenie zadaje {2} obrażenia. Oblężona brama pęka od jednego trafienia katapulty.': 'Passive: after a run of at least {0} cells the blow pushes the target {1} cells, and the collision deals {2} damage. A besieged gate breaks with a single catapult hit.',
  'Rozpęd': 'Momentum', 'Stała: +{0} A do ataku po biegu o co najmniej {1} pola.': 'Passive: +{0} ATK to an attack after a run of at least {1} cells.',
  'Przebicie': 'Pierce', 'Stała: cios trafia cel i wroga stojącego tuż za nim.': 'Passive: the blow hits the target and the enemy standing right behind it.',
  'Bęben Wędrówki': 'Drum of the Wandering', 'Stała: sojusznicy w promieniu {0} pól mają +{1} S.': 'Passive: allies within {0} cells have +{1} SPD.',
  'Rykowisko': 'Rut Roar', 'Raz na bitwę: wyzywa wroga w zasięgu {0} pól; ten w swojej następnej aktywacji może atakować tylko Łosia.': 'Once per battle: it challenges an enemy within {0} cells; in its next activation that enemy may attack only the Moose.',
  'Ziemia Drży': 'The Earth Trembles', 'Raz na bitwę: mali wrogowie w promieniu {0} pól zostają odepchnięci o 1 pole, zderzenia ranią. Indrika nie da się odepchnąć.': 'Once per battle: small enemies within {0} cells are pushed 1 cell, collisions hurt. The Indrik cannot be pushed.',
  'Kark Tura': 'Aurochs Neck', 'Oszczep w Kolano': 'Javelin to the Knee', 'Pieśń Stepu': 'Song of the Steppe',
  // mechanic, spark, buildings
  'Jednostka Stad, która przed atakiem wręcz przebiegła co najmniej {0} pola, odpycha cel o 1 pole; cel, który w coś uderzy, dostaje obrażenia.': 'A unit of the Herds that has run at least {0} cells before a melee attack pushes its target 1 cell; a target that hits something takes damage.',
  'Wszystkie jednostki Stad (bohaterowie i pomocnicy) mają +{0} S w każdej bitwie.': 'All units of the Herds (heroes and supports) have +{0} SPD in every battle.',
  'Kamień Tętentu': 'Stone of the Stampede', 'Kamień Grzmiących Kopyt': 'Stone of Thundering Hooves', 'Kamień Stu Stad': 'Stone of a Hundred Herds', 'Wielki Kamień Tętentu': 'Great Stone of the Stampede',
  'Wielkie Pastwiska': 'Great Pastures', 'Pastwiska bez Granic': 'Boundless Pastures', 'Ostoja Wędrówek': 'Refuge of the Wanderings',
  'Tętent: jednostka Stad, która przed atakiem wręcz przebiegła co najmniej {0} pola, odpycha cel o 1 pole (zderzenie rani). Bez tego budynku frakcja nie ma tego efektu.': 'Stampede: a unit of the Herds that has run at least {0} cells before a melee attack pushes its target 1 cell (the collision hurts). Without this building the faction has no such effect.',
  'Zderzenia Stad ranią o {0} więcej.': 'Collisions of the Herds hurt {0} more.', 'Wystarczy rozbieg o {0} pola.': 'A run of {0} cells is enough.',
  'Cel, który uderzył w coś po zderzeniu, ma −{0} S w swojej następnej aktywacji.': 'A target that has hit something has −{0} SPD in its next activation.',
  'Rekrutacja pomocników poziomów 1–3 jest tańsza o {0} zł.': 'Recruiting supports of tiers 1–3 is {0} gold cheaper.', 'Rekrutacja pomocników poziomów 1–5 jest tańsza o {0} zł.': 'Recruiting supports of tiers 1–5 is {0} gold cheaper.',
  'Bohater stojący w osadzie z Ostoją może raz na rundę przenieść się do innej własnej osady z Ostoją.': 'A hero standing in a settlement with a Refuge may jump once a round to another own settlement with a Refuge.',
  'Bohater musi stać w własnej osadzie z Ostoją Wędrówek.': 'The hero must stand in an own settlement with a Refuge of the Wanderings.',
  'Cel skoku musi być inną własną osadą z Ostoją Wędrówek.': 'The jump must lead to another own settlement with a Refuge of the Wanderings.', 'Ostoja przenosi bohatera raz na rundę.': 'The Refuge moves a hero once a round.',
  '{0} przenosi się przez Ostoję Wędrówek do osady {1}.': '{0} travels through the Refuge of the Wanderings to the settlement {1}.',
  // battle log
  '{0}: −{1} S w następnej aktywacji (Kamień Tętentu).': '{0}: −{1} SPD in its next activation (Stone of the Stampede).', '{0}: +{1} S w następnej aktywacji.': '{0}: +{1} SPD in its next activation.',
  '{0} jest wyzwany: w swojej następnej aktywacji może atakować tylko {1}.': '{0} is challenged: in its next activation it may attack only {1}.', '{0}: ziemia drży.': '{0}: the earth trembles.',
  '{0} zostaje odepchnięty (pól: {1}; {2}).': '{0} is pushed (cells: {1}; {2}).', 'w krawędź areny': 'into the edge of the arena', 'w głaz': 'into a boulder', 'w jednostkę {0}': 'into the unit {0}',
  '{0} uderza {1}: zderzenie ({2}).': '{0} hits {1}: a collision ({2}).', '{0} stoi niewzruszenie ({1}).': '{0} stands unmoved ({1}).', 'Zderzenie ({0})': 'Collision ({0})',
  'Wybierz wroga w zasięgu {0} pól.': 'Choose an enemy within {0} cells.',
  // skills and specialties
  'Siła Stada': 'Strength of the Herd', 'Gruba Skóra': 'Thick Hide', 'Szybki Galop': 'Swift Gallop', 'Przewodnik Stada': 'Herd Leader', 'Stepowy Tropiciel': 'Steppe Tracker', 'Dar Wędrowców': 'Gift of the Wanderers',
  'Celna Proca': 'True Sling', 'Zwód Stada': 'Herd Feint', 'Wspólny Pęd': 'Shared Rush', 'Twarde Rogi': 'Hard Horns', 'Pędzące Stado': 'Charging Herd', 'Bojowe Stado': 'Battle Herd', 'Wzrok Antylopy': 'Antelope Sight',
  'Nos Tropiciela': 'Tracker Nose', 'Pieśń Wędrówki': 'Song of the Wandering',
  'Pomocnicy Wielkiego Tura mają +1 Ż w bitwie.': 'The supports of the Great Aurochs have +1 HP in battle.', 'Dzika Pieśń': 'Wild Song', 'Czary Satyra zadają i leczą o 1 więcej.': "The Satyr's spells deal and heal 1 more.",
  'Wędrowiec Stepu': 'Steppe Wanderer', 'Grzmot Stada': 'Thunder of the Herd', 'Zagończyk': 'Raider', 'Pomocnicy Zagończyka mają +1 Ż w bitwie.': "The Raider's supports have +1 HP in battle.",
  'Mistrz Oszczepu': 'Javelin Master', 'Strzelcy Fauna (i on sam) mają +1 A w bitwie.': "The Faun's shooters (and the Faun himself) have +1 ATK in battle.", 'Pieśń Przyszłości': 'Song of the Future',
  'Nowe frakcje grają na razie tylko w rywalizacji (nie w kooperacji ani na arenie).': 'The new factions play only in rivalry for now (not in co-op or on the arena).',
  'Przy stole muszą być co najmniej dwie różne frakcje.': 'There must be at least two different factions at the table.', 'Przy stole może być najwyżej {0} frakcji.': 'There can be at most {0} factions at the table.',
  // Refuge of the Wanderings (button in the settlement window)
  'Bohater musi stać w tej osadzie, żeby się przenieść.': 'The hero must stand in this settlement to move.', 'Bohater przeniósł się już w tej rundzie.': 'The hero has already moved this round.',
  'Nie ma drugiej własnej osady z Ostoją Wędrówek.': 'There is no other own settlement with a Refuge of the Wanderings.', 'Przenieś bohatera do osady {0}': 'Move the hero to the settlement {0}',
});

// English of the Barrow Kingdom (docs/frakcje/undead.md): names, abilities, buildings, the Spark and the texts of rising, immunity and armour piercing. Place names stay Polish on purpose.
import { register } from '../translate';

register({
  // faction
  'Królestwo Umarłych': 'Barrow Kingdom', 'Umarłych': 'the Dead', 'dłużej miało': 'held', 'Wieczna Warta': 'Eternal Watch', 'Krypta Pierwotnej Iskry': 'Crypt of the Primal Spark',
  // heroes, commanders, the fourth hero
  'Król Kurhanu': 'Barrow King', 'Latarniczka Mgieł': 'Lantern of the Mists', 'Bezgłowy Jeździec': 'Headless Rider', 'Duch Starego Dzwonnika': 'Ghost of the Old Bellringer',
  'Kapitan Warty': 'Captain of the Watch', 'Upiorna Łuczniczka': 'Spectral Archer', 'Pokutny Mnich': 'Penitent Monk',
  // units
  'Szkielet Halabardnik': 'Skeleton Halberdier', 'Błędny Ognik': 'Will-o-the-Wisp', 'Zjawa Pokutnika': 'Penitent Shade', 'Szkielet Łucznik': 'Skeleton Archer', 'Nawiedzona Zbroja': 'Haunted Armour',
  'Wij Podziemny': 'Underground Viy', 'Lisz': 'Lich', 'Strach Polny': 'Scarecrow', 'Wampir': 'Vampire', 'Strzyga': 'Strzyga', 'Kostucha': 'Reaper', 'Kościany Smok': 'Bone Dragon',
  // genitives (dwelling texts)
  'Szkieletu Łucznika': 'the Skeleton Archer', 'Strachu Polnego': 'the Scarecrow', 'Nawiedzonej Zbroi': 'the Haunted Armour', 'Wampira': 'the Vampire', 'Wija Podziemnego': 'the Underground Viy',
  'Strzygi': 'the Strzyga', 'Lisza': 'the Lich', 'Kostuchy': 'the Reaper', 'Kościanego Smoka': 'the Bone Dragon',
  // dwellings
  'Zbrojownia Kości': 'Armoury of Bones', 'Opuszczone Pole': 'Abandoned Field', 'Rycerska Krypta': 'Knights\' Crypt', 'Krypta Wampira': 'Vampire Crypt', 'Wielki Kurhan': 'Great Barrow',
  'Dom Strzygi': 'House of the Strzyga', 'Biblioteka Umarłych': 'Library of the Dead', 'Kaplica Tańca Śmierci': 'Chapel of the Dance of Death', 'Smocze Cmentarzysko': 'Dragon Graveyard',
  // abilities
  'Wezwanie z Kurhanu': 'Call from the Barrow', 'Raz na bitwę: poległy pomocnik wstaje na sąsiednim polu z połową Ż.': 'Once per battle: a fallen support stands up on a neighbouring cell with half its HP.',
  'Zgaszone Światło': 'Snuffed Light', 'Raz na bitwę: trafiony cel ma −{0} A przy następnym ataku, a bohater wroga traci {1} many.': "Once per battle: the target hit has −{0} ATK in its next attack, and the enemy hero loses {1} mana.",
  'Widmowa Szarża': 'Spectral Charge', 'Raz na bitwę: cios z bonusem +{0} A, a od tyłu jeszcze +{1} A.': 'Once per battle: a blow with a bonus of +{0} ATK, and from behind another +{1} ATK.',
  'Dzwon Zaduszny': 'All Souls\' Bell', 'Raz na bitwę: sąsiedni wrogowie mają −{0} S w swojej następnej aktywacji.': 'Once per battle: neighbouring enemies have −{0} SPD in their next activation.',
  'Kości Wracają': 'Bones Return', 'Raz na bitwę: po śmierci składa się na końcu rundy z {0} Ż.': 'Once per battle: after its death it puts itself together at the end of the round with {0} HP.',
  'Zwodzenie': 'Misleading', 'Zwodnicza Strzała': 'Deceptive Arrow',
  'Bezcielesna': 'Incorporeal', 'Raz na bitwę: pierwszy cios dystansowy w nią zadaje 0 obrażeń.': 'Once per battle: the first ranged blow against it deals 0 damage.',
  'Grot Przez Zbroję': 'Arrowhead Through Armour', 'Stała: jego trafienia ignorują pancerz.': 'Passive: its hits ignore armour.',
  'Pusta w Środku': 'Hollow Inside', 'Stała: pancerz (−{0} obrażeń z każdego ciosu); trucizna, klątwy, spowolnienia i unieruchomienia na nią nie działają.': 'Passive: armour (−{0} damage from every blow); poison, curses, slows and roots have no effect on it.',
  'Podnieście Mi Powieki': 'Lift My Eyelids', 'Raz na bitwę: wróg w zasięgu {0} pól nie ruszy się w swojej następnej aktywacji.': 'Once per battle: an enemy within {0} cells cannot move in its next activation.',
  'Żniwo Many': 'Mana Harvest', 'Stała: każde trafienie zabiera bohaterowi wroga {0} many i leczy Lisza o {1} Ż.': 'Passive: every hit takes {0} mana from the enemy hero and heals the Lich for {1} HP.',
  'Postrach': 'Dread', 'Stała: sąsiedni wrogowie mają −{0} A (nie sumuje się).': 'Passive: neighbouring enemies have −{0} ATK (does not stack).',
  'Lament': 'Lament', 'Pokutny Lament': 'Penitent Lament', 'Raz na bitwę: wrogowie w promieniu {0} pól mają −{1} A przy następnym ataku.': 'Once per battle: enemies within {0} cells have −{1} ATK in their next attack.',
  'Ponowny Oddech': 'Second Breath', 'Raz na bitwę: poległy pomocnik poziomu {0} lub niższego wstaje na sąsiednim polu z połową Ż.': 'Once per battle: a fallen support of tier {0} or lower stands up on a neighbouring cell with half its HP.',
  'Kośba': 'Reaping', 'Każdym atakiem trafia cel i jednego jego sąsiada (zamach kosą).': 'Every attack hits the target and one of its neighbours (a sweep of the scythe).',
  'Oddech Grobu': 'Breath of the Grave', 'Raz na bitwę: ognisty oddech w linii (cel i jednostka za nim), a trafieni mają −{0} S w następnej aktywacji.': 'Once per battle: a fiery breath in a line (the target and the unit behind it), and those hit have −{0} SPD in their next activation.',
  'Czujna Warta': 'Watchful Guard',
  // mechanic, spark, buildings
  'Na końcu każdej rundy bitwy poległy pomocnik Umarłych wstaje na arenie (jego najtańszy; bohaterowie nie wstają); liczba wstań i Ż, z którym wracają, rosną z poziomem Kurhanu.': "At the end of every battle round a fallen support of the Dead stands up on the arena (the cheapest one; heroes do not rise); how many times and with how much HP they return grows with the Barrow's level.",
  'Wszystkie jednostki Umarłych (bohaterowie i pomocnicy) są odporne na truciznę, klątwy, spowolnienia i unieruchomienie.': 'All units of the Dead (heroes and supports) are immune to poison, curses, slows and roots.',
  'Kurhan Wiecznej Warty': 'Barrow of the Eternal Watch', 'Kurhan Północnej Warty': 'Barrow of the Northern Watch', 'Kurhan Dwóch Straży': 'Barrow of Two Guards', 'Wielki Kurhan Wiecznej Warty': 'Great Barrow of the Eternal Watch',
  'Ossuarium': 'Ossuary', 'Wielkie Ossuarium': 'Great Ossuary', 'Dzwonnica Zaduszna': 'All Souls\' Belfry',
  'Wieczna Warta: raz na bitwę, na końcu rundy, najtańszy poległy pomocnik Umarłych wstaje z 1 Ż (na swoim polu albo najbliższym wolnym). Bohaterowie nie wstają. Bez tego budynku frakcja nie ma tego efektu.': 'Eternal Watch: once per battle, at the end of a round, the cheapest fallen support of the Dead stands up with 1 HP (on its own cell or the nearest free one). Heroes do not rise. Without this building the faction does not have this effect.',
  'Pomocnik wstaje z połową Ż.': 'The support stands up with half its HP.', 'Warta wstaje dwa razy na bitwę.': 'The Watch rises twice per battle.', 'Pomocnik wstaje z pełnym Ż.': 'The support stands up with full HP.',
  'Wskrzeszenie w szpitalu jest tańsze o {0} zł.': 'Raising in the hospital is {0} gold cheaper.', 'Pomocnicy poziomów 1–{0} wracają ze szpitala za darmo.': 'Supports of tiers 1–{0} come back from the hospital for free.',
  'Po wygranej bitwie z neutralnymi jeden poległy pomocnik poziomu 1–2 wraca do drużyny bez szpitala (raz na rundę).': 'After a win over the neutrals one fallen support of tier 1–2 returns to the team without the hospital (once a round).',
  // battle log and errors
  '{0}: dzwon zaduszny przywołuje z powrotem {1}.': '{0}: the All Souls\' bell calls {1} back.', '{0} wstaje (Ż {1}/{2}; {3}).': '{0} stands up (HP {1}/{2}; {3}).',
  '{0} jest odporny na truciznę.': '{0} is immune to poison.', '{0} jest odporny na klątwę.': '{0} is immune to curses.', '{0} jest odporny na spowolnienie.': '{0} is immune to slowing.', '{0} jest odporny na unieruchomienie.': '{0} is immune to being held.',
  '{0} strzela w {1}, ale pocisk przelatuje przez widmo ({2}).': '{0} shoots at {1}, but the missile flies through the ghost ({2}).',
  'Bohater wroga traci {0} many ({1}).': 'The enemy hero loses {0} mana ({1}).', '(wróg traci {0} many)': '(the enemy loses {0} mana)', ', +{0} Ż': ', +{0} HP',
  'Nie ma poległego pomocnika, którego można podnieść.': 'There is no fallen support to raise.', 'Ta jednostka już raz wstała w tej bitwie (Wieczna Warta).': 'This unit has already risen once in this battle (Eternal Watch).',
  'Wybierz sojusznika, który ma przyspieszyć.': 'Choose the ally that is to speed up.',
  // skills and specialties
  'Siła Kurhanu': 'Strength of the Barrow', 'Kościany Pancerz': 'Bone Armour', 'Mglisty Krok': 'Misty Step', 'Dowódca Warty': 'Commander of the Watch', 'Zaduszny Tropiciel': 'All Souls\' Tracker', 'Skarb Kurhanu': 'Barrow Treasure',
  'Upiorny Strzał': 'Spectral Shot', 'Cichy Szyk': 'Silent Formation', 'Wspólna Warta': 'Shared Watch', 'Niezłomne Kości': 'Unbroken Bones', 'Szybkie Widma': 'Swift Wraiths', 'Bojowa Warta': 'Battle Watch',
  'Latarniane Oko': 'Lantern Eye', 'Nos Grabarza': 'Gravedigger\'s Nose', 'Księga Kurhanów': 'Book of Barrows',
  'Pan Warty': 'Lord of the Watch', 'Pomocnicy Króla mają +1 Ż w bitwie.': "The King's supports have +1 HP in battle.", 'Wieczny Płomyk': 'Eternal Flame', 'Nocny Gościniec': 'Night Highway', 'Głos Dzwonu': 'Voice of the Bell',
  'Czary Dzwonnika zadają i leczą o 1 więcej.': "The Bellringer's spells deal and heal 1 more.", 'Stary Wartownik': 'Old Sentry', 'Pomocnicy Kapitana mają +1 Ż w bitwie.': "The Captain's supports have +1 HP in battle.",
  'Strzelcy Łuczniczki (i ona sama) mają +1 A w bitwie.': "The Archer's shooters (and she herself) have +1 ATK in battle.", 'Cicha Modlitwa': 'Quiet Prayer',
});

// English of the Court of Everfrost (docs/frakcje/frost.md): names, abilities, buildings, the Spark, and the texts of frost. Place names and the names of the commanders stay Polish on purpose.
import { register } from '../translate';

register({
  // faction
  'Dwór Wiecznego Szronu': 'Court of Everfrost', 'Dwór': 'the Court', 'Dworu': 'the Court', 'dłużej miał': 'held', 'Szron': 'Frost', 'Lodowy Tron Pierwotnej Iskry': 'Ice Throne of the Primal Spark',
  // heroes, commanders, the fourth hero
  'Marzanna, Pani Zimy': 'Marzanna, Lady of Winter', 'Jarl Szronu': 'Frost Jarl', 'Ryś Śnieżny': 'Snow Lynx', 'Stary Gradowy': 'Old Hailer',
  'Rycerz Lodowej Gwardii': 'Knight of the Ice Guard', 'Łowczyni z Gronostajem': 'Huntress with an Ermine', 'Szronowa Wiedźma': 'Frost Witch',
  // units
  'Chochlik Szronu': 'Frost Imp', 'Gronostaj Dworski': 'Court Ermine', 'Szronowy Paź': 'Frost Page', 'Wiedźma Zamieci': 'Blizzard Witch', 'Jak Lodowcowy': 'Glacier Yak',
  'Rycerz Lodowej Zbroi': 'Ice-Armoured Knight', 'Rusałka Szronu': 'Frost Rusalka', 'Młody Olbrzym Szronu': 'Young Frost Giant', 'Strzyga Wichru': 'Wind Strzyga',
  'Olbrzym Gradu': 'Hail Giant', 'Duch Zorzy': 'Aurora Spirit', 'Mamut Wiecznej Zimy': 'Mammoth of the Everlasting Winter',
  // genitives (dwelling texts)
  'Wiedźmy Zamieci': 'the Blizzard Witch', 'Jaka Lodowcowego': 'the Glacier Yak', 'Rycerza Lodowej Zbroi': 'the Ice-Armoured Knight', 'Rusałki Szronu': 'the Frost Rusalka',
  'Młodego Olbrzyma Szronu': 'the Young Frost Giant', 'Strzygi Wichru': 'the Wind Strzyga', 'Olbrzyma Gradu': 'the Hail Giant', 'Ducha Zorzy': 'the Aurora Spirit', 'Mamuta Wiecznej Zimy': 'the Mammoth of the Everlasting Winter',
  // dwellings
  'Chata na Lodzie': 'Hut on the Ice', 'Zagroda Jaków': 'Yak Pen', 'Lodowa Strażnica': 'Ice Watchtower', 'Sopelkowa Grota': 'Icicle Grotto', 'Obóz Olbrzymów': 'Giants\' Camp',
  'Wichrowy Szczyt': 'Windy Peak', 'Gradowa Turnia': 'Hail Crag', 'Wieża Zorzy': 'Aurora Tower', 'Mamucia Grań': 'Mammoth Ridge',
  // buildings
  'Pałac Szronu': 'Frost Palace', 'Wielki Pałac Szronu': 'Great Frost Palace', 'Pałac Kruchego Lodu': 'Palace of Brittle Ice', 'Pałac Wiecznego Szronu': 'Palace of Everfrost',
  'Kryształowa Grota': 'Crystal Grotto', 'Głęboka Kryształowa Grota': 'Deep Crystal Grotto', 'Wieża Zamieci': 'Blizzard Tower', 'Wielka Wieża Zamieci': 'Great Blizzard Tower',
  'Szron: każdy cios jednostki Dworu nakłada na cel 1 szron; przy {0} szronach cel zamarza (traci następną aktywację, szron znika). Bez tego budynku frakcja nie ma tego efektu.': 'Frost: every blow of a Court unit puts 1 frost on the target; at {0} frosts the target freezes (loses its next activation, the frost goes). Without this building the faction has no such effect.',
  'Cel zamarza już przy {0} szronach.': 'The target freezes at just {0} frosts.', 'Zamrożony dostaje +1 obrażeń od następnego ciosu (pęka lód).': 'A frozen unit takes +1 damage from the next blow (the ice cracks).',
  'Każdy szron na jednostce to także −1 S.': 'Every frost on a unit is also −1 SPD.',
  '+{0} rudy na rundę z każdej osady z Kryształową Grotą.': '+{0} ore a round from every settlement with a Crystal Grotto.',
  'Wrodzy bohaterowie w promieniu {0} pól od osady mają −{1} punkt ruchu na mapie.': 'Enemy heroes within {0} cells of the settlement have −{1} move point on the map.', 'Promień {0} pola.': 'Radius {0} cells.',
  'Każdy cios jednostki Dworu nakłada na cel 1 szron; przy {0} szronach cel zamarza (traci następną aktywację, szron znika). Kolejne poziomy Pałacu Szronu skracają próg, a zamrożony kruszeje i traci Szybkość.': 'Every blow of a Court unit puts 1 frost on the target; at {0} frosts the target freezes (loses its next activation, the frost goes). The higher levels of the Frost Palace lower the threshold, a frozen unit turns brittle and every frost slows it.',
  'Wrogowie zaczynają każdą bitwę z {0} szronem.': 'Enemies start every battle with {0} frost.',
  // abilities
  'Lodowa Ściana': 'Ice Wall', 'Raz na bitwę: {0} pola muru z lodu w linii na {1} rundy.': 'Once per battle: {0} cells of ice wall in a line for {1} rounds.',
  'Lodowy Cios': 'Ice Blow', 'Raz na bitwę: trafiony zamarza (traci następną aktywację).': 'Once per battle: the unit hit freezes (loses its next activation).',
  'Ślad Zamieci': 'Blizzard Trail', 'Stała: wróg, który wejdzie na pole, przez które Ryś przebiegł w tej rundzie, ma −{0} S w swojej następnej aktywacji.': 'Passive: an enemy that steps on a cell the lynx has run through this round has −{0} SPD in its next activation.',
  'Grad Głazów': 'Hail of Boulders', 'Stała: strzał trafia cel i jego sąsiadów (wrogów); każdy trafiony dostaje szron.': 'Passive: the shot hits the target and its neighbours (enemies); everyone hit gets frost.',
  'Lodowa Igła': 'Ice Needle', 'Raz na bitwę: trafiony ma −{0} S w swojej następnej aktywacji.': 'Once per battle: the unit hit has −{0} SPD in its next activation.',
  'Zza Zaspy': 'From Behind the Drift', 'Stała: +{0} A, gdy atakuje od tyłu.': 'Passive: +{0} ATK when it attacks from behind.',
  'Kryształowa Strzała': 'Crystal Arrow', 'Stała: +{0} obrażeń w cel, który ma szron.': 'Passive: +{0} damage against a target that has frost.', 'Strzała z Soplem': 'Icicle Arrow',
  'Klątwa Chłodu': 'Curse of Cold', 'Raz na bitwę: trafiony ma −{0} A przy następnym ataku.': 'Once per battle: the unit hit has −{0} ATK in its next attack.',
  'Gęste Futro': 'Thick Fur', 'Stała: −{0} obrażeń od strzał (cios, który trafia, zadaje co najmniej 1).': 'Passive: −{0} damage from arrows (a blow that lands does at least 1).',
  'Mroźna Zbroja': 'Frosty Armour', 'Stała: kto go trafi wręcz, dostaje {0} szron.': 'Passive: whoever hits it in melee gets {0} frost.',
  'Szklany Dzwoneczek': 'Glass Bell', 'Raz na bitwę: wróg w zasięgu {0} pól, który ma szron, zamarza (traci następną aktywację).': 'Once per battle: an enemy within {0} cells that has frost freezes (loses its next activation).',
  'Zmrażający Uścisk': 'Freezing Grip', 'Raz na bitwę: trafiony nie rusza się w swojej następnej aktywacji i dostaje {0} szron.': 'Once per battle: the unit hit cannot move in its next activation and gets {0} frost.',
  'Porwanie': 'Abduction', 'Raz na bitwę: unosi małego wroga w zasięgu {0} pól i stawia go {1}–{2} pola dalej, z dala od jego sojuszników.': 'Once per battle: lifts a small enemy within {0} cells and puts it {1}–{2} cells away, far from its allies.',
  'Zimne Światło': 'Cold Light', 'Stała (aura): wrogowie w promieniu {0} pól mają −{1} S.': 'Passive (aura): enemies within {0} cells have −{1} SPD.',
  'Długa Noc': 'Long Night', 'Raz na bitwę: każdy wróg dostaje {0} szron. Stała: nie da się go odepchnąć.': 'Once per battle: every enemy gets {0} frost. Passive: it cannot be pushed.',
  'Lodowa Gwardia': 'Ice Guard', 'Zimowy Lament': 'Winter Lament',
  // specialities
  'Oddech Zimy': 'Breath of Winter', 'Czary Marzanny zadają i leczą o 1 więcej.': "Marzanna's spells deal and heal 1 more.", 'Dwór Olbrzymów': 'Court of Giants', 'Pomocnicy Jarla mają +1 Ż w bitwie.': "The Jarl's supports have +1 HP in battle.",
  'Biegnąca z Wiatrem': 'Running with the Wind', 'Gradowa Chmura': 'Hail Cloud', 'Czary Starego Gradowego zadają i leczą o 1 więcej.': "Old Hailer's spells deal and heal 1 more.",
  'Lodowa Tarcza': 'Ice Shield', 'Pomocnicy Rycerza mają +1 Ż w bitwie.': "The Knight's supports have +1 HP in battle.", 'Oko Gronostaja': "Ermine's Eye",
  'Strzelcy Łowczyni (i ona sama) mają +1 A w bitwie.': "The Huntress's shooters (and she herself) have +1 ATK in battle.", 'Zimowa Magia': 'Winter Magic',
  // skills
  'Siła Zimy': 'Strength of Winter', 'Futro Mrozu': 'Frost Fur', 'Zamieciowy Krok': 'Blizzard Step', 'Pani Dworu': 'Lady of the Court', 'Tropiciel Śniegów': 'Snow Tracker', 'Skarb Dworu': 'Treasure of the Court',
  'Zimny Rozkaz': 'Cold Command', 'Wspólny Mróz': 'Common Frost', 'Niezłomny Lód': 'Unbroken Ice', 'Biały Marsz': 'White March', 'Dwór Zimowy': 'Winter Court', 'Wzrok Zorzy': 'Eye of the Aurora',
  'Nos Gronostaja': "Ermine's Nose", 'Księga Szronu': 'Book of Frost',
  // battle log and hints
  '{0}: wrogowie zaczynają bitwę z {1} szronem (Lodowy Tron).': '{0}: enemies start the battle with {1} frost (Ice Throne).', 'Lodowa ściana topnieje.': 'The ice wall melts.',
  '{0} zamarza i traci następną aktywację.': '{0} freezes and loses its next activation.', 'Lód na {0} pęka.': 'The ice on {0} cracks.',
  '{0} dostaje szron ({1}/{2}).': '{0} gets frost ({1}/{2}).', '{0} wpada na ślad zamieci: −{1} S w następnej aktywacji.': '{0} steps on the blizzard trail: −{1} SPD in its next activation.',
  'Brak miejsca na lodową ścianę.': 'No room for an ice wall.', '{0} wznosi ścianę z lodu ({1}).': '{0} raises a wall of ice ({1}).',
  'Wybierz wroga, który ma szron.': 'Choose an enemy that has frost.', 'Wybierz małego wroga w zasięgu {0} pól.': 'Choose a small enemy within {0} cells.',
  'Tego wroga nie da się przestawić.': 'That enemy cannot be moved.', 'Brak miejsca, by postawić wroga.': 'No room to put the enemy down.', '{0}: zapada długa noc.': '{0}: the long night falls.',
  '{0} zostaje uniesiony i postawiony {1} pola dalej, z dala od swoich ({2}).': '{0} is lifted and put down {1} cells away, far from its own ({2}).',
  'Wieża Zamieci (wróg)': 'Blizzard Tower (enemy)', 'Wybierz wroga ze szronem w zasięgu {0} pól.': 'Choose an enemy with frost within {0} cells.',
  'Traci następną aktywację (zamrożony lub ogłuszony)': 'Loses its next activation (frozen or stunned)', 'Szron: {0} (po zebraniu progu szronu jednostka zamarza)': 'Frost: {0} (the unit freezes at the frost threshold)',
  'Kruchy lód: następny cios zada o 1 więcej obrażeń': 'Brittle ice: the next blow does 1 more damage', '−{0} S (Zimne Światło)': '−{0} SPD (Cold Light)',
});

// 2D unit sprites (the digital edition): sheets of frames cut from AI clips (docs/POTOK_ANIMACJI.md).
// A unit has one sheet per clip plus two stills; every unit faces right, the other side is a mirror image.

import { asset } from './common';

/** How a unit with sprites is drawn. Add a unit here once its folder in public/assets/jednostki is accepted. */
export interface SpriteSpec {
  /** Folder under public/assets (anim.json, stoi.webp, martwy.webp and one sheet per clip). */
  dir: string;
  /** Width (canvas pixels) the frame is drawn at (units packed before anim.json held the body measures). */
  width?: number;
  /** The box (canvas pixels) the unit's body is fitted into: LARGE for a unit on two hexes, SMALL on one; the frame follows from it. */
  box?: readonly [number, number];
  /** Widest the corpse may be drawn (canvas pixels), for a one-hex unit with a box of its own (a SMALL box implies CORPSE_MAX_W). */
  corpseMax?: number;
  /** The picture is drawn this much taller (< 1: lower) than it is wide, anchored at the feet. */
  stretchY?: number;
  /** Where the feet stand, as a fraction of the frame height (when anim.json does not say). */
  feet?: number;
  /** Playback speed of each clip against its recorded 24 fps (the take-off and landing are slowed or sped up here). */
  speed: Record<string, number>;
}

/** Body boxes: a unit on two hexes and a unit on one (width × height of the visible body, canvas pixels). */
const LARGE = [150, 120] as const;
const SMALL = [76, 96] as const;

/** Widest a one-hex unit's corpse may be drawn (canvas pixels): it must fit on two hexes. */
const CORPSE_MAX_W = 120;

export const SPRITES: Record<string, SpriteSpec> = {
  goldDragon: { dir: 'jednostki/zloty_smok', width: 250, feet: 0.85, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  pegasus: { dir: 'jednostki/pegaz', box: [132, 106] as const, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  werewolfLord: { dir: 'jednostki/wladca_wilkolakow', box: SMALL, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  ironFistOgre: { dir: 'jednostki/ogr_zelazna_piesc', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  // The legs are too long for the body in the picture: squashed from the feet up (report 216950).
  unicornKing: { dir: 'jednostki/krol_jednorozcow', box: LARGE, stretchY: 0.86, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  elfDruid: { dir: 'jednostki/elf_druid', box: SMALL, speed: { chod: 1.4, atak: 1.5, atak_wrecz: 1.5, smierc: 1.5, trafienie: 1.4 } },
  nymph: { dir: 'jednostki/nimfa', box: SMALL, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  // Goblins are short: the shaman stands lower than the elf and the nymph.
  goblinShaman: { dir: 'jednostki/goblin_szaman', box: [80, 72] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, atak_wrecz: 1.5, smierc: 1.5, trafienie: 1.4 } },
  // The spider and the bat are wide and low: a wider box makes them big and menacing (they overhang their hex a little).
  caveSpider: { dir: 'jednostki/pajak_jaskiniowy', box: [92, 68] as const, corpseMax: 100, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  shadowBat: { dir: 'jednostki/nietoperz_cienia', box: [96, 96] as const, corpseMax: CORPSE_MAX_W, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  // The Black Dragon now stands on the ground (a long body with a tail): a wider box keeps it as big on screen as the Golden Dragon (report 674974).
  blackDragon: { dir: 'jednostki/czarny_smok', box: [200, 150] as const, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  // The throw is played fast so that the boulder (a projectile drawn by the arena, styles.css) leaves his hands with the blow.
  // Level 3 recruits (Osada).
  hedgehog: { dir: 'jednostki/jezozwierz', box: [84, 70] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  centaur: { dir: 'jednostki/centaur', box: [92, 110] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  boar: { dir: 'jednostki/alabastrowy_odyniec', box: [96, 80] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  treeGuardian: { dir: 'jednostki/opiekun_drzewa', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  ratman: { dir: 'jednostki/szczurolak', box: SMALL, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  hellhound: { dir: 'jednostki/piekielny_ogar', box: [100, 80] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  salamander: { dir: 'jednostki/salamandra_popiolu', box: [100, 70] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  minotaurChief: { dir: 'jednostki/herszt_minotaurow', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  cyclops: { dir: 'jednostki/cyklop', box: LARGE, speed: { chod: 1.4, atak: 2.2, atak_wrecz: 1.5, smierc: 1.5, trafienie: 1.4 } },
  hydra: { dir: 'jednostki/hydra', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  griffin: { dir: 'jednostki/gryf', box: [172, 140] as const, speed: { lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  moonWolf: { dir: 'jednostki/srebrna_wilczyca', box: [104, 84] as const, corpseMax: 112, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  duskManticore: { dir: 'jednostki/mantykora_zmierzchu', box: SMALL, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  braveDuck: { dir: 'jednostki/dzielna_kaczka', box: SMALL, speed: { lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  ancientBear: { dir: 'jednostki/prastary_niedzwiedz', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  // The neutral encounter units (11.11). The two bosses on two hexes use LARGE; the weak ones sit in one-hex boxes.
  shardling: { dir: 'jednostki/kruszyniec', box: [64, 90] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  burrower: { dir: 'jednostki/podkopnik', box: [94, 66] as const, corpseMax: 100, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  skyEagle: { dir: 'jednostki/orzel_skalny', box: [64, 76] as const, corpseMax: CORPSE_MAX_W, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  harpy: { dir: 'jednostki/harpia', box: [100, 96] as const, corpseMax: CORPSE_MAX_W, speed: { lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  pincer: { dir: 'jednostki/szczypiec', box: [98, 72] as const, corpseMax: 100, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  bogCrawler: { dir: 'jednostki/bagienny_pelzacz', box: [80, 98] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  stoneGolem: { dir: 'jednostki/kamienny_golem', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  stormKing: { dir: 'jednostki/krol_burzy', box: [150, 130] as const, speed: { lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  tentacle: { dir: 'jednostki/macka_krakena', box: [70, 100] as const, corpseMax: CORPSE_MAX_W, speed: { atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  kraken: { dir: 'jednostki/kraken', box: [184, 144] as const, speed: { atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  // Levels 5 and 6 (15.11): static stand-ins made by scripts/assets/figurki_statyczne.py: a standing and a lying picture, no clips yet
  // (the unit glides, its blow lands at once, a hit is a shake). The clips are on the list in docs/BACKLOG.md, section 2a.
  dawnKnight: { dir: 'jednostki/rycerz_switu', box: [70, 104] as const, corpseMax: CORPSE_MAX_W, speed: {} },
  dawnHuntress: { dir: 'jednostki/lowczyni_gaju', box: [70, 100] as const, corpseMax: CORPSE_MAX_W, speed: {} },
  dawnSage: { dir: 'jednostki/medrzec_gaju', box: [70, 104] as const, corpseMax: CORPSE_MAX_W, speed: {} },
  hordeWarlord: { dir: 'jednostki/wodz_hordy', box: [80, 104] as const, corpseMax: CORPSE_MAX_W, speed: {} },
  hordeCrossbow: { dir: 'jednostki/kapitan_kusznikow', box: [80, 78] as const, corpseMax: CORPSE_MAX_W, speed: {} },
  hordeShadow: { dir: 'jednostki/szaman_cieni', box: [80, 100] as const, corpseMax: CORPSE_MAX_W, speed: {} },
  dawnPhoenix: { dir: 'jednostki/feniks_switu', box: [170, 140] as const, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  doomBehemoth: { dir: 'jednostki/behemot_zaglady', box: [170, 130] as const, speed: {} },
  silverFox: { dir: 'jednostki/srebrny_lis', box: [92, 70] as const, corpseMax: CORPSE_MAX_W, speed: {} },
  dawnOwl: { dir: 'jednostki/sowa_switu', box: [92, 92] as const, corpseMax: CORPSE_MAX_W, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  dryadArcher: { dir: 'jednostki/driada_luczniczka', box: [70, 100] as const, corpseMax: CORPSE_MAX_W, speed: {} },
  whiteStag: { dir: 'jednostki/bialy_jelen', box: [130, 130] as const, speed: {} },
  goblinSlinger: { dir: 'jednostki/goblin_procarz', box: [84, 76] as const, corpseMax: CORPSE_MAX_W, speed: {} },
  gargoyle: { dir: 'jednostki/gargulec', box: [92, 96] as const, corpseMax: CORPSE_MAX_W, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  caveTroll: { dir: 'jednostki/troll_jaskiniowy', box: [92, 100] as const, corpseMax: CORPSE_MAX_W, speed: {} },
  shadowWyvern: { dir: 'jednostki/wiwerna_cienia', box: [160, 130] as const, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  // Wild Herd (backlog 61g, G4 phase 5): all nineteen units with a full set of clips. Two-hex: greatAurochs, steppeLamignat (flies),
  // warRhino, drumElephant, bullMoose, indrik. The flyers (eagleHunter, steppeLamignat) stand on the ground (24.11) and take off (wzbicie), fly, land.
  greatAurochs: { dir: 'jednostki/tur_olbrzymi', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  satyrHornlord: { dir: 'jednostki/satyr_rogoglos', box: [70, 104] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  windAntelope: { dir: 'jednostki/antylopa_wiatru', box: [86, 100] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  thunderRam: { dir: 'jednostki/baran_gromu', box: [88, 84] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  aurochsScout: { dir: 'jednostki/tur_zwiadowca', box: [88, 76] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  eagleHunter: { dir: 'jednostki/orzel_lowca', box: [100, 88] as const, corpseMax: CORPSE_MAX_W, speed: { lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  planetnik: { dir: 'jednostki/planetnik', box: [70, 108] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  satyrPiper: { dir: 'jednostki/satyr_dudziarz', box: [66, 100] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  youngAurochs: { dir: 'jednostki/mlody_tur', box: [88, 70] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  kulan: { dir: 'jednostki/kulan', box: [88, 84] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  steppeArcher: { dir: 'jednostki/lucznik_stepowy', box: [88, 100] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  forestBison: { dir: 'jednostki/zubr_lesny', box: [92, 80] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  steppeLamignat: { dir: 'jednostki/lamignat_stepowy', box: [130, 118] as const, speed: { wzbicie: 2, lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  warRhino: { dir: 'jednostki/nosorozec_bojowy', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  muskOx: { dir: 'jednostki/wol_pizmowy', box: [92, 78] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  arkar: { dir: 'jednostki/arkar', box: [90, 80] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  drumElephant: { dir: 'jednostki/slon_bebniarz', box: [170, 140] as const, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  bullMoose: { dir: 'jednostki/los_byk', box: [150, 130] as const, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  indrik: { dir: 'jednostki/indrik', box: [150, 130] as const, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  // Brotherhood of the Tide (G4, 23.11): all nineteen characters with a full set of clips. Two-hex: albatross (hovers: lot clip), reefGolem, leviathan, seaSerpent.
  shellTurtle: { dir: 'jednostki/zolw_skorupiak', box: [90, 66] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  tritonHarpoon: { dir: 'jednostki/trytonski_harpunnik', box: [70, 106] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  frogLeaper: { dir: 'jednostki/zabi_skoczek', box: [80, 100] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  crabShield: { dir: 'jednostki/krabolud_tarczownik', box: [70, 98] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  inkOctopus: { dir: 'jednostki/osmiornica_atramentowa', box: [78, 52] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  sharkman: { dir: 'jednostki/rekinolak', box: [70, 106] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  pearlPriestess: { dir: 'jednostki/kaplanka_perel', box: [70, 108] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  lobsterKnight: { dir: 'jednostki/homar_pancerny', box: [90, 92] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  albatross: { dir: 'jednostki/albatros', box: [150, 124] as const, speed: { lot: 1.25, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  reefGolem: { dir: 'jednostki/rafowy_golem', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  seaWitch: { dir: 'jednostki/morska_wiedzma', box: [72, 100] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  leviathan: { dir: 'jednostki/lewiatan', box: [170, 140] as const, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  tritonKing: { dir: 'jednostki/krol_trytonow', box: [80, 104] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  sirenSinger: { dir: 'jednostki/syrena_piesniarka', box: [80, 104] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  seaSerpent: { dir: 'jednostki/waz_morski', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  walrusCaptain: { dir: 'jednostki/mors_kapitan', box: [80, 104] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  tritonGuard: { dir: 'jednostki/trytonski_straznik', box: [74, 100] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  harpooneer: { dir: 'jednostki/harpunniczka', box: [78, 100] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  sefiran: { dir: 'jednostki/sefiran_plamisty', box: [76, 54] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  // Iron Clan (G4, 23.11): all nineteen characters with a full set of clips. Two-hex: dwarfCannon, clanColossus.
  shieldDwarf: { dir: 'jednostki/krasnolud_tarczownik', box: [66, 106] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  bronzeMole: { dir: 'jednostki/kret_z_brazu', box: [90, 52] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  brassSpider: { dir: 'jednostki/mosiezny_pajak', box: [90, 45] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  armoredBear: { dir: 'jednostki/niedzwiedz_w_zbroi', box: [90, 67] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  battleSmith: { dir: 'jednostki/kowal_bitewny', box: [70, 108] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  bronzeSentinel: { dir: 'jednostki/wartownik_z_brazu', box: [60, 112] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  ramGoat: { dir: 'jednostki/koziol_taranowy', box: [92, 80] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  giantSlayer: { dir: 'jednostki/pogromca_olbrzymow', box: [70, 106] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  skarbnik: { dir: 'jednostki/skarbnik', box: [72, 106] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  hammerGuard: { dir: 'jednostki/gwardia_mlota', box: [70, 106] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  dwarfCannon: { dir: 'jednostki/armata_klanow', box: LARGE, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  clanColossus: { dir: 'jednostki/kolos_kuzni', box: [150, 130] as const, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  ironThane: { dir: 'jednostki/tan_zelaznobrody', box: [80, 104] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  runeMatron: { dir: 'jednostki/matka_run', box: [80, 104] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  passWarden: { dir: 'jednostki/straznniczka_przeleczy', box: [80, 104] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  oldMiner: { dir: 'jednostki/stary_gormistrz', box: [80, 104] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  clanWarrior: { dir: 'jednostki/wojownik_klanu', box: [74, 100] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  mountainCrossbow: { dir: 'jednostki/kusznik_gor', box: [78, 100] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
  forgePriest: { dir: 'jednostki/kaplan_kuzni', box: [74, 100] as const, corpseMax: CORPSE_MAX_W, speed: { chod: 1.4, atak: 1.5, smierc: 1.5, trafienie: 1.4 } },
};

/** Whether the unit is drawn from sprites in the digital ruleset (otherwise: 3D figure or portrait token). */
export const hasSprites = (defId: string): boolean => defId in SPRITES;

interface AnimJson {
  frame: [number, number];
  cols: number;
  fps: number;
  clips: Record<string, number>;
  /** Measured on the standing picture (fractions of the cropped frame): feet line, horizontal middle, body width. */
  feet?: number;
  cx?: number;
  body?: number;
}

export interface SpriteSet {
  spec: SpriteSpec;
  /** Drawn width of the frame (canvas pixels), where the feet stand (fraction of the frame height) and its horizontal middle (fraction of the width). */
  width: number;
  feet: number;
  cx: number;
  /** Width of the body as a fraction of the frame (for the shadow). */
  body: number;
  /** The clip that carries it over the board: the flight loop, the walk loop, or none. */
  moveClip: 'lot' | 'chod' | null;
  frameW: number;
  frameH: number;
  cols: number;
  fps: number;
  /** Frames per clip. */
  frames: Record<string, number>;
  /** The clip sheets, decoded ahead of time (`ImageBitmap`) and filled in as they arrive: a clip whose sheet is not there yet is simply not drawn. */
  sheets: Record<string, CanvasImageSource>;
  /** Settles when every sheet is in (or has failed): the stage can wait for it before a battle starts. */
  ready: Promise<void>;
  /** Loads just these clips' sheets now (in parallel, ahead of the sequential queue behind `ready`): a screen that shows only the walk and the blows does not wait for the rest. */
  ensure: (clips: string[]) => Promise<void>;
  stoi: HTMLImageElement;
  martwy: HTMLImageElement;
  /** How the fallen unit is drawn: scale (a small unit's corpse may span at most CORPSE_MAX_W canvas pixels) and the shift that puts its lowest point on the feet line, in canvas pixels. */
  corpse: { scale: number; dy: number };
}

const cache = new Map<string, Promise<SpriteSet>>();

/** Size in pixels of the visible part (alpha above a threshold, ignoring specks) of a picture, or null when the browser cannot tell. */
function measureBody(im: HTMLImageElement): { w: number; h: number; x0: number; x1: number; y1: number } | null {
  try {
    const c = document.createElement('canvas');
    c.width = im.width;
    c.height = im.height;
    const g = c.getContext('2d');
    if (!g) return null;
    g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    const colHits = new Uint16Array(c.width);
    const rowHits = new Uint16Array(c.height);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) (colHits[x]++, rowHits[y]++);
    for (let x = 0; x < c.width; x++) if (colHits[x] > 2) (x0 = Math.min(x0, x), (x1 = Math.max(x1, x)));
    for (let y = 0; y < c.height; y++) if (rowHits[y] > 2) (y0 = Math.min(y0, y), (y1 = Math.max(y1, y)));
    return x1 < 0 ? null : { w: x1 - x0 + 1, h: y1 - y0 + 1, x0, x1, y1 };
  } catch {
    return null;
  }
}

const image = (src: string) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => fail(new Error(`Nie udało się wczytać ${src}`));
    im.src = src;
  });

/**
 * A clip sheet decoded off the main thread. Drawing a plain <img> decodes it on the main thread at its first draw (200-400 ms for a long clip, a
 * stall in the middle of an attack); an ImageBitmap is decoded before it is needed. The first draw (the upload to the graphics card) is
 * done here too, on a one-pixel canvas, one sheet at a time.
 */
async function decodedSheet(url: string): Promise<CanvasImageSource> {
  if (typeof createImageBitmap !== 'function') return image(url);
  const blob = await (await fetch(url)).blob();
  const bitmap = await createImageBitmap(blob);
  await new Promise((ok) => window.setTimeout(ok, 0));
  try {
    warm ??= document.createElement('canvas').getContext('2d');
    warm?.drawImage(bitmap, 0, 0, 1, 1, 0, 0, 1, 1);
  } catch {
    /* a context that cannot draw it: the stage will find out */
  }
  return bitmap;
}
let warm: CanvasRenderingContext2D | null | undefined;

/** Drops the decoded sheets of every unit not in `keep` (a new battle began): decoded sheets are tens of megabytes each. */
export function releaseSpritesExcept(keep: Iterable<string>) {
  const stay = new Set(keep);
  for (const [id, p] of [...cache.entries()]) {
    if (stay.has(id)) continue;
    cache.delete(id);
    void p.then((set) => {
      for (const s of Object.values(set.sheets)) if (typeof ImageBitmap !== 'undefined' && s instanceof ImageBitmap) s.close();
      set.sheets = {};
    }, () => undefined);
  }
}

export function loadSprites(defId: string): Promise<SpriteSet> {
  let p = cache.get(defId);
  if (!p) {
    const spec = SPRITES[defId];
    p = (async () => {
      const url = (f: string) => asset(`${spec.dir}/${f}`);
      const meta = (await (await fetch(url('anim.json'))).json()) as AnimJson;
      const names = Object.keys(meta.clips);
      const [stoi, martwy] = await Promise.all([image(url('stoi.webp')), image(url('martwy.webp'))]);
      // Fit the visible body (measured on the standing picture) into the unit's box.
      const body = measureBody(stoi);
      const box = spec.box ?? SMALL;
      const width = spec.width ?? (body ? meta.frame[0] * Math.min(box[0] / body.w, box[1] / (body.h * (spec.stretchY ?? 1))) : (box[0] / (meta.body ?? 0.55)));
      const feet = meta.feet ?? spec.feet ?? 0.85;
      const lying = measureBody(martwy);
      const corpseMax = spec.corpseMax ?? (!spec.width && (spec.box ?? SMALL) === SMALL ? CORPSE_MAX_W : 0);
      const lyingW = lying ? (lying.w / meta.frame[0]) * width : 0;
      // The fallen unit is drawn at the scale it stood in (the lying and the standing picture share one canvas size). Matching the standing width
      // shrank every lying creature (the Cyclops to 0.7: reports 40037, 805567), so only a small unit's corpse is held to what two hexes hold.
      let scale = 1;
      if (corpseMax && lyingW * scale > corpseMax) scale = corpseMax / lyingW;
      const dh = (width * meta.frame[1]) / meta.frame[0];
      // The lowest point of the corpse lies on the feet line (a little below it, as the hexes' centres are), whatever the picture's margins.
      const dy = lying ? 2 - scale * (lying.y1 / meta.frame[1] - feet) * dh : 0;
      // The sheets come in one after another, the ones a fight needs first (a blow, a hit, a death), while the unit already stands on the board.
      const sheets: Record<string, CanvasImageSource> = {};
      const order = ['atak', 'atak_wrecz', 'trafienie', 'smierc', 'wzbicie', 'lot', 'chod'];
      const loading: Record<string, Promise<void>> = {};
      const loadSheet = (n: string): Promise<void> =>
        (loading[n] ??= (async () => {
          try {
            sheets[n] = await decodedSheet(url(`${n}.webp`));
          } catch {
            /* a sheet that fails to load: that clip is not drawn */
          }
        })());
      const ready = (async () => {
        for (const n of [...names].sort((a, b) => order.indexOf(a) - order.indexOf(b))) await loadSheet(n);
      })();
      const ensure = async (clips: string[]) => {
        await Promise.all(clips.filter((c) => names.includes(c)).map(loadSheet));
      };
      return {
        spec,
        width,
        feet,
        cx: meta.cx ?? 0.5,
        body: meta.body ?? 0.55,
        moveClip: meta.clips.lot ? 'lot' : meta.clips.chod ? 'chod' : null,
        frameW: meta.frame[0],
        frameH: meta.frame[1],
        cols: meta.cols,
        fps: meta.fps,
        frames: meta.clips,
        sheets,
        ready,
        ensure,
        stoi,
        martwy,
        corpse: { scale, dy },
      } satisfies SpriteSet;
    })();
    p.catch(() => cache.delete(defId));
    cache.set(defId, p);
  }
  return p;
}

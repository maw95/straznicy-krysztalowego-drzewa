// 3D figures of the units (public/modele/<unit id>.glb, made by `make modele` from the print models).
// three.js is loaded only when a figure is first needed, so the game starts as fast as before.
// Every model faces +Z (checked in the gallery, ?figury).

import type { Object3D } from 'three';

const BASE = import.meta.env?.BASE_URL ?? '/';

/** Units that have a model (all 15 now); a unit missing here would keep its portrait token. */
export const FIGURES = new Set([
  'goldDragon',
  'unicornKing',
  'ancientBear',
  'elfDruid',
  'nymph',
  'pegasus',
  'blackDragon',
  'werewolfLord',
  'ironFistOgre',
  'goblinShaman',
  'caveSpider',
  'shadowBat',
  'cyclops',
  'griffin',
  'hydra',
]);

export const hasFigure = (unitId: string) => FIGURES.has(unitId);

type Three = typeof import('three');
let lib: Promise<{ THREE: Three; RoomEnvironment: typeof import('three/examples/jsm/environments/RoomEnvironment.js').RoomEnvironment; load: (url: string) => Promise<Object3D> }> | null = null;

/** three.js, the glTF loader and the meshopt decoder, loaded on first use. */
export function threeLib() {
  lib ??= (async () => {
    const [THREE, { GLTFLoader }, { MeshoptDecoder }, { RoomEnvironment }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js'),
      import('three/examples/jsm/environments/RoomEnvironment.js'),
    ]);
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    return { THREE, RoomEnvironment, load: async (url: string) => (await loader.loadAsync(url)).scene };
  })();
  return lib;
}

/**
 * Something for the figures' metal and gloss to reflect (a soft neutral room): without it the painted
 * metal of the models (armour, gold, dark scales) renders almost black.
 */
export async function lightRoom(renderer: import('three').WebGLRenderer) {
  let room = rooms.get(renderer);
  if (!room) {
    const { THREE, RoomEnvironment } = await threeLib();
    const pmrem = new THREE.PMREMGenerator(renderer);
    room = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    rooms.set(renderer, room);
  }
  return room;
}
/** One room per renderer: it is costly to make, and every picture of that renderer can share it. */
const rooms = new WeakMap<import('three').WebGLRenderer, import('three').Texture>();

const models = new Map<string, Promise<Object3D>>();
/** Height of each loaded figure, in base diameters (a dragon with raised wings is tall, a spider low). */
const heights = new Map<string, number>();

/** The figure's height in base diameters, once it is loaded (until then a typical 1.4). */
export const figureHeight = (unitId: string) => heights.get(unitId) ?? 1.4;

/**
 * A fresh copy of the unit's figure (the model is downloaded once and shared). It stands on its base at
 * (0, 0, 0), facing +Z, scaled so that the base is 1 unit across — on the board all figures share one base
 * size, as printed miniatures do, however tall they are.
 */
export async function loadFigure(unitId: string): Promise<Object3D> {
  let model = models.get(unitId);
  if (!model) {
    model = (async () => {
      const { THREE, load } = await threeLib();
      const scene = await load(`${BASE}modele/${unitId}.glb`);
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(scene);
      const height = box.max.y - box.min.y;
      // The base: the points within the lowest 3% of the model; its width is the widest of them from the middle.
      const centre = box.getCenter(new THREE.Vector3());
      const v = new THREE.Vector3();
      let radius = 0;
      scene.traverse((o) => {
        const mesh = o as import('three').Mesh;
        const pos = mesh.isMesh ? mesh.geometry.getAttribute('position') : null;
        if (!pos) return;
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
          if (v.y < box.min.y + height * 0.03) radius = Math.max(radius, Math.hypot(v.x - centre.x, v.z - centre.z));
        }
      });
      const diameter = radius * 2 || Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
      const holder = new THREE.Group();
      scene.position.set(-centre.x, -box.min.y, -centre.z);
      holder.add(scene);
      holder.scale.setScalar(1 / diameter);
      heights.set(unitId, height / diameter);
      const figure = new THREE.Group();
      figure.add(holder);
      return figure;
    })();
    models.set(unitId, model);
  }
  return (await model).clone();
}

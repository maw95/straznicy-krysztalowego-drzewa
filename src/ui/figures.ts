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
  'braveDuck',
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

/** The easter egg duck has no print model: a little figure built from primitives (base 1 wide, facing +Z). */
function duckModel(THREE: Three): Object3D {
  const g = new THREE.Group();
  const mat = (color: number, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: metal });
  const add = (geo: import('three').BufferGeometry, m: import('three').Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    g.add(mesh);
    return mesh;
  };
  const feather = mat(0xfff0b8);
  const orange = mat(0xf08a24);
  add(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 32), mat(0x6b4a22), 0, 0.03, 0); // base
  add(new THREE.SphereGeometry(0.3, 24, 18), feather, 0, 0.42, -0.02, 1, 0.85, 1.25); // body
  add(new THREE.SphereGeometry(0.2, 24, 18), feather, 0, 0.74, 0.18); // head
  add(new THREE.ConeGeometry(0.07, 0.2, 16), orange, 0, 0.72, 0.4).rotation.x = Math.PI / 2; // beak
  for (const x of [-0.08, 0.08]) add(new THREE.SphereGeometry(0.03, 12, 10), mat(0x111111), x, 0.79, 0.34); // eyes
  add(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd9a82e, 0.8), 0, 0.8, 0.18); // helmet
  add(new THREE.ConeGeometry(0.1, 0.35, 12), feather, 0, 0.5, -0.42).rotation.x = -Math.PI / 2.4; // tail
  for (const x of [-0.3, 0.3]) add(new THREE.SphereGeometry(0.16, 16, 12), mat(0xf4c65a), x, 0.46, -0.05, 0.35, 0.8, 1.2); // wings
  for (const x of [-0.12, 0.12]) add(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8), orange, x, 0.13, 0.05); // legs
  const sword = add(new THREE.BoxGeometry(0.05, 0.05, 0.55), mat(0xdde6ee, 0.9), 0.4, 0.5, 0.3);
  sword.rotation.set(0.5, 0, 0);
  return g;
}

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
      const scene = unitId === 'braveDuck' ? duckModel(THREE) : await load(`${BASE}modele/${unitId}.glb`);
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

// Simplifies a print model for the game (make modele), across UV seams where the texture allows it:
// meshoptimizer's simplifyWithAttributes on the UVs with the Permissive flag, so a seam may be collapsed
// only where the UVs on both sides are close. gltf-transform's own simplify keeps every seam, and models
// with many of them (Pegaz, Pająk, Hydra) stop at about 14% of their triangles, far over 2.5 MB.
// Textures and compression are left to `gltf-transform optimize --simplify false` afterwards.
// Usage: MODULES=<node_modules of @gltf-transform/cli> node simplify_model.mjs <in.glb> <out.glb> [ratio] [error]

const D = process.env.MODULES;
if (!D) throw new Error('MODULES: the node_modules folder that holds @gltf-transform/cli');
const { NodeIO } = await import(`${D}/@gltf-transform/core/dist/index.js`);
const { ALL_EXTENSIONS } = await import(`${D}/@gltf-transform/extensions/dist/index.js`);
const { dedup, weld, prune, compactPrimitive } = await import(`${D}/@gltf-transform/functions/dist/index.js`);
const { MeshoptSimplifier } = await import(`${D}/meshoptimizer/index.js`);
await MeshoptSimplifier.ready;

const [src, out, ratio = '0.02', error = '0.01'] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
await doc.transform(dedup(), weld());
for (const mesh of doc.getRoot().listMeshes())
  for (const prim of mesh.listPrimitives()) {
    const indices = prim.getIndices();
    const uv = prim.getAttribute('TEXCOORD_0');
    const index = new Uint32Array(indices.getArray());
    const target = Math.floor((index.length * Number(ratio)) / 3) * 3;
    const positions = new Float32Array(prim.getAttribute('POSITION').getArray());
    const [kept] = uv
      ? MeshoptSimplifier.simplifyWithAttributes(index, positions, 3, new Float32Array(uv.getArray()), 2, [1, 1], null, target, Number(error), ['Permissive'])
      : MeshoptSimplifier.simplify(index, positions, 3, target, Number(error), []);
    indices.setArray(kept);
    compactPrimitive(prim);
  }
await doc.transform(prune());
await io.write(out, doc);

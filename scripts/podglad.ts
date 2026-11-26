// A review page of the new factions (Dzikie Stado, Żelazny Klan, Bractwo Przypływu, Wolna Kompania): every character's card as the game draws it, all of its
// animations in loops, buttons for its attack and death sounds, and the settlement screen with everything built, per faction.
// Usage: npx tsx scripts/podglad.ts [faction ...]   -> .tmp/podglad/index.html (open it from the file system; it points at ../../public/assets)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { openGame } from './browser/game';
import { FACTION_NAMES, UNITS, type FactionId } from '../src/engine/data';
import { SPRITES } from '../src/ui/sprites';

const FACTIONS = (process.argv.slice(2).length ? process.argv.slice(2) : ['herds', 'clans', 'tides', 'free']) as FactionId[];
const OUT = '.tmp/podglad';
const ASSETS = 'public/assets';
mkdirSync(`${OUT}/karty`, { recursive: true });
mkdirSync(`${OUT}/osady`, { recursive: true });

const units = (f: FactionId) => Object.values(UNITS).filter((u) => u.side === f).sort((a, b) => Number(b.kind === 'hero') - Number(a.kind === 'hero'));

// 1. Cards and settlements through the browser.
const settlementShot = async (f: FactionId) => {
  const g = await openGame(`dev=1&steps=1&mode=pvp&races=${f},horde&objective=control&seed=3&empire=1&size=medium&shape=rectangle`, { scale: 1 });
  const p = g.page;
  try {
    await p.getByRole('button', { name: /Jestem G1/ }).click({ timeout: 3000 }).catch(() => undefined);
    await p.locator('[data-dev-scene="settlement"]').click({ timeout: 20000 });
    await p.locator('[data-enter-settlement]').click({ timeout: 45000 });
    await p.locator('[data-settlement]').waitFor({ timeout: 30000 });
    await p.getByRole('button', { name: 'Zamknij', exact: true }).first().click({ timeout: 2000 }).catch(() => undefined); // the dev panel
    await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${OUT}/osady/${f}.jpg`, type: 'jpeg', quality: 82 });
  } catch (e) {
    console.log('settlement', f, 'FAIL', String(e).slice(0, 200));
  }
  await g.close();
};

const cardShots = async () => {
  const g = await openGame('cards=goldDragon&w=200', { scale: 1 });
  try {
    for (const f of FACTIONS) for (const u of units(f)) {
      await g.page.goto(`http://localhost:5180/?cards=${u.id}&w=420`);
      const card = g.page.locator('.card-sheen').first();
      await card.waitFor({ timeout: 10000 });
      await g.page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
      await g.page.evaluate(() => document.fonts.ready);
      await g.page.waitForTimeout(200);
      await card.screenshot({ path: `${OUT}/karty/${u.id}.png`, omitBackground: true });
    }
  } finally { await g.close(); }
};

if (!process.env.SKIP_SHOTS) {
  await cardShots();
  for (const f of FACTIONS) await settlementShot(f);
}

// 2. The page.
interface Clip { name: string; frames: number; sheet: string; fps: number; lunge?: [number, number] }
interface UnitEntry { id: string; name: string; kind: string; stats: string; ability: string; frame: [number, number]; cols: number; clips: Clip[]; stills: string[]; recoil?: { still: string; feet: number; cx: number }; sounds: { atak?: string; smierc?: string } }
const entries: Record<string, UnitEntry[]> = {};
for (const f of FACTIONS) {
  entries[f] = [];
  for (const u of units(f)) {
    const spec = SPRITES[u.id];
    const dir = spec ? `${ASSETS}/${spec.dir}` : null;
    const e: UnitEntry = {
      id: u.id, name: u.name, kind: u.kind === 'hero' ? 'bohater / dowódca' : 'pomocnik',
      stats: `Ż ${u.hp} · A ${u.attack} · Sz ${u.speed}${u.size === 2 ? ' · 2 pola' : ''}`,
      ability: u.abilityName ? `${u.abilityName}: ${u.abilityText ?? ''}` : '',
      frame: [0, 0], cols: 1, clips: [], stills: [], sounds: {},
    };
    if (dir && existsSync(`${dir}/anim.json`)) {
      const a = JSON.parse(readFileSync(`${dir}/anim.json`, 'utf8'));
      e.frame = a.frame; e.cols = a.cols;
      for (const [name, frames] of Object.entries<number>(a.clips)) {
        if (name === 'trafienie' && spec.recoil) continue; // drawn in code instead (SpriteSpec.recoil): shown below as a loop of the still
        if (existsSync(`${dir}/${name}.webp`)) e.clips.push({ name, frames, sheet: `../../${dir}/${name}.webp`, fps: (a.fps ?? 12) * (spec.speed?.[name] ?? 1), lunge: name === 'atak' && spec.lunge ? [spec.lunge.jabs, spec.lunge.reach * (a.body ?? 0.5)] : undefined });
      }
      for (const s of ['stoi', 'martwy']) if (existsSync(`${dir}/${s}.webp`)) e.stills.push(`../../${dir}/${s}.webp`);
      if (spec.recoil) e.recoil = { still: `../../${dir}/stoi.webp`, feet: a.feet ?? 0.84, cx: a.cx ?? 0.5 };
    }
    for (const k of ['atak', 'smierc'] as const) if (existsSync(`${ASSETS}/dzwieki/jednostki/${u.id}_${k}.mp3`)) e.sounds[k] = `../../${ASSETS}/dzwieki/jednostki/${u.id}_${k}.mp3`;
    entries[f].push(e);
  }
}

const html = `<!doctype html><html lang="pl"><meta charset="utf-8"><title>Podgląd frakcji</title>
<style>
body{margin:0;background:#1d1812;color:#eadfc8;font:15px/1.4 Georgia,serif}
header{position:sticky;top:0;z-index:5;background:#2a2118;border-bottom:2px solid #8a6a2f;padding:10px 20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
header a{color:#f0cf7a;text-decoration:none;border:1px solid #8a6a2f;border-radius:6px;padding:4px 10px}
label{margin-left:auto;font-size:13px}
h2{margin:28px 20px 8px;color:#f0cf7a;border-bottom:1px solid #5a4824}
.osada img{max-width:calc(100% - 40px);margin:0 20px;border:2px solid #5a4824;border-radius:6px}
.unit{display:flex;gap:18px;margin:14px 20px;padding:12px;background:#261f17;border:1px solid #4a3a20;border-radius:8px;align-items:flex-start}
.unit>img{height:430px;flex:none}
.info{min-width:0;flex:1}
.info h3{margin:0 0 2px;color:#f0cf7a}
.meta{color:#bfae8a;font-size:13px;margin-bottom:6px}
.clips{display:flex;flex-wrap:wrap;gap:10px}
.clip{background:#14100c;border:1px solid #3a2e1a;border-radius:6px;padding:6px;text-align:center;font-size:12px}
.clip canvas{display:block;background:repeating-conic-gradient(#2c261d 0 25%,#221d16 0 50%) 0 0/16px 16px}
button{background:#3a2e1a;color:#f0cf7a;border:1px solid #8a6a2f;border-radius:5px;padding:4px 10px;margin:6px 6px 0 0;cursor:pointer}
button:hover{background:#4d3d22}
.none{color:#d88;font-size:13px}
</style>
<header><b>Podgląd frakcji</b>${FACTIONS.map((f) => `<a href="#${f}">${FACTION_NAMES[f]}</a>`).join('')}
<label>Skala animacji <input type="range" id="zoom" min="0.3" max="1.2" step="0.05" value="0.6"></label>
<label><input type="checkbox" id="mirror"> lustro (strona wroga)</label></header>
${FACTIONS.map((f) => `<section id="${f}"><h2>${FACTION_NAMES[f]}</h2>
<div class="osada"><div class="meta" style="margin:0 20px 6px">Ekran osady z wybudowanymi wszystkimi budynkami (scena panelu testowego)</div>${existsSync(`${OUT}/osady/${f}.jpg`) ? `<img loading="lazy" src="osady/${f}.jpg">` : '<div class="none" style="margin:0 20px">brak zrzutu osady</div>'}</div>
${entries[f].map((e) => `<div class="unit" data-id="${e.id}"><img loading="lazy" src="karty/${e.id}.png" alt="${e.name}"><div class="info"><h3>${e.name}</h3><div class="meta">${e.kind} · ${e.stats}${e.ability ? '<br>' + e.ability : ''}</div>
<div class="clips">${e.stills.map((s) => `<div class="clip"><canvas data-still="${s}"></canvas>${s.includes('martwy') ? 'martwy' : 'stoi'}</div>`).join('')}${e.clips.map((c) => `<div class="clip"><canvas data-sheet="${c.sheet}" data-frames="${c.frames}" data-cols="${e.cols}" data-fw="${e.frame[0]}" data-fh="${e.frame[1]}" data-fps="${c.fps}"${c.lunge ? ` data-lunge="${c.lunge.join(',')}"` : ''}></canvas>${c.name}</div>`).join('')}${e.recoil ? `<div class="clip"><canvas data-still="${e.recoil.still}" data-recoil="1" data-feet="${e.recoil.feet}" data-cx="${e.recoil.cx}"></canvas>trafienie (w kodzie)</div>` : ''}${e.clips.length || e.stills.length ? '' : '<span class="none">brak sprite\'ów (żeton z portretem)</span>'}</div>
<div>${e.sounds.atak ? `<button data-snd="${e.sounds.atak}">▶ dźwięk ataku</button>` : ''}${e.sounds.smierc ? `<button data-snd="${e.sounds.smierc}">▶ dźwięk śmierci</button>` : ''}${!e.sounds.atak && !e.sounds.smierc ? '<span class="none">brak dźwięków</span>' : ''}</div></div></div>`).join('')}</section>`).join('')}
<script>
const zoom=document.getElementById('zoom'),mirror=document.getElementById('mirror');
const imgs=new Map();const vis=new Set();
const img=(src)=>{let i=imgs.get(src);if(!i){i=new Image();i.src=src;imgs.set(src,i);}return i;};
const size=(c)=>{const w=+c.dataset.fw||0,h=+c.dataset.fh||0;if(w){c.width=Math.round(w*zoom.value);c.height=Math.round(h*zoom.value);}};
const io=new IntersectionObserver((es)=>es.forEach((e)=>e.isIntersecting?vis.add(e.target):vis.delete(e.target)),{rootMargin:'200px'});
document.querySelectorAll('canvas').forEach((c)=>{io.observe(c);if(c.dataset.still){const i=img(c.dataset.still);i.onload=()=>{c.dataset.fw=i.naturalWidth;c.dataset.fh=i.naturalHeight;size(c);};}else size(c);});
zoom.oninput=()=>document.querySelectorAll('canvas').forEach(size);
const t0=performance.now();
function tick(){const t=(performance.now()-t0)/1000;
 for(const c of vis){const x=c.getContext('2d');const flip=mirror.checked;
  if(c.dataset.still){const i=img(c.dataset.still);if(!i.complete||!c.width)continue;x.clearRect(0,0,c.width,c.height);x.save();if(flip){x.translate(c.width,0);x.scale(-1,1);}
   if(c.dataset.recoil){const u=((t*1000)%1600)/760;let r=0;if(u<1)r=u<0.2?Math.sin(u/0.2*Math.PI/2):0.5+0.5*Math.cos((u-0.2)/0.8*Math.PI);
    const px=c.width*(+c.dataset.cx),py=c.height*(+c.dataset.feet);x.translate(px-r*c.width*0.045,py);x.rotate(-r*0.12);x.translate(-px,-py);if(u<0.35)x.filter='brightness('+(1+0.45*(1-u/0.35))+')';}
   x.drawImage(i,0,0,c.width,c.height);x.restore();continue;}
  const i=img(c.dataset.sheet);if(!i.complete||!c.width)continue;const n=+c.dataset.frames,cols=+c.dataset.cols,fw=+c.dataset.fw,fh=+c.dataset.fh;
  const f=Math.floor(t*(+c.dataset.fps))%n;x.clearRect(0,0,c.width,c.height);x.save();if(flip){x.translate(c.width,0);x.scale(-1,1);}
  if(c.dataset.lunge){const [j,r]=c.dataset.lunge.split(',').map(Number);const tt=(t*(+c.dataset.fps)%n)/n;const u=(tt-0.1)/0.75;let o=0;if(u>0&&u<1){const k=(u*j)%1;o=k<0.3?Math.sin(k/0.3*Math.PI/2):0.5+0.5*Math.cos((k-0.3)/0.7*Math.PI);}x.translate(o*r*c.width,0);}
  x.drawImage(i,(f%cols)*fw,Math.floor(f/cols)*fh,fw,fh,0,0,c.width,c.height);x.restore();}
 requestAnimationFrame(tick);}
tick();
let cur=null;document.addEventListener('click',(e)=>{const b=e.target.closest('[data-snd]');if(!b)return;if(cur)cur.pause();cur=new Audio(b.dataset.snd);cur.play();});
</script></html>`;
writeFileSync(`${OUT}/index.html`, html);
console.log(`${OUT}/index.html: ${FACTIONS.map((f) => `${f} ${entries[f].length} units (${entries[f].filter((e) => e.clips.length).length} animated)`).join(', ')}`);

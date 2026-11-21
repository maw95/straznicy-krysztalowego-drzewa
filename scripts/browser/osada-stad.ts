// The settlement screen of the Wild Herd (the pictures of osady/herds_* and land_herds) -> .tmp/osada-stad.png. Usage: npx tsx scripts/browser/osada-stad.ts [built buildings, comma separated]
import { openGame } from './game';

const built = process.argv[2] ?? 'barracks,market,forge,hospital,tavern,treasury,magic,walls,spark,hoofStone,pastures,refuge';
const game = await openGame(`steps=0&seed=3&mode=pvp&races=herds,horde&objective=control&empire=1&size=medium&shape=rectangle&gold=90&res=9&built=${built}`, { scale: 0.6 });
try {
  const p = game.page;
  // Hot-seat veil ("Przekaż urządzenie"): the first player takes the device.
  await p.getByRole('button', { name: /Jestem G1/ }).click({ timeout: 8000 }).catch(() => undefined);
  await p.waitForTimeout(300);
  await p.locator('[data-enter-settlement]').click({ timeout: 10000 });
  await p.locator('[data-settlement]').waitFor();
  await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => (i.onload = i.onerror = ok))))));
  await p.waitForTimeout(500);
  await p.screenshot({ path: '.tmp/osada-stad.png' });
  console.log('broken images:', JSON.stringify(await p.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src.split('/').pop()))));
} finally { await game.close(); }

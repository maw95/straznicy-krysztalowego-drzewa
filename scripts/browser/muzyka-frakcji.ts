// Faction music: which track the game asks for on the map (hero on the Herd's land), in the Herd's settlement and back. Records every `new Audio(src)`. -> console
// Usage: [FRAKCJA=tides] npx tsx scripts/browser/muzyka-frakcji.ts
import { openGame } from './game';

const game = await openGame(`steps=0&seed=3&mode=pvp&races=${process.env.FRAKCJA ?? 'herds'},horde&objective=control&empire=1&size=medium&shape=rectangle&gold=90&res=9`, { view: 'desktop', scale: 0.6 });
const p = game.page;
try {
  await p.addInitScript(() => {
    const w = window as unknown as { __audio: string[] };
    w.__audio = [];
    const Orig = window.Audio;
    // @ts-expect-error a recording stand-in for the constructor
    window.Audio = function (src?: string) { w.__audio.push(String(src).split('/').pop() ?? ''); return new Orig(src); };
  });
  await p.reload();
  await p.getByRole('button', { name: /Jestem G1/ }).click({ timeout: 8000 }).catch(() => undefined);
  await p.mouse.click(300, 300);
  await p.waitForTimeout(2500);
  const heard = () => p.evaluate(() => (window as unknown as { __audio: string[] }).__audio);
  console.log('on the map:', await heard());
  await p.locator('[data-enter-settlement]').click({ timeout: 8000 });
  await p.locator('[data-settlement]').waitFor();
  await p.waitForTimeout(2500);
  console.log('in the settlement:', await heard());
  console.log('errors', game.errors);
} catch (e) {
  console.log('FAIL', String(e).slice(0, 400));
} finally {
  await game.close();
}

// Puts the English dictionary on the screen: every text of the page (and its title, aria-label, placeholder and alt) is translated while the language is
// English, and put back when it is Polish again. New and changed parts of the page are translated as React draws them (a MutationObserver), so no
// component needs to know about languages.

import { getLang, subscribeLang } from './lang';
import { translate } from './translate';

const ATTRS = ['title', 'data-title', 'aria-label', 'placeholder', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT']);
/** Text that is only in Polish on purpose (the manual) carries `translate="no"`: neither it nor anything inside it is touched. */
const kept = (n: Node): boolean => ((n.nodeType === Node.ELEMENT_NODE ? (n as Element) : n.parentElement)?.closest('[translate="no"]') ?? null) !== null;
/** What a node said in Polish, and what we wrote over it (a change that is not our own write is a new Polish text). */
const original = new WeakMap<Node, string>();
const written = new WeakMap<Node, string>();
const attrOriginal = new WeakMap<Element, Record<string, string>>();
const attrWritten = new WeakMap<Element, Record<string, string>>();

function doText(node: Text, en: boolean): void {
  const cur = node.data;
  if (written.get(node) === cur) return;
  original.set(node, cur);
  written.delete(node);
  if (!en) return;
  const out = translate(cur);
  if (out !== null && out !== cur) {
    written.set(node, out);
    node.data = out;
  }
}

function doAttrs(el: Element, en: boolean): void {
  for (const a of ATTRS) {
    const cur = el.getAttribute(a);
    if (cur === null) continue;
    const w = attrWritten.get(el) ?? {};
    if (w[a] === cur) continue;
    (attrOriginal.get(el) ?? attrOriginal.set(el, {}).get(el)!)[a] = cur;
    delete w[a];
    attrWritten.set(el, w);
    if (!en) continue;
    const out = translate(cur);
    if (out !== null && out !== cur) {
      w[a] = out;
      el.setAttribute(a, out);
    }
  }
}

function walk(root: Node, en: boolean): void {
  if (root.nodeType === Node.TEXT_NODE) return kept(root) ? undefined : doText(root as Text, en);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (SKIP.has(el.tagName) || el.getAttribute('translate') === 'no') return;
  doAttrs(el, en);
  for (const child of Array.from(el.childNodes)) walk(child, en);
}

/** Puts every translated node back to its Polish text (the language went back to Polish). */
function restore(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    const t = root as Text;
    if (written.has(t) && written.get(t) === t.data) {
      t.data = original.get(t) ?? t.data;
      written.delete(t);
    }
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  const w = attrWritten.get(el);
  const o = attrOriginal.get(el);
  if (w && o) for (const a of Object.keys(w)) if (el.getAttribute(a) === w[a]) { el.setAttribute(a, o[a]); delete w[a]; }
  for (const child of Array.from(el.childNodes)) restore(child);
}

let started = false;

/** Starts translating the page (once); follows the language and the changes of the page. */
export function installDomTranslator(root: HTMLElement = document.body): void {
  if (started || typeof MutationObserver === 'undefined') return;
  started = true;
  const en = () => getLang() === 'en';
  const observer = new MutationObserver((records) => {
    const e = en();
    for (const r of records) {
      if (r.type === 'characterData') kept(r.target) || doText(r.target as Text, e);
      else if (r.type === 'attributes') kept(r.target) || doAttrs(r.target as Element, e);
      else for (const n of Array.from(r.addedNodes)) kept(n) || walk(n, e);
    }
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  const all = () => {
    if (en()) walk(root, true);
    else restore(root);
  };
  subscribeLang(all);
  all();
}

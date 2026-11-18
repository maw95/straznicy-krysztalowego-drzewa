// The manual of the computer game ("Zasady i karty" → "Instrukcja"): a table of contents with links, a small search by keywords, and the text itself.
// The text is src/content/instrukcja.pl.md or instrukcja.en.md (the translation, same chapters), chosen by the language; manualDoc.ts cuts it into chapters.

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import mdEn from '../content/instrukcja.en.md?raw';
import mdPl from '../content/instrukcja.pl.md?raw';
import { useLang } from '../i18n/lang';
import { asset } from './common';
import { StatText } from './markers';
import { highlightParts, parseManual, searchManual, type Block, type Entry, type Inline } from './manualDoc';

const DOCS = { pl: parseManual(mdPl), en: parseManual(mdEn) };
const anchor = (id: string) => `man-${id}`;

function Text({ v, query }: { v: string; query: string }) {
  // Gold, resources and stats are shown as their icons ("3 zł", "2 drewna", "+1 A").
  if (!query) return <StatText text={v} />;
  return (
    <>
      {highlightParts(v, query).map((p, i) => (p.hit ? <mark key={i}>{p.v}</mark> : <Fragment key={i}><StatText text={p.v} /></Fragment>))}
    </>
  );
}

function Inlines({ inl, query, go }: { inl: Inline[]; query: string; go: (id: string) => void }) {
  return (
    <>
      {inl.map((i, k) => {
        switch (i.t) {
          case 'b':
            return <b key={k}><Text v={i.v} query={query} /></b>;
          case 'i':
            return <i key={k}><Text v={i.v} query={query} /></i>;
          case 'code':
            return <code key={k}>{i.v}</code>;
          case 'link':
            return (
              <a key={k} href={`#${anchor(i.to)}`} className="manual-link" onClick={(e) => { e.preventDefault(); go(i.to); }}>
                <Text v={i.v} query={query} />
              </a>
            );
          default:
            return <Text key={k} v={i.v} query={query} />;
        }
      })}
    </>
  );
}

function Blocks({ blocks, query, go }: { blocks: Block[]; query: string; go: (id: string) => void }) {
  const inl = (x: Inline[]) => <Inlines inl={x} query={query} go={go} />;
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'p':
            return <p key={i}>{inl(b.inl)}</p>;
          case 'quote':
            return <blockquote key={i}>{inl(b.inl)}</blockquote>;
          case 'ul':
            return <ul key={i}>{b.items.map((it, k) => <li key={k}>{inl(it)}</li>)}</ul>;
          case 'ol':
            return <ol key={i}>{b.items.map((it, k) => <li key={k}>{inl(it)}</li>)}</ol>;
          case 'table':
            return (
              <div key={i} className="manual-table-wrap">
                <table>
                  <thead><tr>{b.head.map((c, k) => <th key={k}>{inl(c)}</th>)}</tr></thead>
                  <tbody>{b.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{inl(c)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            );
        }
      })}
    </>
  );
}

export function ManualView() {
  const [lang] = useLang();
  const DOC = DOCS[lang];
  const [query, setQuery] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const [active, setActive] = useState(DOC.entries[0]?.id ?? '');
  const bodyRef = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => searchManual(DOC, query), [DOC, query]);
  const searching = query.trim().length > 0;
  // A new search shows its results from the top, not from where the text was scrolled to.
  useEffect(() => {
    if (searching) bodyRef.current?.scrollTo({ top: 0 });
  }, [query, searching]);

  /** Scrolls the text to an entry; a search in progress ends first, so that the whole text is there. */
  const go = (id: string) => {
    setQuery('');
    setTocOpen(false);
    setTimeout(() => {
      const el = bodyRef.current?.querySelector<HTMLElement>(`#${anchor(id)}`);
      if (el && bodyRef.current) bodyRef.current.scrollTo({ top: el.offsetTop - 6, behavior: 'smooth' });
      setActive(id);
    }, 0);
  };

  // The chapter being read lights up in the table of contents.
  useEffect(() => {
    const root = bodyRef.current;
    if (!root || searching || typeof IntersectionObserver === 'undefined') return;
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (list) => {
        for (const e of list) seen.set(e.target.id.replace(/^man-/, ''), e.isIntersecting);
        const first = DOC.entries.filter((x) => x.level === 2).find((x) => seen.get(x.id));
        if (first) setActive(first.id);
      },
      { root, rootMargin: '0px 0px -75% 0px' },
    );
    root.querySelectorAll('section[data-chapter]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [searching, DOC]);

  const chapters = DOC.entries.filter((e) => e.level === 2);
  const partsOf = (c: Entry) => DOC.entries.filter((e) => e.level === 3 && e.chapter === c.id);

  return (
    <div className="manual" data-manual>
      <aside className={`manual-side ${tocOpen ? 'open' : ''}`}>
        <div className="manual-search">
          <input
            type="text"
            value={query}
            placeholder="Szukaj w instrukcji…"
            aria-label="Szukaj w instrukcji"
            data-manual-search
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.stopPropagation(); setQuery(''); } }}
          />
          {searching && <button className="manual-clear" aria-label="Wyczyść wyszukiwanie" onClick={() => setQuery('')}>×</button>}
        </div>
        <button className="manual-toc-toggle" aria-expanded={tocOpen} onClick={() => setTocOpen(!tocOpen)}>
          Spis treści {tocOpen ? '▴' : '▾'}
        </button>
        <nav className="manual-toc" aria-label="Spis treści" data-manual-toc translate="no" lang={lang}>
          {chapters.map((c) => (
            <div key={c.id}>
              <a href={`#${anchor(c.id)}`} className={`manual-toc-ch ${active === c.id ? 'on' : ''}`} onClick={(e) => { e.preventDefault(); go(c.id); }}>{c.title}</a>
              {partsOf(c).map((p) => (
                <a key={p.id} href={`#${anchor(p.id)}`} className="manual-toc-part" onClick={(e) => { e.preventDefault(); go(p.id); }}>{p.title}</a>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="manual-body" ref={bodyRef}>
        {searching ? (
          <div data-manual-results>
            <h2 className="manual-results-title">{hits.length ? `Wyniki dla „${query.trim()}”: ${hits.length}` : `Brak wyników dla „${query.trim()}”`}</h2>
            {!hits.length && lang === 'en' && <p translate="no">Try a shorter word or another form (for example "forg" instead of "forge"). The contents always lead to the whole chapter.</p>}
            {!hits.length && lang !== 'en' && <p>Spróbuj krótszego słowa albo innej formy (na przykład „kuźn” zamiast „kuźnia”). Spis treści zawsze prowadzi do całego rozdziału.</p>}
            {hits.map(({ entry, snippet }) => (
              <a key={entry.id} href={`#${anchor(entry.id)}`} className="manual-hit" translate="no" lang={lang} onClick={(e) => { e.preventDefault(); go(entry.id); }}>
                <span className="manual-hit-crumb">{entry.level === 3 ? `${entry.chapterTitle} › ` : ''}<b><Text v={entry.title} query={query} /></b></span>
                <span className="manual-hit-text"><Text v={snippet} query={query} /></span>
              </a>
            ))}
          </div>
        ) : (
          <>
            {chapters.map((c) => (
              <section key={c.id} data-chapter id={anchor(c.id)} translate="no" lang={lang}>
                <h2>{c.title}</h2>
                <Blocks blocks={c.blocks} query="" go={go} />
                {partsOf(c).map((p) => (
                  <div key={p.id} id={anchor(p.id)}>
                    <h3>{p.title}</h3>
                    <Blocks blocks={p.blocks} query="" go={go} />
                  </div>
                ))}
                <a href="#top" className="manual-up" onClick={(e) => { e.preventDefault(); bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); setTocOpen(true); }}>{lang === 'en' ? '↑ back to the contents' : '↑ do spisu treści'}</a>
              </section>
            ))}
            <p className="manual-print">
              Instrukcja <b>wersji planszowej</b> do wydrukowania:{' '}
              <a href={asset('manual/index.html')} target="_blank" rel="noreferrer">otwórz w nowej karcie</a>
              {lang === 'en' ? <span translate="no"> (Polish only)</span> : null}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

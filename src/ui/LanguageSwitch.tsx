// The flags that switch the language: Poland and the United Kingdom, as small pictures (the flag emoji are letters on Windows). In the top right corner of
// the title screen and the main menu; the options of the game have the same pair inline.

import { LANGS, useLang, type Lang } from '../i18n/lang';

const NAMES: Record<Lang, string> = { pl: 'Polski', en: 'English' };

function Flag({ lang }: { lang: Lang }) {
  return lang === 'pl' ? (
    <svg viewBox="0 0 24 16" width="26" height="17" aria-hidden="true" style={{ display: 'block', borderRadius: 2 }}>
      <rect width="24" height="8" fill="#fff" />
      <rect y="8" width="24" height="8" fill="#DC143C" />
    </svg>
  ) : (
    <svg viewBox="0 0 60 40" width="26" height="17" aria-hidden="true" style={{ display: 'block', borderRadius: 2 }}>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" strokeWidth="3" />
      <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="13" />
      <path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="8" />
    </svg>
  );
}

export function LanguageSwitch({ inline = false }: { inline?: boolean }) {
  const [lang, setLang] = useLang();
  return (
    <div className={inline ? 'lang-switch inline' : 'lang-switch'} data-lang-switch role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l} className={`btn plate parch lang-flag ${lang === l ? 'on' : ''}`} data-lang={l} aria-pressed={lang === l} title={NAMES[l]} aria-label={NAMES[l]} onClick={() => setLang(l)}>
          <Flag lang={l} />
        </button>
      ))}
    </div>
  );
}

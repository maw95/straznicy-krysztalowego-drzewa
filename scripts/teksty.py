"""Inventory of the texts a translation would have to cover (backlog item 16): every string literal and JSX text in src/ that reads as Polish,
counted per file and sorted into kinds (engine data, engine messages thrown to the player, log lines, interface). Prints a Markdown report.
Usage: python3 scripts/teksty.py   (prints an inventory of Polish texts in src/ to stdout)"""
import os
import re
import sys

POLISH = re.compile(r'[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]')
WORDY = re.compile(r'[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{3,}')
LITERAL = re.compile(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"|`((?:[^`\\]|\\.)*)`", re.S)
JSX_TEXT = re.compile(r'>([^<>{}\n]*[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{3,}[^<>{}\n]*)<')
COMMON = {'nie', 'jest', 'się', 'gracz', 'runda', 'bohater', 'koniec', 'wybierz', 'zasady', 'opcje', 'poziom', 'atak', 'ruch', 'osada', 'mana', 'czary', 'gra', 'cel'}


def polish(text):
    if POLISH.search(text):
        return True
    words = {w.lower() for w in WORDY.findall(text)}
    return bool(words & COMMON) and ' ' in text.strip()


def strip_comments(src):
    src = re.sub(r'/\*.*?\*/', lambda m: '\n' * m.group(0).count('\n'), src, flags=re.S)
    return re.sub(r'(^|[^:\'"`])//[^\n]*', r'\1', src)


def kind(path, line):
    if path.startswith('src/engine/'):
        if 'throw new Error' in line:
            return 'komunikaty odmowy (Error)'
        if re.search(r'\blog\(', line):
            return 'dziennik gry (log)'
        return 'dane i opisy silnika'
    if path.startswith('src/online/'):
        return 'klient online'
    return 'interfejs'


rows, kinds, examples = [], {}, {}
for root, _, files in os.walk('src'):
    for name in sorted(files):
        if not name.endswith(('.ts', '.tsx')):
            continue
        path = os.path.join(root, name)
        src = strip_comments(open(path, encoding='utf8').read())
        count, chars = 0, 0
        for n, line in enumerate(src.split('\n'), 1):
            found = [next(g for g in m.groups() if g is not None) for m in LITERAL.finditer(line)]
            if name.endswith('.tsx'):
                found += [m.group(1).strip() for m in JSX_TEXT.finditer(line)]
            for text in found:
                if len(text) < 3 or not polish(text) or text.startswith(('./', '../')):
                    continue
                count += 1
                chars += len(text)
                k = kind(path, line)
                kinds.setdefault(k, [0, 0])
                kinds[k][0] += 1
                kinds[k][1] += len(text)
                examples.setdefault(k, [])
                if len(examples[k]) < 4 and 12 < len(text) < 90 and '${' not in text:
                    examples[k].append(f'`{path}:{n}` „{text}”')
        if count:
            rows.append((path, count, chars))

total = sum(r[1] for r in rows), sum(r[2] for r in rows)
print('## Podsumowanie (wygenerowane: `python3 scripts/teksty.py`)\n')
print(f'Razem: **{total[0]} tekstów**, około **{total[1]} znaków** w {len(rows)} plikach `src/`.\n')
print('| Rodzaj | Tekstów | Znaków | Przykłady |\n|---|---:|---:|---|')
for k, (c, ch) in sorted(kinds.items(), key=lambda x: -x[1][1]):
    print(f'| {k} | {c} | {ch} | {"; ".join(examples.get(k, [])[:2])} |')
print('\n## Pliki (od największego)\n')
print('| Plik | Tekstów | Znaków |\n|---|---:|---:|')
for path, c, ch in sorted(rows, key=lambda r: -r[2]):
    print(f'| `{path}` | {c} | {ch} |')

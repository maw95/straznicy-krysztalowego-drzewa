"""Edits assets.json as text so the rest of the file keeps its hand formatting (json.dump would rewrite hundreds of lines).
  from assets_json import put, remove      # run from the repo root
  put(entry)    replaces the entry with the same "id" in place, or appends it at the end of the list
  remove(id)    deletes an entry (e.g. a placeholder that was replaced)"""
import json
import re

PATH = 'assets.json'
TAIL = '\n  ]\n}'


def _bounds(s: str, aid: str):
    m = re.search(r'\n    \{\n      "id": "' + re.escape(aid) + r'",', s)
    if not m:
        return None
    start = m.start() + 1
    return start, s.index('\n    }', start) + len('\n    }')


def _dump(e: dict) -> str:
    return json.dumps(e, ensure_ascii=False, indent=2).replace('\n', '\n    ')


def put(e: dict) -> None:
    s = open(PATH).read()
    b = _bounds(s, e['id'])
    if b:
        s = s[:b[0]] + '    ' + _dump(e) + s[b[1]:]
    else:
        body = s.rstrip('\n')
        assert body.endswith(TAIL)
        s = body[:-len(TAIL)] + ',\n    ' + _dump(e) + TAIL + '\n'
    json.loads(s)
    open(PATH, 'w').write(s)


def remove(aid: str) -> None:
    s = open(PATH).read()
    b = _bounds(s, aid)
    if not b:
        return
    a, e = b
    s = s[:a] + s[e + 2:] if s[e:e + 2] == ',\n' else s[:a].rstrip(',\n') + s[e:]
    json.loads(s)
    open(PATH, 'w').write(s)

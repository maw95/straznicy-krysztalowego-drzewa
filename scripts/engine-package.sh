#!/usr/bin/env bash
# The game engine (src/engine) as an npm package attached to a game release on GitHub.
# The game server (straznicy-krysztalowego-drzewa-backend) installs it by that file's URL,
# so it plays by exactly the rules of the released game. Built from the tag, not the working copy.
#
#   scripts/engine-package.sh 1.3.0           # pack and attach to release 1.3.0
#   scripts/engine-package.sh 1.3.0 --no-upload   # only pack (into .tmp/)
set -euo pipefail

tag="${1:?podaj tag wydania, np. 1.3.0}"
upload="${2:-}"
git rev-parse -q --verify "refs/tags/$tag" >/dev/null || { echo "Nie ma taga $tag." >&2; exit 1; }

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/package" .tmp
git archive "$tag" src/engine | tar -x -C "$work/package"
cat > "$work/package/package.json" <<JSON
{
  "name": "straznicy-engine",
  "version": "$tag",
  "description": "Silnik gry Strażnicy Kryształowego Drzewa (zasady, mapa, boty) z wydania $tag — źródła TypeScript",
  "type": "module",
  "license": "UNLICENSED",
  "repository": "github:maw95/straznicy-krysztalowego-drzewa",
  "gitHead": "$(git rev-parse "$tag^{commit}")"
}
JSON
out=".tmp/straznicy-engine-$tag.tgz"
tar -czf "$out" -C "$work" package
echo "Pakiet: $out ($(du -h "$out" | cut -f1))"

if [ "$upload" != "--no-upload" ]; then
  # Never replace a published package: the server's package-lock.json holds its checksum.
  if gh release view "$tag" --json assets --jq '.assets[].name' | grep -qx "straznicy-engine-$tag.tgz"; then
    echo "Wydanie $tag ma już pakiet silnika — nie podmieniam go (serwer ma zapisaną jego sumę kontrolną)." >&2
    exit 1
  fi
  gh release upload "$tag" "$out"
  echo "Dołączony do wydania: https://github.com/maw95/straznicy-krysztalowego-drzewa/releases/download/$tag/straznicy-engine-$tag.tgz"
fi

"""Adds the assets of one unit to assets.json (see docs/POTOK_ANIMACJI.md).

Usage: python3 scripts/animacje/manifest.py <unit folder> <manifest json>
The manifest json (written while generating) looks like:
  {"unit": "ancientBear", "reference": "asset_...", "items": {"stoi": {"asset": "asset_...", "prompt": "...", "model": "...", "kind": "obraz"}, ...}}
Every item becomes one entry "<folder>/<name>" with the files public/assets/jednostki/<folder>/<name>.webp.
"""
import json
import sys

folder, manifest = sys.argv[1:3]
m = json.load(open(manifest))
d = json.load(open("assets.json"))
have = {a["id"] for a in d["assets"]}
for name, it in m["items"].items():
    aid = f"{folder}/{name}"
    if aid in have:
        d["assets"] = [a for a in d["assets"] if a["id"] != aid]
    d["assets"].append(
        {
            "id": aid,
            "pliki": [f"public/assets/jednostki/{folder}/{name}.webp"],
            "typ": it["kind"],
            "narzedzie": "Scenario (plan Starter)",
            "model": it["model"],
            "scenario_asset": it["asset"],
            **({"odniesienie": m["reference"]} if m.get("reference") else {}),
            "prompt": it["prompt"],
            "data": "2026-11-05",
            "ai": True,
            "licencja": "Scenario, plan płatny: pełna licencja komercyjna bez tantiem",
        }
    )
json.dump(d, open("assets.json", "w"), ensure_ascii=False, indent=2)
print(len(m["items"]), "entries for", folder)

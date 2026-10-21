#!/bin/bash
# Eksport wszystkich elementów do druku: 15 podstawek, kryształ, znacznik rundy (STL) + podglądy PNG.
# Użycie: bash docs/druk3d/eksport.sh   (wyniki w docs/druk3d/stl/ i docs/druk3d/podglad/)
set -e
cd "$(dirname "$0")"
mkdir -p stl podglad

# plik | frakcja | krótka nazwa na tylnej ściance (ok. 13 mm szerokości)
UNITS="
zloty_smok|przymierze|Złoty Smok
krol_jednorozcow|przymierze|Jednorożec
prastary_niedzwiedz|przymierze|Niedźwiedź
elf_druid|przymierze|Elf Druid
nimfa|przymierze|Nimfa
pegaz|przymierze|Pegaz
czarny_smok|horda|Czarny Smok
wladca_wilkolakow|horda|Wilkołak
ogr_zelazna_piesc|horda|Ogr
goblin_szaman|horda|Goblin
pajak_jaskiniowy|horda|Pająk
nietoperz_cienia|horda|Nietoperz
cyklop|straznik|Cyklop
gryf|straznik|Gryf
hydra|straznik|Hydra
"

CAM="--camera=0,-6,2,55,0,20,75 --imgsize=600,450 --colorscheme=Tomorrow"

echo "$UNITS" | while IFS='|' read -r file faction name; do
  [ -z "$file" ] && continue
  openscad -q -D "frakcja=\"$faction\"" -D "nazwa=\"$name\"" -o "stl/podstawka_$file.stl" podstawka.scad
  echo "podstawka: $file"
done

# Podgląd jednej podstawki każdej frakcji (z przodu i z tyłu).
for f in przymierze horda straznik; do
  openscad -q -D "frakcja=\"$f\"" -D 'nazwa="Złoty Smok"' $CAM -o "podglad/podstawka_$f.png" podstawka.scad
done
openscad -q -D 'frakcja="przymierze"' -D 'nazwa="Złoty Smok"' --camera=0,6,2,55,0,200,75 --imgsize=600,450 --colorscheme=Tomorrow -o podglad/podstawka_tyl.png podstawka.scad

for r in krysztal znacznik; do
  openscad -q -D "rodzaj=\"$r\"" -o "stl/$r.stl" krysztal.scad
  openscad -q -D "rodzaj=\"$r\"" --camera=0,0,8,60,0,25,70 --imgsize=400,500 --colorscheme=Tomorrow -o "podglad/$r.png" krysztal.scad
done
echo "gotowe: $(ls stl | wc -l) plików STL"

// Podstawka figurki — Strażnicy Kryształowego Drzewa (docs/FIGURKI_SPECYFIKACJA.md, rozdz. 2).
// Sześciokąt 30 mm między płaskimi bokami, ustawiony jak pola areny (płaski bok z przodu i z tyłu).
// Na górze, przy przedniej krawędzi, wypukły herb frakcji; na środku gniazdo na kołek figurki;
// na tylnej ściance (opcjonalnie) nazwa jednostki.
//
// Eksport: openscad -D 'frakcja="przymierze"' -D 'nazwa="Złoty Smok"' -o zloty_smok.stl podstawka.scad

frakcja = "przymierze";   // "przymierze" | "horda" | "straznik"
nazwa = "";               // napis na tylnej ściance; pusty = bez napisu

szerokosc = 30;           // mm między płaskimi bokami
wysokosc = 3;             // mm
fazka = 0.5;              // mm, fazka górnej krawędzi
herb_wypuklosc = 0.6;     // mm ponad górną powierzchnię
herb_rozmiar = 8;         // mm, szerokość herbu
kolek_srednica = 3.2;     // mm (kołek figurki Ø 3 mm + luz)
kolek_glebokosc = 2;      // mm
napis_wysokosc = 2.2;     // mm (ścianka ma 3 mm)

$fn = 48;

// Promień do wierzchołka sześciokąta o danym rozstawie płaskich boków.
function r_wierzcholek(f) = f / sqrt(3);

module szesciokat(f) {
  // Płaskie boki z przodu (−Y) i z tyłu (+Y), jak pola areny z płaskimi bokami u góry i u dołu.
  circle(r = r_wierzcholek(f), $fn = 6);
}

module bryla() {
  hull() {
    linear_extrude(wysokosc - fazka) szesciokat(szerokosc);
    translate([0, 0, wysokosc - fazka]) linear_extrude(fazka) szesciokat(szerokosc - 2 * fazka);
  }
}

// ---------------------------------------------------------------- herby (2D, w okręgu o średnicy 1)

module herb_drzewo() {
  // Korona z trzech kół, pień i dwa korzenie.
  translate([0, 0.12]) {
    circle(d = 0.42);
    translate([-0.2, -0.05]) circle(d = 0.34);
    translate([0.2, -0.05]) circle(d = 0.34);
  }
  translate([-0.05, -0.45]) square([0.1, 0.42]);
  polygon([[-0.05, -0.33], [-0.25, -0.47], [-0.18, -0.47], [-0.02, -0.38]]);
  polygon([[0.05, -0.33], [0.25, -0.47], [0.18, -0.47], [0.02, -0.38]]);
}

module herb_helm() {
  // Kopuła hełmu z osłoną nosa i dwa rogi wygięte do góry.
  difference() {
    union() {
      translate([0, -0.05]) circle(d = 0.5);
      translate([-0.25, -0.35]) square([0.5, 0.3]);
    }
    translate([-0.18, -0.36]) square([0.13, 0.14]);
    translate([0.05, -0.36]) square([0.13, 0.14]);
  }
  for (s = [-1, 1]) mirror([s < 0 ? 1 : 0, 0])
    hull() {
      translate([0.22, 0.02]) circle(d = 0.14);
      translate([0.42, 0.25]) circle(d = 0.06);
    }
}

module herb_krysztal() {
  // Kryształ: wydłużony sześciokąt z ostrymi końcami.
  polygon([[0, 0.48], [0.22, 0.2], [0.22, -0.2], [0, -0.48], [-0.22, -0.2], [-0.22, 0.2]]);
}

module herb() {
  scale([herb_rozmiar, herb_rozmiar])
    if (frakcja == "horda") herb_helm();
    else if (frakcja == "straznik") herb_krysztal();
    else herb_drzewo();
}

// ---------------------------------------------------------------- model

difference() {
  bryla();
  // Gniazdo na kołek figurki, na środku.
  translate([0, 0, wysokosc - kolek_glebokosc]) cylinder(d = kolek_srednica, h = kolek_glebokosc + 0.01);
  // Nazwa wycięta w tylnej ściance (0,4 mm).
  if (nazwa != "")
    translate([0, szerokosc / 2 - 0.4, (wysokosc - napis_wysokosc) / 2]) rotate([90, 0, 180])
      linear_extrude(1) text(nazwa, size = napis_wysokosc, halign = "center", font = "Liberation Sans:style=Bold");
}
// Herb przy przedniej krawędzi (−Y), wypukły.
translate([0, -szerokosc / 2 + herb_rozmiar / 2 + 1.2, wysokosc - 0.01]) linear_extrude(herb_wypuklosc) herb();

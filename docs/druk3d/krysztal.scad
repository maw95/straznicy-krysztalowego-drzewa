// Kryształ Opieki i znacznik rundy — Strażnicy Kryształowego Drzewa (docs/FIGURKI_SPECYFIKACJA.md, rozdz. 4).
// Graniastosłup sześciokątny z ostrym czubkiem (5 ścianek szlifu) i krótkim stożkiem od spodu.
// Najlepiej drukować z przezroczystej, niebieskiej żywicy, pionowo, na podporach od spodu.
//
// Kryształ (3 szt.):      openscad -D 'rodzaj="krysztal"' -o krysztal.stl krysztal.scad
// Znacznik rundy (1 szt.): openscad -D 'rodzaj="znacznik"' -o znacznik_rundy.stl krysztal.scad

rodzaj = "krysztal";      // "krysztal" | "znacznik"

// Kryształ: 10 mm między płaskimi bokami, 18 mm wysokości.
// Znacznik: 8 mm, 14 mm, a dolna część zwęża się, żeby wchodził w gniazdo toru rund.
szerokosc = rodzaj == "znacznik" ? 8 : 10;
wysokosc = rodzaj == "znacznik" ? 14 : 18;
czubek = rodzaj == "znacznik" ? 4 : 5.5;     // wysokość ostrza
spod = rodzaj == "znacznik" ? 3 : 1.5;       // wysokość zwężenia od spodu
spod_skala = rodzaj == "znacznik" ? 0.7 : 0.85;
zaokraglenie = 0.4;       // mm, czubek nie jest ostry jak igła (figurki dla dzieci)

r = szerokosc / sqrt(3);  // promień do wierzchołka

module szesciokat(skala = 1) {
  scale([skala, skala]) circle(r = r, $fn = 6);
}

hull() {
  // Zwężony spód.
  linear_extrude(0.01) szesciokat(spod_skala);
  // Graniastosłup.
  translate([0, 0, spod]) linear_extrude(wysokosc - spod - czubek) szesciokat();
  // Ostrze: zaokrąglony czubek nad środkiem.
  translate([0, 0, wysokosc - zaokraglenie]) sphere(r = zaokraglenie, $fn = 16);
}

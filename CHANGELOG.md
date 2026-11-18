# Historia zmian

Co się zmieniało w kolejnych wersjach gry. Wersja to tag w repozytorium (np. `1.1.0`) i pole `version` w `package.json`; numer widać w menu głównym, a kliknięcie go otwiera tę historię w grze.

Każdy wpis to jeden commit, a skrót commita stoi w nawiasie na końcu wpisu (commit nie zna własnego skrótu, więc dopisuję go w następnym commicie albo przy tagowaniu). Zmiany, które nie trafiły jeszcze do żadnej wersji, są w sekcji „W przygotowaniu”. Nagłówek wersji ma postać `## numer — RRRR-MM-DD`, bo gra czyta ten plik.

## W przygotowaniu

- Okna w osadzie (targ, szpital, kuźnia i inne) mają ozdobną złotą ramkę z narożnikami zamiast beżowej z brązową obwódką, krzyżyk w rogu i zamykają się też kliknięciem poza oknem. Przyciski wymiany, sprzedaży i budowy siedlisk mają złotą obwódkę i niebieski gradient zamiast szarego tła z czarną ramką.
- Ekran osady przebudowany na wzór Heroes III: wybudowane budynki stoją w krajobrazie jak jego część (różnej wielkości, na swoich miejscach, bez podpisów i ramek), po najechaniu świeci złota poświata wzdłuż ich sylwetki, a niewybudowanych nie widać. Wybudowane siedliska stworzeń też stoją w krajobrazie. Budować i rozbudowywać można tylko w Radzie Osady. Kliknięcie koszar i Rady otwiera osobny ekran, a pozostałych budynków okno. Dolna część ekranu to jeden ozdobny pasek przy krawędzi z garnizonem, bohaterem, złotem i opisem budynku pod myszką; okno osady mieści się już w ekranie, więc „Wyjdź z osady” zawsze widać.
- Instrukcja gry komputerowej ma pełne tłumaczenie na angielski: przy angielskim języku gry „Zasady i karty” → „Instrukcja” pokazuje angielski tekst z tym samym spisem treści i wyszukiwarką; nazwy poziomów, jednostek i budynków są takie same jak w grze.
- Poziomy złożoności są numerowane cyframi rzymskimi (Spacer I … Imperium VII) wszędzie: w nazwach poziomów, oknie zasad, podpowiedziach „Własnych ustawień”, dzienniku, instrukcji i na liście stołów online.
- Kreator: poziomy złożoności zamiast „Poziom 0…6” w opisie mają ozdobną cyfrę rzymską w rogu karty (Spacer I, Przygoda II, … Imperium VII), a „Własne ustawienia” znak zapytania. Wszystkie odznaki są tej samej wielkości i okrągłe (także „VII”).
- Nowa instrukcja gry komputerowej w „Zasady i karty” → „Instrukcja”: opisuje wszystkie poziomy (od Spaceru do Imperium), tryby, cele, kampanię, Ekspedycję i grę online. Ma spis treści z linkami do rozdziałów i wyszukiwarkę po słowach kluczowych (pomija polskie litery i końcówki). Instrukcja planszówki do druku zostaje dostępna na dole strony. Na razie tylko po polsku.
- Kreator: przyciski liczby graczy mają większe cyfry w tych samych kolorach co kody wielkości mapy (S, M, L).
- Kreator: przyciski wielkości mapy mają jednakowy rozmiar, a „Bardzo duża” mieści się w jednej linii.
- Poziom trudności „Bardzo trudny” ma nową ikonę (głowa smoka z przodu).
- Wybór poziomu gry: nowa ikona „Księstwa” (dwór z młynem, tartakiem, wozem z rudą i katapultą).
- Wybór poziomu gry: ikony „Królestwo” i „Imperium” nie pokazują już kawałków sąsiednich ikon na brzegach.
- Menu główne: nowe ikony przycisków „Nowa gra”, „Kampania”, „Ekspedycja” i „Wczytaj grę”; przyciski mają jednakowy rozmiar i stoją po dwa w rzędzie.
- Angielska wersja gry ma własne logo: „Gleamroot: Wardens of the Crystal Tree” (ekran startowy, menu, kreator i ekran online).
- Przyciski zmiany języka to same flagi, bez beżowego tła i ramki.

## 2.10.0 — 2026-11-17

- Balans poziomów 4–6, trudność Trudny: komputer jest silniejszy na krótkich mapach (tam gracz wygrywał za łatwo), a w rywalizacji na średnich i długich mapach nieco słabszy (tam wygrywał za rzadko).

- Rywalizacja dla 7 i 8 graczy (po czterech na stronę): każda frakcja dostaje czwartego bohatera (Przymierze: Dzielna Kaczka, Horda: Wódz Hordy). Stoły na 7–8 graczy są dostępne na poziomach do Księstwa (na poziomach z karczmą ci bohaterowie są dowódcami do wynajęcia), także online.

- Ekspedycja (nowa karta w menu nowej gry): osiem bitew na arenie 6 na 6 pod rząd, jedno życie. Po każdej wygranej wybierasz jedną z trzech relikwii (więcej many, dodatkowy czar, dodatkowy artefakt), a komputer rośnie w siłę z etapu na etap; na końcu czeka Czarny Smok. Wyprawa zapisuje się sama, profil (ukończone wyprawy, najlepszy wynik) odblokowuje kolejnych bohaterów, a „Wyprawa dnia” ma ten sam przebieg dla wszystkich i ranking dla zalogowanych.

- Aplikacja (PWA): grę można zainstalować z przeglądarki (Opcje → „Zainstaluj grę”; na iPhonie: Safari → „Udostępnij” → „Dodaj do ekranu początkowego”), otwiera się na pełnym ekranie, a po pierwszej wizycie działa także bez internetu przeciw komputerowi. Nowe wydanie gry podmienia starą kopię samo.

- Arena 6 na 6 działa też online: opcja „Wielkość bitwy” w kreatorze stołu online, napis „Arena 6 na 6” w pokoju i osobny ranking (zakładki pod tabelą rankingu).

## 2.9.0 — 2026-11-17

- Telefon: kreator przechodzi dalej po wyborze celu i mapy, nowa strona zawsze zaczyna się od góry, przyciski „Wstecz” i „Dalej” oraz przyciski poziomów mają równe rozmiary. Po rozpoczęciu gry na telefonie poziomo pasek i panel boczne są mniejsze, więc mapa i arena mają więcej miejsca.

- Kampania „Powrót Światła”: cztery scenariusze Przymierza Świtu na ręcznie rysowanych mapach, z fabułą, wskazówkami i odblokowywaniem kolejnych (karta „Kampania” w menu nowej gry).

- Gra mówi po angielsku i po polsku. Język wybiera się klikając flagę w prawym górnym rogu ekranu startowego i menu (albo w Opcjach, także w trakcie gry); na początku jest taki, jak w przeglądarce, a wybór gra zapamiętuje.

- Telefon: opisy, które na komputerze widać po najechaniu myszą (mana, punkty ruchu, dochód, pola mapy), pokazują się po dotknięciu. Przyciski na dolnym pasku, lista osad i plecak bohatera mają 44 px.

- Osada wygląda jak miasto z Heroes III: budynki stoją tarasami wokół Rady Osady, a bohater, który jest w osadzie, ma w niej swój portret. Samouczek i instrukcja opisują okno osady i drzewko budynków.

- Imperium: Koszary stoją w każdej osadzie od początku, a siedliska jednostek wiszą w drzewku pod Koszarami jedno za drugim (siedlisko wyższego poziomu wymaga niższego; wybór jednej jednostki wyklucza drugą).

- Poziom Imperium: zamiast drzewek frakcji każda frakcja ma własne budynki. Przymierze: Kapliczka Świtu (Blask Świtu, 4 poziomy), Szkółka Drzewa (drewno) i Krąg Gaju (pełna mana). Horda: Jama Krwi (Żądza Krwi, 4 poziomy), Szabrownia (złoto z łupów) i Wilcze Legowisko (+1 ruch). Bez Kapliczki lub Jamy frakcja nie ma swojej mechaniki. Wszystko widać w drzewku pod Radą Osady.

- Arena: w pełnej 6 na 6 sam wybierasz dwa czary dla bohatera (z sześciu). Łatwy komputer jest trochę mocniejszy w 6 na 6, a na poziomie Bardzo trudny w szybkiej arenie 3 na 3 dobiera o jeden skarb więcej.

- Budynki w osadzie: koniec z limitem „jeden budynek na rundę” na wszystkich poziomach gry. Budować można tyle, na ile starcza złota i surowców.

- Na telefonie trzymanym poziomo dolny pasek mapy nie gubi już przycisków „Opcje” i „Zgłoś błąd” (zawija się do drugiego rzędu), a przyciski muzyki, pełnego ekranu i przybliżania mapy mają 44 px, tyle co palec.

- Rada Osady ma własne obrazy: altana z liści i kryształu u Przymierza, warowna sala wojenna z paleniskiem u Hordy.

- Osada otwiera się na cały ekran. Rada Osady na krajobrazie pokazuje drzewko budynków: co jest wybudowane, co można kupić, co jest za drogie i co czeka na inny budynek (z liniami zależności).

- Budynki osady tworzą drzewo: Kuźnia, Fosa i Mury oraz Szpital wymagają najpierw Koszar, Wieża maga Szpitala, a Karczma Targu (przycisk pokazuje, czego brakuje).

- Statystyki i punkty: pełna arena 6 na 6 liczy się osobno od szybkiej 3 na 3 (własny wiersz w tabeli) i daje o połowę więcej punktów za wygraną.

- Arena 6 na 6, poziom Bardzo trudny: komputer gra bez błędów, a jego bohater ma więcej many, jeden czar więcej i dwa dodatkowe artefakty (wygrane gracza w symulacjach ok. 24%).

- Arena „6 na 6 (pełna)” (kreator, tryb Arena, gra bez sieci): każda strona wybiera bohatera i pięciu pomocników z puli ośmiu, bohater bierze artefakt do wyboru z trzech i dostaje dwa czary z kręgów I–II.

- Nowe ozdobniki okien: złote narożniki ramek z szafirem, Księga czarów jako otwarta księga ze skórzaną okładką i dwiema stronami, okno skarbów jako otwarta skrzynia z czerwonym aksamitem.

- Okno „Zasady i karty” jest aktualne: w Jednostkach są pomocnicy z rekrutacji, dowódcy z karczmy i legendarne jednostki poziomów 3–6, w Artefaktach zestawy z premiami, a Lokacje na mapie mają osadę, kopalnie, chatkę, młyn, studnię, składnicę, mury i Odłamek Iskry z informacją, od którego poziomu występują.

- Okno osady: garnizon jest stale widoczny (nie dopiero pod murami): trzy miejsca na jednostki, krótka zasada (broni osady pod nieobecność bohatera, wróg musi go pokonać, w bitwie dowodzi nim właściciel) i przyciski „Zostaw w garnizonie” / „Zabierz do drużyny”.

- Mapa: dwuklik (na telefonie dwa szybkie dotknięcia) na własną osadę otwiera jej okno, także gdy bohater stoi gdzie indziej; pojedynczy klik zaznacza pole i po chwili rusza bohatera jak dotąd.

- Lista osad w panelu bocznym mapy nie ma już beżowego tła: w każdym wierszu miniaturka osady (inna dla Przymierza i Hordy), nazwa i liczba jednostek garnizonu.

- Nowe ikony poziomów Wyprawa, Osada i Księstwo w kreatorze nowej gry (malowane medale w stylu pozostałych) oraz nowe ikony i animacje czarów Grom, Klątwa, Tarcza, Natchnienie i Przyspieszenie.

- Własne ustawienia: ekran pojawia się od razu po wyborze karty (przed trybem) i ma pięć sekcji: poziomy i mechaniki (osady, surowce, magia, Relikt), bohater (ruch 2–5), bitwa, limit rund bitwy oraz horda i skarby; ustawienia zależne od trybu (dodatkowy bohater Hordy) są na stronie graczy. Gry na własnych ustawieniach nie dają punktów rankingu.

- Kreator nowej gry: wszystkie sekcje (liczba graczy, wielkość mapy, trudność, a także ustawienia własne) mają ten sam układ: duży tytuł i pod nim przyciski wyśrodkowane w jednej linii, bez nachodzenia na siebie.

- Magia: trzy kręgi czarów. Nowa „Arcywieża maga” (trzecie ulepszenie wieży, 11 zł + 4 rudy + 4 Pyły) uczy czarów trzeciego kręgu: Grom, Klątwa, Tarcza i Natchnienie; w pierwszym kręgu pojawia się Przyspieszenie (+2 ruchu na mapie). Komputer też ich używa.

- Bardzo trudny: komputer nie ma już więcej Życia jednostek; zamiast tego zaczyna z dodatkowymi surowcami (3 drewna, 3 rudy, 2 Pyłu) i dwoma artefaktami dla głównego bohatera, nadal z większymi dochodami i 2 skarbami więcej.

- Obrona osady: garnizon bez bohatera prowadzi w bitwie gracz-właściciel (wybór jednostek, rozstawienie i ruchy), a nie komputer; przy kilku graczach tej strony ten, którego bohater ruszał się ostatnio (człowiek przed botem).

- Relikt: Pierwotną Iskrę może wznieść tylko bohater, który sam niesie wszystkie Odłamki i stoi we własnej osadzie. Odłamki można przekazać sojusznikowi na tym samym lub sąsiednim polu (przycisk „Przekaż Odłamki” w panelu bohatera); komputer też je zbiera u jednego bohatera.

- Punkty rankingu za wygraną na poziomie Bardzo trudnym to 1,5 razy punkty za tę samą grę na Trudnym (na arenie 5 zamiast 4).

- Gdy w celu Kontrola, Podbój lub Relikt upłynie limit rund i żadna strona nie ma przewagi (remis), gra kończy się remisem zamiast wygraną Hordy; to samo w celach Boss i Artefakt w PvP (w koopie nadal przegrywacie, gdy upłynie limit rund); w grze o kryształy limit rund nadal wygrywa Horda.

- Komputer używa Zwoju Teleportacji: skacze na pomoc sojusznikowi przyciśniętemu przez silniejszego lub kilku wrogów, a gdy nikt nie jest w zasięgu, skraca sobie drogę do przeciwnika.

- Dolny pasek złota i surowców (drewno, ruda, Pył) nie ma już tła ani ramki, a ikony i liczby są dużo większe.

- Strona `?sprity` pokazuje wszystkie animacje jednostek (chód, lot, atak, trafienie, śmierć, odrodzenie) w pętli, w rozmiarze z areny, z linią stóp i możliwością zwolnienia; przydatna do oceny klipów bez rozgrywania bitwy.

- Mapa przygody: kapliczki, obozy najemników, skrzynie, kopalnie (złota, rudy, Pyłu), tartak, chatki, młyny, studnie, składy i Odłamki Iskry mają własne kafelki z unikalnymi grafikami zamiast okrągłych ikon na polu.

- Właściciela kopalni lub osady pokazuje duży herb jego frakcji (ten sam co na karcie bohatera); obiekt bez właściciela nie ma żadnego znaku.

- Bitwa: przyciski „Magia” i „Skarby” mają ten sam rozmiar, obwódkę i kolory; „Magia” ma malowaną księgę czarów zamiast różdżki. „Magia” otwiera duże okno w stylu księgi czarów (ikony, nazwy, koszt i opis czarów), a „Skarby” okno w stylu drewnianej skrzyni (to samo okno jest teraz na mapie).

- Mapa: w panelu bocznym jest rząd „Drugi bohater”: klik w jego portret otwiera jego kartę.

- Nowe ikony poziomów trudności (królik, wilk, niedźwiedź, smok): rysunki od autora zamiast prostych sylwetek.

## 2.8.0 — 2026-11-16

- Okno osady (poziom Imperium): każde siedlisko jednostki ma własną ikonę, a trzy stopnie drzewka frakcji (Przymierza i Hordy) mają ikony.

- Srebrny Lis, Driada Łuczniczka, Biały Jeleń i Sowa Świtu mają prawdziwe animacje; Wódz Hordy dostał animację ataku.

- Behemot Zagłady, Feniks Świtu, Goblin Procarz, Troll Jaskiniowy, Gargulec i Wiwerna Cienia mają prawdziwe animacje (chód lub lot, atak, trafienie, śmierć).

- Ramki okien mają nowe, proste narożniki (złoty łuk z niebieskim kryształkiem) dopasowane do ramki.

- Okładka (menu gry i wydruk): bez starego napisu u góry, z aktualnym logo Gleamroot.

- Oblężenie: mur, brama i wieżyczki mają teraz wygląd frakcji obrońcy: biały marmur ze złotem i zielenią u Przymierza, czarne żelazo z kolcami i czerwonymi sztandarami u Hordy.

- Troll Jaskiniowy ma animację ataku, a Driada Łuczniczka i Feniks Świtu animację trafienia (z łukiem w ręce). Odrodzenie Feniksa z popiołów gra teraz własny klip na arenie.

- Efekty świetlne: czary bitewne (Magiczny Pocisk, Leczenie, Spowolnienie, Kamienna Skóra, Kula Ognia, Przyspieszenie), uderzenia katapulty i fosa w oblężeniu, odrodzenie Feniksa oraz na mapie czary Wizja i Wrota, podniesienie Odłamka i wzniesienie Pierwotnej Iskry mają teraz własne animowane efekty.

- Dowódcy poziomu 5 (Łowczyni Gaju, Mędrzec Gaju, Kapitan Kuszników, Szaman Cieni) mają prawdziwe animacje chodu, ataku, trafienia i śmierci.

- Ranking: wygrana na poziomie Królestwo liczy się z mnożnikiem 1,45, a na poziomie Imperium 1,55 (Księstwo 1,35), bo na wyższych poziomach jest więcej do rozegrania.

- Poziom trudności wybiera się teraz w każdym trybie, także w rywalizacji (Trudny i Bardzo trudny: komputerowi przeciwnicy ze skarbami, większym Życiem i dochodami) i na arenie; w grze online też (stół może mieć Bardzo trudny).

- Nowy poziom trudności „Bardzo trudny”: jak Trudny, ale komputer ma przewagę: jednostki o 20% więcej Życia, o 2 losowe skarby więcej na start i o połowę większe dochody (poziomy z osadami). W kooperacji (Horda) i przy stole z botami; na arenie komputer ma o 20% więcej Życia. Poziom Trudny jest teraz dostępny także w rywalizacji.

- Wybór trudności: ikony poziomów (królik, wilk, niedźwiedź) są teraz jednokolorowymi rysunkami wektorowymi, większymi, nad nazwą poziomu (jak litery S, M przy wyborze mapy). Poziom Trudny ma niedźwiedzia zamiast smoka.

- Arena: czary rzuca się teraz z okna „Magia” (fioletowa ikona różdżki obok „Skarbów” w prawym dolnym rogu; pokazuje manę). W oknie widać wszystkie czary bohatera, a te, na które brakuje many, są wyszarzone.
- Arena: przy wyborze celu czaru znika zasięg ruchu i ataku jednostki; możliwe cele mają fioletową obwódkę, a nad nimi kursor zmienia się w różdżkę. Esc anuluje wybór czaru.

- Targ (poziom Księstwo i wyżej): można wymienić 1 surowiec na 1 inny jednym kliknięciem (sprzedaż i kupno po cenach targu, widać dopłatę w złocie). Sprzedaż surowców za złoto i kupno zostają jak były.

- Mapa przygody: kopalnia, tartak i źródło Pyłu przejęte przez frakcję mają przy ikonie jej chorągiewkę (zieloną dla Przymierza, czerwoną dla Hordy). W oknie dochodu kopalnie mają nazwę i „pole” zamiast samych współrzędnych.

- Mapa przygody: gdy bohater weźmie złoto lub surowce (młyn, składnica, skrzynia, chatka, łup), nad jego polem unosi się napis z ikoną, np. „+2 zł”, i gra dźwięk monet.

- Mapa przygody: prawy przycisk myszy na polu z osadą, kopalnią, tartakiem, młynem, składnicą, studnią, chatką albo Odłamkiem pokazuje teraz także ten obiekt (nazwę, co daje i do kogo należy), a nie tylko typ pola i koszt ruchu.

- Prawy przycisk myszy (albo długie przytrzymanie na telefonie) na artefakcie w oknie „Wyposażenie i plecak” i na lalce wyposażenia pokazuje okienko z jego opisem: nazwa, miejsce, rzadkość, tekst i premia zestawu.

- Arena: podczas bitwy nie widać już paska ze złotem i surowcami na dole ekranu (nie jest tam potrzebny); na mapie przygody pasek zostaje.

- Arena: podświetlony zasięg (po przytrzymaniu Ctrl) uwzględnia teraz także ogon jednostek dwupolowych (smoków, niedźwiedzia…), więc pokazuje wszystkie pola, które naprawdę może zaatakować.

- Rycerz Świtu i Wódz Hordy mają prawdziwe animacje (Wódz bez ataku; chód, trafienie, śmierć), a zdolność Odrodzenie z Popiołów Feniksa własną ikonę.

- Dowódcy, jednostki legendarne i alternatywne z poziomów 5–6 mają własne dźwięki ataku i śmierci (16 jednostek, 32 nagrania).

- Samouczek ma kroki dla poziomów Królestwo (dowódca, czary) i Imperium (Odłamki, drzewko frakcji, siedliska).

- Dowódcy, jednostki legendarne i alternatywne (16 jednostek poziomów 5–6) stoją na arenie jako malowane postacie zamiast żetonów z portretem. Na razie bez animacji: postać przesuwa się, cios trafia od razu.

- Poziomy 4–6: nowe dźwięki (katapulta, strzał wieżyczki, fosa, podniesienie Odłamka, wzniesienie Pierwotnej Iskry, Wrota, najem dowódcy), własne karty w kreatorze dla Podboju, Reliktu, Królestwa i Imperium, ikony mechanik frakcji, garnizonu i siedlisk, obrazek rozbudowanej wieży maga oraz pełne ilustracje Feniksa Świtu i Behemota Zagłady.

- Imperium: **dwie jednostki na każdym z poziomów 2–5 i siedliska**. Frakcja wybiera, którą jednostkę danego poziomu chce mieć, budując jej siedlisko w koszarach; drugie siedlisko tego poziomu jest wtedy wykluczone do końca gry. Osiem nowych jednostek: Srebrny Lis, Sowa Świtu, Driada Łuczniczka i Biały Jeleń u Przymierza; Goblin Procarz, Gargulec, Troll Jaskiniowy i Wiwerna Cienia u Hordy. Komputer też wybiera siedliska.

- Imperium: **mechaniki frakcji, drzewko frakcji i legendarne jednostki**. Przymierze ma Blask Świtu (co rundę bitwy leczy najciężej ranną jednostkę), Horda Żądzę Krwi (po śmierci wroga wszystkie jej jednostki biją mocniej). Obie mechaniki rozwija trzystopniowe drzewko frakcji kupowane w osadzie za złoto i Gwiezdny Pył. W rozbudowanych koszarach czeka jedna legendarna jednostka: Feniks Świtu (odradza się raz na bitwę) albo Behemot Zagłady (trafia dwóch wrogów naraz).

- Nowy poziom 6 **„Imperium”** (początek): **Odłamki Pierwotnej Iskry** i cel **Relikt**. Odłamki leżą na mapie, bohater zabiera je wejściem na pole, a zwycięzca bitwy bohaterów przejmuje Odłamki pokonanego. Frakcja z kompletem Odłamków wznosi w swojej osadzie Sanktuarium (Przymierze: +2 Życia dla wszystkich jednostek) albo Czarną Kuźnię (Horda: +1 Ataku). W celu „Relikt” ten budynek wygrywa grę. Komputer zbiera Odłamki, poluje na niosących i buduje.

- Królestwo: **typy bohaterów, specjalności i rozgałęzienia umiejętności**. Wojownik zyskuje Życie z każdym poziomem, łowca Atak co dwa poziomy, mędrzec manę i moc czarów. Każdy bohater ma własną specjalność (np. dodatkowy ruch, złoto za wygrane bitwy, mocniejsze czary). Moc, Hart, Lekkość i Dowódcę można dokończyć na dwa sposoby: przy trzecim stopniu pojawia się dodatkowa karta rozgałęzienia. Poziomy 1–4 bez zmian.

- Królestwo: **magia**. Bohaterowie mają manę i rzucają czary: w bitwie jeden na aktywację (Magiczny Pocisk, Leczenie, Spowolnienie, Kamienna Skóra, Kula Ognia, Zryw), na mapie Wizję i Wrota do własnej osady. Czarów uczy nowy budynek, wieża maga; bohaterowie główni znają Magiczny Pocisk od początku, a mędrcy czarują mocniej. Komputer też czaruje.

- Nowy poziom 5 **„Królestwo”** (początek): **drugi bohater**. W karczmie (nowy budynek) każdy gracz najmuje jednego dowódcę: wojownika, łucznika albo mędrca z własnym imieniem. Dowódca ma własny pionek, turę, doświadczenie, umiejętności i artefakty. Gdy polegnie, traci artefakty, ale można go wykupić w karczmie; śmierć bohatera głównego pozostaje ostateczna. Komputer też najmuje dowódców. W kreatorze gry są karty „Królestwo” i (na razie pusta) „Imperium”.

- Tryb rodzinny na poziomach Osada i Księstwo: **autopilot warstw**. Dziecko wędruje i walczy, a gospodarką zajmuje się dorosły z tej samej frakcji (autopilot nie wydaje już wspólnego złota za jego plecami) albo, gdy dorosłego nie ma, autopilot. W turze dziecka okno osady jest zamknięte i widać, kto nią zarządza.

- Księstwo: nowy cel gry **Podbój**. Wygrywa strona, która na koniec rundy trzyma wszystkie osady na ziemi wroga (jego stolicę i osady na jego połowie mapy); przy limicie rund liczy się, kto trzyma ponad połowę. Komputer zdobywa osady, szturmuje garnizony i broni swoich. Cel wybiera się w kreatorze gry przy poziomie Księstwo.

- Księstwo: **obrona osady**. Bohater może zostawić w swojej osadzie do trzech pomocników jako garnizon; wróg musi ich pokonać, żeby osadę zająć. Nowy budynek **Fosa** (kolce: kto wejdzie, traci turę i Życie) rozbudowuje się w **Mury z wieżyczkami**: mur z bramą zatrzymuje piechotę, a dwie wieżyczki co rundę strzelają do napastników. Atakujący dostaje **katapultę**: jeden strzał na rundę burzy mur, wieżyczkę albo (po dwóch trafieniach) bramę. Komputer zostawia w osadach nadwyżkę pomocników i umie szturmować mury.

- Księstwo: nowe miejsca na mapie. **Młyn** daje 2 zł co 3 rundy, **Leśna składnica** oddaje raz zapas surowca, **Studnia Wędrowców** dodaje bohaterowi 2 punkty ruchu (raz na rundę). Przycisk zadania w chatce jest wyszarzony, gdy nie masz tego, o co chatka prosi.

- Księstwo: nowy budynek **Kuźnia** (za rudę; pomocnicy całej frakcji dostają +1 do Ataku, po rozbudowie także +1 do Życia) i **wymiana surowców** w osadzie (brakujący surowiec kupisz za złoto, z targiem taniej; targ skupuje nadwyżki). Komputer też z nich korzysta, więc nie siedzi już na stosie złota, gdy brakuje mu drewna. Wygrana w Księstwie daje nieco więcej punktów rankingu niż w Osadzie.

- Osada: wyrównana siła pomocników Przymierza. Jeżozwierz (8 Ż, 3 A) jest teraz mocniejszy od pomocników poziomu 1, Alabastrowy Odyniec (12 Ż, 5 A) i Opiekun Drzewa (15 Ż, 6 A) wyraźnie mocniejsi od Centaura, więc ceny 3/5/8/12 zł odpowiadają sile.

- Poziom 4 „Księstwo”: chatki z zadaniami. Bohater stojący w chatce może oddać złoto, surowiec albo artefakt z plecaka i dostać więcej: złoto, surowiec, doświadczenie albo artefakt (raz na chatkę). Komputer też je załatwia. Nowa ikona chatki; rozdział 18 instrukcji opisuje poziom 4.

- Poziom 4 „Księstwo” (początek): drewno, ruda i Gwiezdny Pył obok złota. Surowce dają tartaki, kopalnie rudy i źródła Pyłu rozsiane po mapie (kto wejdzie, trzyma je, póki ktoś inny nie przejmie); budynki kosztują złoto i surowce, drugi poziom budynku i legendarny artefakt na targu także Gwiezdny Pył, a w rundzie można zbudować tylko jeden budynek. Komputer to rozumie i gra na poziomie 4 do końca. W dolnym pasku i w oknie osady widać zapasy i dochód surowców, a ceny budynków i artefaktów pokazują, czego brakuje. Nowe ikony: tartak, kopalnia rudy, źródło Gwiezdnego Pyłu, drewno, ruda i Pył.

- Osada: pomiar siły rekrutów obu frakcji i ceny sprawdzone symulacjami (zostają bez zmian); wyniki Łatwego, Normalnego i Trudnego mieszczą się w pasmach.

- Nowe nazwy poziomów w grze, instrukcji i opisach: poziom 0 to „Spacer” (dawniej Zerówka), poziom 3 to „Osada” (dawniej Królestwo). Nazwa „Królestwo” przejdzie na poziom 5. Wcześniejsze wpisy tej historii zostają ze starymi nazwami.

- Królestwo liczy się do rankingu i do „Twoich partii”: punkty jak na poziomie 2 (ta sama trudność, zmierzona symulacjami), powiększone o jedną czwartą, bo partie trwają dłużej.

- Królestwo: Normalny i Trudny przestrojone po zmianie zachowania komputera (zakupy z dowolnego miejsca), a bardzo długa mapa dostała własne strojenie. Normalny: Przymierze wygrywa 51–67%, Trudny (kooperacja): 34–45%.

- Królestwo na Łatwym: komputer zaczyna słabszy, a Przymierze dostaje na Łatwym dodatkowe złoto na rundę („Pomoc na Łatwym poziomie” w rozbiciu dochodu). Przymierze wygrywa tam ok. 65–80% partii (dwóch graczy na średniej mapie nieco poniżej pasma).

- Łatwy na poziomach 1–3 jest wystrojony na arenie: komputer zaczyna słabszy (mniej skarbów, a w koopie bez posiłków Hordy), Przymierze wygrywa na nim ok. 65–76% partii. Punkty za wygraną na Łatwym są o jeden stopień trudności niższe niż na Normalnym.

- Instrukcja, okno zasad i wstęp opisują poziom 0 (Zerówkę) oraz trudność jako warunki startowe komputera.

- Królestwo: komputer kupuje i rekrutuje z dowolnego miejsca, tak jak człowiek (wcześniej robił zakupy tylko stojąc w osadzie, więc prawie nie korzystał z ekonomii). Kupuje najsilniejszego rekruta, na którego go stać, a gdy ma już wszystkich słabszych, rozbudowuje koszary po najmocniejszych. Na długich mapach komputer ma teraz średnio 2–3 awansowanych rekrutów na grę i wygrywa o kilka punktów procentowych rzadziej.

- Poziom 0 „Zerówka”: dawny Łatwy (krótkie pojedynki na planszy, bez zdolności i kości, bez rytuału) jest teraz osobnym poziomem dla najmłodszych, ze swoją kolumną punktów. Na poziomach 1–3 „Łatwy” gra się już pełnymi bitwami na arenie, a o trudności decydują warunki startowe komputera. Stare zapisy partii z dawnym Łatwym nie wczytają się jako poziom 0.

## 2.7.0 — 2026-11-14

- Królestwo: osady znalezione na mapie mają własne kafelki (osada Przymierza i osada Hordy), a nie wzór zwykłego terenu.
- Nowa grafika menu i kreatora: ikony dla „Ten komputer”, „Przez internet”, „Cyfrowa”, „Planszowa”, „Kooperacja”, „Rywalizacja”, „Arena”, „Przygoda”, „Własne ustawienia”, „Kryształy”, „Przetrwanie”, „Boss”, „Losowa” i „Gotowa”. Poziomy trudności mają zwierzęta: królik (Łatwy), wilk (Normalny), smok (Trudny). Ikona plecaka bohatera jest nowa.
- Licznik skarbów w rogu mapy jest ozdobnym medalionem (złota obwódka, czerwona emalia, czytelna czcionka szeryfowa) zamiast płaskiego czerwonego kółka.
- Kreator nowej gry: bez ramek wokół ikon przy dużych przyciskach; wybór kształtu mapy jest wycentrowany („Wybierz kształt”, „Wybierz mapę”), a kształty mają obrazki ułożone z heksów. Rozmiar mapy to większe, wycentrowane przyciski z dużym skrótem (S, M, L, XL, XXL, 3XL) nad nazwą. Zmiana nazw: Krótka → Mała, Długa → Duża, Bardzo długa → Bardzo duża.
- Walka: Centaur strzela strzałą (lecącą w stronę celu), a nie kulą energii jak czarodzieje.
- Portrety Centaura i Opiekuna Drzewa mają już widoczne twarze (nowy kadr z oryginałów).
- Królestwo: do osady nie trzeba już dochodzić. W prawym panelu jest lista własnych osad: pierwsze kliknięcie pokazuje osadę na mapie, drugie otwiera jej okno, w którym można budować, rekrutować i kupować z dowolnego miejsca (w turze bohatera).
- Dolny pasek: zniknął podgląd dziennika (przycisk „Dziennik” jest teraz w „Opcjach”, skrót D działa jak dawniej), a w Królestwie stoi tam złoto w skrócie, np. „2 (+2)”; prawy przycisk myszy pokazuje, skąd bierze się dochód.
- Mapa świata: kółko myszy przybliża i oddala (wokół kursora), a przeciąganie lewym przyciskiem przewija mapę; przeciągnięcie nie jest kliknięciem heksa. Ikony osad i kopalń są większe, kopalnie mają złotą poświatę (były słabo widoczne na drobnej mapie).
- Poziom „Królestwo”: strojenie trudności. Dotąd poziom Normalny i Trudny w Królestwie grały bez żadnych poprawek trudności; teraz Horda i Przymierze dostają skarby startowe dobrane z symulacji (cel „Kryształy”), tak że Przymierze wygrywa na Normalnym około 45–65% gier, a na Trudnym około 30–45%.

## 2.6.0 — 2026-11-14

- Poziom „Królestwo”: samouczek tłumaczy złoto, osady, drużynę i zestawy artefaktów, w instrukcji jest nowy rozdział 17 o ekonomii, a w trybie rodzinnym zakupy dziecka robi autopilot (zaznaczenie „Dziecko” oznacza zgodę rodzica).
- Okno osady wygląda jak w Heroes III: krajobraz frakcji (Przymierze albo Horda) z obrazkami budynków. Niezbudowane stoją jako place budowy, koszary, targ i szpital mają dwa stany (zwykły i rozbudowany), skarbiec jeden. Zakupy brzmią: monety przy kupnie, stukot młotka przy budowie. Osiem nowych pomocników ma karty, ikony zdolności i animacje; dwanaście elementów zestawów artefaktów ma ikony.
- Poziom „Królestwo”: cztery zestawy artefaktów po trzy elementy (Strój Gajowego, Rynsztunek Brzasku, Pancerz Wartownika, Strój Kupca), rzadkie, wypadają ze skrzyń i z Targu tylko na tym poziomie. Pełny komplet (3 z 3) daje premię; karta bohatera pokazuje „2/3 zestawu”, a Targ oznacza elementy zestawu. Boty też zbierają zestawy.
- Poziom „Królestwo”: osiem nowych pomocników do wykupienia w koszarach, po czterech na frakcję (poziomy 2–5; poziomy 4 i 5 w rozbudowanych koszarach). Przymierze: Jeżozwierz (Kolce), Centaur (Strzał i Galop), Alabastrowy Odyniec (Czołowe Natarcie), Opiekun Drzewa (Korzenie Drzewa). Horda: Szczurołak (Zatruty Pazur), Piekielny Ogar (Obława), Salamandra Popiołu (Pożoga), Herszt Minotaurów (Bitewny Szał). Ceny na razie robocze (3, 5, 8 i 12 zł). Dochód: każda osada, także startowa, daje 2 zł na rundę (skarbiec +1).
- Gra szybciej startuje przy kolejnych wejściach: rzadko zmieniane części programu (tabele strojenia, biblioteka React) są w osobnych plikach, które przeglądarka zachowuje po wydaniu nowej wersji. Główny plik programu zmalał z 1089 do 565 kB.
- Gra online ma poziom „Własne ustawienia”: założyciel pokoju może przełączyć wszystko jak w grze lokalnej: rozwój bohatera, rodzaj bitew (arena albo pojedynek), ułatwienia, utrudnienia, rzut kością, dodatkowego bohatera Hordy i remis inicjatywy, a do tego wybrać cel i kształt mapy. Pozostali gracze widzą te ustawienia w pokoju. Serwer przyjmuje tylko dozwolone przełączniki, a partie na własnych zasadach nie liczą się do rankingu.
- Okno ze szczegółami pod prawym przyciskiem myszy pokazuje się tylko, dopóki go trzymasz; puszczasz przycisk i okno znika (wcześniej po krótkim kliknięciu zostawało do następnego kliknięcia).
- Mniej podpowiedzi na wierzchu: nie ma okienka po najechaniu myszą na pole mapy ani na portret bohatera w panelu gry i w wyborze frakcji i bohatera. Szczegóły pokazuje przytrzymany prawy przycisk (na telefonie przytrzymanie palca).
- Plecak bohatera nie ma już limitu miejsc (dotąd 4): każdy artefakt, który nie trafia na bohatera, ląduje w plecaku, a zdobycz po pokonanym bohaterze przechodzi w całości.
- Panel po prawej stronie mapy jest uporządkowany: znika wstążka z nazwą frakcji (sztandar stoi obok portretu bohatera), rząd portretów wszystkich bohaterów i napis „jeszcze żadnej (pierwsza na poziomie 2)” (jest „brak”). Kliknięcie portretu bohatera otwiera Kartę bohatera, a pod „Artefakty” jest podgląd pięciu miejsc i ikona plecaka, która otwiera okno z samym wyposażeniem i plecakiem.
- Karta bohatera ma nowy układ: z lewej prawdziwa karta bohatera z tarczą poziomu i paskiem doświadczenia nad nią (tekst „Poziom 1 · PD 0 / 3”), pośrodku wyposażenie i plecak, z prawej umiejętności, a na dole „Kamienie milowe”: zdolność specjalna i jej ulepszenia na poziomach 3, 6 i 9 (cyfry II–IV na ikonie, strzałki, wyszarzone do czasu zdobycia poziomu).
- Skarby frakcji nie zajmują już miejsca w panelu bocznym: w prawym dolnym rogu mapy jest ikona skarbu z licznikiem i podpisem „Skarby”, która otwiera okno do oglądania i używania skarbów. Ta sama ikona zastąpiła przycisk „Skarby” w bitwie.
- Przycisk „Dla testerów” (dawniej „INFO DLA TESTERÓW”) ma inny kolor niż reszta menu, a okno pod nim ma aktualną treść: zgłoszenia i uwagi idą na serwer same, nic nie trzeba pobierać ani wysyłać ręcznie.
- Opcje w grze: tempo botów to suwak (także w pokoju online), na dole duży czerwony przycisk „Wyjdź z gry” z pytaniem „Czy na pewno chcesz wyjść z gry?”. Znikły ziarno partii i eksporty partii i dziennika, a tempo botów nie jest już w ustawieniach przed grą.
- Do 6 graczy: w rywalizacji gra od 2 do 6 osób (po trzech bohaterów na stronę), w kooperacji do 3 bohaterów Przymierza. Boty rozgrywają takie partie do końca na każdej mapie.
- Nowe menu: najpierw duże przyciski „Nowa gra” i „Wczytaj grę”, potem wybór „Ten komputer” albo „Przez internet”. Nowa gra to kreator z osobnym ekranem na każdą decyzję i dużymi przyciskami z obrazkiem i opisem: wersja (cyfrowa jest domyślna), poziom (Przygoda, Wyprawa, Królestwo wkrótce, Własne ustawienia), tryb (Kooperacja, Rywalizacja, Arena), cel gry, mapa (Losowa z kształtem albo Gotowa: Cieśnina, Dolina; gotowa mapa ma jeden rozmiar, więc rozmiaru się nie wybiera), a na końcu liczba graczy, wielkość mapy i trudność. Przyciski „Zasady i karty”, „Wprowadzenie” i „Dla testerów” stoją pod logo na każdym ekranie menu.
- Gra online: w menu są „Nowa gra” (ten sam kreator co na komputerze, na końcu powstaje stół) i „Dołącz do gry” (kod pokoju), a na dole czerwony przycisk „Wstecz”; zniknął przycisk „Gra na tym komputerze”. W pokoju widać podsumowanie ustawień stołu, a założyciel może je zmienić przyciskiem „Zmień ustawienia”, po czym wybiera się frakcję i bohatera.
- Zapisy gry pod własną nazwą (na tym komputerze): „Zapisz grę” w Opcjach, „Zapisz i wyjdź” przy wyjściu z gry (obok „Wyjdź bez zapisu” i „Anuluj”) i lista zapisów w „Wczytaj grę” z przyciskami „Wczytaj” i „Usuń” (do 20 zapisów, ten sam zapis nazywa się raz).
- „Zasady i karty” są aktualne: karty dziewięciu neutralnych jednostek (słabi i bossowie), skarby w nazwach wersji cyfrowej, nowe zakładki „Artefakty” (wszystkie 15 z opisami) i „Lokacje na mapie” oraz odświeżone „Podstawowe zasady” (wersje i poziomy, cele, kamienie milowe, plecak bez limitu, przytrzymany prawy przycisk).
- Telefon: po wejściu do partii gra prosi o obrót telefonu poziomo (tam, gdzie przeglądarka pozwala, blokuje ekran w poziomie; mały przycisk „Graj w pionie” zostawia pionowy układ). Panel bohatera po prawej mieści się na niskim ekranie bez przewijania: mniejszy sztandar i portret, pięć miejsc na artefakty w jednym rzędzie, mniejsza tarcza poziomu.
- Gotowe mapy mogą mieć fabułę: okienka z tekstem otwierają się po wyzwalaczu (numer rundy, tura frakcji, wejście bohatera na pole albo pokonanie jednostki). Silnik pilnuje, żeby każda notatka pokazała się raz, także w grze online i po wczytaniu zapisu; opis formatu jest w dokumentacji zasad.
- Okna mają ozdobne narożniki (złoto z szafirami i listowiem, namalowane w Scenario) zamiast samej płaskiej złotej ramki.
- Wprowadzenie ma aktualne obrazy (zrzuty prawdziwej gry zamiast starych grafik z błędami: mapa z równymi kafelkami, arena, menu) i nowe slajdy: dwie wersje gry, poziomy złożoności, cele gry, online i hot-seat oraz arena.
- Gra online da się zapisać: założyciel pokoju zapisuje partię pod własną nazwą w Opcjach albo przy wyjściu z gry („Zapisz i wyjdź”). Zapisy leżą na jego koncie (do 20); „Wczytaj grę” → „Przez internet” (albo „Wczytaj grę” w menu online) otwiera nowy pokój z zapisaną partią: ustawień i bohaterów nie da się zmienić, gracze zajmują miejsca i gra idzie dalej od zapisanego momentu.
- Poziom 3 „Królestwo”, silnik: złoto wspólne dla frakcji, osady (startowa na bazie i do zdobycia z neutralnymi obrońcami, po równo na obu stronach mapy), kopalnie złota, dochód co rundę, budynki (koszary, targ, szpital, skarbiec), rekrutacja pomocników, targ z artefaktami, wskrzeszanie w szpitalu, skrzynia do wyboru (artefakt albo złoto) i drużyna do pięciu pomocników; boty kupują i wracają do osad. Ekran osady dojdzie w następnym kroku.
- Poziom „Królestwo” jest do wybrania w kreatorze (też przy stołach online): na pasku jest złoto z dochodem na rundę (przytrzymany prawy przycisk pokazuje, skąd), na mapie medale osad (Przymierza, Hordy, bez właściciela) i kopalni złota, a stojąc w swojej osadzie wchodzisz do jej okna: koszary, targ z artefaktami za złoto, szpital i skarbiec. Skrzynia pyta, czy bierzesz artefakt, czy złoto.

## 2.5.0 — 2026-11-12

- Gra ma nową nazwę: **Gleamroot: Strażnicy Kryształowego Drzewa**. Nowe logo (to samo kryształowe drzewo, wielki napis „Gleamroot” i pod nim dotychczasowy tytuł) jest na ekranie tytułowym, w menu i na ekranie gry online; nowa nazwa jest też w karcie przeglądarki, w oknach „Autorzy” i „Dla testerów” oraz w instrukcji.
- Boty lepiej korzystają ze skarbów w bitwie: do tej pory nigdy nie używały Rogu Odwagi, Rogu Strażników, Klepsydry Czasu i Butów Wiatru (ok. jedna trzecia zdobytych skarbów szła na marne), teraz bohater dmucha w róg przed ciosem, pomocnik ze Rogiem Strażników atakuje dwa razy, a Klepsydra daje bohaterowi drugi ruch, gdy nie dosięga wroga. Przeciwnicy i boty zastępujące graczy są przez to nieco groźniejsi (wygrane Przymierza w symulacjach wzrosły zwykle o 1–3 punkty).
- Naprawiony cel „Boss” z Krakenem: boty nie wchodziły w jego legowisko (gra stała w miejscu do limitu rund i wygrywała Horda). Teraz Kraken jest tak samo trudnym bossem jak Hydra, Cyklop, Golem i Król Burzy (Przymierze wygrywa z nim w 50–70% gier).
- Karty jednostek i skarbów otwierają się prawym przyciskiem myszy (na telefonie długim przytrzymaniem) i zostają na ekranie do następnego kliknięcia gdziekolwiek. Samo najechanie pokazuje tylko małą podpowiedź: nazwę i liczby (Życie, Atak, Szybkość) albo nazwę skarbu.
- Efekty Króla Burzy wyglądają jak prawdziwa błyskawica: Pole Naładowane iskrzy trzeszczącą energią, a teleport (też ze Zwoju Teleportacji) to słup światła z pierścieniem, zamiast rysowanych kresek.
- Ciosy w walce wręcz brzmią różnie: do miecza doszły trzy nowe dźwięki (cięcie, ciężkie uderzenie, rozdarcie) losowane przy każdym ciosie. Krok bohatera, podniesienie kryształu i oddanie go Drzewu miały już swoje dźwięki.
- Macka Krakena ma własną ilustrację karty, portret i ikonę zdolności zamiast pożyczonych od Krakena i Strażnika.
- Pegaz jest mocniejszy w wersji cyfrowej (5 Życia i 3 Ataku zamiast 4 i 2): symulacje pokazały, że z nim drużyna wygrywała wyraźnie rzadziej niż z Elfem Druidem i Nimfą. Wersja planszowa bez zmian.
- Kraken nie stoi już bezczynnie: jego głowa strzela strugą wody w każdego wroga w zasięgu wzroku, a obok niego stoją jeszcze dwie macki, krab i błotny stwór (jak obok Króla Burzy Harpia i Orzeł). Walka jest groźna, ale podobnie trudna dla każdego z trzech bohaterów.
- W oknie „Autorzy” jest trzech autorów gry: Maciej Woźniak (pomysł, zasady, wykonanie), Aleksandra Szestowicka (pomoc przy fabule) i Zuzanna Woźniak (autorka Dzielnej Kaczki).

## 2.4.0 — 2026-11-12

- Ogr Żelazna Pięść ma na figurce kolczastą maczugę z portretu: nosi ją na ramieniu, zamachuje się nią przy ataku i siada z nią, gdy polegnie. Nowe animacje powstały ze Scenario.

- Każda z 26 jednostek ma własny dźwięk ataku i własny dźwięk śmierci (smok ryczy i zieje, golem się kruszy, kaczka kwacze, Kraken ryczy pod wodą i tak dalej). Dźwięki powstały ze Scenario (ElevenLabs); głośność reguluje suwak efektów.

- Największe rozmiary map nazywają się teraz po prostu „Ogromna” i „Gigantyczna” (bez dopisków XL i XXL).

- Nowy suwak „Szybkość animacji” w opcjach: normalnie, szybko (1,6×), bardzo szybko (2,5×). Skraca ruchy, ciosy, efekty i pauzy w walce, a wybór zostaje zapamiętany.

- Czytelniejsza podpowiedź walki na mapie: zamiast kilku linii tekstu widać nazwę pola, czerwoną plakietkę z przeciwnikiem i kolorową plakietkę trudności (zielona łatwa, żółta wyrównana, czerwona groźna, czarna niemożliwa). Ta sama plakietka jest w oknie prawego przycisku na polu z przeciwnikiem i w oknie potwierdzenia walki. Bohater bez pomocników dostaje trudniejszą ocenę, bo walka liczy się dla niego naprawdę samotnie.

- Trudność walki na mapie: po najechaniu na strażników lub wrogiego bohatera, do których dojdziesz w tej turze, podpowiedź mówi, jak potoczyłaby się walka: łatwa, wyrównana, groźna albo niemożliwa. Gra rozgrywa taką walkę botami po obu stronach na kopii partii, więc liczą się poziom bohatera, umiejętności, artefakty, skarby, pomocnicy i zdolności jednostek. To ocena orientacyjna: gracz może zagrać lepiej lub gorzej niż bot.

- Naprawiony rzadki błąd botów: smok, który nie mógł zionąć ogniem (drugi cel byłby sojusznikiem), podawał mimo to drugi cel, a gra odrzucała taki atak i walka z botem mogła stanąć.

- Kamienna Skóra Kamiennego Golema jest słabsza: zmniejsza każdy cios o 3 (w Wyprawie), nie o 6. Elf z Atakiem 6 zadaje mu teraz 3 obrażenia zamiast 1.

- Leśny Tropiciel (i odpowiedniki Hordy) na III stopniu daje +3 punkty ruchu na mapie; wcześniej III stopień dawał tyle samo co II (+2).

- Teleportacja wygląda jak teleportacja: jednostka blednie i maleje tam, gdzie stała, po czym pojawia się w nowym miejscu, a w obu miejscach błyska filar światła z pierścieniem i iskrami (niebieskie dla Króla Burzy, fioletowe dla Zwoju Teleportacji). Wcześniej jednostka po prostu przelatywała.
- Pola, które Król Burzy zostawia po teleportacji, mają grafikę pola elektrycznego (niebieska poświata i migające błyskawice) zamiast żółtego heksa. Podpowiedź pokazuje prawdziwe obrażenia (×3 w Wyprawie).

- Odrastanie Bagiennego Pełzacza i Hydry pokazuje się osobno: najpierw znacznik obrażeń od ciosu (np. −6), chwilę później leczenie (+5), zamiast jednego znacznika z różnicą (−1).

- Rzut Cyklopa: animacja trafienia, iskry i znacznik obrażeń pokazują się dopiero, gdy kamień doleci do celu, a nie w chwili wypuszczenia go z rąk.

- Muzyka rytuału cichnie, gdy tylko rytuał przestaje trwać (np. po pokonaniu bohatera Hordy przy Drzewie), a nie dopiero na końcu rundy.

- Poległe jednostki nie zmniejszają się już po śmierci: leżą w tej samej skali co żywe (Cyklop i Hydra były rysowane o 30% mniejsze). Zwłoki małych jednostek nadal mają limit szerokości dwóch heksów, ale luźniejszy niż dotąd.

- Jednostka dwupolowa (np. Jednorożec), która podchodzi do wroga, pokazuje na żółto dwa heksy: pole głowy i pole ogona, więc widać, gdzie stanie cała.

- Jednostka walcząca wręcz, która stoi już obok wroga i jeszcze się nie ruszyła, może go „obejść”: wskaż krawędź heksa po drugiej stronie wroga, a podświetli się pole, z którego uderzy (jednostka tam podejdzie i zaatakuje). Wskazanie strony, z której już stoi, bije od razu, jak dotąd.

- Jednostka strzelająca, która musi uderzyć sąsiada, pokazuje kursor miecza zamiast strzały.

- Kursor ataku (miecz lub strzała) widać teraz na całym heksie wroga, także w jego środku. Wcześniej w środku pojawiał się zwykły kursor, a atak „świecił” tylko przy krawędziach.

- Miażdżący Głaz Cyklopa: gra mówi teraz, dlaczego cel nie został odepchnięty (jednostki dwupolowe, np. Niedźwiedź, są za ciężkie; albo nie ma za nim wolnego pola), a opis zdolności o tym wspomina.

- Jednostka dwupolowa (np. Jednorożec) nie przechodzi już przez lukę szerokości jednego pola między dwiema jednostkami lub przeszkodami: ogon musi się gdzieś zmieścić na każdym polu trasy, nie tylko na polu docelowym.

- Lekkość Wiatru (i odpowiedniki Hordy) na III stopniu daje +3 do Szybkości bohatera w bitwie; wcześniej III stopień dawał tyle samo co II (+2).

- Opisy zdolności w Wyprawie pokazują prawdziwe liczby: Rozprysk Kruszyńca rani o 3 (nie o 1), Kamienna Skóra Golema zmniejsza cios o 6 (nie o 2), a Wyładowanie Króla Burzy zadaje 3 (nie 1). Silnik liczył dobrze, mylił się tylko opis.

## 2.3.0 — 2026-11-11

- Cel „Boss” w kooperacji (lokalnie i online): można wybrać „Bez Hordy, wszyscy przeciw Bossowi”. Horda nie ma wtedy bohaterów, a wszyscy gracze razem biją samego Bossa, który ma o jedną piątą więcej Życia. Działa też online (wybiera właściciel pokoju).

- Neutralni na mapie Wyprawy: obok strażników kryształów stoją grupy dziewięciu nowych potworów, im dalej od baz, tym groźniejsze, a nagrodą jest skarb i artefakt (zwykły, rzadki albo legendarny). Słabi: Kruszyniec (po śmierci rozpryskuje się), Podkopnik (wychodzi spod ziemi tuż przy bohaterze), Orzeł Skalny (nurkuje z rozbiegu), Harpia (boli od tyłu), Szczypiec (chwyta i nie puszcza), Bagienny Pełzacz (odrasta). Bossowie: Kamienny Golem (twarda skóra, a po utracie połowy Życia trzęsienie), Król Burzy (teleportuje się, zostawia naładowane pola i razi tych, którzy go uderzą z bliska) i Kraken (nietykalny, dopóki żyją jego macki). Mają własne ilustracje kart, portrety i ikony zdolności; na planszy też mają własne figurki z animacjami ruchu, ataku, trafienia i śmierci.

- Mapy XL („ogromna”) i XXL („gigantyczna”) w wersji cyfrowej, w grze lokalnej i online: trójkąt o 17 i 20 rzędach (153 i 210 pól), większe prostokąty, pierścienie i wyspy, więcej skarbów, miejsc na mapie i rund (limit 30 i 36). Poziomy trudności przestrojone symulacjami, żeby Przymierze wygrywało tyle samo co na mniejszych mapach. Za wygraną na XL i XXL jest więcej punktów rankingowych (do 40). Planszówka zostaje przy czterech rozmiarach.

- Gra online: w pokoju można wybrać poziom gry. Obok „Poziomu 1: Przygoda” jest „Poziom 2: Wyprawa” z wyborem celu (kryształy, punkty kontrolne, przetrwanie, boss, artefakt) i kształtu mapy (trójkąt, prostokąt, pierścień, wyspy, własna mapa); w Wyprawie bohaterowie zdobywają doświadczenie jak w grze lokalnej (zgłoszenie autora, 11.11). Poziom „Własne” zostaje na razie tylko w grze lokalnej.

## 2.2.0 — 2026-11-11

- Umiejętności: pięć nowych (Strzelec, Taktyk, Zwiadowca, Łowca skarbów, Uczony) ma własne malowane ikony zamiast pożyczonych.
- Czarny Smok: Ognisty Oddech w wersji cyfrowej rani też sojusznika, który stoi w linii za trafionym wrogiem (decyzja autora). Boty biorą to pod uwagę i nie zionią w swoich. Planszówka bez zmian.
- Menu: nowy przycisk „Autorzy” (obok numeru wersji) z listą autorów muzyki, licencjami (CC BY, CC0), informacją o użyciu AI przy grafice i dźwiękach oraz użytym oprogramowaniu.
- Życie ma własną skalę: w Wyprawie Życie jest teraz ×5 (Atak nadal ×3), więc bohater potrzebuje 2–4 ciosów, żeby pokonać innego bohatera (dawniej mocny cios, np. Szarża Jednorożca, zabijał bohatera jednym uderzeniem). Wszystkie liczby Życia i leczenia (Czarny Smok ma 35 Ż, Niedźwiedź 60 Ż) są odpowiednio większe.
- Bitwa: koniec walki jest płynny. Ostatni cios nie odbudowuje już areny (znikało „wygaszenie ekranu”, a jednostki odwracały się i zaczynały ruch od nowa), zwycięzca nie obraca się, a trup Złotego Smoka nie jest mniejszy, Czarnego nie jest dwa razy większy niż za życia.
- Bitwa: kursor ataku (miecz, strzała, różdżka) pojawia się na całym heksie jednostki, także na pierwszym heksie dużej jednostki i na dole heksa małej. Różdżka jest teraz malowana i pokazuje się też przy używaniu skarbów na jednostce.
- Bitwa: ataki magiczne (Goblin Szaman, Elf Druid, Nimfa) mają własny dźwięk. Goblin jest nieco większy, nogi Króla Jednorożców krótsze.
- Mapa: punkty kontrolne mają malowane znaczniki (szary sztandar, zielono-złoty Przymierza, czerwono-żelazny Hordy; środkowy z dodatkowym pierścieniem) zamiast wektorowych.
- Bitwa: strzelcy walczą wręcz, gdy cel stoi obok. Elf Druid, Goblin Szaman i Cyklop mają osobny klip ataku z bliska (laska, laska, zamach ręką), a strzała albo głaz lecą tylko na odległość.
- Zgłoszenia z 10.11: Horda może wyzywać strażników we wszystkich celach poza „Kryształami” (w trybie punktów kontrolnych, przetrwania, artefaktu i bossa strażnik to zwykła walka). Dotąd mogła tylko w „Kryształach”, gdzie to ma sens.
- Zgłoszenia z 10.11: panel bohatera pokazuje, z czego składają się punkty ruchu (podstawa, Leśny Tropiciel, buty, niesiony Artefakt −1; podpowiedź nad paskiem ruchu) i dopisuje „Artefakt spowalnia: −1 ruchu”. To tłumaczy „3 zamiast 4” i „0 po polu za 2”.
- Zgłoszenia z 10.11: okno wyboru umiejętności wyjaśnia, skąd awans (ostatnio zdobyte PD z powodami i tabelka, co daje PD).
- Zgłoszenia z 10.11: opis zdolności po najechaniu na przycisk w bitwie pokazuje liczby w skali gry (Nocna Zasadzka: +9 A zamiast +3).
- Zgłoszenia z 10.11: Powietrzny Zryw Pegaza (i inne skoki) liczy zasięg od bliższego z dwóch pól dużej jednostki, więc Pegaz skacze naprawdę o 3 pola.
- Zgłoszenia z 10.11: w bitwie bok ataku wybiera się krawędzią heksa pod kursorem także na dużych jednostkach (Hydra, smoki): liczy się ten z dwóch heksów, nad którym jest kursor, i sąsiad od strony kursora.
- Zgłoszenia z 10.11: rozmiary figurek: Czarny Smok dorównuje Złotemu, Goblin Szaman jest naprawdę niski, Pająk mieści się w swoim heksie, Gryf jest większy.
- Bitwa: animacje nie przycinają się. Arkusze animacji jednostek są trzy razy lżejsze (107 → 38 MB), dekodują się z wyprzedzeniem zamiast w środku ciosu, a sąsiednie klatki są płynnie mieszane. Dawniej pierwszy cios, trafienie i śmierć każdej jednostki zacinały grę na 0,2–0,4 s (a przy słabszej karcie dłużej), co wyglądało jak spóźniona animacja śmierci.
- Bitwa: ostatni cios walki zawsze pokazuje animację ataku. Dotąd po kliknięciu ostatniego ciosu ekran czekał kilka sekund (do limitu 6 s) na cios, który się nie zaczął, i dopiero potem pokazywał śmierć.
- Artefakty: plecak i przekazywanie. Bohater nosi do 4 artefaktów w plecaku; trafia tam to, czego nie zakłada od razu (dawniej zamieniało się w skarb), a zwycięzca walki bohaterów zabiera też plecak pokonanego. W swojej turze w „Karcie bohatera” można kliknąć artefakt i go założyć, zdjąć albo przekazać sojusznikowi stojącemu na sąsiednim polu.
- Skarby w wersji cyfrowej: cztery karty, które brzmiały jak wyposażenie, mają nowe nazwy (i trzy nowe obrazki), żeby nie myliły się z artefaktami: Miecz Bohatera → Eliksir Mocy, Buty Wiatru → Eliksir Chyżości, Tarcza Strażnika → Zwój Tarczy, Kamień Ochrony → Runa Ochrony. Działają tak samo; planszówka bez zmian.
- Artefakty: pięć miejsc (hełm, broń, zbroja, tarcza, buty) i trzy rzadkości (zwykły, rzadki, legendarny), 15 artefaktów o jednej nazwie i obrazku dla obu frakcji. Nowe efekty: tarcze dają Obronę 1 / 2 / 3 (każdy cios słabszy, ale zabiera co najmniej 1; legendarna Egida Drzewa dzieli też pierwszy cios na pół), Kolczuga Cierni rani atakującego w zwarciu, Ostrze Łowcy bije mocniej rannych, Hełm Dowódcy wzmacnia pomocników, Korona Zwiadowcy odkrywa pola w promieniu 2, Trzewiki Trapera znoszą koszt trudnego terenu, Hełm Olbrzyma daje dużo Życia kosztem Szybkości. Zwycięzca walki bohaterów zabiera artefakty pokonanego (te, które poprawiają jego wyposażenie). Nowa „Karta bohatera” (przycisk przy artefaktach): portret, liczby w bitwie, wyposażenie ułożone jak na postaci, opisy artefaktów i umiejętności.
- Mapa: malowane okrągłe znaczniki na kafelkach (kapliczka, obóz najemników, skrzynia z artefaktem, skarb) zamiast prostych medalików.
- Bitwa, grafika jednostek: Nietoperz Cienia siedzi (i jest większy), Pegaz i Czarny Smok stoją na ziemi; do lotu wzbijają się i po nim lądują. Nowe ataki: Pegaz i Król Jednorożców uderzają kopytami i rogiem zamiast biec, Gryf bije szponami, Pająk Jaskiniowy (większy) staje dęba i kąsa, Cyklop podnosi i ciska głaz, który leci przez arenę. Goblin Szaman jest niższy. Elf Druid, Goblin Szaman i Władca Wilkołaków po śmierci leżą na boku albo brzuchu, głową w prawo.
- Mapa: zakryte pola nie mrugają już pojedynczo. Mgła nad nimi przeskakiwała raz na minutę (pętla animacji miała szew), a że każde pole zaczyna w innej chwili, wyglądało to jak błysk na jednym zakrytym kafelku. Błysk nie zdradzał skarbów, ale mylił.
- Rozwój bohatera: sprawdzony symulacjami (progi PD, umiejętności, kamienie milowe). Żaden bohater ani kamień milowy nie wychodzi poza szum; liczby bez zmian.
- Karty bohaterów w grze z rozwojem pokazują osiągnięty kamień milowy: pod opisem zdolności dopisana jest linia „Poziom N: …” z aktualnymi liczbami.
- Rozwój bohatera: kamienie milowe na poziomach 3, 6 i 9 wzmacniają własną zdolność bohatera (np. Szarża Światła Króla Jednorożców: +2 → +3 → +4 → +5 do Ataku; Czarny Smok oddycha na 9. poziomie dwa razy w bitwie; Dzielna Kaczka leczy się po zabiciu wroga). Awans na kamień milowy zapisuje się w dzienniku.
- Rozwój bohatera: Łowca skarbów (Skarbnik Gaju / Nos Hieny) pozwala po walce ze strażnikiem wybrać skarb zamiast losu: 1 z 2, 1 z 3, a na III stopniu 2 z 3. Uczony (Mądrość Drzewa / Pamięć Przodków) daje +1/+2/+3 PD za każdą wygraną walkę.
- Rozwój bohatera: trzy nowe umiejętności ze stopniami I–III. Strzelec (Oko Łucznika / Krzywy Łuk) daje strzelcom +1/+2/+3 do Ataku; Taktyk (Sztuka Wojny / Zasadzka) pozwala ustawić jednostki przed bitwą o 1/2/3 kolumny dalej; Zwiadowca (Orle Oko / Ślepia Wilka) odkrywa na starcie tury pola w promieniu 2/3/4. Medale na razie pożyczają ikony innych umiejętności.
- Rozwój bohatera: poziomy 6–10. Kolejne progi doświadczenia to 26, 38, 56, 84 i 128 PD łącznie, więc wysokie poziomy są rzadkie (poziom 10 wymaga bardzo długiej wyprawy).
- Rozwój bohatera: umiejętności mają stopnie I–III. Wybranie umiejętności, którą bohater już ma, podnosi jej stopień (np. Moc daje +1, +2, +3 do Ataku). Przy awansie wśród propozycji jest zawsze co najmniej jedno rozwinięcie, jeśli bohater ma coś do rozwinięcia.
- Wyprawa (poziom 2 i wyżej): Życie i Atak wszystkich jednostek są trzy razy większe (np. Prastary Niedźwiedź ma 36 Ż), a wszystkie premie, zdolności i skarby odpowiednio większe. Gra przebiega tak samo, ale pozostawia miejsce na drobniejsze premie i obronę. Przygoda (poziom 1) i planszówka bez zmian.
- Muzyka: uzupełnione źródła i licencje wszystkich utworów (część wymaga podania autora, ekran „Autorzy” w przygotowaniu).
- Walka: wroga jednostkę zasłoniętą przez własnych sojuszników można zaatakować, klikając w jej heks (wcześniej klik w pole przykryte ramką stojącego przed nią sojusznika nic nie robił); kursor miecza i wybór strony ataku działają tak samo.
- Wersja cyfrowa: obrót jednostki nie wygląda już jak obrót kartki papieru: obraz zwęża się tylko do połowy, jednostka lekko podskakuje i przechyla się w stronę obrotu (prawdziwy klip obrotu nadal czeka na grafikę).
- Wersja cyfrowa: Pegaz zajmuje dwa heksy (jak Jednorożec i Smoki) i jest narysowany odpowiednio większy.
- Walka: gdy włączysz zdolność, którą rzuca się na jednostkę (Dar Życia Nimfy, Pajęcze Sidła), kursor zmienia się w różdżkę nad każdą jednostką, na której da się ją użyć.
- Tryb Boss: przy legowisku Bossa nie ma już ikony kryształu ani napisu „Leży tu kryształ” (w tym trybie kryształy nie są potrzebne).
- Koniec bitwy: okno wyboru umiejętności po awansie (i dźwięk awansu) czeka teraz na koniec pokazu ostatniego ciosu i animacji śmierci, tak jak okna skarbu i podsumowania; wcześniej wyskakiwało od razu na arenie. Dziennik z początku tury nie otwiera się już sam w grze z samymi botami (jest przycisk „Dziennik”).
- Nowe malowane grafiki: woda między wyspami (zamiast gładkiego gradientu), puste miejsca na artefakty (miecz, tarcza, but w brązowych medalionach) oraz tarcza poziomu bohatera, która z każdym poziomem jest bogatsza: szare żelazo, brąz, srebro, złoto z szafirami, a na 5. poziomie złote skrzydła z błękitnymi kryształami i poświatą. Numer poziomu jest na środku tarczy.
- Wersja cyfrowa: polegli (np. Władca Wilkołaków) nie leżą już na trzech heksach ani za wysoko: trup jednostki jednopolowej jest ograniczony do szerokości dwóch heksów i leży na linii stóp, a animacja śmierci płynnie do tego dochodzi.
- Koniec gry: po zwycięstwie (Hordy i Przymierza) gra tylko dźwięk zwycięstwa albo porażki; stare utwory zwycięstwa nie nakładają się już na niego.
- Wersja cyfrowa: dwupolowe jednostki da się atakować z każdej strony, także od strony ogona, a dwupolowy atakujący liczy podejście całym swoim ciałem. Kursor miecza pojawia się też nad polem ogona, nie tylko nad głową.
- Wersja cyfrowa: Szaman Goblinów (i inni strzelcy) ma ten sam Atak na karcie przy wyborze pomocników i w podglądzie karty, co na arenie; wcześniej te widoki pokazywały wartość z wydrukowanej karty.
- Efekty dźwiękowe: cios mieczem, strzał z łuku, czar (zdolność), kroki idących jednostek, kliknięcie przycisku, znaleziony skarb, awans bohatera, wygrana i przegrana. W opcjach jest osobny suwak i przełącznik „Efekty”, niezależny od muzyki.
- Dźwięki mapy przygody: krok bohatera, podniesienie kryształu i oddanie go Drzewu.
- Balans: poziomy trudności wszystkich celów (kryształy, punkty kontrolne, przetrwanie, boss, artefakt, z rozwojem bohatera i bez) przestrojone automatycznie na wygrane Przymierza: Łatwy 65–85%, Normalny 45–65%, Trudny 30–45%. Obejmuje wszystkie kształty map (trójkąt, prostokąt, pierścień, wyspy, Cieśnina, Dolina).
- Balans, drugi przebieg: Kryształy na Dolinie oraz Artefakt i Boss na wyspach przestrojone dokładniej (200 gier na komórkę); mniej poziomów poza pasmem, Cieśnina bez zmian.
- Umiejętności i artefakty mają własne, malowane ikony (medaliony: miecz, serce, skrzydło, sztandar, kompas, skrzynia; miecz, zbroja i buty w dwóch poziomach: brąz i złoto z fioletem).
- Rozwój bohatera stał się czytelny: pod portretem jest pasek poziomu i PD (ile masz, ile brakuje do następnego poziomu), ikony umiejętności i trzy miejsca na artefakty (broń, zbroja, buty; puste są zaznaczone). Za każde zdobyte PD pojawia się notka, za co. Zdobycie artefaktu ogłasza osobna karta z opisem, źródłem (skrzynia, strażnik, pokonany bohater) i wyjaśnieniem, czym artefakt różni się od skarbu. Umiejętności do wyboru to teraz karty z ikonami i ozdobną ramką. Wyjaśnienia są też w samouczku i w „Zasadach i kartach”.
- Gra online: stany od serwera są pokazywane po kolei, każdy po zakończeniu animacji poprzedniego (cios, trafienie, śmierć, ruch). Wcześniej ekran przeskakiwał i pokazywał dwa ciosy naraz albo kończył bitwę przed ostatnim ciosem.
- Punkty kontrolne, boss i artefakt: strażnicy już nie pilnują kryształów (pokonany nic nie zostawia), a pasek na dole pokazuje postęp celu zamiast kryształów.
- Animacje bitwy: jednostki obracają się płynnie (zamiast przeskoku na lustrzane odbicie), zawsze są zwrócone w stronę ruchu i celu, a kolejność to ruch, obrót, atak. Komputer czeka z następną akcją, aż skończy się pokaz poprzedniej (cios, trafienie, śmierć), więc ataki nie nakładają się. Okno znalezionego skarbu i podsumowanie bitwy pojawiają się dopiero po pokazie ostatniego ciosu. Czarny Smok jest tak duży jak Złoty.
- Samouczek zna cel gry: w przetrwaniu, punktach kontrolnych, bossie i artefakcie pierwsza podpowiedź mówi, o co naprawdę chodzi, a nie o kryształy i Drzewo.
- Cel „Przetrwanie”: strażnicy zostali, ale już nie chronią kryształów (pokonany nic nie zostawia), a w miejscu kafelka Drzewa jest zwykłe pole. Na dole ekranu licznik przetrwanych rund zamiast kryształów. Poziomy trudności przestrojone.
- Mapa „Wyspy”: kanały między wyspami to teraz widoczna od początku woda (nowy kafelek), więc od razu widać trzy wyspy, a mosty to luki w wodzie. Wcześniej kanał był kolumną ukrytych pól i mapa wyglądała jak zwykły prostokąt.
- Wersja cyfrowa: karta strzelca (np. Elfa Druida) pokazuje Atak z premią strzelca (+1), czyli tyle, ile jednostka naprawdę zadaje, a nie tylko wartość wydrukowaną.
- „Leśny Tropiciel” (i „Nocny Zwiadowca”) daje dodatkowy punkt ruchu od razu po wyborze, a nie dopiero w następnej turze. Pasek ruchu bohatera na mapie pokazuje teraz wszystkie punkty (też te z umiejętności, pomocy dla dziecka i wyposażenia), np. cztery zamiast trzech.
- Balans wersji cyfrowej po naprawie Nocnej Zasadzki: przestrojone poziomy z rozwojem bohatera (Łatwy był za trudny, Trudny w kooperacji dla dwóch graczy za łatwy) i kilka komórek bez rozwoju.
- Naprawiono Nocną Zasadzkę Nietoperza Cienia: dodatkowe obrażenia (+3) nie były doliczane do ciosu, który jej używał, choć podgląd je pokazywał. Boty z nietoperzem biją teraz tak, jak mówi karta.
- Menu główne podzielone na trzy ekrany: najpierw wybór wersji (planszowa albo cyfrowa, z opisem), potem ustawienia gry (tryb, poziom, cel, kształt i wielkość mapy, trudność, liczba graczy), na końcu miejsca przy stole z opcjami (samouczek, pełny ekran). „Twoje partie” ze statystykami zostały na pierwszym ekranie. Ziarno losowania zniknęło z menu. Wszystkie własne ustawienia (rozwój bohatera, rodzaj bitew, ułatwienia, utrudnienia, remis inicjatywy) są teraz pod poziomem „Własne ustawienia”, a trudność to tylko Łatwy, Normalny i Trudny.
- Tryb rodzinny w kooperacji (wersja cyfrowa): przy miejscu gracza można zaznaczyć „Dziecko”. Bohater dziecka ma więcej życia i ruchu, a przycisk „Podpowiedź” mówi, co zrobiłby komputer, i podświetla pole na mapie.
- Ekran startu (wersja cyfrowa): wybór poziomu gry. „Poziom 1: Przygoda” to prosta gra z planszówki, „Poziom 2: Wyprawa” odblokowuje cele, kształty map i rozwój bohatera, a „Własne ustawienia” pozwalają przełączać wszystko osobno.
- Rozwój bohatera: artefakty (broń, zbroja, buty) znajdowane w skrzyniach na mapie, u pokonanych strażników i po wygranych walkach; na mapie pojawiają się też kapliczki (punkty doświadczenia) i obozy najemników (wracają polegli pomocnicy).
- Wersja cyfrowa, opcja „Rozwój bohatera”: bohaterowie zbierają punkty doświadczenia z bitew i skarbów, awansują do 5 poziomu i przy każdym awansie wybierają jedną z trzech umiejętności (większa siła, życie, szybkość, ruch na mapie, wsparcie pomocników albo skarb).
- Narzędzie dla autora: `make sim-cele` pokazuje w minutę i pół, jak często wygrywa Przymierze w każdym celu i na każdym kształcie mapy.
- Wersja cyfrowa: kształt mapy „Wyspy” (trzy wyspy rozdzielone wodą, dojście po mostach) oraz gotowe, ręcznie narysowane mapy „Cieśnina” i „Dolina”, wybierane w ekranie startu.
- Nowy cel przygody w wersji cyfrowej, „Artefakt”: w środku mapy leży Artefakt, a wygrywa strona, której bohater zaniesie go do własnej bazy. Niosący idzie wolniej, a poległy upuszcza Artefakt na polu, więc wróg może go przejąć.
- Nowy cel przygody w wersji cyfrowej, „Boss”: w środku mapy leży legowisko potężnego Bossa, którego wyzywają obie strony; rany Bossa zostają między walkami, a wygrywa ten, kto zada ostatni cios.
- Wersja cyfrowa: nowe kształty mapy przygody, „Prostokąt” (Drzewo w środku, bazy po bokach) i „Pierścień” (obręcz wokół jeziora, do Drzewa wiodą dwie drogi). Wybierasz je w ekranie startu; Przymierze dostaje na nich skarby na start, żeby szanse były wyrównane.
- Nowy cel przygody w wersji cyfrowej, „Przetrwanie” (kooperacja): trzeba utrzymać przy życiu choć jednego bohatera przez kilka rund, a co dwie rundy w bazie Hordy pojawia się kolejny bohater. Wybierasz go w ekranie startu obok „Punktów kontrolnych”.
- Silnik: przywrócony przełącznik „jednostki zasłaniają strzał” (domyślnie wyłączony). Symulacje pokazały, że nie zmienia balansu, więc w grze strzał zasłaniają tylko przeszkody.
- Nimfa w wersji cyfrowej wygląda jak na swoim portrecie (miętowo-seledynowe włosy, korona z kwiatów i pnączy, złote ozdoby); nowe są wszystkie jej animacje (chód, atak, trafienie, śmierć), a śmierć nie ma już podwójnego upadku.
- Dzielna Kaczka: nowa animacja trafienia, skrzydła nie rozmywają się już w trakcie uderzenia.
- Ogr Żelazna Pięść: po śmierci leży w tej samej zgarbionej pozie, w której kończy się animacja, więc nie ma już skoku przy przejściu.
- Elf Druid: zielono-złota fala liści w ataku rozpływa się na brzegu kadru zamiast urywać się twardą krawędzią.
- Złoty Smok: płomień w ataku rozpływa się na prawym brzegu kadru zamiast urywać się twardą krawędzią.
- Czarny Smok ma nowy klip ataku: płomień jest wyraźniejszy i na prawym brzegu kadru rozpływa się zamiast urywać twardą krawędzią.
- Wydanie cyfrowe: jednostka, która rusza i od razu uderza (kliknięcie dalekiego wroga), najpierw dolatuje na miejsce, a dopiero potem atakuje i pokazują się obrażenia; poprawiona też śmierć, która przy niektórych ciosach odtwarzała się dwa razy (jednostka upadała, wstawała i upadała znowu).
- Na ekranie nowej gry jest przełącznik „Wersja: Cyfrowa / Planszowa” we wszystkich trybach (arena, kooperacja, przeciwko sobie); domyślna jest cyfrowa, a wybór gra pamięta. Bitwy w wersji cyfrowej mają jednostki w grafice 2D także w przygodzie, mapa świata zostaje z figurkami 3D.
- Wersja cyfrowa: komputer układa ogon dużej jednostki taktycznie, po stronie odwróconej od wrogów (głowa patrzy na nich), zamiast brać pierwsze wolne pole.
- Gra online: założyciel pokoju wybiera przy stole „Wersja: Cyfrowa / Planszowa” (domyślnie cyfrowa); działa po wdrożeniu serwera z nowym silnikiem.
- Wersja cyfrowa: jednostki 2D są rysowane w rozdzielczości ekranu (z uwzględnieniem powiększenia planszy i gęstości pikseli), więc nie wyglądają już na rozpikselowane.
- Wersja cyfrowa: klatki animacji jednostek są ostrzejsze (512 px zamiast 320 px, wyższa jakość kompresji); grafika jednostek waży łącznie ok. 104 MB.
- Wersja cyfrowa ma własne liczby bohaterów: Złoty Smok bije najmocniej (7 A, ale tylko 7 Ż), Prastary Niedźwiedź ma najwięcej życia (12 Ż, wolny), Król Jednorożców jest najszybszy (10 S); Czarny Smok dostaje 6 A. Planszówka zostaje bez zmian, a w symulacjach każdy bohater wygrywa na arenie 48–52% gier.
- Wersja cyfrowa: karty bohaterów na ekranie nowej gry i przed bitwą na arenie pokazują cyfrowe Życie, Atak i Szybkość (np. Jednorożec ma 10 S).
- Pod maską: cel gry (kryształy do Drzewa i rytuał Hordy) jest teraz wymiennym modułem, żeby można było dodawać nowe cele; wyniki gier bez zmian.
- Wersja cyfrowa: na ekranie nowej gry (kooperacja, rywalizacja) jest wybór „Cel”: kryształy do Drzewa albo „Punkty kontrolne” — trzy punkty na mapie (środkowy wart 2, boczne po 1); kto trzyma więcej punktów przez kilka rund z rzędu, wygrywa. Punkty oznaczają sztandary na mapie, a panel „Cele” i pasek na dole pokazują, kto ile trzyma i jak długo.
- Wersja cyfrowa: wyrównany poziom trudności przygody. Na bardzo długiej mapie w dwóch graczy jest trudniej (Horda startuje ze skarbami), Trudny na punktach kontrolnych dla jednego gracza jest łatwiejszy, a wygrane Przymierza w kooperacji i rywalizacji mieszczą się w pasmach: Łatwy 70–90%, Normalny 45–65%, Trudny 30–50%. Gra planszowa bez zmian.
- Wczesna wersja wydania cyfrowego, do wybrania na ekranie nowej gry w trybie Arena („Zasady: Cyfrowe (w budowie)”): arena z poziomymi heksami jak w Heroes III, ciemniejsze tła z różnymi przeszkodami (także zajmującymi dwa pola, jedna pod skosem), wszystkie 16 jednostek jako animowana grafika 2D (chód lub lot, atak, trafienie, śmierć, zostają jako trupy), duże jednostki na dwóch polach, cienkie paski życia, obrażenia pokazują się w chwili uderzenia animacji, a po ostatnim ciosie widać jeszcze chwilę śmierć przed wynikiem. W tym trybie ruch bez ataku kończy turę (strzelec nie może ruszyć się i strzelić, ma za to +1 do ataku). Zasady klasyczne zostają bez zmian.
- Dzielna Kaczka ma już swój malowany portret i prawdziwą figurkę 3D (zamiast tymczasowych rysunków); ikony umiejętności Kaczej Furii są jeszcze tymczasowe.
- Sekret: pięć kliknięć w herb Przymierza na ekranie nowej gry budzi Dzielną Kaczkę — kruchego (3 Ż), bardzo szybkiego (10 S) bohatera z atakiem 6 i umiejętnością Kacza Furia: gdy jej atak zabije wroga, od razu aktywuje się jeszcze raz.
- Instrukcja (w grze i do druku) nie ma już strony z okładką: okładka segregatora jest osobnym plikiem, a instrukcja zaczyna się od wiadomości od autora.
- Wersja do druku: w folderze `do_druku/` leżą też okładka segregatora (`okladki_przod_tyl_grzbiet.pdf`) i żółte logo na pudełko (`logo_zolte_120mm.pdf`, `logo_zolte_przezroczyste.png`).
- Wersja do druku: z planszy areny zniknął napis „tnij tu: środek planszy”, który zostawałby widoczny na przyciętej połowie; linia cięcia leży w pasku, który się odcina.
- Wersja do druku: rewersy kart (jednostek i skarbów) mają całą ramkę zamiast uciętych brzegów, kafelki mapy mają 7 mm przerwy zamiast 4 mm, a plansza areny ma całą ramkę także na bokach, górze i dole.
- Okładka w lepszej jakości (pełne 300 DPI zamiast powiększanego obrazka): ostrzejsza w menu głównym, w instrukcji w grze i w wersji do druku.
- Nowa okładka (zmienione widoki niektórych postaci): w menu głównym gry, na okładce instrukcji w grze i w wersji do druku.
- Plan wersji planszowej: okładka segregatora (przód, tył, grzbiet 10 mm) i żółte logo na przezroczystym tle na pudełko, z uwagą, na czym je wydrukować.
## 2.1.0 — 2026-10-29

- Instrukcja, rozdział 17: wariant „na szybko” podaje farby w kolorze frakcji (zieleń, bordo, granat) i ten sam kolor na podstawkę; wariant „porządniej” ma pełną paletę z nazwami farb na wszystkie 15 figurek, cienie i wskazówki mieszania; z nagłówka zniknęła uwaga o drukarce.
- Plan wersji planszowej: lżejsze pudełko — sklejka topolowa 3 mm (dno 4 mm), listewki 10 × 10 w narożnikach, wyjmowana półka nad figurkami, figurki w piance EVA 10 mm z otworami Ø 35 mm (sześciokątna podstawka 30 mm ma 34,6 mm między rogami, więc otwornica 30 mm nie wystarczy), orientacyjna waga i lista cięcia.
- Instrukcja (poprawki): okładka nie jest liczona do numeracji stron; „Przymierze Świtu” na stronie opowieści ma zielony nagłówek; nazwa gry i rozdziału w stopce nie są już „przekreślone” linią ramki; liczby przy znacznikach („× 6”) zawsze stoją w osobnej linii; punkt „Skarby i strażnicy” w przygotowaniu ma numer 4 (kolejne przesunięte); bazy Przymierza i Hordy mają przezroczyste tło; obrazki aren pokazują aktualny układ przeszkód i obwódki; strona „Słowo na drogę” bez linijek „Drogi / Droga” i „Autor gry”; nowy rozdział 17 „Malowanie figurek” (malowanie na szybko drybrushem albo porządniej, techniki, sprzęt i farby) na jednej stronie; na gęstych stronach więcej zapasu, żeby tekst nie wychodził poza ramkę.
- Menu główne: w panelu po prawej karta jednostki jest teraz na górze, a pod nią większa figurka 3D.
- Wersja do druku: `make druk` robi gotowe PDF-y na drukarkę domową (A4, 300 DPI) — instrukcję, karty jednostek i skarbów z rewersami, 121 kafelków mapy z rewersami, dwustronną planszę areny na 4 arkuszach, naklejki na znaczniki z drukarki 3D, kość i tor rund, okładkę, logo i etykiety na pudełko i grzbiet segregatora.
- Instrukcja: nowa strona „Rady na pierwsze wyprawy” (wskazówki dla Przymierza, Hordy i na arenę); karty jednostek mają w wersji do druku 8 × 11,2 cm — tak jak karty w grze.
- Instrukcja ma 40 stron: na drugiej stronie miejsce na wiadomość od autora, „Zasady w obrazkach” (cała gra w ośmiu obrazkach na pierwszą partię), przykład tury na mapie i przykład początku bitwy krok po kroku. Przygotowanie mówi, jak rozłożyć karty skarbów (stos skarbów mapy i talia skarbów), a rozdział 7 nie twierdzi już, że bitwa kończy ruch.
- Wersja do druku: wszystko, co potrzebne do papierowej wersji gry (wymiary, figurki do druku 3D, instrukcja do edycji), jest teraz w jednym folderze `docs/wersja_planszowa/`.
- Punkty za partię z ustawieniem „pojedynki na planszy”: od kiedy Złoty Smok używa w pojedynku Słonecznego Blasku, to ustawienie wyraźnie ułatwia grę Przymierzu, więc wygrana Przymierza daje mniej punktów, a wygrana Hordy w rywalizacji więcej. Instrukcja (rozdział 13) mówi, komu pojedynki sprzyjają.
- Instrukcja: karty strażników do pojedynku (błękitny rewers) — w liście elementów (18 kart jednostek), przy strażnikach (z obrazkami kart), w zasadach pojedynku i w ściągawce.
- Karty strażników do pojedynku są w grze: w pojedynku strażnik pokazuje swoją kartę pojedynkową (błękitna obwódka, napis „Pojedynek”), a wszystkie trzy są w „Zasadach i kartach → Jednostki”. Zwykła karta strażnika nie ma już liczby Życia w nawiasie.
- **Zmiana zasad:** w pojedynku na planszy strażnik walczy osobną kartą: Cyklop ma Kamienną Skórę (każdy cios w niego o 1 mniej, 14 Życia), Gryf Złodziejski Szpon (gdy zrani, odzyskuje 1 Życie, 10 Życia), a Hydra Odrastające Głowy (na początku swojej aktywacji odzyskuje 2 Życia, 12 Życia). Bot Przymierza w pojedynku używa Słonecznego Blasku.
- Figurki 3D: wszystkie 15 z nowych modeli autora (także Pegaz, Pająk Jaskiniowy, Hydra i Król Jednorożców), każda poniżej 2,5 MB. W instrukcji każda frakcja ma swoją stronę: większe figurki bohaterów, pod nimi mniejsze figurki pomocników.
- Figurki 3D obracają się wolniej, a ruch ma dwie fazy: najpierw obrót w miejscu, potem przesunięcie (tak samo przed atakiem: obrót do celu, potem cios).
- Areny: przeszkody nie wchodzą już na sąsiednie pola (podwójne są obrócone wzdłuż swoich dwóch pól), a ich obwódka jest ciemnożółta na obu arenach.
- Figurki 3D nie mają już kolorowej poświaty — tylko aktywna figurka ma cienką żółtą obwódkę wokół podstawki.
- Instrukcja, rozdział 1: krople obrażeń są dwustronne (6 × „1” / „2”, 10 × „3” / „5”), a znaczników Żywotności i Ochrony jest po jednym — tyle, ile naprawdę może być potrzebne w jednej bitwie. Róg Odwagi oznacza się dwoma znacznikami Wzmocnienia Ataku.
- Instrukcja: figurki są pokazane jako rzuty modeli 3D z gry, każda podpisana, a strażnicy na osobnej stronie. Narzędzia: `make figurki` robi te rzuty od nowa.
- Figurki 3D: nowe, dokładniejsze modele 11 jednostek (Goblin Szaman jest przy tym kilka razy lżejszy); Cyklop, Gryf, Hydra i Władca Wilkołaków mają figurki także w wersji z GitHuba.
- Bitwa: Złoty Smok po Słonecznym Blasku ma własny znacznik „+3 Ataku” (znika po jego ataku), Eliksir Żywotności ma nowy znacznik „+4”, a pasek aktywacji pokazuje znaczniki aktywnej jednostki. Oba znaczniki są też w instrukcji.
- Instrukcja, rozdział 1: lista elementów z pudełka ma rozmiary (kafelki, plansza, karty, figurki, kryształy, tor rund) i nowy znacznik „+3 Ataku” Złotego Smoka.
- Wersja do druku: wymiary znaczników (Ø 23 mm), kropli obrażeń, toru rund, znacznika rundy i kryształów są już ostateczne — wszystkie te elementy będą drukowane w 3D.
- **Zmiana zasad:** bitwa nie kończy już ruchu. Wejście na pole wrogiego bohatera albo strażnika kosztuje tyle punktów ruchu, ile koszt terenu tego pola (jak każdy krok), a po wygranej bohater może iść dalej. Zasada jest też w instrukcji i w „Zasadach i kartach”.
- Figurki 3D: na mapie i na arenie bohaterowie i pomocnicy stoją jako trójwymiarowe figurki — obracają się w stronę ruchu, odwracają do celu przy ataku, a pierścień wokół podstawki pokazuje stronę, aktywną jednostkę i cel. W menu obok karty bohatera obraca się jego figurka. Na słabszym sprzęcie figurki można wyłączyć w Opcjach. Mają je wszystkie jednostki, także strażnicy kryształów — na mapie stoją przy pilnowanym krysztale.
- Nowe portrety Hydry i wszystkich jednostek Mrocznej Hordy — na kartach, w kolejce bitwy, w oknie szczegółów i przy wyborze bohatera, a także w instrukcji.
- Telefon, mapa świata: mapa zajmuje całą ramkę (runda jest na dolnym pasku), można ją przybliżać i oddalać przyciskami +/− albo dwoma palcami, a na początku tury mapa sama przewija się do aktywnego bohatera.
- Opis pola na mapie nie zasłania już planszy: myszką pojawia się po chwili jako mała notka obok pola, a na ekranie dotykowym dotknięte pole jest opisane w jednym pasku na dole mapy.
- Telefon trzymany poziomo: okna (zasady, opcje, dziennik) mają mniejsze marginesy, więc mieści się w nich więcej.
- Telefon trzymany poziomo: mapa albo arena z lewej, panel z prawej, wszystko na jednym ekranie. Na arenie telefon pokazuje same pola (bez szerokiej malowanej ramki), więc heksy są większe; ostatni atak jest opisany na dole areny, a nie pod tytułem bitwy.
- Boty lepiej oceniają atak na pole z kilkoma bohaterami: liczą się z obrońcą o największym Życiu, tak jak gra.
- Silnik gry działa kilka razy szybciej (symulacje ok. 8×), a wynik każdej partii jest identyczny — pilnuje tego nowy test „złotych” partii.
- Narzędzia: `make zrzut` robi mały zrzut ekranu gry w przeglądarce bez okna (desktop, telefon pionowo i poziomo, cały ekran albo jeden element).
- Narzędzia: `make sim` domyślnie bez kości obrażeń (opcja `dice`), `make sim-tabele` działa na czystym repo, nowe `make test-slow`, a `make test-engine` i `make test-ui` uruchamiają wszystkie swoje testy.
- Podgląd obrażeń nad wrogiem liczy dokładnie tak jak gra (np. Ogr z Kamieniem Ochrony: Twardogłowy działa przed Kamieniem, więc cios za 2 pokazuje −0), a gdy cios przyjmie Opiekun Gaju, podgląd to mówi.
- Zapis partii w trybie Arena jest w menu opisany jako „Arena”, a nie „Rywalizacja”.
- Esc zamyka każde okno (także czat, „Dla testerów”, „Od Twojej ostatniej tury” i znaleziony skarb), a skróty literowe nie działają, gdy jakieś okno jest otwarte.
- Figurki na mapie i na arenie są większe (mogą lekko wchodzić na sąsiednie pola), a zamiast jednolitych pierścieni otacza je delikatna, rozmyta poświata w kolorze strony.
- Bitwa: przycisk „Zasięg wrogów” zastępuje Ctrl — przytrzymany nad dowolną jednostką pokazuje, dokąd może dojść (niebieskie pola) i kogo dosięgnie (czerwone).
- Figurka obok karty bohatera w menu nie miga już przy szybkim przełączaniu bohaterów, a menu nie tworzy przy tym coraz to nowych płócien 3D.
- Bitwa przy szybkich botach: animacje ataków już się nie zacinają — figurka robi wypad przy każdym ataku, a liczby obrażeń i ślady ciosów znikają jak trzeba. Na telefonie arena nie przewija się po każdym trafieniu, tylko gdy zmienia się aktywna jednostka.
- Druga partia w tej samej sesji nie pokazuje już na starcie fałszywego „Znaleziono skarb!”, a podsumowanie „Od Twojej ostatniej tury” nie miesza wpisów z poprzedniej partii.
- Gra online: napis „Utracono połączenie z serwerem — łączę ponownie…” pojawia się tylko wtedy, gdy gra naprawdę łączy się ponownie (a nie np. po wygaśnięciu sesji).
- Strzelec, który ma wroga tuż obok, widzi nad nim kursor strzały, a nie miecza — i tak strzela, a nie bije wręcz.
- Narzędzia: `make modele` robi lekkie figurki do gry z modeli do druku (ok. 1–1,5 MB zamiast 120–200 MB); galeria `?figury` pokazuje każdą z czterech stron.
- Narzędzia: testy interfejsu korzystają ze wspólnych pomocników (`tests/helpers/ui.ts`: przygotowanie jsdom, szukanie przycisków, zamykanie okien).
- Mapa świata: ślad drogi bohatera i odsłanianie pól liczone porządniej (bez zmian w wyglądzie).
- Narzędzia: powtarzające się rozmiary przycisków są klasami CSS (`btn-bar`, `chip`, `btn-dialog`…), wygląd bez zmian.
- Narzędzia: domyślni bohaterowie przy nowym stole są wspólni dla gry lokalnej i pokoju online (`defaultHeroes`).

## 2.0.1 — 2026-10-23

- „Zgłoś błąd” wysyła zgłoszenie prosto do twórcy gry, razem z partią — także z gry online. Opinie z „Dla testerów” wysyła przycisk „Wyślij do twórcy” (bez internetu wciąż można pobrać plik); „Dla testerów” jest teraz także w menu gry online (`03e0e5a`).
- Narzędzia: `make zgloszenia` pobiera z serwera nowe zgłoszenia błędów i opinie, odtwarza błędy i podsumowuje opinie (`03e0e5a`).
- Po wydaniu nowej wersji gra raz pokazuje okienko „Nowa wersja — co nowego” ze zmianami od Twojej ostatniej wizyty (`5deeb5b`).
- „Historia zmian” nie pokazuje już numerów technicznych przy niektórych wpisach (`5deeb5b`).

## 2.0.0 — 2026-10-23

- Narzędzia: `make sim-tabele` — czytelne tabele z % wygranych Przymierza w każdym trybie, mapie i poziomie oraz z tym, jak przegrywa (wybici bohaterowie, rytuał, limit rund) (`0f1b64f`).
- Gra online (wersja próbna): przycisk „Gra online” w menu — konto (nick i hasło), pokój z kodem dla znajomych, ustawienia stołu, zajmowanie miejsc i czat; partię we wszystkich trybach prowadzi serwer gry. W trakcie gry: czat, odliczanie, gdy ktoś się rozłączy, i „Oddaj botowi”. Podczas `npm run dev` gra łączy się z serwerem uruchomionym lokalnie (`d73b84d`).
- Gra online: tempo botów ustawia założyciel pokoju (w lobby i w Opcjach) dla wszystkich graczy; na przycisku „Czat” liczba nowych wiadomości (`a503c65`).
- Narzędzia: `make silnik` — silnik gry jako pakiet dołączony do wydania na GitHubie; z niego korzysta serwer gry online (`9fbbe08`).
- Dokumentacja: `docs/INFRASTRUKTURA.md` — gdzie działa gra i serwer, jak wydawać wersje i wdrażać zmiany (`112849c`).
- Punktacja i rozpoznawanie poziomu przeniesione do silnika gry, żeby serwer liczył ranking tak samo jak gra (`125e876`).
- Menu „najpierw online”: na starcie „Zaloguj się / Nowe konto / Graj bez konta” (bez konta — tylko gra na tym komputerze; wybór zapamiętany), a po zalogowaniu menu z „Nowy pokój”, kodem pokoju, „Gra na tym komputerze”, rankingiem top 10 (puchary dla miejsc 1–3, własne miejsce pod tabelą), listą graczy online z „Zaproś” i ogólnym czatem. Zaproszenia wyskakują w rogu ekranu (z dźwiękiem i odliczaniem), a gry przeciw komputerowi skończone po zalogowaniu trafiają do rankingu (`3f86dc5`).
- Bitwa: ikony statystyk w listach jednostek po bokach areny (i pod kartami w pojedynku) są białe, czytelne na ciemnym tle, i odsunięte od paska Życia (`f79eb4c`).
- Szczegóły pod prawym przyciskiem, jak w Heroesach: przytrzymanie prawego przycisku na polu mapy (teren, koszt ruchu, kryształ ze strażnikiem, skarb, stojący tam bohaterowie), jednostce na arenie (karta z bieżącymi wartościami, Życie, efekty), portrecie albo skarbie pokazuje okienko, a puszczenie je chowa. Krótkie kliknięcie prawym (np. na touchpadzie) zostawia okienko do następnego kliknięcia; na telefonie — przytrzymanie palca (`6b17291`).
- Kursory: złote także na polach mapy i areny i na jednostkach w bitwie (wcześniej systemowe); kursor mówi, co zrobi kliknięcie — but (ruch), miecz (atak wręcz, także strzelca na sąsiada), strzała (strzał), przekreślona strzała (przeszkoda zasłania cel, z podpowiedzią nad celem) (`5e90c41`).
- Arena: obrysy pól nie nachodzą już na siebie — każdy róg pola liczony z perspektywy planszy na jego własnej wysokości, więc sąsiednie pola mają wspólne krawędzie (`c36cbdb`).
- Enter w okienkach naciska ich przycisk potwierdzenia albo zamknięcia (np. „Dalej”, „Do ekwipunku”, „Zamknij”, „Zakończ turę” w pytaniu); okienka bez takiego przycisku zamyka. Nie działa na ekranie końca gry, żeby nie zacząć nowej przypadkiem (`167e25c`).
- Bitwa: atak jednym kliknięciem — jednostka walcząca wręcz klika wroga w zasięgu ruchu, podchodzi i atakuje. Stronę wybiera się kursorem (część wroga, w którą celuje mysz, jak w Heroes III); pole, z którego nastąpi atak, świeci się na złoto, a nad wrogiem widać obrażenia. Na telefonie pierwsze dotknięcie pokazuje pole, drugie atakuje (`34556ea`).
- Kursory z nowych grafik: zwykły, but (ruch), skrzydło (ruch jednostki latającej w bitwie), miecz, strzała i przekreślona strzała; miecz i strzały obracają się w stronę ataku — miecz od pola, z którego jednostka uderzy, strzały od strzelca do celu (na mapie miecz od bohatera do pola z walką) (`77e1693`, `c80f70b`).
- Prawy przycisk nigdy nie otwiera menu przeglądarki (należy do gry); w polach tekstowych kopiowanie i wklejanie działa skrótami Ctrl+C / Ctrl+V (`bcde321`).
- Arena: równa złota siatka pól rysowana przez grę na planszy — na malowanych arenach sąsiednie heksy miały osobne obwódki, które nie zawsze leżały na sobie (podwójne krawędzie, jasne pola startowe nachodzące na sąsiadów) (`7a97561`).

## 1.3.0 — 2026-10-22

- Narzędzia: przebudowa instrukcji (`scripts/assets/manual.py`) nadpisuje pliki zamiast kasować folder, przez co działający serwer deweloperski pokazywał w zakładce „Instrukcja” menu gry zamiast instrukcji (`9b73c58`).
- Notatki projektowe: zasady nowego trybu Arena (`d8f75e1`).
- Arena, część 1: zasady w silniku gry (wybór pomocników, losowanie skarbów A, B, B, A ze wspólnej talii, jedna bitwa) i bot na trzech poziomach; ekrany jeszcze w budowie (`4cbdc11`).
- Narzędzia: symulacje balansu Areny (`scripts/sim/arena.ts`): każdy skład Przymierza przeciw każdemu składowi Hordy (`d227c4b`).
- Arena, część 2: tryb „Arena (jedna bitwa)” w menu — przeciw komputerowi (Łatwy / Normalny / Trudny) albo drugiemu graczowi; ekran przed walką, losowanie skarbów (przy dwóch graczach zakryte, dopóki strona ich nie odsłoni), ekran końca; w „Twoich partiach” osobny wiersz Areny i 1 / 2 / 3 pkt za wygraną z komputerem (`86a53c2`).
- Instrukcja: nowy rozdział 15 „Arena — szybka bitwa” (ściągawka to teraz rozdział 16) i sekcja Areny w „Podstawowych zasadach”; w notatkach wyniki symulacji Areny (`3309c1e`).
- Notatki projektowe: punkty za Arenę (1 / 2 / 3) zaakceptowane (`b064e71`).
- Narzędzia: symulacje Areny przyjmują zmiany testowe (`SIM_OVERRIDE`) i zapisują wyniki do porównań (`1a42647`).
- Narzędzia: porównywanie zestawów zmian jednostek z wynikami wyjściowymi na Arenie i w całej grze (`scripts/sim/tune.ts`) oraz testowe warianty zdolności Zew Krwi i Twardogłowy (domyślnie wyłączone) (`7c8a91f`).
- Notatki projektowe: założenia i ustalenia nowego balansu jednostek (bez budżetu statystyk, specjalizacje, limit ±5 punktów) (`adcc12f`).
- Balans jednostek: Władca Wilkołaków S 7, a Zew Krwi daje +1 A do każdego ataku na rannego wroga (zamiast raz na bitwę +2 A); Król Jednorożców S 8 i Szarża Światła +2 A; Ogr Żelazna Pięść Ż 10 (`40372c7`).
- Arena: przy losowaniu skarbów Horda widzi 4 karty zamiast 3 (bez tego Przymierze wygrywało ok. 55% starć); okienko wyboru mieści 4 karty w jednym rzędzie (`0bcd3d5`).
- Bitwa: chodzące jednostki nie przechodzą już przez pola zajęte przez sojuszników (zgłoszenie z 22 października 2026); opis w „Podstawowych zasadach” (`e684e4c`).
- Instrukcja i punkty po nowym balansie: statystyki i zdolności w rozdziale 2 (z nowymi obrazkami kart Wilkołaka, Jednorożca i Ogra), zasada ruchu w bitwie, 4 karty dla Hordy na Arenie, przeliczone tabele trudności w rozdziale 13 i oceny w punktach; w notatkach wyniki balansu i lista zmian dla wersji papierowej (`bdf0d90`).

## 1.2.0 — 2026-10-22

- Historia zmian w repozytorium: lista commitów w każdej wersji (`1667367`).
- Instrukcja, rozdział 13: tabele trudności tylko dla poziomów Łatwy, Normalny i Trudny; w rywalizacji osobne kolumny Przymierza i Hordy w kolorach frakcji (`1cb09f8`).
- Menu: remis inicjatywy jest teraz ustawieniem Własnego poziomu (domyślnie obrońca pierwszy), samouczek stoi nad zasadami testowymi (`14d9a91`).
- Menu, „Twoje partie”: procent wygranych, punkty za wygrane (długość mapy × zmierzona trudność, najwyżej 30) i okienko „Dokładne dane” z tabelą według trybu, mapy i poziomu. Nieukończone partie się nie liczą (`0047738`).
- Wprowadzenie przy pierwszym uruchomieniu: pokaz slajdów z opowieścią i podstawowymi zasadami (grafiki w przygotowaniu); przycisk „Wprowadzenie” w menu pokazuje je ponownie (`eca6c54`).
- Poprawiona podpowiedź w menu o liczbie bohaterów automatu zła (`c237c05`).
- Kooperacja na poziomach Łatwym i Normalnym: automat zaczyna z tyloma bohaterami Hordy, ilu jest graczy, a gdy polegną wszyscy, w bazie Hordy pojawia się kolejny. Poziom Trudny bez zmian (`a46d086`).
- Instrukcja i punkty uwzględniają posiłki Hordy: rozdziały 4, 12 i 13, nowe oceny trudności kooperacji (`d621403`).
- Notatki projektowe: wyniki symulacji posiłków Hordy zaakceptowane (`19b98db`).
- Historia zmian w grze: kliknięcie numeru wersji w menu głównym otwiera okienko z wersjami, datami i zmianami; ten plik prowadzony po polsku (`54c7e38`).
- Wprowadzenie z prawdziwymi ilustracjami (9 slajdów, JPG zamiast PNG: 3,6 MB zamiast 24,6 MB) i łagodniejszy ruch kamery (`e5920d6`).
- Pełny ekran jak F11: przycisk w prawym górnym rogu (obok muzyki) i ustawienie „Pełny ekran przy uruchomieniu” — gra przechodzi na pełny ekran przy pierwszym kliknięciu albo klawiszu; Esc wraca do okna (`b54281e`).
- Ekran tytułowy przy każdym otwarciu gry: logo, hasło i przycisk START, który włącza pełny ekran i muzykę, a za pierwszym razem prowadzi do wprowadzenia (`cdfb484`).
- Ekran tytułowy wczytuje w tle muzykę menu i (przy pierwszym uruchomieniu) grafiki wprowadzenia, więc po kliknięciu START nic nie doczytuje się na oczach gracza (`9167c7a`).
- Poprawione grafiki: nowa okładka (tło menu i ekranu tytułowego, okładka instrukcji) i nowe ilustracje pięciu slajdów wprowadzenia (strażnicy, jak wygrać, wędrówka, bitwa, tryby gry) (`bb144e7`).
- Poprawka: zamknięcie dziennika zdarzeń wywracało grę („Błąd interfejsu: n is not a function”) w nowszych przeglądarkach opartych na Chrome, np. Operze; zgłosił Filip (`d3e3f39`).
- Narzędzia: analiza zgłoszeń (`make report`) czyta też pliki testerów z „INFO DLA TESTERÓW” i pokazuje ich uwagi (`b96531b`).
- Poprawka: liczba na kropli obrażeń w bitwie stoi teraz na środku kropli i nie wystaje poza nią (cyfry równej wysokości, mniejsza czcionka dla liczb dwucyfrowych) (`e6484e6`).

## 1.1.0 — 2026-10-22

- Balans: szybkości bez remisów (Przymierze parzyste, Horda nieparzyste), prostszy automat zła, poziomy Łatwy i Trudny, limity rund 8 / 12 / 18 / 24, skarby Przymierza na start na długich mapach, 6 Eliksirów Odrodzenia (`51f6d15`).
- Interfejs: numer wersji w menu, poziom Łatwy, tor rund z 24 gniazdami, animacja chodzenia jednostek na arenie (`36cd3ec`).
- Grafika: areny z przeszkodami dopasowanymi do pól (dwie zajmują po 2 pola), nowe znaczniki i tor rund, portret Zwoju Magicznej Strzały, arkusze figurek (`7911897`).
- Instrukcja 1.1: nowe zasady i poziomy, skarby automatu, figurki, tabele trudności (`bd6f9bf`).
- Zgłoszenia błędów od testerów z 21 października 2026 (`9b41cce`).

## 1.0.0 — 2026-10-21

- Pierwsza wersja cyfrowego prototypu: silnik zasad, boty, gra na jednym urządzeniu, mapa przygody i bitwy na arenie (`5f86ad0`).
- Usprawnienia interfejsu: animacje bitew, odkrywanie skarbów, wygląd kart (`cddb9b0`).
- Wiele zmian w zasadach, interfejsie i grafice, zapis gry, samouczek (`3d3c4bb`).
- Gra dostępna w przeglądarce przez GitHub Pages (`84b5a7d`).
- Poprawka konfiguracji publikacji (`0b4120e`).
- Wersja 1.0: muzyka, informacje dla testerów i dziennik partii, znaczniki w bitwie (`d3e25d9`).

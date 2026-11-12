# Historia zmian

Co się zmieniało w kolejnych wersjach gry. Wersja to tag w repozytorium (np. `1.1.0`) i pole `version` w `package.json`; numer widać w menu głównym, a kliknięcie go otwiera tę historię w grze.

Każdy wpis to jeden commit, a skrót commita stoi w nawiasie na końcu wpisu (commit nie zna własnego skrótu, więc dopisuję go w następnym commicie albo przy tagowaniu). Zmiany, które nie trafiły jeszcze do żadnej wersji, są w sekcji „W przygotowaniu”. Nagłówek wersji ma postać `## numer — RRRR-MM-DD`, bo gra czyta ten plik.

## W przygotowaniu

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

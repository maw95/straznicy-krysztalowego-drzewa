# Strażnicy Kryształowego Drzewa — najczęstsze komendy.
# Node.js jest zainstalowany lokalnie w ~/.local/node, więc dopinamy go do PATH.

export PATH := $(HOME)/.local/node/bin:$(HOME)/.fly/bin:$(PATH)

GAMES ?= 1000
SIZE ?= short
MODE ?= coop
OPTIONS ?= full
BATTLE ?= arena

.DEFAULT_GOAL := help
.PHONY: help install dev build preview test test-engine test-ui test-slow test-watch typecheck check sim sim-all sim-matrix sim-battles sim-arena sim-tabele report zgloszenia modele silnik clean

help: ## Lista komend
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[33m%-12s\033[0m %s\n", $$1, $$2}'

node_modules: package.json package-lock.json
	npm install
	@touch node_modules

install: node_modules ## Instalacja zależności

dev: node_modules ## Gra w trybie deweloperskim (http://localhost:5173)
	npx vite

build: node_modules ## Sprawdzenie typów + wersja statyczna w dist/
	npm run build

preview: build ## Podgląd zbudowanej wersji (http://localhost:4173)
	npx vite preview

# Interface tests: the clicking ones and the music player; every other test file checks the rules.
UI_TESTS := $(wildcard tests/ui*.test.tsx) tests/music.test.ts
ENGINE_TESTS := $(filter-out $(UI_TESTS),$(wildcard tests/*.test.ts tests/*.test.tsx))

test: node_modules ## Wszystkie testy (zasady + interfejs)
	npx vitest run

test-engine: node_modules ## Tylko testy zasad (szybkie)
	npx vitest run $(ENGINE_TESTS)

test-ui: node_modules ## Tylko testy interfejsu (klikające i muzyka)
	npx vitest run $(UI_TESTS)

test-slow: node_modules ## Wszystkie testy z pełnym przeglądem bitew w interfejsie (36 ziaren zamiast 12)
	SLOW=1 npx vitest run

test-watch: node_modules ## Testy w trybie ciągłym
	npx vitest

typecheck: node_modules ## Sprawdzenie typów TypeScript
	npx tsc --noEmit -p .

check: typecheck test ## Typy + testy (przed commitem)

sim: node_modules ## Symulacje botów (bez kości obrażeń, chyba że OPTIONS ma dice), np. make sim GAMES=500 SIZE=medium MODE=pvp OPTIONS=noabilities,dice BATTLE=board
	npx tsx scripts/simulate.ts $(GAMES) $(SIZE) $(MODE) $(OPTIONS) $(BATTLE)

sim-all: node_modules ## Symulacje wszystkich map w kooperacji: pełna gra i bez zdolności
	@for size in short medium long; do for diff in full noabilities; do \
		npx tsx scripts/simulate.ts $(GAMES) $$size coop $$diff; \
	done; done

sim-matrix: node_modules ## Wszystkie 72 warianty z diagnostyką botów, np. make sim-matrix GAMES=1000
	node --import tsx scripts/sim/matrix.ts $(GAMES) matrix

sim-battles: node_modules ## Turniej jednostek w równych warunkach (balans bohaterów, pomocników, strażników)
	node --import tsx scripts/sim/battles.ts 300

sim-tabele: node_modules ## Tabele: % wygranych Przymierza w każdym trybie, mapie i poziomie oraz jak przegrywa, np. make sim-tabele GAMES=300
	@mkdir -p .tmp/sim
	node --import tsx scripts/sim/matrix.ts $(GAMES) tabele > .tmp/sim/tabele.log
	node --import tsx scripts/sim/tables.ts tabele

sim-arena: node_modules ## Arena: każdy skład Przymierza przeciw każdemu składowi Hordy, np. make sim-arena GAMES=1000
	node --import tsx scripts/sim/arena.ts $(GAMES) normal

report: node_modules ## Odtworzenie zgłoszeń błędów z bug-reports/ (albo FILE=ścieżka.json)
	npx tsx scripts/report.ts $(FILE)

zgloszenia: node_modules ## Nowe zgłoszenia błędów i opinie z serwera gry: pobranie, odtworzenie, podsumowanie (ACK=0: bez oznaczania)
	npx tsx scripts/zgloszenia.ts $(if $(filter 0,$(ACK)),--no-ack,)

# Figure models for the game: source file (docs/druk3d/figurki/z_teksturami/<faction>/<name>/<name>.glb) → unit id.
FIGURES := przymierze/zloty_smok:goldDragon przymierze/jednorozec:unicornKing przymierze/niedzwiedz:ancientBear \
	przymierze/elf_druid:elfDruid przymierze/nimfa:nymph przymierze/pegaz:pegasus \
	horda/czarny_smok:blackDragon horda/wilkolak:werewolfLord horda/ogr:ironFistOgre \
	horda/goblin:goblinShaman horda/pajak:caveSpider horda/nietoperz:shadowBat \
	straznicy/cyklop:cyclops straznicy/gryf:griffin straznicy/hydra:hydra
RATIO ?= 0.02

modele: ## Figurki 3D do gry: docs/druk3d/figurki/z_teksturami/** -> public/modele/<jednostka>.glb (uproszczone, tekstury 1024 px WebP; model, który wyjdzie ponad 2,5 MB, upraszczany jest z większą tolerancją), np. make modele RATIO=0.02
	@mkdir -p public/modele
	@for f in $(FIGURES); do \
		src=docs/druk3d/figurki/z_teksturami/$${f%%:*}/$$(basename $${f%%:*}).glb; id=$${f##*:}; \
		if [ -f $$src ]; then \
			for err in 0.01 0.05; do \
				npx -y @gltf-transform/cli@4 optimize $$src public/modele/$$id.glb --simplify-ratio $(RATIO) --simplify-error $$err \
					--texture-size 1024 --texture-compress webp --compress meshopt >/dev/null; \
				[ $$(stat -c %s public/modele/$$id.glb) -lt 2500000 ] && break; \
			done; echo "$$id: $$(du -h public/modele/$$id.glb | cut -f1)"; \
		else echo "$$id: brak modelu ($$src)"; fi; \
	done

silnik: ## Silnik gry jako pakiet dla serwera, dołączony do wydania na GitHubie, np. make silnik TAG=1.3.0
	scripts/engine-package.sh $(or $(TAG),$(shell node -p "require('./package.json').version"))

clean: ## Usunięcie dist/ i plików tymczasowych
	rm -rf dist .tmp

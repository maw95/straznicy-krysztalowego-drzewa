# Strażnicy Kryształowego Drzewa — najczęstsze komendy.
# Node.js jest zainstalowany lokalnie w ~/.local/node, więc dopinamy go do PATH.

export PATH := $(HOME)/.local/node/bin:$(PATH)

GAMES ?= 1000
SIZE ?= short
MODE ?= coop
OPTIONS ?= full
BATTLE ?= arena

.DEFAULT_GOAL := help
.PHONY: help install dev build preview test test-engine test-ui test-watch typecheck check sim sim-all sim-matrix sim-battles sim-arena report clean

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

test: node_modules ## Wszystkie testy (zasady + interfejs)
	npx vitest run

test-engine: node_modules ## Tylko testy zasad (szybkie)
	npx vitest run tests/engine.test.ts

test-ui: node_modules ## Tylko testy klikające po interfejsie
	npx vitest run tests/ui.test.tsx tests/ui-battle.test.tsx

test-watch: node_modules ## Testy w trybie ciągłym
	npx vitest

typecheck: node_modules ## Sprawdzenie typów TypeScript
	npx tsc --noEmit -p .

check: typecheck test ## Typy + testy (przed commitem)

sim: node_modules ## Symulacje botów, np. make sim GAMES=500 SIZE=medium MODE=pvp OPTIONS=noabilities,nodice BATTLE=board
	npx tsx scripts/simulate.ts $(GAMES) $(SIZE) $(MODE) $(OPTIONS) $(BATTLE)

sim-all: node_modules ## Symulacje wszystkich map w kooperacji: pełna gra i bez zdolności
	@for size in short medium long; do for diff in full noabilities; do \
		npx tsx scripts/simulate.ts $(GAMES) $$size coop $$diff; \
	done; done

sim-matrix: node_modules ## Wszystkie 72 warianty z diagnostyką botów, np. make sim-matrix GAMES=1000
	node --import tsx scripts/sim/matrix.ts $(GAMES) matrix

sim-battles: node_modules ## Turniej jednostek w równych warunkach (balans bohaterów, pomocników, strażników)
	node --import tsx scripts/sim/battles.ts 300

sim-arena: node_modules ## Arena: każdy skład Przymierza przeciw każdemu składowi Hordy, np. make sim-arena GAMES=1000
	node --import tsx scripts/sim/arena.ts $(GAMES) normal

report: node_modules ## Odtworzenie zgłoszeń błędów z bug-reports/ (albo FILE=ścieżka.json)
	npx tsx scripts/report.ts $(FILE)

clean: ## Usunięcie dist/ i plików tymczasowych
	rm -rf dist .tmp

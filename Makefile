# Strażnicy Kryształowego Drzewa — najczęstsze komendy.
# Node.js jest zainstalowany lokalnie w ~/.local/node, więc dopinamy go do PATH.

export PATH := $(HOME)/.local/node/bin:$(PATH)

GAMES ?= 1000
SIZE ?= short
MODE ?= coop
DIFFICULTY ?= basic
BATTLE ?= arena

.DEFAULT_GOAL := help
.PHONY: help install dev build preview test test-engine test-ui test-watch typecheck check sim sim-all clean

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

sim: node_modules ## Symulacje botów, np. make sim GAMES=500 SIZE=medium MODE=pvp DIFFICULTY=advanced BATTLE=board
	npx tsx scripts/simulate.ts $(GAMES) $(SIZE) $(MODE) $(DIFFICULTY) $(BATTLE)

sim-all: node_modules ## Symulacje wszystkich map i wariantów kooperacji
	@for size in short medium long; do for diff in basic advanced; do \
		npx tsx scripts/simulate.ts $(GAMES) $$size coop $$diff; \
	done; done

clean: ## Usunięcie dist/ i plików tymczasowych
	rm -rf dist .tmp

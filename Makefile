# Lunar Lander - Multi-LLM Chat Application Makefile

# Environment variables
SHELL := /bin/bash
NODE_ENV ?= development
ELECTRON := npx electron
WEBPACK := npx webpack
ESLINT := npx eslint
TSC := npx tsc
CONCURRENTLY := npx concurrently
ELECTRON_BUILDER := npx electron-builder

# Platform and architecture detection
ifeq ($(OS),Windows_NT)
	PLATFORM := win
	ifeq ($(PROCESSOR_ARCHITECTURE),AMD64)
		ARCH := x64
	else
		ARCH := ia32
	endif
else
	UNAME := $(shell uname -s)
	ifeq ($(UNAME),Linux)
		PLATFORM := linux
	else ifeq ($(UNAME),Darwin)
		PLATFORM := mac
	endif

	UNAME_M := $(shell uname -m)
	ifeq ($(UNAME_M),x86_64)
		ARCH := x64
	else ifeq ($(UNAME_M),arm64)
		ARCH := arm64
	else
		ARCH := ia32
	endif
endif

# Directories
SRC_DIR := src
DIST_DIR := dist
BUILD_DIR := build
NODE_MODULES := node_modules

# Colors
COLOR_RESET := \033[0m
COLOR_BOLD := \033[1m
COLOR_RED := \033[31m
COLOR_GREEN := \033[32m
COLOR_YELLOW := \033[33m
COLOR_BLUE := \033[34m
COLOR_MAGENTA := \033[35m
COLOR_CYAN := \033[36m

# Default target
.PHONY: all
all: help

# Make sure these directories exist
$(DIST_DIR):
	@mkdir -p $(DIST_DIR)

$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

# Install dependencies
.PHONY: install
install:
	@echo -e "$(COLOR_BOLD)$(COLOR_BLUE)Installing dependencies...$(COLOR_RESET)"
	@yarn install

# Clean up
.PHONY: clean
clean:
	@echo -e "$(COLOR_BOLD)$(COLOR_BLUE)Cleaning up...$(COLOR_RESET)"
	@rm -rf $(DIST_DIR) $(BUILD_DIR)

# Development mode
.PHONY: dev
dev: $(NODE_MODULES) prepare
	@echo -e "$(COLOR_BOLD)$(COLOR_GREEN)Starting development server...$(COLOR_RESET)"
	@NODE_ENV=development $(CONCURRENTLY) \
		"$(WEBPACK) --config webpack.main.config.js --watch" \
		"$(WEBPACK) --config webpack.renderer.config.js --watch" \
		"$(ELECTRON) $(DIST_DIR)/main/index.js"

# Prepare directories
.PHONY: prepare
prepare:
	@mkdir -p $(DIST_DIR)/main $(DIST_DIR)/renderer

# Build for production
.PHONY: build
build: $(NODE_MODULES) clean prepare
	@echo -e "$(COLOR_BOLD)$(COLOR_GREEN)Building for production...$(COLOR_RESET)"
	@NODE_ENV=production $(WEBPACK) --config webpack.main.config.js
	@NODE_ENV=production $(WEBPACK) --config webpack.renderer.config.js

# Start the application (production build)
.PHONY: start
start: $(NODE_MODULES) $(DIST_DIR)
	@echo -e "$(COLOR_BOLD)$(COLOR_GREEN)Starting application...$(COLOR_RESET)"
	@$(ELECTRON) $(DIST_DIR)/main/index.js

# Linting
.PHONY: lint
lint: $(NODE_MODULES)
	@echo -e "$(COLOR_BOLD)$(COLOR_BLUE)Linting code...$(COLOR_RESET)"
	@$(ESLINT) --ext .ts,.tsx $(SRC_DIR)

# Type checking
.PHONY: typecheck
typecheck: $(NODE_MODULES)
	@echo -e "$(COLOR_BOLD)$(COLOR_BLUE)Type checking...$(COLOR_RESET)"
	@$(TSC) --noEmit

# Code quality check (lint + typecheck)
.PHONY: check
check: lint typecheck
	@echo -e "$(COLOR_BOLD)$(COLOR_GREEN)Code quality check passed!$(COLOR_RESET)"

# Package for distribution
.PHONY: package
package: $(NODE_MODULES) build
	@echo -e "$(COLOR_BOLD)$(COLOR_MAGENTA)Packaging application for current platform...$(COLOR_RESET)"
ifeq ($(PLATFORM),linux)
	@NODE_ENV=production yarn dist:linux
else ifeq ($(PLATFORM),win)
	@NODE_ENV=production yarn dist:win
else ifeq ($(PLATFORM),mac)
	@NODE_ENV=production yarn dist:mac
endif

# Package for Linux only
.PHONY: package_linux
package_linux: $(NODE_MODULES) build
	@echo -e "$(COLOR_BOLD)$(COLOR_MAGENTA)Packaging application for Linux...$(COLOR_RESET)"
	@NODE_ENV=production yarn dist:linux

# Package for Windows only
.PHONY: package_win
package_win: $(NODE_MODULES) build
	@echo -e "$(COLOR_BOLD)$(COLOR_MAGENTA)Packaging application for Windows...$(COLOR_RESET)"
	@NODE_ENV=production yarn dist:win

# Package for Mac only
.PHONY: package_mac
package_mac: $(NODE_MODULES) build
	@echo -e "$(COLOR_BOLD)$(COLOR_MAGENTA)Packaging application for macOS...$(COLOR_RESET)"
	@NODE_ENV=production yarn dist:mac

# Package for all platforms (requires all platforms available)
.PHONY: package_all
package_all: $(NODE_MODULES) build
	@echo -e "$(COLOR_BOLD)$(COLOR_MAGENTA)Packaging application for all platforms...$(COLOR_RESET)"
	@NODE_ENV=production yarn dist:all

# Pack without creating installers (useful for testing)
.PHONY: pack
pack: $(NODE_MODULES) build
	@echo -e "$(COLOR_BOLD)$(COLOR_MAGENTA)Packing application for current platform...$(COLOR_RESET)"
ifeq ($(PLATFORM),linux)
	@NODE_ENV=production yarn pack:linux
else ifeq ($(PLATFORM),win)
	@NODE_ENV=production yarn pack:win
else ifeq ($(PLATFORM),mac)
	@NODE_ENV=production yarn pack:mac
endif

# Create release
.PHONY: release
release: build package
	@echo -e "$(COLOR_BOLD)$(COLOR_CYAN)Creating release...$(COLOR_RESET)"
	@echo -e "$(COLOR_YELLOW)Remember to update the version number in package.json!$(COLOR_RESET)"

# Node modules dependency
$(NODE_MODULES):
	@$(MAKE) install

# Help menu
.PHONY: help
help:
	@echo -e "$(COLOR_BOLD)$(COLOR_CYAN)Lunar Lander - Multi-LLM Chat Application Makefile$(COLOR_RESET)"
	@echo -e "$(COLOR_BOLD)Usage:$(COLOR_RESET)"
	@echo -e "  $(COLOR_GREEN)make [target]$(COLOR_RESET)"
	@echo
	@echo -e "$(COLOR_BOLD)Targets:$(COLOR_RESET)"
	@echo -e "  $(COLOR_GREEN)install$(COLOR_RESET)     Install dependencies"
	@echo -e "  $(COLOR_GREEN)dev$(COLOR_RESET)         Start development server"
	@echo -e "  $(COLOR_GREEN)build$(COLOR_RESET)       Build application for production"
	@echo -e "  $(COLOR_GREEN)start$(COLOR_RESET)       Start the built application"
	@echo -e "  $(COLOR_GREEN)lint$(COLOR_RESET)        Lint code"
	@echo -e "  $(COLOR_GREEN)typecheck$(COLOR_RESET)   Typecheck TypeScript code"
	@echo -e "  $(COLOR_GREEN)check$(COLOR_RESET)       Run all code quality checks"
	@echo -e "  $(COLOR_GREEN)package$(COLOR_RESET)     Package application for current platform"
	@echo -e "  $(COLOR_GREEN)package_linux$(COLOR_RESET) Package application for Linux only"
	@echo -e "  $(COLOR_GREEN)package_win$(COLOR_RESET) Package application for Windows"
	@echo -e "  $(COLOR_GREEN)package_mac$(COLOR_RESET) Package application for macOS"
	@echo -e "  $(COLOR_GREEN)package_all$(COLOR_RESET) Package application for all platforms"
	@echo -e "  $(COLOR_GREEN)pack$(COLOR_RESET)        Pack application without creating installers"
	@echo -e "  $(COLOR_GREEN)release$(COLOR_RESET)     Create a release"
	@echo -e "  $(COLOR_GREEN)clean$(COLOR_RESET)       Clean build files"
	@echo -e "  $(COLOR_GREEN)help$(COLOR_RESET)        Show this help message"
	@echo
	@echo -e "$(COLOR_BOLD)Environment:$(COLOR_RESET)"
	@echo -e "  $(COLOR_YELLOW)Platform:$(COLOR_RESET) $(PLATFORM)"
	@echo -e "  $(COLOR_YELLOW)Architecture:$(COLOR_RESET) $(ARCH)"
	@echo -e "  $(COLOR_YELLOW)Node environment:$(COLOR_RESET) $(NODE_ENV)"
# Web App (SolidJS)

**Package:** `packages/app`
**Type:** Web application

## Overview

SolidJS web application with SolidStart. Features include components, hooks, pages, and context management.

## Structure

```
packages/app/src/
├── addons/         # Additional features
├── components/     # App components
│   └── session/
├── context/        # React/context providers
├── hooks/          # Custom hooks
├── i18n/           # Internationalization
├── pages/          # Route pages
└── utils/          # Utilities
```

## Commands

```bash
# Dev
bun dev

# Test
bun test

# E2E tests
cd packages/app && bun test:e2e
```

## Debugging

- NEVER try to restart the app, or the server process, EVER.

## Local Dev

- `opencode dev web` proxies `https://app.opencode.ai`, so local UI/CSS changes will not show there.
- For local UI changes, run the backend and app dev servers separately.
- Backend (from `packages/opencode`): `bun run --conditions=browser ./src/index.ts serve --port 4096`
- App (from `packages/app`): `bun dev -- --port 4444`
- Open `http://localhost:4444` to verify UI changes (it targets the backend at `http://localhost:4096`).

## SolidJS Patterns

- Always prefer `createStore` over multiple `createSignal` calls

## Tool Calling

- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

## E2E Testing

Playwright starts the Vite dev server automatically via `webServer`, and UI tests need an opencode backend (defaults to `localhost:4096`).

```bash
bunx playwright install
bun run test:e2e:local
bun run test:e2e:local -- --grep "settings"
```

# Console Web Dashboard

**Package:** `packages/console`
**Type:** Web dashboard (SolidJS + Hono)

## Overview

Account and usage management dashboard. Consists of frontend app, backend core, Cloudflare Workers functions, and resource handlers.

## Structure

```
packages/console/
├── app/             # Frontend (SolidJS)
├── core/            # Backend logic, DB migrations
├── function/        # Cloudflare Workers
├── resource/        # Resource handlers
└── mail/            # Email service
```

## Key Patterns

- Frontend uses SolidJS with `@solidjs/start`
- Backend uses Hono for Edge Functions
- Database migrations in `core/migrations/`
- SST deployment via `sst.config.ts`

## Commands

```bash
# Dev
bun dev

# Build
bun turbo build --filter=console
```

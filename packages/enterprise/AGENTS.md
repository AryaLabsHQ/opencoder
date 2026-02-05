# Enterprise Features

**Package:** `packages/enterprise`
**Type:** Enterprise-specific functionality

## Overview

Enterprise features including shareable routes, API endpoints, and business logic.

## Structure

```
packages/enterprise/src/
├── core/           # Core enterprise logic
└── routes/         # API and page routes
    ├── api/        # API endpoints
    └── share/      # Share functionality
```

## Commands

```bash
# Dev
bun dev

# Build
bun build
```

## Key Patterns

- Hono for API routes
- SST deployment
- Enterprise-specific business logic

# JavaScript SDK

**Package:** `packages/sdk/js`
**Type:** External SDK for programmatic access

## Overview

JavaScript/TypeScript SDK for external programmatic access to OpenCode. Generated from OpenAPI spec.

## Commands

```bash
# Regenerate SDK
./packages/sdk/js/script/build.ts

# Test
cd packages/sdk/js && bun test
```

## Structure

```
packages/sdk/js/
├── src/
│   ├── index.ts           # Public exports
│   ├── client.ts          # Core client
│   ├── entrypoints/       # Specific entry points
│   └── __tests__/         # Vitest tests
├── script/
│   └── build.ts           # SDK generation
└── vitest.config.ts       # Test configuration
```

## Testing

- Framework: Vitest
- Config: `vitest.config.ts`
- Tests in `__tests__/` directory

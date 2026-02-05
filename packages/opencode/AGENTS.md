# OpenCode CLI - TUI Application

**Package:** `packages/opencode`
**Type:** Main CLI/TUI application

## Overview

The core OpenCode terminal interface. Built with custom TUI, handles agent orchestration, file operations, and interactive sessions.

## Build/Test Commands

- **Install**: `bun install`
- **Run**: `bun run --conditions=browser ./src/index.ts`
- **Typecheck**: `bun run typecheck`
- **Test**: `bun test`
- **Single test**: `bun test test/tool/tool.test.ts`

## Code Style

- **Runtime**: Bun with TypeScript ESM modules
- **Imports**: Relative imports for local modules, named imports preferred
- **Types**: Zod schemas for validation, TypeScript interfaces for structure
- **Naming**: camelCase for variables/functions, PascalCase for classes/namespaces
- **Error handling**: Use Result patterns, avoid throwing exceptions in tools
- **File structure**: Namespace-based organization (e.g., `Tool.define()`, `Session.create()`)

## Architecture

- **Tools**: Implement `Tool.Info` interface with `execute()` method
- **Context**: Pass `sessionID` in tool context, use `App.provide()` for DI
- **Validation**: All inputs validated with Zod schemas
- **Logging**: Use `Log.create({ service: "name" })` pattern
- **Storage**: Use `Storage` namespace for persistence
- **SDK Generation**: When modifying server endpoints in `server.ts`, run `./script/generate.ts`

## Structure

```
packages/opencode/src/
├── agent/           # Agent definitions and prompts
├── cli/             # CLI commands
├── file/            # File operations (has path security TODOs)
├── permission/      # Permission system (incomplete)
├── provider/        # LLM providers (legacy code marked for removal)
├── server/          # Server (too large - needs refactor)
├── session/         # Session management
├── tool/            # Tool definitions
└── bun/             # Bun runtime utilities
```

## Technical Debt (Priority)

1. **Path security** (`src/file/index.ts`): Symlink escaping, Windows bypass
2. **Legacy provider code** (`src/provider/provider.ts`): Marked for removal
3. **Server refactor** (`src/server/server.ts`): Too large, needs splitting
4. **Permission system** (`src/permission/next.ts`): Incomplete implementation

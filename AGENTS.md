# OpenCode - AI Coding Agent

**Generated:** 2026-01-29
**Branch:** dev
**Type:** Bun + Turborepo monorepo

### General Principles

- Keep things in one function unless composable or reusable
- Avoid `try`/`catch` where possible
- Avoid using the `any` type
- Prefer single word variable names where possible
- Use Bun APIs when possible, like `Bun.file()`
- Rely on type inference when possible; avoid explicit type annotations or interfaces unless necessary for exports or clarity
- Prefer functional array methods (flatMap, filter, map) over for loops; use type guards on filter to maintain type inference downstream

### Naming

Prefer single word names for variables and functions. Only use multiple words if necessary.

```ts
// Good
const foo = 1
function journal(dir: string) {}

// Bad
const fooBar = 1
function prepareJournal(dir: string) {}
```

Reduce total variable count by inlining when a value is only used once.

```ts
// Good
const journal = await Bun.file(path.join(dir, "journal.json")).json()

// Bad
const journalPath = path.join(dir, "journal.json")
const journal = await Bun.file(journalPath).json()
```

### Destructuring

Avoid unnecessary destructuring. Use dot notation to preserve context.

```ts
// Good
obj.a
obj.b

// Bad
const { a, b } = obj
```

### Variables

Prefer `const` over `let`. Use ternaries or early returns instead of reassignment.

```ts
// Good
const foo = condition ? 1 : 2

// Bad
let foo
if (condition) foo = 1
else foo = 2
```

### Control Flow

Avoid `else` statements. Prefer early returns.

```ts
// Good
function foo() {
  if (condition) return 1
  return 2
}

// Bad
function foo() {
  if (condition) return 1
  else return 2
}
```

### Schema Definitions (Drizzle)

Use snake_case for field names so column names don't need to be redefined as strings.

```ts
// Good
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  created_at: integer().notNull(),
})

// Bad
const table = sqliteTable("session", {
  id: text("id").primaryKey(),
  projectID: text("project_id").notNull(),
  createdAt: integer("created_at").notNull(),
})
```

## Testing

- Avoid mocks as much as possible
- Test actual implementation, do not duplicate logic into tests
=======
## Overview

OpenCode is an open-source AI coding agent with terminal-first experience. Provider-agnostic architecture supports Claude, OpenAI, Google, and local models.

**Tech Stack:**

- **Frontend:** SolidJS (web/desktop), custom TUI
- **Backend:** Hono (Edge Functions via Cloudflare Workers/SST)
- **Language:** TypeScript throughout
- **Build:** Bun + Turbo
- **Packages:** 20+ workspace packages

## Structure

```
opencode/
├── .github/workflows/     # CI/CD
├── packages/
│   ├── opencode/          # CLI/TUI (main app)
│   ├── console/           # Web dashboard
│   │   ├── app/           # Console frontend
│   │   ├── core/          # Console backend
│   │   ├── function/      # Cloudflare Workers
│   │   ├── resource/      # Resource handlers
│   │   └── mail/          # Email service
│   ├── desktop/           # Electron desktop app
│   ├── web/               # Marketing site (Astro)
│   ├── sdk/               # JavaScript SDK
│   ├── ui/                # Shared UI components
│   ├── app/               # Web app (SolidJS)
│   ├── enterprise/        # Enterprise features
│   ├── slack/             # Slack integration
│   ├── plugin/            # Plugin system
│   ├── function/          # Serverless utilities
│   ├── script/            # Script utilities
│   └── util/              # Shared utilities
├── sdks/
│   └── vscode/            # VSCode extension
├── infra/                 # Infrastructure configs
├── nix/                   # Nix packages
├── script/                # Build scripts
└── specs/                 # Specs
```

## Commands

```bash
# Dev (TUI)
bun dev

# Type checking
bun typecheck

# Build all
bun turbo build

# Test
bun turbo test

# Regenerate JS SDK
./packages/sdk/js/script/build.ts
```

## Conventions

- **Single-word naming:** Prefer single-word variables/functions when possible
- **No `let`:** Use `const` with ternary operators
- **No `else`:** Use early returns
- **No `try/catch`:** When avoidable
- **No `any`:** Type inference preferred
- **Bun APIs:** Use `Bun.file()` for file operations
- **Parallel tools:** Always use parallel tools when applicable
- **Automation:** Execute requested actions without confirmation unless blocked by missing info or safety/irreversibility

## Anti-Patterns (Forbidden)

- **Git operations:** Never force-push main, never amend after push, never skip hooks
- **File operations:** Never use bash `cat/sed/awk/echo` - use Read/Edit/Write tools
- **File creation:** Never create files unless necessary - prefer editing existing
- **Comments:** Never add comments unless asked
- **Tool names:** Never say tool names to users - describe actions instead
- **Verification:** Never end turn without solving the problem - verify all changes

## Technical Debt (Priority)

1. **Path security vulnerabilities** (`packages/opencode/src/file/index.ts`):
   - Symlink path escaping vulnerability
   - Windows cross-drive path bypass

2. **Legacy provider code** (`packages/opencode/src/provider/provider.ts`) - marked for removal

3. **Server architecture refactor** (`packages/opencode/src/server/server.ts`) - too large

4. **Permission system incomplete** (`packages/opencode/src/permission/next.ts`)

## Package-Level AGENTS.md

Each package has its own AGENTS.md with package-specific conventions:

- `packages/opencode/AGENTS.md` - CLI behavior, agent prompts
- `packages/app/AGENTS.md` - Web app patterns
- `packages/console/*/AGENTS.md` - Console subpackages
- `packages/sdk/js/AGENTS.md` - SDK generation
- `packages/ui/AGENTS.md` - UI components
- `packages/desktop/AGENTS.md` - Desktop app
- `packages/enterprise/AGENTS.md` - Enterprise logic

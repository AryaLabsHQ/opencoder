# Shared UI Components

**Package:** `packages/ui`
**Type:** Component library

## Overview

Shared UI components used across the application. Built with SolidJS, TailwindCSS styling.

## Structure

```
packages/ui/src/
├── components/     # UI components
│   ├── file-icons/
│   └── provider-icons/
├── context/        # Context providers
├── hooks/          # Shared hooks
├── i18n/           # Internationalization
├── styles/         # Styles including Tailwind
├── theme/          # Theme definitions
└── assets/         # Icons, images, fonts
```

## Key Patterns

- Components use TailwindCSS via `@tailwindcss/vite`
- Icons in `assets/icons/`
- Themes in `theme/themes/`
- I18n support via `i18n/` directory

## Commands

```bash
# Build
bun build
```

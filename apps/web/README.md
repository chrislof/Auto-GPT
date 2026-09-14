# @mindpress/web

Public MindPress marketing site — forward-deployed AI engineering.

**Tagline:** We put AI to work for you.

## Requirements

- Node.js 20+
- npm workspaces (run installs from the monorepo root)

## Setup

From the repository root:

```bash
npm install
```

## Scripts

```bash
# Development server (http://localhost:3000)
npm run dev -w @mindpress/web

# Production build
npm run build -w @mindpress/web

# Lint
npm run lint -w @mindpress/web

# Typecheck
npm run typecheck -w @mindpress/web
```

Root shortcuts also exist: `npm run dev:web` and `npm run build:web`.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Hero + manifesto thesis + content pillars |
| `/how-we-work` | Diagnostic / Install / Operate |
| `/platform` | Company brain, app factory, agents, governance |
| `/manifesto` | Full curated manifesto |
| `/contact` | Contact CTA (UI only; no backend) |

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- CSS Modules + global CSS variables (no Tailwind)
- Fonts: Syne + IBM Plex Sans via `next/font`

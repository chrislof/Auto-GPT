# MindPress

**We put AI to work for you.**

MindPress is a forward-deployed AI engineering company. We build the secure company brain, the apps employees use, and the agents that perform bounded work — then measure whether revenue rose, costs fell, decisions improved, and people adopted what we built.

This repository is the start of that operating platform plus the public site that states the thesis.

> Strategic interpretation, not a claim of completed external delivery. See [docs/MANIFESTO.md](docs/MANIFESTO.md).

## Monorepo

| Path | Package | Role |
|------|---------|------|
| `apps/web` | `@mindpress/web` | Public marketing site |
| `packages/brain` | `@mindpress/brain` | Company brain map |
| `packages/app-factory` | `@mindpress/app-factory` | Apps, tables, pages, handlers, warehouse contracts |
| `packages/governance` | `@mindpress/governance` | Permissions, approvals, audit, evals, rollback |
| `packages/mcp-server` | `@mindpress/mcp-server` | Governed MCP tool surface for agents |
| `packages/shared` | `@mindpress/shared` | Shared types and Result helpers |

Architecture overview: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Quick start

```bash
npm install
npm run dev:web          # http://localhost:3000
npm test                 # package unit tests
npm run typecheck
```

## Platform principles

1. Give agents a governed way to understand the business.
2. Give them tools that correspond to real work.
3. Put that work inside applications employees can understand and control.
4. Keep permissions, evidence, approvals, and observability around every consequential action.
5. Improve the platform as each workflow teaches something about the company.

## Legacy

The previous Auto-GPT experiment scripts remain under `legacy/auto-gpt/` for historical reference. They are not the MindPress product.

## License

See [LICENSE](LICENSE).

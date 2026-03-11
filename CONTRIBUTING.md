# Contributing to GlowSocial

Thank you for your interest in contributing. This document covers the development
workflow, branch strategy, commit conventions, and PR process.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Development Setup](#2-development-setup)
3. [Branch Strategy](#3-branch-strategy)
4. [Commit Conventions](#4-commit-conventions)
5. [Testing Requirements](#5-testing-requirements)
6. [Pull Request Process](#6-pull-request-process)
7. [Architecture Constraints](#7-architecture-constraints)
8. [Critical Rules](#8-critical-rules)

---

## 1. Prerequisites

| Tool | Version | Notes |
| :--- | :--- | :--- |
| Node.js | 24.x | Must match CI environment |
| npm | 10.x | Use `npm ci` for installs |
| PostgreSQL | 15 | Or connect to Neon Serverless |

---

## 2. Development Setup

```bash
# Clone and install
git clone https://github.com/your-org/glowsocial.git
cd glowsocial
npm install

# Configure environment
cp .env.example .env
# Fill in all required variables (see README)

# Push schema and seed data
npx prisma db push
npx prisma db seed

# Start dev server
npm run dev
```

---

## 3. Branch Strategy

```
main          — production-ready, protected
develop       — integration branch for PRs
feature/*     — new features (branch from develop)
fix/*         — bug fixes (branch from develop)
hotfix/*      — urgent production fixes (branch from main)
```

**Examples:**
```bash
git checkout -b feature/partial-refund
git checkout -b fix/settlement-idempotency
git checkout -b hotfix/commission-clawback
```

---

## 4. Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

| Type | When to use |
| :--- | :--- |
| `feat` | New feature |
| `fix` | Bug fix |
| `test` | Adding or updating tests |
| `refactor` | Code change without behaviour change |
| `docs` | Documentation only |
| `ci` | CI/CD configuration |
| `chore` | Dependency updates, config changes |

**Examples:**
```
feat(refund): add partial refund amount field to schema
fix(settlement): prevent duplicate kolEarnings decrement on retry
test(integration): add rollback verification for batch refund
ci: upgrade Node to 24, use setup-node cache strategy
```

---

## 5. Testing Requirements

All PRs must pass the following before merge:

### Integration Tests

```bash
npx jest --config jest.config.integration.js tests/integration/ --runInBand
```

Required: **17/17 passing**. Do not merge if any integration test regresses.

### E2E Tests (local)

```bash
npm run dev   # in a separate terminal
npx playwright test --reporter=list
```

For financial flow changes (checkout, refund, settlement), the relevant
Playwright spec must pass locally before submitting a PR.

### TypeScript

```bash
npx tsc --noEmit
```

Zero new TypeScript errors. Existing baseline errors are documented and
tracked separately — do not introduce new ones.

### Build

```bash
npm run build
```

Must complete without errors. `prisma generate` runs automatically as part
of the build script.

---

## 6. Pull Request Process

1. **Branch** from `develop` (or `main` for hotfixes)
2. **Write tests first** for any financial logic change
3. **Run the full test suite** locally before opening PR
4. **Fill in the PR template** — describe what changed and why
5. **Link related issues** using `Closes #issue-number`
6. **Do not force-push** to a PR branch after review has started
7. **Squash merge** into `develop` — keep history clean

### PR Template

```markdown
## What changed
<!-- Brief description of the change -->

## Why
<!-- Business or technical motivation -->

## Test coverage
<!-- Which tests cover this change? New tests added? -->

## Checklist
- [ ] `npx tsc --noEmit` — zero new errors
- [ ] Integration tests 17/17 passing
- [ ] `npm run build` — no errors
- [ ] No `.env` secrets committed
- [ ] Relevant E2E spec passes locally
```

---

## 7. Architecture Constraints

These rules are non-negotiable and enforced in code review:

### DDD Layer Boundaries

```
Route Handler  →  Application Service  →  Domain Service  →  Repository Interface
                                                                      ↓
                                                              Infrastructure (Prisma)
```

- **Domain layer** must not import Prisma or any infrastructure package
- **Route Handlers** must not call Prisma directly — always go through Application Service
- **Infrastructure** implementations live in `src/infrastructure/` only

### Financial Operations

All operations touching money (checkout, refund, commission, settlement) **must**:

1. Use `prisma.$transaction()` for atomicity
2. Include rollback verification in integration tests
3. Be idempotent — safe to run multiple times with the same input

### Prisma Migration Rules

```bash
# ✅ Development — sync schema without migration history
npx prisma db push

# ✅ Production — use migration files
npx prisma migrate deploy

# ❌ NEVER run in any shared environment
npx prisma migrate dev   # triggers reset prompts, unsafe
npx prisma migrate reset # destroys data
```

**Never delete** `prisma/migrations/` — migration history is required for CI and production deploys.

### Auth Context

- All API routes that require authentication must call both `requireUser()` (or `requireAdmin()`) **and** `getCurrentUser()`
- `requireUser()` returns `null` on success, a `NextResponse` on failure — check with `if (guard) return guard`
- Do not call `getServerSession` directly in Route Handlers — use the wrappers in `src/infrastructure/auth/`

---

## 8. Critical Rules

| Rule | Reason |
| :--- | :--- |
| Never commit `.env` or `.env.test` | Contains real credentials |
| Never commit `node_modules/` | Managed by npm |
| Use `npm ci --legacy-peer-deps` in CI | AWS SDK peer dep constraint |
| Node version must be 24.x | Matches `package-lock.json` format |
| `prisma generate` runs before `next build` | Already configured in `package.json` |
| Test accounts read from `.env`, never hardcoded | Supports multiple environments |
| `R2_PUBLIC_URL` must be set | Images will fail to load without it |

---

## Questions?

Open a [GitHub Discussion](https://github.com/your-org/glowsocial/discussions) for
design questions, or file an [Issue](https://github.com/your-org/glowsocial/issues)
for bugs and feature requests.
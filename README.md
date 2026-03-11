# GlowSocial Beauty Commerce Platform

![Next.js](https://img.shields.io/badge/Next.js-15.x-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)
![Playwright](https://img.shields.io/badge/Playwright-E2E_120_tests-green?style=flat-square&logo=playwright)
![Jest](https://img.shields.io/badge/Jest-Integration_17%2F17-orange?style=flat-square&logo=jest)
![Datadog](https://img.shields.io/badge/Datadog-RUM%2BAPM-purple?style=flat-square&logo=datadog)
![License](https://img.shields.io/badge/License-MIT%20%2B%20Commons%20Clause-red?style=flat-square)

**Production-ready KOL live-streaming e-commerce platform** engineered for high concurrency,
real-time engagement, and robust financial settlement.

> **Portfolio Notice:** This project is published for demonstration purposes.
> Code is readable and forkable; commercial use is prohibited. See [LICENSE](LICENSE).

> **Status:** Core features complete · Integration tests 17/17 passing · CI/CD pipeline active

---

## 🏗 System Architecture

```text
[ Client Side ]                 [ Server Side / Cloud Infrastructure ]
      │
      ▼
Next.js App Router ───────────▶ Next.js API Routes (Serverless)
(SSR / ISR / Client Components)         │
                                         ├──▶ Prisma ORM
                                         │         └──▶ PostgreSQL (Neon Serverless)
                                         ├──▶ Pusher Channels  (Real-time chat / notifications)
                                         ├──▶ Cloudflare R2    (Refund evidence / product images)
                                         └──▶ Datadog          (RUM + APM + Business KPI monitors)
      │
      ▼
Vercel Cron Jobs ─────────────▶ Automated commission settlement + refund satisfaction reminders
```

### Domain-Driven Design (DDD)

The `src/` directory follows strict DDD layering to decouple business logic from infrastructure:

| Layer | Path | Responsibility |
| :--- | :--- | :--- |
| **Domain** | `src/domain/` | Pure business rules, entities, repository interfaces. No framework dependencies. |
| **Application** | `src/application/` | Use-case orchestration — coordinates domain objects and external services. |
| **Infrastructure** | `src/infrastructure/` | Concrete implementations: Prisma, Cloudflare R2, Pusher, NextAuth. |
| **Components** | `src/components/` | React UI — Atomic → Feature → Page hierarchy with Tailwind CSS + shadcn/ui. |

---

## 🛠 Tech Stack

| Layer | Technology | Version | Notes |
| :--- | :--- | :--- | :--- |
| Framework | Next.js | 15.x | App Router, Server Actions, Edge Runtime |
| Language | TypeScript | 5.x | Strict end-to-end typing (Frontend → DB) |
| Auth | NextAuth.js | v4 | Credentials Provider + bcryptjs |
| Database | PostgreSQL | 15 | Neon Serverless — auto-scales |
| ORM | Prisma | latest | Type-safe schema + automated migrations |
| Real-time | Pusher Channels | — | WebSocket chat, notifications, order status |
| Storage | Cloudflare R2 | — | S3-compatible — refund evidence + product images |
| State | Zustand | — | Client-side cart state |
| Styling | Tailwind CSS + shadcn/ui | — | Utility-first + component library, dark mode |
| E2E Testing | Playwright | latest | 120 tests across 6 spec files |
| Integration | Jest + ts-jest | 30.x | 3 suites, 17/17 passing, CI-ready |
| Deployment | Vercel | — | Preview + Production, Cron Jobs |
| Observability | Datadog | — | RUM, APM, custom business KPI dashboard |

---

## 🚀 Core Functionality

### 🔐 Authentication & Authorization
- NextAuth.js v4 Credentials Provider with bcrypt password hashing
- Three-role RBAC: `USER` / `KOL` / `ADMIN`
- Route-level protection via `middleware.ts`
- API Routes double-verification with `getServerSession`
- Session persistence across page reloads

### 🛍️ Product System
- Full CRUD with soft-delete archive/restore (`isArchived`)
- Multi-field fuzzy search — name, bio, description (ILIKE + OR conditions)
- Product image upload to Cloudflare R2
- Review system with infinite scroll, rating distribution, and duplicate prevention
- 50-item seed dataset (`npx prisma db seed`)

### 🛒 Orders & Checkout
- Atomic checkout transaction (`prisma.$transaction` + `SELECT FOR UPDATE`)
- Inventory locking — race condition protection against overselling
- Server-side price tampering validation
- Order status → Pusher real-time notification pipeline
- Admin cancel with automatic inventory restore

### 📺 Live Streaming
- KOL start/end stream with automatic commission settlement trigger
- Real-time product carousel (Pusher-powered)
- Live chat via dedicated `live-{liveId}` Pusher channel
- Inventory-aware "Buy Now" button

### 💰 Refunds & Commission Settlement
- Batch refund (up to 10 orders per request, reason ≥ 5 characters)
- Multi-file evidence upload to R2 (up to 5 URLs)
- **Commission clawback** — atomic `kolEarnings` decrement on refund approval
- Admin approve/reject dashboard
- Settlement idempotency — repeated Cron runs are safe
- Vercel Cron auto-settlement: `POST /api/cron/settle-live-revenue`
- 7-day satisfaction survey Cron: `POST /api/cron/refund-feedback-reminder`
- KOL revenue ledger at `/dashboard/settlement`

### 🔔 Search & Notifications
- Search with 300ms debounce, minimum 2-character input, empty-state UI
- Pusher real-time notification badge
- Admin anomaly detection dashboard

### 🎨 UI / UX
- Dark mode (`ThemeProvider` + Tailwind `class` strategy)
- Responsive desktop Navbar + mobile BottomTabBar
- KOL Profile inline editor and public-facing profile page

### 🤝 Social Features
- Follow / Unfollow KOL
- Favorite / Unfavorite products
- Real-time private messaging (Pusher)

### 📊 Observability
- Datadog RUM — Core Web Vitals tracking
- Datadog APM Monitors — pre-configured JSON definitions
- API response time threshold alerts

---

## 🧪 Testing

### E2E Tests (Playwright) — 120 test cases

```bash
# Requires dev server running
npm run dev

# Run all tests
npx playwright test --reporter=list

# Run a single spec
npx playwright test tests/e2e/auth/auth-security.spec.ts
```

| Spec File | Test IDs | Coverage |
| :--- | :--- | :--- |
| `live/live-streaming.spec.ts` | TC-01 ~ TC-05 | KOL stream lifecycle |
| `refund/refund-settlement.spec.ts` | TC-06 ~ TC-11, TC-21 | Refund + settlement |
| `search/search-notifications.spec.ts` | TC-12 ~ TC-14, TC-25 | Search + notifications |
| `admin/observability.spec.ts` | TC-15 ~ TC-16, TC-28 ~ TC-29 | Datadog + observability |
| `auth/auth-security.spec.ts` | TC-17, TC-18, TC-26, TC-27 | Auth + CSRF |
| `orders/orders-mobile-e2e.spec.ts` | TC-19, TC-24, TC-30 | Orders + mobile layout |

### Integration Tests (Jest) — 17/17 passing

```bash
npx jest --config jest.config.integration.js tests/integration/ --runInBand
```

| Suite | Coverage |
| :--- | :--- |
| `settlement/settlement.test.ts` | Commission settlement idempotency |
| `orders/order-transaction.test.ts` | Checkout atomic transaction integrity |
| `refund/batch-refund-transaction.test.ts` | Batch refund + rollback verification |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db   # for prisma migrate

# Auth
NEXTAUTH_SECRET=                  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=

# Pusher
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Cloudflare R2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
R2_PUBLIC_URL=https://pub-xxx.r2.dev   # ⚠️ Required for image display

# Datadog (optional — required for observability features)
DD_API_KEY=
DD_APP_KEY=
DD_CLIENT_TOKEN=
DD_SITE=datadoghq.com
NEXT_PUBLIC_DATADOG_APPLICATION_ID=
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=

# Vercel Cron (required for settlement + survey jobs)
CRON_SECRET=                      # openssl rand -base64 32

# E2E Test accounts (must exist in DB after prisma db seed)
ADMIN_EMAIL=          # must match a seeded account in your DB
ADMIN_PASSWORD=
KOL_EMAIL=
KOL_PASSWORD=
USER_EMAIL=
USER_PASSWORD=
```

---

## 🛠 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, Pusher keys, R2 credentials

# 3. Push schema to database
npx prisma db push

# 4. Seed test data (50 products + 3 role accounts)
npx prisma db seed

# 5. Start development server
npm run dev
```

---

## 📊 Datadog Setup

Pre-configured Datadog resources live in `datadog/`.

```bash
# Import dashboard
curl -X POST "https://api.datadoghq.com/api/v1/dashboard" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  -d @datadog/dashboard.json

# Import monitors
curl -X POST "https://api.datadoghq.com/api/v1/monitor" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  -d @datadog/monitor.json
```

---

## 📋 Roadmap

| Priority | Item | Notes |
| :--- | :--- | :--- |
| 🟡 Medium | Rate Limiting | Vercel Edge Middleware + Upstash Redis |
| 🟡 Medium | Partial Refund | Add `refundAmount` field to schema |
| 🟢 Low | Vector Search | `pgvector` extension + embedding pipeline |
| 🟢 Low | Multi-currency / Tax | VAT/sales tax recalculation on refunds |
| 🟢 Low | CI matrix | Chromium + Firefox + WebKit + retry logic |

---

## 📄 License

MIT + Commons Clause — free to read and fork; commercial use prohibited. See [LICENSE](LICENSE).

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, commit conventions, and PR guidelines.
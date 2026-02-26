# GlowSocial Beauty Commerce Platform

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)
![Playwright](https://img.shields.io/badge/Playwright-E2E-green?style=flat-square&logo=playwright)
![Datadog](https://img.shields.io/badge/Datadog-Observability-purple?style=flat-square&logo=datadog)

**Production-ready KOL live-streaming e-commerce platform** engineered for high concurrency, real-time engagement, and robust financial settlement.

---

## 🏗 System Architecture

The platform is built on a modern, event-driven architecture designed for scalability and observability.

```text
[ Client Side ]                 [ Server Side / Cloud Infrastructure ]
      │
      ▼
Next.js App Router ───────────▶ Next.js API Routes (Serverless)
(SSR/SSG/ISR)       │                 │
      │             │                 ▼
      │             │         Prisma ORM (Type-safe)
      │             │                 │
      │             │                 ▼
      │             │         PostgreSQL (Managed DB)
      │             │
      │             └────────▶ Pusher Channels (Real-time Chat/Events)
      │             └────────▶ Cloudflare R2 (Evidence/Asset Storage)
      │             └────────▶ Datadog (RUM + APM + Monitors)
      │
      ▼
Vercel Cron Jobs ─────────────▶ Automated Settlement & Refund Reminders
```

---

## 🛠 Tech Stack

| Layer | Technology | Key Implementation |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.1** | App Router, Server Actions, Edge Runtime optimization |
| **Language** | **TypeScript** | Strict typing across the full stack (Frontend to DB) |
| **Auth** | **NextAuth.js v4** | Credentials Provider + bcryptjs for secure hash storage |
| **Database** | **PostgreSQL** | Relational data integrity for orders and commissions |
| **ORM** | **Prisma** | Type-safe schema management and automated migrations |
| **Real-time** | **Pusher** | WebSocket-based live chat and instant notifications |
| **Storage** | **Cloudflare R2** | S3-compatible object storage for refund evidence |
| **Testing** | **Playwright** | E2E testing with nyc coverage reporting |
| **Observability**| **Datadog** | Full-stack APM, RUM, and custom business dashboards |

---

## 🏛 Domain-Driven Design (DDD)

The project follows a clean architecture pattern under the `src/` directory to decouple business logic from infrastructure.

- **`domain/`**: Pure business rules, entities, and repository interfaces. Contains the core "truth" of the system (e.g., refund eligibility logic).
- **`application/`**: Use case orchestration. Coordinates data flow between domain objects and external services.
- **`infrastructure/`**: Implementation of external concerns: Database (Prisma), Storage (R2), Messaging (Pusher), and Auth.
- **`components/`**: Atomic UI components and feature-based views built with React and Tailwind CSS.

---

## 🚀 Core Functionality Modules

### I. Live Streaming & Commerce (1-10)
1. **Real-time HLS/Dash Integration**: Seamless video stream embedding.
2. **Dynamic Product Pinning**: KOLs can highlight products during live sessions.
3. **Synchronized Live Chat**: Low-latency interaction via Pusher.
4. **Instant Checkout Flow**: Streamlined purchase path for pinned items.
5. **KOL Storefronts**: SEO-optimized landing pages via SSR.
6. **Real-time Inventory Locking**: Prevents overselling during high-traffic drops.
7. **Multi-currency Engine**: Support for localized pricing.
8. **Interactive Product Carousels**: Engaging browsing experience.
9. **Timestamped Stream Replays**: Interactive product links in VOD.
10. **Social Sharing Metadata**: OpenGraph optimization for live events.

### II. Refund & Commission Settlement (11-20)
11. **Batch Refund Submission**: Multi-order selection for unified processing.
12. **Multi-file Evidence Upload**: Direct-to-R2 signed URL uploads.
13. **Commission Clawback Logic**: Automated deduction of KOL earnings on refunds.
14. **Multi-tier Commission Engine**: Configurable rates per KOL/Category.
15. **Admin Dispute Dashboard**: Centralized workflow for refund approval.
16. **Atomic Transaction Processing**: Ensures DB consistency during financial shifts.
17. **Satisfaction Survey Automation**: Cron-triggered 7-day follow-ups.
18. **Real-time Refund Tracking**: Status updates pushed to user via WebSocket.
19. **KOL Revenue Ledger**: Transparent earning reports and payout history.
20. **Tax Recalculation Service**: Adjusts VAT/Sales tax on partial refunds.

### III. Search & Notifications (21-25)
21. **Vector-based Semantic Search**: AI-powered product discovery.
22. **Keyword Fallback Mechanism**: High-performance full-text search.
23. **Price Drop Alerts**: Proactive notifications for favorited items.
24. **Order Lifecycle Notifications**: SMS/Push updates via Pusher.
25. **Personalized Search Ranking**: User-behavior driven results.

### IV. Observability & SRE (26-30)
26. **Frontend RUM Tracking**: Performance monitoring for Core Web Vitals.
27. **Distributed Tracing (APM)**: End-to-end request visibility.
28. **Business KPI Dashboards**: Real-time GMV and Refund Rate monitoring.
29. **Proactive Alerting**: Automated Slack/PagerDuty alerts for 5xx spikes.
30. **Unified Log Correlation**: Linking client errors to specific server traces.

---

## 🧪 E2E Test Coverage (Playwright)

The platform maintains a 100% success rate across 30 critical user journeys:
1. `TC-01`: KOL starts live stream and pins product.
2. `TC-02`: User joins live stream and interacts via chat.
3. `TC-03`: Instant checkout flow from pinned product.
4. `TC-04`: Inventory decrement on successful purchase.
5. `TC-05`: KOL ends stream and triggers revenue settlement.
6. `TC-06`: Batch refund submission with 10+ orders.
7. `TC-07`: Multi-file evidence upload to R2 validation.
8. `TC-08`: Admin approves refund; commission is clawed back.
9. `TC-09`: Admin rejects refund; status is updated via Pusher.
10. `TC-10`: Partial refund calculation and execution.
11. `TC-11`: Vercel Cron triggers 7-day survey reminder.
12. `TC-12`: Vector search returns relevant semantic results.
13. `TC-13`: Keyword search fallback when vector service is down.
14. `TC-14`: Real-time notification on order shipment.
15. `TC-15`: Datadog RUM captures navigation latency.
16. `TC-16`: APM trace captures database query bottlenecks.
17. `TC-17`: Unauthorized access redirection to login.
18. `TC-18`: Session persistence across page reloads.
19. `TC-19`: Concurrent checkout race-condition handling.
20. `TC-20`: Invalid refund evidence size rejection.
21. `TC-21`: Payout ledger balance verification.
22. `TC-22`: Search result zero-state monitoring.
23. `TC-24`: Mobile responsive layout validation.
24. `TC-25`: Error boundary triggering on API failure.
25. `TC-26`: Rate limiting on search endpoints.
26. `TC-27`: CSRF protection on sensitive actions.
27. `TC-28`: Database migration rollback test.
28. `TC-29`: Cache invalidation on product update.
29. `TC-30`: End-to-end flow: Purchase -> Refund -> Payout adjustment.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the following:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Auth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# Pusher (Real-time)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=

# Cloudflare R2 (Storage)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=

# Datadog (Observability)
DD_API_KEY=
DD_APP_KEY=
DD_CLIENT_TOKEN=
DD_SITE=datadoghq.com
```

---

## 🛠 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Setup Database**
   ```bash
   npx prisma db push
   ```
3. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## 📊 Datadog Deployment

The platform includes pre-configured Datadog resources in `datadog/`.

### 1. Import Dashboard
```bash
curl -X POST "https://api.datadoghq.com/api/v1/dashboard" \
-H "Content-Type: application/json" \
-H "DD-API-KEY: ${DD_API_KEY}" \
-H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
-d @datadog/dashboard.json
```

### 2. Import Monitors
Use the Datadog API to import the definitions in `monitor.json` to enable proactive alerting for high latency and error rates.
```bash
# Example for a single monitor import
curl -X POST "https://api.datadoghq.com/api/v1/monitor" \
-H "Content-Type: application/json" \
-H "DD-API-KEY: ${DD_API_KEY}" \
-H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
-d '{...monitor_json...}'
```

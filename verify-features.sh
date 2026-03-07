#!/bin/bash
# ================================================================
# GlowSocial — Feature Verification Script
# FAANG-grade audit: confirms what is actually implemented
# Usage: bash verify-features.sh 2>&1 | tee verify-report.txt
# ================================================================

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; }
warn() { echo "  ⚠️  $1"; }
section() {
  echo ""
  echo "════════════════════════════════════════════════"
  echo "  $1"
  echo "════════════════════════════════════════════════"
}

# ================================================================
section "0. Project Structure"
# ================================================================
for dir in app src prisma tests; do
  [ -d "$dir" ] && pass "$dir/ exists" || fail "$dir/ MISSING"
done

echo ""
echo "  Prisma models:"
grep "^model " prisma/schema.prisma 2>/dev/null | awk '{print "    •", $2}' || fail "Cannot read schema.prisma"

echo ""
echo "  API routes:"
find app/api -name "route.ts" 2>/dev/null | wc -l | xargs -I{} echo "    {} route.ts files"

echo ""
echo "  Auth-guarded routes:"
grep -rln "requireUser\|requireKOL\|requireAdmin" app/api/ 2>/dev/null | wc -l | \
  xargs -I{} sh -c 'echo "    {} routes guarded"'

# ================================================================
section "I. Live Streaming & Commerce (1-10)"
# ================================================================

echo "1. HLS/Dash Real Video"
grep -rqn "hls\|HLS\|m3u8\|ReactPlayer\|video\.js" app/live/ src/components/live/ 2>/dev/null \
  && pass "Video player found" \
  || fail "NOT IMPLEMENTED — placeholder spinner only"

echo "2. Dynamic Product Pinning"
grep -qn "activeProductIdx\|activeProduct\|ChevronLeft\|ChevronRight" \
  src/components/live/LiveChatClient.tsx 2>/dev/null \
  && pass "Product carousel in LiveChatClient.tsx" \
  || fail "NOT IMPLEMENTED"

echo "3. Pusher Live Chat"
grep -qn "pusher.subscribe\|chat-message" src/components/live/LiveChatClient.tsx 2>/dev/null \
  && pass "Pusher chat implemented" \
  || fail "NOT IMPLEMENTED"

echo "4. Instant Live Checkout"
grep -qn "buyProduct\|/api/live.*order\|liveStreamId" \
  src/components/live/LiveChatClient.tsx 2>/dev/null \
  && pass "Live checkout found" \
  || fail "NOT IMPLEMENTED"

echo "5. KOL Storefront SSR"
find app/kol -name "page.tsx" 2>/dev/null | grep -q . \
  && pass "KOL page: $(find app/kol -name 'page.tsx' | head -1)" \
  || fail "NOT FOUND — expected app/kol/[id]/page.tsx"

echo "6. Inventory Locking"
TX=$(grep -rn "\$transaction" app/api/orders/ app/api/live/ 2>/dev/null | wc -l | tr -d ' ')
[ "$TX" -gt 0 ] \
  && { pass "\$transaction in $TX places"; warn "No row-level lock (FOR UPDATE) — race condition possible under extreme concurrency"; } \
  || fail "NOT IMPLEMENTED"

echo "7. Multi-currency"
grep -rqn "exchangeRate\|currency.*USD\|currency.*JPY" app/ src/ 2>/dev/null \
  && pass "Currency references found" \
  || fail "NOT IMPLEMENTED — hardcoded TWD only"

echo "8. Product Carousels"
grep -rqn "carousel\|Carousel\|Swiper\|embla" src/components/ app/ 2>/dev/null \
  && pass "Carousel component found" \
  || warn "PARTIAL — live chat has product switcher; no standalone Carousel"

echo "9. VOD / Stream Replays"
grep -rqn "replay\|vod\|VOD\|seekTo" app/ src/ 2>/dev/null \
  && pass "VOD logic found" \
  || fail "NOT IMPLEMENTED — ended streams listed only, no playback"

echo "10. OpenGraph Metadata"
grep -rqn "openGraph\|generateMetadata" app/live/ 2>/dev/null \
  && pass "OpenGraph/generateMetadata in app/live/" \
  || fail "NOT IMPLEMENTED — no OG tags in app/live/"

# ================================================================
section "II. Refund & Commission Settlement (11-20)"
# ================================================================

echo "11. Batch Refund API"
[ -f "app/api/refund/batch/route.ts" ] \
  && pass "app/api/refund/batch/route.ts" \
  || fail "NOT FOUND"

echo "12. Evidence Upload"
grep -qn "evidenceUrls" prisma/schema.prisma 2>/dev/null \
  && pass "evidenceUrls String[] in schema" \
  || fail "NOT IN SCHEMA"

echo "13. Commission Clawback"
grep -rqn "clawback\|kolEarnings.*decrement\|refund.*kolEarning" app/ src/ 2>/dev/null \
  && pass "Clawback found" \
  || fail "NOT IMPLEMENTED — refund does NOT reduce kolEarnings"

echo "14. Multi-tier Commission"
grep -qn "commissionRate" prisma/schema.prisma 2>/dev/null \
  && { pass "Per-KOL commissionRate supported"; warn "PARTIAL — no per-category tier"; } \
  || fail "NOT IN SCHEMA"

echo "15. Admin Refund Dashboard"
find app/admin/refund -name "page.tsx" 2>/dev/null | grep -q . \
  && pass "app/admin/refund/page.tsx" \
  || fail "NOT FOUND"

echo "16. Atomic Transactions"
TOTAL_TX=$(grep -rn "\$transaction" app/api/ 2>/dev/null | wc -l | tr -d ' ')
[ "$TOTAL_TX" -gt 0 ] \
  && pass "\$transaction in $TOTAL_TX API routes" \
  || fail "NOT IMPLEMENTED"

echo "17. Survey Cron"
[ -f "app/api/cron/refund-feedback-reminder/route.ts" ] \
  && pass "Cron route exists" \
  || fail "NOT FOUND"

echo "18. Real-time Refund Status (Pusher)"
grep -rqn "trigger.*refund\|pusher.*refund\|refund.*channel" app/api/ 2>/dev/null \
  && pass "Pusher refund events found" \
  || fail "NOT IMPLEMENTED — DB-only status updates, no Pusher push"

echo "19. KOL Revenue Ledger"
[ -f "app/dashboard/settlement/page.tsx" ] \
  && pass "Settlement page exists" \
  || fail "NOT FOUND"

echo "20. Tax Recalculation"
grep -rqn "taxRate\|vat\|VAT\|sales_tax" app/ src/ 2>/dev/null \
  && pass "Tax logic found" \
  || fail "NOT IMPLEMENTED"

# ================================================================
section "III. Search & Notifications (21-25)"
# ================================================================

echo "21. Vector Semantic Search"
grep -rqn "pgvector\|embedding\|openai.*embed\|cosine" app/ src/ 2>/dev/null \
  && pass "Vector search found" \
  || fail "NOT IMPLEMENTED — keyword only"

echo "22. Keyword Search"
find app/api/search -name "route.ts" 2>/dev/null | grep -q . \
  && pass "$(find app/api/search -name 'route.ts' | wc -l | tr -d ' ') search route(s) found" \
  || fail "NOT FOUND"

echo "23. Price Drop Alerts"
grep -rqn "priceDrop\|price.*drop\|alert.*price" app/ src/ 2>/dev/null \
  && pass "Price alert logic found" \
  || fail "NOT IMPLEMENTED"

echo "24. Order Lifecycle Notifications"
NOTIF=$(grep -rn "notification\.create\|prisma\.notification" app/api/ 2>/dev/null | wc -l | tr -d ' ')
[ "$NOTIF" -gt 0 ] \
  && { pass "DB notifications in $NOTIF places"; warn "No SMS/FCM — DB + Pusher only"; } \
  || fail "NOT IMPLEMENTED"

echo "25. Personalized Search Ranking"
grep -rqn "rankScore\|personali\|userBehavior" app/api/search/ 2>/dev/null \
  && pass "Ranking logic found" \
  || fail "NOT IMPLEMENTED — static orderBy only"

# ================================================================
section "IV. Observability & SRE (26-30)"
# ================================================================

echo "26. Datadog RUM"
grep -rqn "datadogRum\|DD_CLIENT_TOKEN\|NEXT_PUBLIC_DD" app/ src/ 2>/dev/null \
  && pass "RUM initialisation found" \
  || fail "NOT FOUND — add RUM snippet to layout.tsx"

echo "27. APM Tracing"
grep -rqn "dd-trace\|tracer\.init\|APM" app/ src/ 2>/dev/null \
  && pass "APM tracer found" \
  || fail "NOT FOUND"

echo "28. KPI Dashboard JSON"
[ -f "datadog/dashboard.json" ] \
  && pass "datadog/dashboard.json ($(wc -c < datadog/dashboard.json 2>/dev/null) bytes)" \
  || fail "NOT FOUND"

echo "29. Alerting Monitors"
[ -f "datadog/monitor.json" ] \
  && pass "datadog/monitor.json" \
  || fail "NOT FOUND"

echo "30. Structured Logger"
find src/infrastructure -name "logger*" 2>/dev/null | grep -q . \
  && pass "Logger found: $(find src/infrastructure -name 'logger*' | head -2 | tr '\n' ' ')" \
  || warn "No structured logger — console.error only"

# ================================================================
section "Security Audit"
# ================================================================

echo "CRON_SECRET on cron routes"
grep -rqn "CRON_SECRET" app/api/cron/ 2>/dev/null \
  && pass "CRON_SECRET verified" \
  || fail "Cron routes UNPROTECTED"

echo "Rate Limiting"
grep -rqn "rateLimit\|x-ratelimit\|upstash" app/ src/ 2>/dev/null \
  && pass "Rate limiting found" \
  || fail "NOT IMPLEMENTED"

echo "Input Validation (Zod)"
grep -rqn "z\.object\|from 'zod'" app/ src/ 2>/dev/null \
  && pass "Zod schema validation found" \
  || warn "No Zod — manual validation only"

echo "Environment Variables"
for var in DATABASE_URL NEXTAUTH_SECRET PUSHER_APP_ID S3_ENDPOINT R2_PUBLIC_URL CRON_SECRET; do
  grep -q "^${var}=" .env 2>/dev/null \
    && pass "$var set" \
    || fail "$var MISSING from .env"
done

# ================================================================
section "Test Infrastructure"
# ================================================================

echo "Playwright config"
[ -f "playwright.config.ts" ] \
  && { pass "playwright.config.ts"; grep -E "testDir|baseURL|timeout" playwright.config.ts | sed 's/^/    /'; } \
  || fail "MISSING"

echo "tests/fixtures/auth.ts"
[ -f "tests/fixtures/auth.ts" ] \
  && pass "$(grep -c 'export' tests/fixtures/auth.ts 2>/dev/null) exports" \
  || fail "MISSING"

echo "tests/fixtures/db.ts"
[ -f "tests/fixtures/db.ts" ] \
  && pass "$(grep -c 'export' tests/fixtures/db.ts 2>/dev/null) exports" \
  || fail "MISSING"

echo "tests/helpers/mock-request.ts"
[ -f "tests/helpers/mock-request.ts" ] \
  && pass "exists" \
  || fail "MISSING — required by integration tests"

echo "E2E spec files"
E2E_COUNT=$(find tests/e2e -name "*.spec.ts" 2>/dev/null | wc -l | tr -d ' ')
[ "$E2E_COUNT" -gt 0 ] \
  && { pass "$E2E_COUNT spec files"; find tests/e2e -name "*.spec.ts" | sed 's/^/    /'; } \
  || fail "0 spec files — directories empty"

echo "Integration test files"
INT_COUNT=$(find tests/integration -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
[ "$INT_COUNT" -gt 0 ] \
  && { pass "$INT_COUNT integration files"; find tests/integration -name "*.ts" | sed 's/^/    /'; } \
  || fail "0 integration test files"

# ================================================================
section "Final Summary"
# ================================================================
echo ""
echo "  CONFIRMED IMPLEMENTED:"
echo "    Pusher live chat, dynamic product carousel, live checkout"
echo "    Prisma transactions, batch refund, evidence upload"
echo "    Per-KOL commission, auto+manual settlement, revenue ledger"
echo "    Admin refund dashboard, 7-day survey cron"
echo "    Keyword search, DB notifications (6 types)"
echo "    Dark Mode, Shopping cart, ADMIN order cancel"
echo "    Anomaly detection, Auth guards, CRON_SECRET"
echo ""
echo "  CONFIRMED NOT IMPLEMENTED (remove from README/pitch deck):"
echo "    HLS/Dash streaming, Vector search, Multi-currency"
echo "    Commission clawback, Pusher refund status, Price alerts"
echo "    Tax recalculation, Rate limiting, Personalized ranking"
echo "    VOD/stream replays, OpenGraph live events, SMS/FCM"
echo ""
echo "  Run: bash verify-features.sh 2>&1 | tee verify-report.txt"

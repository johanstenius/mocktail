# Mocktail - Product Overview

**Local-first mock API server with auth simulation**

## What It Is

A hosted mock API platform where developers can:
1. Import OpenAPI specs or manually define endpoints
2. Configure realistic auth (API keys, future: JWT, Basic)
3. Simulate real-world conditions (latency, errors, rate limits)
4. Share mock URLs with teams and start building

## Target Users

- Frontend devs who can't wait for backend
- Backend devs integrating third-party APIs
- QA engineers needing deterministic test environments
- Small teams wanting simpler alternatives to WireMock

---

## Current Features

### Core Mock Engine

| Feature | Status | Notes |
|---------|--------|-------|
| Route matching (method + path params) | ✅ | Supports `:id` style params |
| Static JSON responses | ✅ | |
| Dynamic templates (Handlebars + Faker) | ✅ | fullName, email, uuid, etc. |
| Delay simulation | ✅ | 0-5000ms configurable |
| Fail rate injection | ✅ | 0-100% random failures |
| Request/response logging | ✅ | Full capture with filtering |
| Custom response headers | ✅ | JSON config per endpoint |
| Status code configuration | ✅ | Any HTTP status |

### OpenAPI Import

| Feature | Status | Notes |
|---------|--------|-------|
| OpenAPI 3.x parsing | ✅ | Via swagger-parser |
| Auto-generate endpoints | ✅ | From paths object |
| Example response generation | ✅ | From schemas |
| Path param conversion | ✅ | `{id}` → `:id` |
| JSON + YAML support | ✅ | |
| Overwrite/skip existing | ✅ | |

### Authentication & Authorization

| Feature | Status | Notes |
|---------|--------|-------|
| User registration/login | ✅ | JWT-based |
| Email verification | ✅ | Via Resend |
| Password reset flow | ✅ | Token-based |
| Refresh tokens | ✅ | Database-persisted |
| Organization multi-tenancy | ✅ | |
| Role-based access (owner/admin/member) | ✅ | |

### Team Collaboration

| Feature | Status | Notes |
|---------|--------|-------|
| Invite members via email | ✅ | With role assignment |
| Member management | ✅ | Update roles, remove |
| Organization-scoped projects | ✅ | |
| Shared mock URLs | ✅ | Via project slug |

### Billing & Usage

| Feature | Status | Notes |
|---------|--------|-------|
| Three-tier system (Free/Pro/Enterprise) | ✅ | |
| Stripe integration | ✅ | Checkout + webhooks |
| Monthly request quotas | ✅ | Auto-reset |
| Usage tracking dashboard | ✅ | |
| Rate limiting (tier-based) | ✅ | 10/100/1000 req/sec |

### Tier Limits

| Limit | Free | Pro ($29/mo) | Enterprise |
|-------|------|--------------|------------|
| Projects | 3 | 20 | Unlimited |
| Endpoints | 30 | 2,000 | Unlimited |
| Requests/month | 10,000 | 500,000 | Unlimited |
| Team members | 3 | Unlimited | Unlimited |
| Rate limit | 10 req/sec | 100 req/sec | 1,000 req/sec |

### Web UI

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard with project grid | ✅ | |
| Project detail with tabs | ✅ | Endpoints/Logs/Analytics/Settings |
| Endpoint builder (full config) | ✅ | Method, path, body, delay, fail rate |
| Request log viewer | ✅ | Filtering, pagination |
| OpenAPI import modal | ✅ | File upload or paste |
| Analytics dashboard | ✅ | Stats, trends |
| Team management UI | ✅ | Invites, roles |
| Billing dashboard | ✅ | Usage bars, tier comparison |

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo + pnpm |
| API | Hono + @hono/zod-openapi |
| Database | PostgreSQL + Prisma |
| Web | React + Vite + TanStack Router |
| Styling | Tailwind + shadcn/ui |
| Auth | JWT (custom) |
| Email | Resend |
| Payments | Stripe |

## URL Structure

```
http://localhost:3002/api/*           → Management API
http://localhost:3002/m/{slug}/*      → Mock traffic (legacy)
http://localhost:3002/:org/:project/* → Mock traffic (org-scoped)
http://localhost:3003                 → Web UI
```

---

## Competitive Landscape

### Direct Competitors

| Tool | Type | Pricing | Strengths | Weaknesses |
|------|------|---------|-----------|------------|
| **Mockoon** | Desktop + Cloud | Free / $15/mo cloud | Easy desktop app, open-source, offline-first | Limited cloud collab, no advanced auth sim |
| **Beeceptor** | Cloud SaaS | Free / $10/mo | Zero-setup, AI data, webhook testing | Limited free tier (50 req/day), cloud-only |
| **Postman** | Suite | Free / $19/user/mo | Full API lifecycle, collaboration | Mock is secondary feature, expensive at scale |
| **WireMock** | Library + Cloud | Free / $236/mo team | Gold standard simulation, recording | Complex setup, Java-centric |
| **MockServer** | Library | Free (OSS) | Powerful, CI/CD friendly | Requires coding, no GUI |

### Our Differentiators

1. **Auth simulation built-in** - Most tools ignore auth entirely
2. **Team collaboration from start** - Not an afterthought
3. **Tiered pricing for indie/startup** - Between free tools and enterprise
4. **OpenAPI-first with manual fallback** - Flexible spec handling
5. **Request logging with analytics** - Visibility into mock usage

### Our Gaps vs Competition

| Feature | Mockoon | Beeceptor | WireMock | Us |
|---------|---------|-----------|----------|-----|
| Record & replay | ✅ | ✅ | ✅ | ❌ |
| Stateful mocks | Limited | ✅ CRUD | ✅ | ❌ |
| Proxy/passthrough | ✅ | ✅ | ✅ | ❌ |
| GraphQL mocks | ❌ | ✅ | ✅ | ❌ |
| SOAP mocks | ❌ | ✅ | ✅ | ❌ |
| CLI tool | ✅ | ❌ | ✅ | ❌ |
| Local tunnel | ❌ | ✅ | ❌ | ❌ |
| Webhook testing | ❌ | ✅ | ❌ | ❌ |
| AI data generation | ❌ | ✅ | ❌ | Partial (Faker) |

---

## Data Model

```
Organization { id, name, slug, tier, stripeCustomerId, ... }
  └─ OrgMembership { userId, orgId, role }
  └─ Project { id, name, slug, apiKey }
       └─ Endpoint { method, path, status, body, headers, delay, failRate }
       └─ RequestLog { method, path, status, request/response data, duration }
  └─ ApiKey { id, keyHash, keyMasked }
  └─ UsageRecord { year, month, apiCalls }
  └─ OrgInvite { email, role, token, expiresAt }

User { id, email, passwordHash, emailVerified }
  └─ RefreshToken { token, expiresAt }
  └─ PasswordResetToken { token, expiresAt }
  └─ EmailVerificationToken { token, expiresAt }
```

---

## Current Limitations

1. **No record/replay** - Can't capture real API responses
2. **No proxy mode** - Can't passthrough to real APIs
3. **No stateful mocks** - Can't simulate CRUD persistence
4. **No CLI** - Only web-based management
5. **No GraphQL/SOAP** - REST-only
6. **No environments** - No dev/staging/prod separation
7. **No version control** - No git sync or history
8. **Single region** - No edge deployment

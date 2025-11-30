# Mocktail - Future Roadmap

## Pre-Launch Blockers (Must-Haves)

These must be complete before public testing:

### 1. Error Handling & Edge Cases
**Priority: HIGH**

- [ ] Global error boundary in web app
- [ ] API error responses (standardized format)
- [ ] Graceful degradation when services unavailable
- [ ] Input validation errors with helpful messages
- [ ] Rate limit exceeded handling (user-facing)

### 2. Onboarding Flow
**Priority: HIGH**

First-time user experience is undefined.

- [ ] Welcome modal after registration
- [ ] Empty state CTAs (create first project)
- [ ] Quick-start guide or tooltips
- [ ] Sample project import (one-click demo)
- [ ] Interactive endpoint builder tutorial

### 3. Production Readiness
**Priority: HIGH**

- [ ] Environment configuration (prod vs dev)
- [ ] HTTPS enforcement
- [ ] CORS configuration for web app
- [ ] Database connection pooling
- [ ] Health check endpoint
- [ ] Error logging/monitoring (Sentry?)
- [ ] Rate limit: Redis backend (currently in-memory)

### 4. UI Polish
**Priority: MEDIUM**

- [ ] Loading states/skeletons throughout
- [ ] Optimistic updates
- [ ] Toast notifications for actions
- [ ] Keyboard shortcuts (Cmd+K, Cmd+N)
- [ ] Dark mode toggle (currently forced dark)
- [ ] Mobile-responsive improvements

---

## Post-Launch Nice-to-Haves

### Phase 1: Core Enhancements

#### Proxy Mode
Passthrough to real APIs with selective mocking.

- [ ] Proxy config per project (target URL)
- [ ] Endpoint toggle: mock vs proxy
- [ ] Request/response modification
- [ ] Header forwarding rules

#### Record & Replay
Capture real API responses for mock generation.

- [ ] Record mode toggle
- [ ] Request capture to logs
- [ ] Convert captured requests to endpoints
- [ ] Response comparison (recorded vs actual)

#### Environments
Dev/staging/prod separation.

- [ ] Environment model per project
- [ ] Environment-specific endpoint overrides
- [ ] Environment variables in templates
- [ ] Quick environment switcher

### Phase 2: Advanced Mocking

#### Stateful Mocks
Simulate CRUD persistence.

- [ ] In-memory state store per project
- [ ] State templates (list, get, create, update, delete)
- [ ] State reset endpoint
- [ ] State inspection UI

#### Conditional Responses
Response based on request content.

- [ ] Request matching rules (header, body, query)
- [ ] Multiple response variants per endpoint
- [ ] Rule priority/ordering
- [ ] Default fallback response

#### GraphQL Support
- [ ] Schema-based mocking
- [ ] Query/mutation handling
- [ ] Resolver templating
- [ ] Introspection support

### Phase 3: Developer Experience

#### CLI Tool
Local development workflow.

- [ ] `mocktail init` - project scaffolding
- [ ] `mocktail push` - sync local config to cloud
- [ ] `mocktail pull` - download cloud config
- [ ] `mocktail serve` - local mock server
- [ ] Config file format (YAML/JSON)

#### GitHub Sync
Version-controlled mocks.

- [ ] GitHub App integration
- [ ] Repo-to-project binding
- [ ] PR previews for mock changes
- [ ] Conflict resolution

#### Local Tunnel
Expose localhost publicly.

- [ ] Subdomain assignment
- [ ] Secure tunnel connection
- [ ] Request forwarding

### Phase 4: Enterprise

#### SSO/SAML
- [ ] SAML 2.0 provider integration
- [ ] Okta, Auth0, Azure AD
- [ ] JIT user provisioning
- [ ] Org-level SSO enforcement

#### Audit Logs
- [ ] User action logging
- [ ] API access logs
- [ ] Log export/retention
- [ ] Compliance reporting

#### Advanced Analytics
- [ ] Usage trends over time
- [ ] Endpoint performance metrics
- [ ] Error rate tracking
- [ ] Export to BI tools

#### Self-Hosted Option
- [ ] Docker image
- [ ] Helm chart
- [ ] Air-gapped deployment
- [ ] License management

---

## Competitive Parity Checklist

Features needed to match competitors:

| Feature | Mockoon | Beeceptor | WireMock | Priority |
|---------|---------|-----------|----------|----------|
| Record/replay | ✅ | ✅ | ✅ | P1 |
| Proxy mode | ✅ | ✅ | ✅ | P1 |
| Stateful mocks | ⚠️ | ✅ | ✅ | P2 |
| GraphQL | ❌ | ✅ | ✅ | P2 |
| CLI tool | ✅ | ❌ | ✅ | P2 |
| Environments | ✅ | ✅ | ✅ | P2 |
| GitHub sync | ❌ | ❌ | ⚠️ | P3 |
| Local tunnel | ❌ | ✅ | ❌ | P3 |
| Webhook testing | ❌ | ✅ | ❌ | P3 |
| SOAP/gRPC | ❌ | ✅ | ✅ | P4 |

---

## Pricing Strategy (Review)

Current pricing vs competition:

| Tier | Us | Beeceptor | Mockoon Cloud |
|------|-----|-----------|---------------|
| Free | 10k req/mo | 50 req/day (~1.5k/mo) | Local only |
| Starter | $29/mo (500k) | $10/mo (15k) | $15/mo (50k) |
| Team | Enterprise | Custom | Custom |

**Analysis:**
- Free tier is competitive (better than Beeceptor)
- Pro tier expensive vs requests-per-dollar (Beeceptor wins on volume)
- Consider: lower Pro price or add intermediate tier

**Suggested adjustments:**
- Add $15/mo "Starter" tier: 100k requests, 10 projects
- Move current Pro to $29/mo: 500k requests, 20 projects
- Keep Enterprise as-is

---

## Technical Debt

Items to address before scaling:

1. **Rate limiting** - Move from in-memory to Redis
2. **Session management** - Consider refresh token rotation
3. **API versioning** - No version prefix currently
4. **Caching** - No caching layer for mock responses
5. **Database indexes** - Review for query performance
6. **Type safety** - Audit for `any` usage
7. **Test coverage** - Add integration tests
8. **Documentation** - API docs, user guides

---

## Success Metrics

Track these to validate product-market fit:

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Signups | 100 | 500 |
| Active projects | 50 | 250 |
| Mock requests served | 100k | 1M |
| Paid conversions | 5 | 25 |
| Team invites sent | 20 | 100 |
| Retention (weekly active) | 30% | 40% |

---

## Open Questions

1. **Pricing model** - Per-request vs per-seat vs hybrid?
2. **Self-hosted** - Is there demand? What's the priority?
3. **CLI vs cloud** - Which workflow do target users prefer?
4. **GraphQL** - How important vs REST-only focus?
5. **Differentiator** - What's our actual edge if not auth simulation?

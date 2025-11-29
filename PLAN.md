# Mocktail MVP Plan

**Local-first mock API server**

## Status

| Phase             | Status      | Notes |
| ----------------- | ----------- | ----- |
| 1. Foundation     | done        |       |
| 2. Mock Engine    | done        |       |
| 3. OpenAPI Import | done        |       |
| 4. Web UI         | done        |       |
| 5. Auth Sim       | pending     |       |
| 6. Polish         | pending     |       |

---

## Stack

- **Monorepo**: Turborepo + pnpm
- **API**: Hono + @hono/zod-openapi + Prisma + PostgreSQL
- **Web**: Next.js 14 + Tailwind + shadcn/ui + Framer Motion

## URL Structure

```
http://localhost:3002/api/*        → management API
http://localhost:3002/m/{slug}/*   → mock traffic
http://localhost:3003              → web UI
```

## Data Model

```
Project    { id, name, slug, apiKey?, createdAt }
Endpoint   { id, projectId, method, path, status, body, delay?, createdAt }
RequestLog { id, endpointId, method, path, status, requestHeaders, requestBody, responseBody, duration, createdAt }
```

---

## Phase 1: Foundation

- [x] Init git repo
- [x] Setup monorepo (turbo + pnpm workspaces)
- [x] Create apps/api with Hono + zod-openapi
- [x] Create apps/web with Next.js 15
- [x] Prisma schema + PostgreSQL
- [x] Project CRUD endpoints
- [x] Endpoint CRUD endpoints

## Phase 2: Mock Engine

- [x] Route matcher (method + path with params)
- [x] Request handler at `/m/{slug}/*`
- [x] Response serving (status, headers, body)
- [x] Delay simulation
- [x] Request logging to DB

## Phase 3: OpenAPI Import

- [x] Spec parser (OpenAPI 3.x)
- [x] Extract paths, methods, responses
- [x] Generate endpoints from spec
- [x] Example response generation from schemas

### Phase 3 Implementation Plan

**3.1 Add dependencies**
- `@apidevtools/swagger-parser` - parse & validate OpenAPI 3.x / Swagger 2.0
- `openapi-types` - TypeScript types for OpenAPI spec

**3.2 OpenAPI parser service** (`src/services/openapi-parser.ts`)
- `parseSpec(input: string | object)` → parsed & dereferenced spec
- Handle JSON + YAML input
- Validate spec structure
- Dereference $refs for easier traversal

**3.3 Schema-to-example generator** (`src/services/example-generator.ts`)
- `generateExample(schema: SchemaObject)` → mock JSON
- Support types: string, number, integer, boolean, array, object
- Use `example` field if present
- Use `enum` first value if present
- Generate realistic defaults (lorem ipsum, incremental ids)
- Handle nested objects/arrays recursively

**3.4 Spec extractor** (`src/services/spec-extractor.ts`)
- `extractEndpoints(spec)` → `ExtractedEndpoint[]`
- Walk `paths` object
- For each path + method: extract response schema (prefer 200/201)
- Convert OpenAPI path params `{id}` → `:id` format
- Generate example response body from schema

**3.5 Import route** (`src/routes/import.ts`)
- `POST /api/projects/:projectId/import`
- Accept: `{ spec: string | object, options?: { overwrite?: boolean } }`
- Parse spec → extract endpoints → bulk create in DB
- Return: `{ created: number, endpoints: EndpointResponse[] }`

**3.6 Tests**
- Parser: valid/invalid specs, JSON/YAML
- Example generator: all schema types, nested structures
- Extractor: path params, multiple methods, missing responses
- Integration: full import flow

## Phase 4: Web UI

- [x] Design system setup (colors, typography, components)
- [x] Dashboard - project list
- [x] Project view - endpoint list
- [x] Endpoint builder (method, path, response editor)
- [x] Request logs viewer with search/filter
- [x] OpenAPI import modal

### Phase 4 Implementation Plan

**4.1 Foundation & Dependencies**
- Add shadcn/ui (button, input, dialog, dropdown, select, tabs, toast)
- Add `@tanstack/react-query` for data fetching
- Add fonts (Inter + JetBrains Mono via `next/font`)
- Create shared types from API schemas
- Create API client (`src/lib/api.ts`)

**4.2 Shared Components** (`src/components/`)
- `Logo` - brand icon + text
- `Navbar` - logo + nav links + user area
- `EmptyState` - icon + title + description + action
- `MethodBadge` - colored HTTP method pill (GET=green, POST=blue, etc.)
- `StatusBadge` - colored status code pill
- `CodeEditor` - JSON editor with syntax highlighting (monaco-editor or codemirror)
- `Modal` - generic modal wrapper using dialog

**4.3 Dashboard** (`/`)
- Already exists, enhance:
  - Add "New Project" modal (name, slug inputs)
  - Add project count, endpoint count per project
  - Add delete confirmation
  - Loading states with skeletons

**4.4 Project Detail** (`/projects/[id]`)
- Project header: name, slug, mock URL, edit/delete actions
- Tabs: Endpoints | Logs | Settings
- Endpoint list with method, path, status columns
- "New Endpoint" button → endpoint builder
- Empty state when no endpoints

**4.5 Endpoint Builder** (modal or slide-over)
- Method select (GET/POST/PUT/DELETE/PATCH)
- Path input with validation
- Status code dropdown (common codes + custom)
- Response headers key-value editor
- Response body JSON editor
- Delay slider (0-5000ms)
- Fail rate slider (0-100%)
- Save/cancel buttons

**4.6 Request Logs Viewer** (tab in project view)
- Table: timestamp, method, path, status, duration
- Row expansion: request headers, request body, response body
- Filters: method dropdown, status code, endpoint
- Real-time updates (polling or SSE later)
- Pagination (offset/limit)

**4.7 OpenAPI Import** (modal)
- File upload or paste text area
- Drag-and-drop zone
- Preview extracted endpoints count
- Import options: overwrite existing
- Progress indicator
- Success/error feedback

**File Structure:**
```
apps/web/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (dashboard)
│   └── projects/
│       └── [id]/
│           └── page.tsx
├── components/
│   ├── ui/ (shadcn)
│   ├── navbar.tsx
│   ├── logo.tsx
│   ├── empty-state.tsx
│   ├── method-badge.tsx
│   ├── status-badge.tsx
│   ├── code-editor.tsx
│   ├── project-card.tsx
│   ├── endpoint-list.tsx
│   ├── endpoint-form.tsx
│   ├── request-log-table.tsx
│   ├── import-modal.tsx
│   └── create-project-modal.tsx
├── lib/
│   ├── api.ts (fetch wrapper)
│   └── utils.ts
└── types/
    └── index.ts
```

**Unresolved:**
- Monaco vs CodeMirror for JSON editor?
- Real-time logs: polling vs SSE?

## Phase 5: Auth Simulation

- [ ] Project-level API key generation
- [ ] API key validation middleware in mock engine
- [ ] Auth toggle in UI

## Phase 6: Polish

- [ ] Error handling
- [ ] Loading states
- [ ] Animations/transitions
- [ ] Keyboard shortcuts
- [ ] Onboarding hints

---

## Design Direction

**Vibe**: Raycast-inspired - dark, glowy red accents, command-palette feel

**Key Elements**:

- Dark background (#0f0f12)
- Red/orange gradient accents (#ff5757 → #ff8c57)
- Ambient glow effects
- Numbered feature grids (01, 02, 03...)
- Terminal-style demos
- Glass morphism on cards/modals
- JetBrains Mono for code, Inter for UI

**Reference**: `design-mocks/raycast-refined.html`

---

## Decisions Log

| Date       | Decision                         | Rationale                     |
| ---------- | -------------------------------- | ----------------------------- |
| 2024-11-28 | No subdomains, use `/m/{slug}/*` | Simpler SSL, easier local dev |
| 2024-11-28 | Single service for API + mock    | Simpler architecture for MVP  |
| 2024-11-28 | PostgreSQL over SQLite           | Production-ready from start   |

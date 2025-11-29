- In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any. Make the questions extremely concise. Sacrifice grammar for the sake of concision.

- **ALWAYS run when a feature or phase is fully implemented**: `pnpm build && pnpm test:run && pnpm lint`. Make sure it passes and no errors.
- After a plan has been accepted, always add a github issue with the whole plan, then update it as each sub-phase is done.
- Only add comments if they bring a lot of value, rather refactor to make code readable
- Make sure code compiles and test pass after changes

- Types over interfaces
- **Use named function declarations, not arrow function constants**: `function foo(): Bar {}` not `const foo = () => {}`

## Frameworks

- Hono + @hono/zod-openapi
- Prisma
- Vitest

## Architecture Pattern (CRITICAL)

**Layered architecture with strict separation:**

```
routes/controllers → services → repositories
     ↓                  ↓            ↓
  API types      domain models    DB access
```

### Layers

1. **Routes/Controllers** (`/routes`)
   - HTTP handling only
   - Call services, map domain models to API responses
   - NO business logic, NO DB calls

2. **Services** (`/services`)
   - Business logic
   - Define and return domain models
   - Call repositories for data
   - NO Prisma/DB access

3. **Repositories** (`/repositories`)
   - ONLY place for Prisma/DB access
   - Return raw DB data or domain models
   - NO business logic

4. **Schemas** (`/schemas`)
   - Zod schemas for OpenAPI
   - Export API types: `export type TaskResponse = z.infer<typeof schema>`
   - Keep routes clean - no schema definitions in route files

### Type Flow

- **OpenAPI schemas** → API types (request/response)
- **Services** → domain models
- **Mappers** → transform between domain models and API types
- **NO DB types outside repositories**

## Type Safety

**NEVER use `any` type. Zero exceptions.**

Use instead:

- `unknown` - when type is truly unknown, forces type narrowing
- `Record<string, unknown>` - for objects with unknown shape
- Generic types `<T>` - for reusable functions
- Union types - `string | number | null` for known possibilities
- `as const` - for literal types
- Type assertions `as Type` - only when you have proof it's safe

If stuck, ask for help. Never resort to `any`.

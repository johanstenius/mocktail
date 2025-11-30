# Request Schema Validation for Mock Endpoints

## Overview
Add optional request schema validation to variants. When configured, validates incoming request body/headers/query against JSON Schema. Configurable strict mode determines behavior on mismatch.

## Design Decisions

### Where to put the schema?
**On Variant** (not Endpoint) - because:
- Different variants may expect different request shapes
- A "success" variant expects valid input, "error" variant expects invalid input
- Aligns with existing variant-based response config

### Validation strictness
Per-variant `validationMode` field:
- `"none"` (default) - no validation
- `"warn"` - log mismatch in request log, still return response
- `"strict"` - return 400 on mismatch

### What to validate?
- `requestBodySchema` - JSON Schema for request body
- Future: `requestHeadersSchema`, `requestQuerySchema` (out of scope for now)

---

## Implementation Plan

### Phase 1: DB Schema
1. Add to `ResponseVariant` model:
   - `requestBodySchema String @default("{}")` - JSON Schema string
   - `validationMode String @default("none")` - "none" | "warn" | "strict"

### Phase 2: API Schema Updates
1. Update `apps/api/src/schemas/variant.ts`:
   - Add `validationModeSchema = z.enum(["none", "warn", "strict"])`
   - Add `requestBodySchema` to variant schemas (z.unknown for JSON Schema)
   - Add to create/update schemas

### Phase 3: Service Layer
1. Update `apps/api/src/services/variant.service.ts`:
   - Add `requestBodySchema` and `validationMode` to `VariantModel`
   - Add to `CreateVariantInput` and `UpdateVariantInput`
   - Handle serialization in create/update

2. Create `apps/api/src/services/request-validator.service.ts`:
   - `validateRequest(schema: object, body: unknown): ValidationResult`
   - Use Ajv for JSON Schema validation
   - Return `{ valid: boolean, errors?: string[] }`

### Phase 4: Mock Service Integration
1. Update `apps/api/src/services/mock.service.ts`:
   - After variant selection, before response generation:
   - If `validationMode !== "none"` and `requestBodySchema` exists:
     - Validate request body against schema
     - If invalid:
       - `warn`: continue, add validation errors to log
       - `strict`: return 400 with validation errors
   - Add `validationErrors` to request log

### Phase 5: Request Log Enhancement
1. Add to `RequestLog` model:
   - `validationErrors String?` - JSON array of error messages

2. Update request log creation to include validation errors

### Phase 6: Frontend (out of scope for this plan)
- UI for editing request schema on variant
- Display validation errors in request logs

---

## DB Migration

```prisma
model ResponseVariant {
  // ... existing fields
  requestBodySchema String @default("{}")
  validationMode    String @default("none")
}

model RequestLog {
  // ... existing fields
  validationErrors String?
}
```

---

## API Changes

### Create/Update Variant
```json
{
  "requestBodySchema": { "type": "object", "properties": {...} },
  "validationMode": "strict"
}
```

### Variant Response
```json
{
  "requestBodySchema": { ... },
  "validationMode": "strict"
}
```

### Request Log Response
```json
{
  "validationErrors": ["body.email: must be string"]
}
```

---

## Dependencies
- `ajv` - JSON Schema validator (add to api package)

---

## Unresolved Questions
- Support JSON Schema draft-07 or also draft-04/06?
- Max schema size limit?
- Validate schema itself on variant create/update?

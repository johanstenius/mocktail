# Product Vision

## Name

TBD

## One-liner

A mock API server that developers can spin up in minutes – with or without a spec – that actually handles auth like the real thing.

## Problem

Building against APIs is painful when:

- The API doesn't exist yet
- It's unreliable or slow
- It costs money per call
- You need to test edge cases (errors, latency, auth failures)

Existing tools are either too simple (static JSON), too complex (WireMock), or ignore auth entirely.

## Solution

A hosted mock server where you:

1. Import an OpenAPI spec or define endpoints manually
2. Configure realistic auth (API key, JWT, Basic)
3. Simulate real-world conditions (latency, errors)
4. Share a URL with your team and start building

## Who it's for

- Frontend developers who can't wait for backend
- Backend developers integrating third-party APIs
- QA engineers who need deterministic test environments
- Small teams who want something simpler than enterprise tools

## Core principles

1. **Fast to start**: Working mock in under 5 minutes
2. **Flexible**: Spec-first or manual, your choice
3. **Realistic**: Auth and failure modes that match production
4. **Collaborative**: Share with your team, not just localhost

## What success looks like

- Developer signs up, uploads a spec (or skips it), and has a working mock URL in minutes
- Team uses it throughout development, not just as a one-off
- Replaces hacky workarounds and flaky staging environments

## MVP Scope

| Area | Features |
|------|----------|
| **Spec import** | OpenAPI 3.x / Swagger 2.0, auto-generate endpoints, editable |
| **Manual builder** | Method, path, status, body, templates, conditionals |
| **Auth** | API key, JWT, Basic auth – per endpoint config |
| **Request behavior** | Delay simulation, failure rate, status code overrides |
| **Logging** | Request history with search/filter |
| **Hosting** | Unique URL per project, team sharing, environments |

## Out of scope (v1)

- Stateful mocks
- Record/proxy mode
- GitHub sync
- Self-hosted option
- Analytics / usage dashboards

## Future possibilities (post-MVP)

- Stateful mocks for more realistic flows
- Record mode to capture real API responses
- GitHub sync for version-controlled mocks
- Self-hosted option for enterprise

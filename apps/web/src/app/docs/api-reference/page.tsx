import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

function Endpoint({
	method,
	path,
	description,
}: {
	method: string;
	path: string;
	description: string;
}) {
	const methodColors: Record<string, string> = {
		GET: "text-green-400",
		POST: "text-blue-400",
		PATCH: "text-yellow-400",
		PUT: "text-orange-400",
		DELETE: "text-red-400",
	};

	return (
		<div className="flex items-start gap-3 py-2">
			<code
				className={`${methodColors[method] || "text-gray-400"} font-semibold text-sm w-16`}
			>
				{method}
			</code>
			<code className="text-[var(--text-primary)] text-sm flex-1">{path}</code>
			<span className="text-[var(--text-muted)] text-sm">{description}</span>
		</div>
	);
}

export default function DocsApiReference() {
	return (
		<DocsLayout>
			<DocsHeader
				title="API Reference"
				description="REST API endpoints for programmatic access to Mockspec."
			/>

			<p className="text-[var(--text-secondary)] mb-8">
				All endpoints require authentication via org API key (
				<code>ms_org_xxx</code>). Include it in the <code>X-API-Key</code>{" "}
				header.
			</p>

			<Section title="Base URL">
				<CodeBlock>{"https://api.mockspec.dev"}</CodeBlock>
			</Section>

			<Section title="Authentication">
				<CodeBlock>{`curl -X GET "https://api.mockspec.dev/projects" \\
  -H "X-API-Key: ms_org_xxx" \\
  -H "Content-Type: application/json"`}</CodeBlock>
			</Section>

			<Section title="Projects">
				<div className="space-y-1 font-mono text-sm">
					<Endpoint method="GET" path="/projects" description="List all" />
					<Endpoint method="GET" path="/projects/:id" description="Get one" />
					<Endpoint method="POST" path="/projects" description="Create" />
					<Endpoint method="PATCH" path="/projects/:id" description="Update" />
					<Endpoint method="DELETE" path="/projects/:id" description="Delete" />
					<Endpoint
						method="POST"
						path="/projects/:id/rotate-key"
						description="Rotate API key"
					/>
					<Endpoint
						method="POST"
						path="/projects/:id/state/reset"
						description="Reset state"
					/>
				</div>

				<h4 className="font-semibold mt-6 mb-2">Create Project</h4>
				<CodeBlock>{`POST /projects
{
  "name": "My API",
  "slug": "my-api",
  "proxyBaseUrl": "https://api.example.com",  // optional
  "proxyTimeout": 10000                        // optional, ms
}`}</CodeBlock>

				<h4 className="font-semibold mt-6 mb-2">Response</h4>
				<CodeBlock>{`{
  "id": "clx...",
  "name": "My API",
  "slug": "my-api",
  "apiKey": "ms_proj_xxx",
  "proxyBaseUrl": null,
  "proxyTimeout": 10000,
  "proxyAuthHeader": null,
  "proxyPassThroughAuth": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}`}</CodeBlock>
			</Section>

			<Section title="Endpoints">
				<div className="space-y-1 font-mono text-sm">
					<Endpoint
						method="GET"
						path="/projects/:projectId/endpoints"
						description="List all"
					/>
					<Endpoint
						method="GET"
						path="/projects/:projectId/endpoints/:id"
						description="Get one"
					/>
					<Endpoint
						method="POST"
						path="/projects/:projectId/endpoints"
						description="Create"
					/>
					<Endpoint
						method="PATCH"
						path="/projects/:projectId/endpoints/:id"
						description="Update"
					/>
					<Endpoint
						method="DELETE"
						path="/projects/:projectId/endpoints/:id"
						description="Delete"
					/>
				</div>

				<h4 className="font-semibold mt-6 mb-2">Create Endpoint</h4>
				<CodeBlock>{`POST /projects/:projectId/endpoints
{
  "method": "GET",
  "path": "/users/:id",
  "status": 200,
  "headers": { "X-Custom": "value" },
  "body": { "id": "{{ params.id }}", "name": "{{ name }}" },
  "bodyType": "template",      // "static" | "template"
  "delay": 0,                  // ms
  "failRate": 0,               // 0-100
  "requestBodySchema": {},     // JSON Schema for validation
  "validationMode": "none",    // "none" | "warn" | "strict"
  "proxyEnabled": false,
  "isCrud": false,
  "crudBucket": "users",
  "crudIdField": "id"
}`}</CodeBlock>
			</Section>

			<Section title="Variants">
				<div className="space-y-1 font-mono text-sm">
					<Endpoint
						method="GET"
						path="/projects/:projectId/endpoints/:endpointId/variants"
						description="List"
					/>
					<Endpoint
						method="GET"
						path="/projects/:projectId/endpoints/:endpointId/variants/:id"
						description="Get"
					/>
					<Endpoint
						method="POST"
						path="/projects/:projectId/endpoints/:endpointId/variants"
						description="Create"
					/>
					<Endpoint
						method="PATCH"
						path="/projects/:projectId/endpoints/:endpointId/variants/:id"
						description="Update"
					/>
					<Endpoint
						method="DELETE"
						path="/projects/:projectId/endpoints/:endpointId/variants/:id"
						description="Delete"
					/>
					<Endpoint
						method="POST"
						path="/projects/:projectId/endpoints/:endpointId/variants/reorder"
						description="Reorder"
					/>
				</div>

				<h4 className="font-semibold mt-6 mb-2">Create Variant</h4>
				<CodeBlock>{`POST /projects/:projectId/endpoints/:endpointId/variants
{
  "name": "Error case",
  "status": 500,
  "headers": {},
  "body": { "error": "Server error" },
  "bodyType": "static",
  "delay": 0,
  "delayType": "fixed",        // "fixed" | "random"
  "failRate": 0,
  "rules": [
    {
      "target": "header",      // "header" | "query" | "param" | "body"
      "key": "X-Fail",
      "operator": "equals",    // "equals" | "not_equals" | "contains" | "exists"
      "value": "true"
    }
  ],
  "ruleLogic": "and",          // "and" | "or"
  "sequenceIndex": null        // for sequence responses
}`}</CodeBlock>

				<h4 className="font-semibold mt-6 mb-2">Reorder Variants</h4>
				<CodeBlock>{`POST /projects/:projectId/endpoints/:endpointId/variants/reorder
{
  "variantIds": ["variant-id-1", "variant-id-2", "variant-id-3"]
}`}</CodeBlock>
			</Section>

			<Section title="Buckets (Stateful Data)">
				<div className="space-y-1 font-mono text-sm">
					<Endpoint
						method="GET"
						path="/projects/:id/buckets"
						description="List all"
					/>
					<Endpoint
						method="GET"
						path="/projects/:id/buckets/:name"
						description="Get one"
					/>
					<Endpoint
						method="POST"
						path="/projects/:id/buckets"
						description="Create"
					/>
					<Endpoint
						method="PUT"
						path="/projects/:id/buckets/:name"
						description="Set data"
					/>
					<Endpoint
						method="DELETE"
						path="/projects/:id/buckets/:name"
						description="Delete"
					/>
				</div>

				<h4 className="font-semibold mt-6 mb-2">Create Bucket</h4>
				<CodeBlock>{`POST /projects/:id/buckets
{
  "name": "users",
  "data": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ]
}`}</CodeBlock>

				<h4 className="font-semibold mt-6 mb-2">Set Bucket Data</h4>
				<CodeBlock>{`PUT /projects/:id/buckets/users
{
  "data": [
    { "id": 1, "name": "Alice Updated" }
  ]
}`}</CodeBlock>
			</Section>

			<Section title="Request Logs">
				<div className="space-y-1 font-mono text-sm">
					<Endpoint
						method="GET"
						path="/projects/:projectId/logs"
						description="List (with filters)"
					/>
					<Endpoint
						method="GET"
						path="/projects/:projectId/logs/:logId"
						description="Get one"
					/>
					<Endpoint
						method="DELETE"
						path="/projects/:projectId/logs"
						description="Clear all"
					/>
				</div>

				<h4 className="font-semibold mt-6 mb-2">Query Parameters</h4>
				<CodeBlock>{`GET /projects/:projectId/logs?limit=50&offset=0&method=POST&status=201&source=mock

// source: "mock" | "proxy" | "proxy_fallback"`}</CodeBlock>

				<h4 className="font-semibold mt-6 mb-2">Response</h4>
				<CodeBlock>{`{
  "logs": [
    {
      "id": "clx...",
      "projectId": "clx...",
      "endpointId": "clx...",
      "method": "POST",
      "path": "/users",
      "status": 201,
      "source": "mock",
      "requestHeaders": {},
      "requestBody": {},
      "responseBody": {},
      "validationErrors": null,
      "duration": 12,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 150
}`}</CodeBlock>
			</Section>

			<Section title="Statistics">
				<div className="space-y-1 font-mono text-sm">
					<Endpoint
						method="GET"
						path="/projects/:projectId/statistics"
						description="Get stats"
					/>
				</div>

				<h4 className="font-semibold mt-6 mb-2">Response</h4>
				<CodeBlock>{`{
  "endpoints": [
    {
      "endpointId": "clx...",
      "requestCount": 150,
      "lastRequestAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "unmatched": [
    {
      "method": "GET",
      "path": "/unknown",
      "count": 5,
      "lastRequestAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "avgLatency": 45
}`}</CodeBlock>
			</Section>

			<Section title="OpenAPI Import">
				<div className="space-y-1 font-mono text-sm">
					<Endpoint
						method="POST"
						path="/projects/:projectId/import"
						description="Import spec"
					/>
				</div>

				<h4 className="font-semibold mt-6 mb-2">Request</h4>
				<CodeBlock>{`POST /projects/:projectId/import
{
  "spec": "openapi: 3.0.0\\n...",  // string or object
  "options": {
    "overwrite": false             // skip existing endpoints
  }
}`}</CodeBlock>

				<h4 className="font-semibold mt-6 mb-2">Response</h4>
				<CodeBlock>{`{
  "created": 5,
  "skipped": 2,
  "endpoints": [...]
}`}</CodeBlock>
			</Section>

			<Section title="API Keys">
				<p className="mb-4">
					Manage API keys for your organization and projects.
				</p>

				<h4 className="font-semibold mb-2">Organization Keys</h4>
				<div className="space-y-1 font-mono text-sm mb-4">
					<Endpoint method="GET" path="/api-keys" description="List org keys" />
					<Endpoint
						method="POST"
						path="/api-keys"
						description="Create org key"
					/>
					<Endpoint
						method="DELETE"
						path="/api-keys/:id"
						description="Delete org key"
					/>
				</div>

				<h4 className="font-semibold mb-2">Project Keys</h4>
				<div className="space-y-1 font-mono text-sm mb-4">
					<Endpoint
						method="GET"
						path="/projects/:id/api-keys"
						description="List project keys"
					/>
					<Endpoint
						method="POST"
						path="/projects/:id/api-keys"
						description="Create project key"
					/>
					<Endpoint
						method="DELETE"
						path="/projects/:id/api-keys/:keyId"
						description="Delete project key"
					/>
				</div>

				<h4 className="font-semibold mt-4 mb-2">Create API Key</h4>
				<CodeBlock>{`POST /api-keys  // or /projects/:id/api-keys
{
  "name": "CI Pipeline",
  "expiresAt": "2025-01-01T00:00:00.000Z"  // optional
}`}</CodeBlock>
			</Section>

			<Section title="Error Responses">
				<CodeBlock>{`{
  "error": "Not found",
  "code": "NOT_FOUND"
}

// Validation errors include fields:
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "fields": {
    "name": "Required",
    "slug": "Must be lowercase"
  }
}`}</CodeBlock>

				<h4 className="font-semibold mt-6 mb-2">Status Codes</h4>
				<ul className="list-disc list-inside space-y-1 ml-4">
					<li>
						<code>200</code> - Success
					</li>
					<li>
						<code>201</code> - Created
					</li>
					<li>
						<code>204</code> - No content (delete)
					</li>
					<li>
						<code>400</code> - Bad request / validation error
					</li>
					<li>
						<code>401</code> - Unauthorized (missing/invalid API key)
					</li>
					<li>
						<code>403</code> - Forbidden (no access)
					</li>
					<li>
						<code>404</code> - Not found
					</li>
					<li>
						<code>409</code> - Conflict (duplicate slug, etc.)
					</li>
					<li>
						<code>429</code> - Rate limit exceeded
					</li>
				</ul>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

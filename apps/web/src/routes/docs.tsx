import { Logo } from "@/components/logo";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
	component: DocsPage,
});

function CodeBlock({ children }: { children: string }) {
	return (
		<pre className="bg-[rgba(0,0,0,0.4)] border border-[var(--border-subtle)] rounded-xl p-4 overflow-x-auto text-sm font-['JetBrains_Mono'] text-slate-200">
			<code>{children}</code>
		</pre>
	);
}

function Section({
	id,
	title,
	children,
}: {
	id: string;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section id={id} className="scroll-mt-24 mb-16">
			<h2 className="text-2xl font-bold mb-6 font-['Outfit'] text-[var(--text-primary)]">
				{title}
			</h2>
			<div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
				{children}
			</div>
		</section>
	);
}

function SubSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="mt-8">
			<h3 className="text-lg font-semibold mb-4 font-['Outfit'] text-[var(--text-primary)]">
				{title}
			</h3>
			<div className="space-y-4">{children}</div>
		</div>
	);
}

function NavLink({ href, children }: { href: string; children: string }) {
	return (
		<a
			href={href}
			className="block py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
		>
			{children}
		</a>
	);
}

function DocsPage() {
	return (
		<div className="min-h-screen">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-50 py-4 bg-[rgba(5,5,5,0.8)] backdrop-blur-xl border-b border-[var(--border-subtle)]">
				<div className="container max-w-6xl mx-auto px-6 flex items-center justify-between">
					<Link to="/" className="flex items-center gap-2">
						<Logo />
					</Link>
					<nav className="flex items-center gap-6">
						<Link
							to="/"
							className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
						>
							Home
						</Link>
						<Link
							to="/login"
							className="h-9 px-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-highlight)] transition-all flex items-center"
						>
							Sign In
						</Link>
					</nav>
				</div>
			</header>

			<div className="container max-w-6xl mx-auto px-6 pt-24">
				<div className="flex gap-12">
					{/* Sidebar Navigation */}
					<aside className="hidden lg:block w-56 flex-shrink-0">
						<nav className="sticky top-24 space-y-6">
							<div>
								<div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
									Getting Started
								</div>
								<NavLink href="#introduction">Introduction</NavLink>
								<NavLink href="#quick-start">Quick Start</NavLink>
							</div>
							<div>
								<div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
									Core Concepts
								</div>
								<NavLink href="#authentication">Authentication</NavLink>
								<NavLink href="#endpoints">Endpoints</NavLink>
								<NavLink href="#path-parameters">Path Parameters</NavLink>
								<NavLink href="#response-templates">Response Templates</NavLink>
							</div>
							<div>
								<div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
									Features
								</div>
								<NavLink href="#chaos-engineering">Chaos Engineering</NavLink>
								<NavLink href="#openapi-import">OpenAPI Import</NavLink>
								<NavLink href="#request-logs">Request Logs</NavLink>
							</div>
							<div>
								<div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
									Reference
								</div>
								<NavLink href="#rate-limits">Rate Limits</NavLink>
								<NavLink href="#error-responses">Error Responses</NavLink>
							</div>
						</nav>
					</aside>

					{/* Main Content */}
					<main className="flex-1 min-w-0 pb-24">
						<h1 className="text-4xl font-bold mb-4 font-['Outfit'] bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
							Documentation
						</h1>
						<p className="text-lg text-[var(--text-secondary)] mb-12">
							Everything you need to mock APIs and accelerate your frontend
							development.
						</p>

						{/* Introduction */}
						<Section id="introduction" title="Introduction">
							<p>
								Mocktail is a mock API server that lets you create realistic API
								endpoints without writing backend code. Define your endpoints,
								configure responses, and start building your frontend
								immediately.
							</p>
							<p>Key features:</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>
									<strong>Project-based organization</strong> - Group endpoints
									by project
								</li>
								<li>
									<strong>Flexible authentication</strong> - Use API keys via
									header, Bearer, or Basic auth
								</li>
								<li>
									<strong>Dynamic responses</strong> - Use templates to generate
									dynamic data
								</li>
								<li>
									<strong>Chaos engineering</strong> - Simulate delays and
									failures
								</li>
								<li>
									<strong>OpenAPI import</strong> - Generate endpoints from your
									specs
								</li>
								<li>
									<strong>Request logging</strong> - Debug and monitor all
									requests
								</li>
							</ul>
						</Section>

						{/* Quick Start */}
						<Section id="quick-start" title="Quick Start">
							<p>Get your first mock endpoint running in under 2 minutes:</p>

							<SubSection title="1. Create a Project">
								<p>
									Sign up and create a new project. Each project gets a unique
									API key that you'll use to authenticate requests.
								</p>
							</SubSection>

							<SubSection title="2. Create an Endpoint">
								<p>
									Add an endpoint with a method, path, and response body. For
									example:
								</p>
								<ul className="list-disc list-inside space-y-1 ml-4 mb-4">
									<li>
										Method:{" "}
										<code className="text-[var(--glow-violet)]">GET</code>
									</li>
									<li>
										Path:{" "}
										<code className="text-[var(--glow-violet)]">/users</code>
									</li>
									<li>Status: 200</li>
								</ul>
								<p>Response body:</p>
								<CodeBlock>{`{
  "users": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ]
}`}</CodeBlock>
							</SubSection>

							<SubSection title="3. Make a Request">
								<p>
									Copy your API key from the project settings and make a
									request:
								</p>
								<p className="text-sm text-[var(--text-muted)] mb-2">curl:</p>
								<CodeBlock>{`curl -X GET "https://api.mocktail.dev/mock/users" \\
  -H "X-API-Key: mk_your_api_key_here"`}</CodeBlock>

								<p className="text-sm text-[var(--text-muted)] mb-2 mt-4">
									TypeScript:
								</p>
								<CodeBlock>{`const response = await fetch("https://api.mocktail.dev/mock/users", {
  headers: {
    "X-API-Key": "mk_your_api_key_here"
  }
});

const data = await response.json();
console.log(data.users);`}</CodeBlock>
							</SubSection>
						</Section>

						{/* Authentication */}
						<Section id="authentication" title="Authentication">
							<p>
								Every request to your mock endpoints must be authenticated using
								your project's API key. Mocktail supports three authentication
								methods:
							</p>

							<SubSection title="X-API-Key Header (Recommended)">
								<p>Pass your API key in the X-API-Key header:</p>
								<CodeBlock>{`curl -X GET "https://api.mocktail.dev/mock/users" \\
  -H "X-API-Key: mk_your_api_key_here"`}</CodeBlock>

								<p className="mt-4">TypeScript:</p>
								<CodeBlock>{`fetch("https://api.mocktail.dev/mock/users", {
  headers: {
    "X-API-Key": "mk_your_api_key_here"
  }
});`}</CodeBlock>
							</SubSection>

							<SubSection title="Bearer Token">
								<p>Use the Authorization header with Bearer scheme:</p>
								<CodeBlock>{`curl -X GET "https://api.mocktail.dev/mock/users" \\
  -H "Authorization: Bearer mk_your_api_key_here"`}</CodeBlock>

								<p className="mt-4">TypeScript:</p>
								<CodeBlock>{`fetch("https://api.mocktail.dev/mock/users", {
  headers: {
    "Authorization": "Bearer mk_your_api_key_here"
  }
});`}</CodeBlock>
							</SubSection>

							<SubSection title="Basic Auth">
								<p>
									Use Basic authentication with your API key as the username
									(password can be empty). This is useful for systems that only
									support Basic auth:
								</p>
								<CodeBlock>{`# Base64 encode "mk_your_api_key_here:"
curl -X GET "https://api.mocktail.dev/mock/users" \\
  -H "Authorization: Basic $(echo -n 'mk_your_api_key_here:' | base64)"`}</CodeBlock>

								<p className="mt-4">TypeScript:</p>
								<CodeBlock>{`const apiKey = "mk_your_api_key_here";
const encoded = btoa(\`\${apiKey}:\`);

fetch("https://api.mocktail.dev/mock/users", {
  headers: {
    "Authorization": \`Basic \${encoded}\`
  }
});`}</CodeBlock>
							</SubSection>

							<SubSection title="Rotating API Keys">
								<p>
									You can rotate your API key at any time from the project
									settings. The old key is invalidated immediately. Make sure to
									update your applications with the new key.
								</p>
							</SubSection>
						</Section>

						{/* Endpoints */}
						<Section id="endpoints" title="Endpoints">
							<p>
								Endpoints define the mock responses for your API. Each endpoint
								has:
							</p>

							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>
									<strong>Method</strong> - GET, POST, PUT, PATCH, or DELETE
								</li>
								<li>
									<strong>Path</strong> - The URL path (e.g., /users,
									/orders/:id)
								</li>
								<li>
									<strong>Status</strong> - HTTP status code (default: 200)
								</li>
								<li>
									<strong>Headers</strong> - Response headers (JSON object)
								</li>
								<li>
									<strong>Body</strong> - Response body (JSON or template)
								</li>
								<li>
									<strong>Delay</strong> - Simulated latency in milliseconds
								</li>
								<li>
									<strong>Fail Rate</strong> - Percentage of requests that
									return 500
								</li>
							</ul>

							<SubSection title="Response Headers">
								<p>Add custom response headers as a JSON object:</p>
								<CodeBlock>{`{
  "X-Custom-Header": "custom-value",
  "Cache-Control": "no-cache"
}`}</CodeBlock>
							</SubSection>

							<SubSection title="Response Body">
								<p>
									The response body can be static JSON or a dynamic template
									(see Response Templates section).
								</p>
								<CodeBlock>{`{
  "id": 123,
  "name": "Product Name",
  "price": 29.99,
  "inStock": true
}`}</CodeBlock>
							</SubSection>
						</Section>

						{/* Path Parameters */}
						<Section id="path-parameters" title="Path Parameters">
							<p>
								Use colon syntax to define dynamic path segments. Parameters are
								automatically extracted and available in templates.
							</p>

							<SubSection title="Single Parameter">
								<p>
									Define path:{" "}
									<code className="text-[var(--glow-violet)]">/users/:id</code>
								</p>
								<p>
									Request:{" "}
									<code className="text-[var(--glow-violet)]">/users/123</code>
								</p>
								<p>
									Extracted:{" "}
									<code className="text-[var(--glow-violet)]">
										{"{{ params.id }}"} = "123"
									</code>
								</p>
							</SubSection>

							<SubSection title="Multiple Parameters">
								<p>
									Define path:{" "}
									<code className="text-[var(--glow-violet)]">
										/orgs/:orgId/users/:userId
									</code>
								</p>
								<p>
									Request:{" "}
									<code className="text-[var(--glow-violet)]">
										/orgs/acme/users/456
									</code>
								</p>
								<p>Extracted:</p>
								<ul className="list-disc list-inside ml-4">
									<li>
										<code className="text-[var(--glow-violet)]">
											{"{{ params.orgId }}"} = "acme"
										</code>
									</li>
									<li>
										<code className="text-[var(--glow-violet)]">
											{"{{ params.userId }}"} = "456"
										</code>
									</li>
								</ul>
							</SubSection>

							<SubSection title="Using in Static Responses">
								<p>
									Even with static JSON bodies, path parameters are interpolated
									using{" "}
									<code className="text-[var(--glow-violet)]">:param</code>{" "}
									syntax:
								</p>
								<CodeBlock>{`{
  "id": ":id",
  "message": "User :id retrieved successfully"
}`}</CodeBlock>
								<p className="mt-2">
									Request to <code>/users/123</code> returns:
								</p>
								<CodeBlock>{`{
  "id": "123",
  "message": "User 123 retrieved successfully"
}`}</CodeBlock>
							</SubSection>
						</Section>

						{/* Response Templates */}
						<Section id="response-templates" title="Response Templates">
							<p>
								Templates let you generate dynamic responses using request data.
								Switch the body type to "Template" to enable template syntax.
							</p>

							<SubSection title="Available Variables">
								<p>Access request data using double curly braces:</p>
								<ul className="list-disc list-inside space-y-2 ml-4">
									<li>
										<code className="text-[var(--glow-violet)]">
											{"{{ params.* }}"}
										</code>{" "}
										- Path parameters
									</li>
									<li>
										<code className="text-[var(--glow-violet)]">
											{"{{ query.* }}"}
										</code>{" "}
										- Query string parameters
									</li>
									<li>
										<code className="text-[var(--glow-violet)]">
											{"{{ headers.* }}"}
										</code>{" "}
										- Request headers
									</li>
									<li>
										<code className="text-[var(--glow-violet)]">
											{"{{ body.* }}"}
										</code>{" "}
										- Request body (for POST/PUT/PATCH)
									</li>
								</ul>
							</SubSection>

							<SubSection title="Template Example">
								<p>
									Endpoint:{" "}
									<code className="text-[var(--glow-violet)]">
										GET /users/:id
									</code>
								</p>
								<p>Template body:</p>
								<CodeBlock>{`{
  "id": "{{ params.id }}",
  "requestedBy": "{{ headers.x-user-id }}",
  "filter": "{{ query.filter }}",
  "timestamp": "{{ now }}"
}`}</CodeBlock>
								<p className="mt-2">
									Request:{" "}
									<code className="text-[var(--glow-violet)]">
										GET /users/123?filter=active
									</code>{" "}
									with header <code>X-User-Id: admin</code>
								</p>
								<p>Response:</p>
								<CodeBlock>{`{
  "id": "123",
  "requestedBy": "admin",
  "filter": "active",
  "timestamp": "2025-01-15T10:30:00.000Z"
}`}</CodeBlock>
							</SubSection>

							<SubSection title="Echo Request Body">
								<p>Echo back parts of the request body in POST/PUT requests:</p>
								<p>
									Endpoint:{" "}
									<code className="text-[var(--glow-violet)]">POST /users</code>
								</p>
								<p>Template body:</p>
								<CodeBlock>{`{
  "id": "usr_generated_123",
  "name": "{{ body.name }}",
  "email": "{{ body.email }}",
  "createdAt": "{{ now }}"
}`}</CodeBlock>
							</SubSection>
						</Section>

						{/* Chaos Engineering */}
						<Section id="chaos-engineering" title="Chaos Engineering">
							<p>
								Test how your application handles slow or failing APIs using
								built-in chaos engineering features.
							</p>

							<SubSection title="Simulated Delay">
								<p>
									Add artificial latency to responses. Set the delay in
									milliseconds (0-30000ms).
								</p>
								<ul className="list-disc list-inside space-y-1 ml-4">
									<li>
										<strong>0ms</strong> - No delay (default)
									</li>
									<li>
										<strong>100-500ms</strong> - Simulate typical API latency
									</li>
									<li>
										<strong>1000-5000ms</strong> - Test loading states and
										timeouts
									</li>
								</ul>
								<p className="mt-2">
									Use this to test loading spinners, skeleton screens, and
									timeout handling.
								</p>
							</SubSection>

							<SubSection title="Failure Rate">
								<p>
									Configure a percentage of requests to fail with a 500 error.
									Set fail rate between 0-100%.
								</p>
								<ul className="list-disc list-inside space-y-1 ml-4">
									<li>
										<strong>0%</strong> - All requests succeed (default)
									</li>
									<li>
										<strong>10-20%</strong> - Occasional failures for resilience
										testing
									</li>
									<li>
										<strong>50%</strong> - Heavy failure rate for stress testing
									</li>
									<li>
										<strong>100%</strong> - All requests fail
									</li>
								</ul>
								<p className="mt-2">When a request fails, it returns:</p>
								<CodeBlock>{`{
  "error": "simulated_failure",
  "message": "Random failure triggered"
}`}</CodeBlock>
							</SubSection>
						</Section>

						{/* OpenAPI Import */}
						<Section id="openapi-import" title="OpenAPI Import">
							<p>
								Import endpoints from OpenAPI (Swagger) specifications. Mocktail
								parses your spec and generates mock endpoints automatically.
							</p>

							<SubSection title="Supported Formats">
								<ul className="list-disc list-inside space-y-1 ml-4">
									<li>OpenAPI 3.0.x (JSON or YAML)</li>
									<li>OpenAPI 3.1.x (JSON or YAML)</li>
									<li>Swagger 2.0 (JSON or YAML)</li>
								</ul>
							</SubSection>

							<SubSection title="How to Import">
								<ol className="list-decimal list-inside space-y-2 ml-4">
									<li>Open your project and click "Import Spec"</li>
									<li>Paste your OpenAPI spec (JSON or YAML)</li>
									<li>Click "Import"</li>
									<li>Endpoints are created based on paths and methods</li>
								</ol>
							</SubSection>

							<SubSection title="Response Generation">
								<p>Mocktail generates mock responses from your spec:</p>
								<ul className="list-disc list-inside space-y-1 ml-4">
									<li>
										Uses <code>example</code> values from schemas when available
									</li>
									<li>
										Generates realistic data based on schema types and formats
									</li>
									<li>Respects required fields and default values</li>
								</ul>
							</SubSection>

							<SubSection title="Import Options">
								<ul className="list-disc list-inside space-y-1 ml-4">
									<li>
										<strong>Overwrite existing</strong> - Replace endpoints with
										matching method + path
									</li>
									<li>
										<strong>Skip duplicates</strong> - Keep existing endpoints,
										only add new ones
									</li>
								</ul>
							</SubSection>
						</Section>

						{/* Request Logs */}
						<Section id="request-logs" title="Request Logs">
							<p>
								Every request to your mock endpoints is logged. Use logs to
								debug integration issues and monitor usage.
							</p>

							<SubSection title="Logged Information">
								<ul className="list-disc list-inside space-y-1 ml-4">
									<li>Request method and path</li>
									<li>Request headers</li>
									<li>Request body (for POST/PUT/PATCH)</li>
									<li>Response status code</li>
									<li>Response body</li>
									<li>Response time (duration)</li>
									<li>Timestamp</li>
									<li>Matched endpoint (or "unmatched")</li>
								</ul>
							</SubSection>

							<SubSection title="Filtering Logs">
								<p>Filter logs by:</p>
								<ul className="list-disc list-inside space-y-1 ml-4">
									<li>HTTP method</li>
									<li>Status code</li>
									<li>Specific endpoint</li>
								</ul>
							</SubSection>

							<SubSection title="Unmatched Requests">
								<p>
									Requests that don't match any endpoint are logged with status
									404. Use this to identify missing endpoints or incorrect paths
									in your application.
								</p>
							</SubSection>
						</Section>

						{/* Rate Limits */}
						<Section id="rate-limits" title="Rate Limits & Quotas">
							<p>
								Rate limits and quotas depend on your plan tier. Limits are
								applied per organization (aggregate of all projects).
							</p>

							<div className="overflow-x-auto mt-4">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-[var(--border-subtle)]">
											<th className="text-left py-3 px-4 text-[var(--text-muted)]">
												Limit
											</th>
											<th className="text-left py-3 px-4 text-[var(--text-muted)]">
												Free
											</th>
											<th className="text-left py-3 px-4 text-[var(--text-muted)]">
												Pro
											</th>
											<th className="text-left py-3 px-4 text-[var(--text-muted)]">
												Enterprise
											</th>
										</tr>
									</thead>
									<tbody className="text-[var(--text-secondary)]">
										<tr className="border-b border-[var(--border-subtle)]">
											<td className="py-3 px-4">Projects</td>
											<td className="py-3 px-4">1</td>
											<td className="py-3 px-4">10</td>
											<td className="py-3 px-4">Unlimited</td>
										</tr>
										<tr className="border-b border-[var(--border-subtle)]">
											<td className="py-3 px-4">Endpoints per project</td>
											<td className="py-3 px-4">5</td>
											<td className="py-3 px-4">50</td>
											<td className="py-3 px-4">Unlimited</td>
										</tr>
										<tr className="border-b border-[var(--border-subtle)]">
											<td className="py-3 px-4">Monthly requests</td>
											<td className="py-3 px-4">10,000</td>
											<td className="py-3 px-4">500,000</td>
											<td className="py-3 px-4">Unlimited</td>
										</tr>
										<tr className="border-b border-[var(--border-subtle)]">
											<td className="py-3 px-4">Rate limit (req/sec)</td>
											<td className="py-3 px-4">10</td>
											<td className="py-3 px-4">100</td>
											<td className="py-3 px-4">1,000</td>
										</tr>
										<tr className="border-b border-[var(--border-subtle)]">
											<td className="py-3 px-4">Team members</td>
											<td className="py-3 px-4">2</td>
											<td className="py-3 px-4">10</td>
											<td className="py-3 px-4">Unlimited</td>
										</tr>
										<tr>
											<td className="py-3 px-4">Log retention</td>
											<td className="py-3 px-4">1 day</td>
											<td className="py-3 px-4">30 days</td>
											<td className="py-3 px-4">90 days</td>
										</tr>
									</tbody>
								</table>
							</div>

							<SubSection title="Rate Limit Headers">
								<p>Every response includes rate limit information:</p>
								<CodeBlock>{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200`}</CodeBlock>
							</SubSection>
						</Section>

						{/* Error Responses */}
						<Section id="error-responses" title="Error Responses">
							<p>
								Mocktail returns standard error responses for common issues:
							</p>

							<SubSection title="401 Unauthorized">
								<p>Missing or invalid API key.</p>
								<CodeBlock>{`{
  "error": "Unauthorized",
  "message": "No API key provided"
}`}</CodeBlock>
								<p className="mt-2">Or:</p>
								<CodeBlock>{`{
  "error": "Unauthorized",
  "message": "Invalid API key"
}`}</CodeBlock>
							</SubSection>

							<SubSection title="404 Not Found">
								<p>No endpoint matches the request method and path.</p>
								<CodeBlock>{`{
  "error": "not_found",
  "message": "No endpoint configured for GET /unknown/path"
}`}</CodeBlock>
							</SubSection>

							<SubSection title="429 Too Many Requests">
								<p>Rate limit exceeded.</p>
								<CodeBlock>{`{
  "error": "Too many requests",
  "message": "Rate limit exceeded"
}`}</CodeBlock>
								<p className="mt-2">Or monthly quota exceeded:</p>
								<CodeBlock>{`{
  "error": "Monthly request quota exceeded",
  "code": "QUOTA_EXCEEDED"
}`}</CodeBlock>
							</SubSection>

							<SubSection title="500 Simulated Failure">
								<p>
									When fail rate is configured and a request is randomly
									selected to fail:
								</p>
								<CodeBlock>{`{
  "error": "simulated_failure",
  "message": "Random failure triggered"
}`}</CodeBlock>
							</SubSection>
						</Section>

						{/* Footer */}
						<div className="border-t border-[var(--border-subtle)] pt-8 mt-16">
							<p className="text-[var(--text-muted)] text-sm">
								Need help?{" "}
								<a
									href="mailto:support@mocktail.dev"
									className="text-[var(--glow-violet)] hover:underline"
								>
									Contact support
								</a>
							</p>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}

import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

export default function DocsSdk() {
	return (
		<DocsLayout>
			<DocsHeader
				title="SDK"
				description="Programmatically manage your mocks with the TypeScript SDK."
			/>

			<p className="text-[var(--text-secondary)] mb-8">
				The Mocktail SDK lets you manage projects, endpoints, variants, and data
				buckets programmatically - perfect for CI/CD pipelines, test setup, and
				automation.
			</p>

			<Section title="Installation">
				<CodeBlock>{"npm install @mockspec/sdk"}</CodeBlock>
			</Section>

			<Section title="Quick Start">
				<CodeBlock>{`import { Mocktail } from '@mockspec/sdk'

const client = new Mocktail({
  apiKey: 'ms_org_xxx',  // Get from API Keys page
  baseUrl: 'https://api.mockspec.dev'  // optional
})

// List all projects
const projects = await client.projects.list()

// Create a new project
const project = await client.projects.create({
  name: 'My API',
  slug: 'my-api'
})

// Create an endpoint
const endpoint = await client.endpoints.create(project.id, {
  method: 'GET',
  path: '/users',
  status: 200,
  body: { users: [] }
})`}</CodeBlock>
			</Section>

			<Section title="Project-Scoped Client">
				<p className="mb-4">
					For convenience, use <code>client.project(id)</code> to get a
					project-scoped client:
				</p>
				<CodeBlock>{`const proj = client.project('proj-123')

// No need to pass projectId everywhere
const endpoints = await proj.endpoints.list()
const bucket = await proj.buckets.get('users')
const stats = await proj.stats.get()
await proj.logs.clear()`}</CodeBlock>
			</Section>

			<Section title="Resources">
				<div className="space-y-6">
					<div>
						<h4 className="font-semibold mb-2">Projects</h4>
						<CodeBlock>{`client.projects.list()
client.projects.get(id)
client.projects.create({ name, slug })
client.projects.update(id, { name })
client.projects.delete(id)
client.projects.rotateKey(id)
client.projects.resetState(id)`}</CodeBlock>
					</div>

					<div>
						<h4 className="font-semibold mb-2">Endpoints</h4>
						<CodeBlock>{`client.endpoints.list(projectId)
client.endpoints.get(projectId, endpointId)
client.endpoints.create(projectId, {
  method: 'GET',
  path: '/users',
  status: 200,
  body: { users: [] },
  bodyType: 'static',  // or 'template'
  delay: 0,
  failRate: 0
})
client.endpoints.update(projectId, endpointId, { status: 201 })
client.endpoints.delete(projectId, endpointId)`}</CodeBlock>
					</div>

					<div>
						<h4 className="font-semibold mb-2">Variants</h4>
						<CodeBlock>{`client.variants.list(projectId, endpointId)
client.variants.get(projectId, endpointId, variantId)
client.variants.create(projectId, endpointId, {
  name: 'Error case',
  status: 500,
  body: { error: 'Server error' },
  rules: [
    { target: 'header', key: 'X-Fail', operator: 'equals', value: 'true' }
  ]
})
client.variants.update(projectId, endpointId, variantId, { status: 503 })
client.variants.delete(projectId, endpointId, variantId)
client.variants.reorder(projectId, endpointId, [id1, id2, id3])`}</CodeBlock>
					</div>

					<div>
						<h4 className="font-semibold mb-2">Buckets (Stateful Data)</h4>
						<CodeBlock>{`client.buckets.list(projectId)
client.buckets.get(projectId, 'users')
client.buckets.create(projectId, { name: 'users', data: [] })
client.buckets.set(projectId, 'users', [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
])
client.buckets.delete(projectId, 'users')`}</CodeBlock>
					</div>

					<div>
						<h4 className="font-semibold mb-2">Logs</h4>
						<CodeBlock>{`const { logs, total } = await client.logs.list(projectId, {
  limit: 50,
  offset: 0,
  method: 'POST',
  status: 201
})

const log = await client.logs.get(projectId, logId)
const { deleted } = await client.logs.clear(projectId)`}</CodeBlock>
					</div>

					<div>
						<h4 className="font-semibold mb-2">Statistics</h4>
						<CodeBlock>{`const stats = await client.stats.get(projectId)
// { endpoints, unmatched, avgLatency }`}</CodeBlock>
					</div>

					<div>
						<h4 className="font-semibold mb-2">OpenAPI Import</h4>
						<CodeBlock>{`const result = await client.import.openapi(projectId, specString, {
  overwrite: false  // skip existing endpoints
})
// { created: 5, skipped: 2, endpoints: [...] }`}</CodeBlock>
					</div>
				</div>
			</Section>

			<Section title="Error Handling">
				<CodeBlock>{`import { Mocktail, MocktailError } from '@mockspec/sdk'

try {
  await client.projects.create({ name: '', slug: 'x' })
} catch (e) {
  if (e instanceof MocktailError) {
    console.log(e.code)    // 'VALIDATION_ERROR'
    console.log(e.status)  // 400
    console.log(e.fields)  // { name: 'Required' }
  }
}`}</CodeBlock>
			</Section>

			<Section title="Test Integration">
				<p className="mb-4">
					The SDK is perfect for setting up test fixtures in your test suite:
				</p>
				<CodeBlock>{`import { Mocktail } from '@mockspec/sdk'
import { beforeAll, afterAll, describe, it } from 'vitest'

const client = new Mocktail({ apiKey: process.env.MOCKSPEC_API_KEY! })
let projectId: string

beforeAll(async () => {
  const project = await client.projects.create({
    name: 'Test Suite',
    slug: \`test-\${Date.now()}\`
  })
  projectId = project.id

  await client.endpoints.create(projectId, {
    method: 'GET',
    path: '/users',
    body: [{ id: 1, name: 'Test User' }]
  })
})

afterAll(async () => {
  await client.projects.delete(projectId)
})

describe('my tests', () => {
  it('works with mocked API', async () => {
    // Your tests here
  })
})`}</CodeBlock>
			</Section>

			<Section title="API Keys">
				<p>
					Create an organization API key from the <strong>API Keys</strong> page
					in the dashboard. Org keys (<code>ms_org_xxx</code>) can manage all
					projects in your organization.
				</p>
				<p className="mt-4">
					For consuming mocks, use project API keys (<code>ms_proj_xxx</code>)
					which only authenticate requests to that specific project&apos;s
					endpoints.
				</p>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

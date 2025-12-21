import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

export default function DocsStatefulMocks() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Stateful Mocks"
				description="Simulate data persistence across requests with buckets and sequence responses."
			/>

			<Section title="Overview">
				<p className="mb-4">
					Stateful mocks let you test scenarios that require data persistence.
					Two main features:
				</p>
				<ul className="list-disc list-inside space-y-2 ml-4">
					<li>
						<strong>Data Buckets</strong> - In-memory JSON arrays that persist
						across requests
					</li>
					<li>
						<strong>Sequence Responses</strong> - Return different responses
						based on request count
					</li>
				</ul>
			</Section>

			<Section title="Quick Start">
				<p className="mb-4">Create a REST API with persistence in 3 steps:</p>

				<p className="font-semibold mb-2">1. Create a Bucket</p>
				<p className="mb-2">
					Go to <strong>Data</strong> tab → <strong>New Bucket</strong> → name
					it <code className="text-[var(--glow-violet)]">users</code>
				</p>
				<CodeBlock>{`[
  { "id": "1", "name": "Alice" },
  { "id": "2", "name": "Bob" }
]`}</CodeBlock>

				<p className="font-semibold mb-2 mt-6">2. Create Endpoints</p>
				<p className="mb-4">Create endpoints and link them to the bucket:</p>

				<div className="overflow-x-auto mb-4">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-[var(--border-subtle)]">
								<th className="text-left py-2 pr-4 text-[var(--text-muted)]">
									Endpoint
								</th>
								<th className="text-left py-2 pr-4 text-[var(--text-muted)]">
									Stateful
								</th>
								<th className="text-left py-2 text-[var(--text-muted)]">
									Operation
								</th>
							</tr>
						</thead>
						<tbody className="font-mono">
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-2 pr-4">
									<span className="text-emerald-400">GET</span> /users
								</td>
								<td className="py-2 pr-4">users</td>
								<td className="py-2 text-[var(--text-secondary)]">List all</td>
							</tr>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-2 pr-4">
									<span className="text-emerald-400">GET</span> /users/:id
								</td>
								<td className="py-2 pr-4">users</td>
								<td className="py-2 text-[var(--text-secondary)]">Get one</td>
							</tr>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-2 pr-4">
									<span className="text-amber-400">POST</span> /users
								</td>
								<td className="py-2 pr-4">users</td>
								<td className="py-2 text-[var(--text-secondary)]">
									Create (auto UUID)
								</td>
							</tr>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-2 pr-4">
									<span className="text-blue-400">PUT</span> /users/:id
								</td>
								<td className="py-2 pr-4">users</td>
								<td className="py-2 text-[var(--text-secondary)]">Update</td>
							</tr>
							<tr>
								<td className="py-2 pr-4">
									<span className="text-red-400">DELETE</span> /users/:id
								</td>
								<td className="py-2 pr-4">users</td>
								<td className="py-2 text-[var(--text-secondary)]">Remove</td>
							</tr>
						</tbody>
					</table>
				</div>

				<p className="text-sm text-[var(--text-muted)] mb-4">
					For each endpoint: enable <strong>Stateful</strong> toggle → select
					bucket → ID field auto-fills from path param.
				</p>

				<p className="font-semibold mb-2">3. Test It</p>
				<CodeBlock>{`# List users
curl -H "X-API-Key: YOUR_KEY" https://api.mockspec.dev/mock/users

# Create user
curl -X POST -H "X-API-Key: YOUR_KEY" \\
  -d '{"name": "Charlie"}' \\
  https://api.mockspec.dev/mock/users

# List again - Charlie is there
curl -H "X-API-Key: YOUR_KEY" https://api.mockspec.dev/mock/users`}</CodeBlock>
			</Section>

			<Section title="How It Works">
				<p className="mb-4">
					The endpoint&apos;s <strong>method</strong> and <strong>path</strong>{" "}
					determine the operation:
				</p>

				<ul className="list-disc list-inside space-y-2 ml-4 mb-4">
					<li>
						<strong>GET</strong> without ID param → returns all items
					</li>
					<li>
						<strong>GET</strong> with ID param → returns single item (404 if not
						found)
					</li>
					<li>
						<strong>POST</strong> → creates item, auto-generates UUID if no ID
						in body
					</li>
					<li>
						<strong>PUT</strong> with ID param → replaces item
					</li>
					<li>
						<strong>DELETE</strong> with ID param → removes item
					</li>
				</ul>

				<p className="text-sm text-[var(--text-muted)]">
					All endpoints linked to the same bucket share data. Changes are
					visible immediately.
				</p>
			</Section>

			<Section title="Template Helpers">
				<p className="mb-4">
					For non-stateful endpoints, access bucket data in response templates:
				</p>

				<div className="overflow-x-auto mb-4">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-[var(--border-subtle)]">
								<th className="text-left py-2 pr-4 text-[var(--text-muted)]">
									Helper
								</th>
								<th className="text-left py-2 text-[var(--text-muted)]">
									Returns
								</th>
							</tr>
						</thead>
						<tbody className="font-mono">
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-2 pr-4 text-[var(--glow-violet)]">{`{{ bucket 'users' }}`}</td>
								<td className="py-2 text-[var(--text-secondary)]">
									Full array
								</td>
							</tr>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-2 pr-4 text-[var(--glow-violet)]">{`{{ bucketLength 'users' }}`}</td>
								<td className="py-2 text-[var(--text-secondary)]">
									Item count
								</td>
							</tr>
							<tr>
								<td className="py-2 pr-4 text-[var(--glow-violet)]">{`{{ bucketItem 'users' 0 }}`}</td>
								<td className="py-2 text-[var(--text-secondary)]">
									Item by index (-1 for last)
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<CodeBlock>{`{
  "users": {{ bucket 'users' }},
  "count": {{ bucketLength 'users' }}
}`}</CodeBlock>
			</Section>

			<Section title="Sequence Responses">
				<p className="mb-4">
					Return different responses based on request count. Set{" "}
					<strong>Sequence Position</strong> on a variant.
				</p>

				<p className="font-semibold mb-2">Example: Test Retry Logic</p>
				<p className="mb-2">Create endpoint with three variants:</p>

				<div className="overflow-x-auto mb-4">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-[var(--border-subtle)]">
								<th className="text-left py-2 pr-4 text-[var(--text-muted)]">
									Variant
								</th>
								<th className="text-left py-2 pr-4 text-[var(--text-muted)]">
									Sequence
								</th>
								<th className="text-left py-2 pr-4 text-[var(--text-muted)]">
									Status
								</th>
								<th className="text-left py-2 text-[var(--text-muted)]">
									When
								</th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-2 pr-4">First Fail</td>
								<td className="py-2 pr-4 font-mono text-amber-400">#1</td>
								<td className="py-2 pr-4 font-mono text-red-400">500</td>
								<td className="py-2 text-[var(--text-secondary)]">
									1st request
								</td>
							</tr>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-2 pr-4">Second Fail</td>
								<td className="py-2 pr-4 font-mono text-amber-400">#2</td>
								<td className="py-2 pr-4 font-mono text-red-400">500</td>
								<td className="py-2 text-[var(--text-secondary)]">
									2nd request
								</td>
							</tr>
							<tr>
								<td className="py-2 pr-4">Success</td>
								<td className="py-2 pr-4 font-mono text-[var(--text-muted)]">
									-
								</td>
								<td className="py-2 pr-4 font-mono text-emerald-400">200</td>
								<td className="py-2 text-[var(--text-secondary)]">
									3rd+ requests
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<p className="text-sm text-[var(--text-muted)]">
					First two requests fail, third succeeds. Perfect for testing retry
					logic.
				</p>
			</Section>

			<Section title="Reset State">
				<p className="mb-4">
					Clear sequence counters and reset buckets to initial data:
				</p>

				<ul className="list-disc list-inside space-y-2 ml-4 mb-4">
					<li>
						<strong>UI:</strong> Settings tab → <strong>Reset State</strong>
					</li>
					<li>
						<strong>API:</strong>{" "}
						<code className="text-[var(--glow-violet)]">
							POST /projects/:id/state/reset
						</code>
					</li>
				</ul>

				<p className="text-sm text-[var(--text-muted)]">
					State is in-memory and resets on server restart.
				</p>
			</Section>

			<Section title="Limits">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-[var(--border-subtle)]">
								<th className="text-left py-2 pr-4 text-[var(--text-muted)]">
									Limit
								</th>
								<th className="text-left py-2 pr-4 text-[var(--text-muted)]">
									Free
								</th>
								<th className="text-left py-2 text-[var(--text-muted)]">Pro</th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-2 pr-4">Buckets per project</td>
								<td className="py-2 pr-4 font-mono">3</td>
								<td className="py-2 font-mono">20</td>
							</tr>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-2 pr-4">Max bucket size</td>
								<td className="py-2 pr-4 font-mono">100KB</td>
								<td className="py-2 font-mono">1MB</td>
							</tr>
							<tr>
								<td className="py-2 pr-4">Items per bucket</td>
								<td className="py-2 pr-4 font-mono">100</td>
								<td className="py-2 font-mono">1,000</td>
							</tr>
						</tbody>
					</table>
				</div>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

export default function DocsIntroduction() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Introduction"
				description="Everything you need to mock APIs and accelerate your frontend development."
			/>

			<Section title="What is Mockspec?">
				<p>
					Mockspec is a mock API server that lets you create realistic API
					endpoints without writing backend code. Define your endpoints,
					configure responses, and start building your frontend immediately.
				</p>
			</Section>

			<Section title="Key Features">
				<ul className="list-disc list-inside space-y-2 ml-4">
					<li>
						<strong>Project-based organization</strong> - Group endpoints by
						project with separate API keys
					</li>
					<li>
						<strong>Dynamic responses</strong> - Use templates to generate
						realistic data on each request
					</li>
					<li>
						<strong>Stateful mocks</strong> - Simulate CRUD persistence with data
						buckets and sequence responses
					</li>
					<li>
						<strong>Chaos engineering</strong> - Simulate delays and failures to
						test resilience
					</li>
					<li>
						<strong>OpenAPI import</strong> - Generate endpoints from your specs
						instantly
					</li>
					<li>
						<strong>Request logging</strong> - Debug and monitor all requests in
						real-time
					</li>
					<li>
						<strong>Team collaboration</strong> - Share projects with your team
					</li>
				</ul>
			</Section>

			<Section title="How It Works">
				<ol className="list-decimal list-inside space-y-3 ml-4">
					<li>
						<strong>Create a project</strong> - Each project gets a unique API
						key
					</li>
					<li>
						<strong>Define endpoints</strong> - Set up paths, methods, and
						response bodies
					</li>
					<li>
						<strong>Call your mock API</strong> - Use your API key to
						authenticate requests
					</li>
					<li>
						<strong>Debug with logs</strong> - View all requests and responses
						in the dashboard
					</li>
				</ol>
			</Section>

			<Section title="Example Request">
				<p>Once you&apos;ve created an endpoint, call it like any other API:</p>
				<CodeBlock>{`curl -X GET "https://api.mockspec.dev/mock/users" \\
  -H "X-API-Key: mk_your_api_key"`}</CodeBlock>
			</Section>

			<Section title="Plans & Limits">
				<p className="mb-4">
					Mockspec offers a generous free tier for individuals and a Pro plan for teams with advanced features.
				</p>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
						<h4 className="font-semibold mb-2">Free</h4>
						<ul className="text-sm text-[var(--text-secondary)] space-y-1">
							<li>1 project</li>
							<li>5 endpoints per project</li>
							<li>1,000 requests/month</li>
							<li>1 team member</li>
							<li>1 day log retention</li>
						</ul>
					</div>
					<div className="bg-[var(--bg-surface)] border border-[var(--glow-violet)]/30 rounded-xl p-4">
						<h4 className="font-semibold mb-2 text-[var(--glow-violet)]">Pro</h4>
						<ul className="text-sm text-[var(--text-secondary)] space-y-1">
							<li>10 projects</li>
							<li>50 endpoints per project</li>
							<li>100,000 requests/month</li>
							<li>10 team members</li>
							<li>30 day log retention</li>
							<li><strong>Proxy mode</strong></li>
							<li><strong>Stateful mocks (CRUD)</strong></li>
						</ul>
					</div>
				</div>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

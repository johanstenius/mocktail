import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

export default function DocsAuthentication() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Authentication"
				description="Authenticate requests to your mock endpoints using API keys."
			/>

			<Section title="API Key Types">
				<p className="mb-4">Mockspec uses two types of API keys:</p>
				<div className="space-y-4">
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
						<h4 className="font-semibold mb-1">
							Project Keys{" "}
							<code className="text-[var(--glow-violet)]">ms_proj_xxx</code>
						</h4>
						<p className="text-sm text-[var(--text-muted)]">
							For consuming mock endpoints. Each project has a default key, and
							you can create additional keys for different environments (dev,
							staging, CI).
						</p>
					</div>
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
						<h4 className="font-semibold mb-1">
							Org Keys{" "}
							<code className="text-[var(--glow-violet)]">ms_org_xxx</code>
						</h4>
						<p className="text-sm text-[var(--text-muted)]">
							For programmatic management via the SDK. Create, update, and
							delete projects, endpoints, and more. Manage org keys from the{" "}
							<strong>API Keys</strong> page in the dashboard.
						</p>
					</div>
				</div>
			</Section>

			<Section title="X-API-Key Header (Recommended)">
				<CodeBlock>{`curl -X GET "https://api.mockspec.dev/mock/users" \\
  -H "X-API-Key: ms_proj_xxx"`}</CodeBlock>

				<p className="mt-4 mb-2">TypeScript:</p>
				<CodeBlock>{`fetch("https://api.mockspec.dev/mock/users", {
  headers: { "X-API-Key": "ms_proj_xxx" }
});`}</CodeBlock>
			</Section>

			<Section title="Bearer Token">
				<CodeBlock>{`curl -X GET "https://api.mockspec.dev/mock/users" \\
  -H "Authorization: Bearer ms_proj_xxx"`}</CodeBlock>

				<p className="mt-4 mb-2">TypeScript:</p>
				<CodeBlock>{`fetch("https://api.mockspec.dev/mock/users", {
  headers: { "Authorization": "Bearer ms_proj_xxx" }
});`}</CodeBlock>
			</Section>

			<Section title="Basic Auth">
				<p className="mb-2">
					Use your API key as the username (password can be empty):
				</p>
				<CodeBlock>{`curl -X GET "https://api.mockspec.dev/mock/users" \\
  -H "Authorization: Basic $(echo -n 'ms_proj_xxx:' | base64)"`}</CodeBlock>

				<p className="mt-4 mb-2">TypeScript:</p>
				<CodeBlock>{`const apiKey = "ms_proj_xxx";
const encoded = btoa(\`\${apiKey}:\`);

fetch("https://api.mockspec.dev/mock/users", {
  headers: { "Authorization": \`Basic \${encoded}\` }
});`}</CodeBlock>
			</Section>

			<Section title="Managing API Keys">
				<ul className="list-disc list-inside space-y-2 ml-4">
					<li>
						<strong>Project keys:</strong> Found in project settings. Create
						additional keys for different environments.
					</li>
					<li>
						<strong>Org keys:</strong> Manage from the <strong>API Keys</strong>{" "}
						page in the dashboard sidebar.
					</li>
					<li>
						<strong>Rotation:</strong> Rotate any key instantly. The old key is
						invalidated immediately.
					</li>
				</ul>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

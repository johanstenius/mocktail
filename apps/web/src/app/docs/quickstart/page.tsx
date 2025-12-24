import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

export default function DocsQuickstart() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Quick Start"
				description="Get your first mock endpoint running in under 2 minutes."
			/>

			<Section title="1. Create a Project">
				<p>
					Sign up and create a new project. Each project gets a unique API key
					that you&apos;ll use to authenticate requests.
				</p>
			</Section>

			<Section title="2. Create an Endpoint">
				<p>Add an endpoint with a method, path, and response body:</p>
				<ul className="list-disc list-inside space-y-1 ml-4 mb-4">
					<li>
						Method: <code className="text-[var(--glow-violet)]">GET</code>
					</li>
					<li>
						Path: <code className="text-[var(--glow-violet)]">/users</code>
					</li>
					<li>Status: 200</li>
				</ul>
				<p className="mb-2">Response body:</p>
				<CodeBlock>{`{
  "users": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ]
}`}</CodeBlock>
			</Section>

			<Section title="3. Make a Request">
				<p className="mb-2">
					Copy your project API key from settings and make a request:
				</p>

				<p className="text-sm text-[var(--text-muted)] mb-2">curl:</p>
				<CodeBlock>{`curl -X GET "https://api.mockspec.dev/mock/users" \\
  -H "X-API-Key: ms_proj_xxx"`}</CodeBlock>

				<p className="text-sm text-[var(--text-muted)] mb-2 mt-4">
					TypeScript:
				</p>
				<CodeBlock>{`const response = await fetch("https://api.mockspec.dev/mock/users", {
  headers: { "X-API-Key": "ms_proj_xxx" }
});

const data = await response.json();
console.log(data.users);`}</CodeBlock>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

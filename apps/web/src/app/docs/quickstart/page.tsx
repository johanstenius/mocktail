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
					Copy your API key from the project settings and make a request:
				</p>

				<p className="text-sm text-[var(--text-muted)] mb-2">curl:</p>
				<CodeBlock>{`curl -X GET "https://api.mockspec.dev/mock/users" \\
  -H "X-API-Key: mk_your_api_key_here"`}</CodeBlock>

				<p className="text-sm text-[var(--text-muted)] mb-2 mt-4">
					TypeScript:
				</p>
				<CodeBlock>{`const response = await fetch("https://api.mockspec.dev/mock/users", {
  headers: { "X-API-Key": "mk_your_api_key_here" }
});

const data = await response.json();
console.log(data.users);`}</CodeBlock>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

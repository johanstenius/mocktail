import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/authentication")({
	component: DocsAuthentication,
});

function DocsAuthentication() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Authentication"
				description="Authenticate requests to your mock endpoints using API keys."
			/>

			<p className="text-[var(--text-secondary)] mb-8">
				Every request to your mock endpoints must include your project's API
				key. Mocktail supports three authentication methods:
			</p>

			<Section title="X-API-Key Header (Recommended)">
				<CodeBlock>{`curl -X GET "https://api.mocktail.dev/mock/users" \\
  -H "X-API-Key: mk_your_api_key_here"`}</CodeBlock>

				<p className="mt-4 mb-2">TypeScript:</p>
				<CodeBlock>{`fetch("https://api.mocktail.dev/mock/users", {
  headers: { "X-API-Key": "mk_your_api_key_here" }
});`}</CodeBlock>
			</Section>

			<Section title="Bearer Token">
				<CodeBlock>{`curl -X GET "https://api.mocktail.dev/mock/users" \\
  -H "Authorization: Bearer mk_your_api_key_here"`}</CodeBlock>

				<p className="mt-4 mb-2">TypeScript:</p>
				<CodeBlock>{`fetch("https://api.mocktail.dev/mock/users", {
  headers: { "Authorization": "Bearer mk_your_api_key_here" }
});`}</CodeBlock>
			</Section>

			<Section title="Basic Auth">
				<p className="mb-2">
					Use your API key as the username (password can be empty):
				</p>
				<CodeBlock>{`curl -X GET "https://api.mocktail.dev/mock/users" \\
  -H "Authorization: Basic $(echo -n 'mk_your_api_key_here:' | base64)"`}</CodeBlock>

				<p className="mt-4 mb-2">TypeScript:</p>
				<CodeBlock>{`const apiKey = "mk_your_api_key_here";
const encoded = btoa(\`\${apiKey}:\`);

fetch("https://api.mocktail.dev/mock/users", {
  headers: { "Authorization": \`Basic \${encoded}\` }
});`}</CodeBlock>
			</Section>

			<Section title="Rotating API Keys">
				<p>
					You can rotate your API key at any time from project settings. The old
					key is invalidated immediately - update your applications with the new
					key.
				</p>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

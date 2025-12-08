import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

export default function DocsEndpoints() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Endpoints"
				description="Define mock responses for your API endpoints."
			/>

			<Section title="Endpoint Properties">
				<ul className="list-disc list-inside space-y-2 ml-4">
					<li>
						<strong>Method</strong> - GET, POST, PUT, PATCH, or DELETE
					</li>
					<li>
						<strong>Path</strong> - URL path (e.g., /users, /orders/:id)
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
						<strong>Fail Rate</strong> - Percentage of requests that return 500
					</li>
				</ul>
			</Section>

			<Section title="Path Parameters">
				<p className="mb-4">
					Use colon syntax for dynamic segments. Parameters are extracted
					automatically.
				</p>
				<p>
					Path: <code className="text-[var(--glow-violet)]">/users/:id</code>
					<br />
					Request: <code className="text-[var(--glow-violet)]">/users/123</code>
					<br />
					Result:{" "}
					<code className="text-[var(--glow-violet)]">params.id = &quot;123&quot;</code>
				</p>

				<p className="mt-4 mb-2">Use in response body with :param syntax:</p>
				<CodeBlock>{`{
  "id": ":id",
  "message": "User :id retrieved"
}`}</CodeBlock>
			</Section>

			<Section title="Response Headers">
				<p className="mb-2">Add custom headers as JSON:</p>
				<CodeBlock>{`{
  "X-Custom-Header": "value",
  "Cache-Control": "no-cache"
}`}</CodeBlock>
			</Section>

			<Section title="Response Body">
				<p className="mb-2">Static JSON or dynamic template:</p>
				<CodeBlock>{`{
  "id": 123,
  "name": "Product Name",
  "price": 29.99
}`}</CodeBlock>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

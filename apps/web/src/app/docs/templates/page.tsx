import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

export default function DocsTemplates() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Response Templates"
				description="Generate dynamic responses using request data and fake data helpers."
			/>

			<Section title="Template Syntax">
				<p className="mb-4">
					Templates use double curly braces. They&apos;re auto-detected when
					your response contains{" "}
					<code className="text-[var(--glow-violet)]">{"{{"}</code> syntax.
				</p>

				<p className="font-semibold mb-2">Available variables:</p>
				<ul className="list-disc list-inside space-y-1 ml-4">
					<li>
						<code className="text-[var(--glow-violet)]">
							{"{{ request.params.* }}"}
						</code>{" "}
						- Path parameters
					</li>
					<li>
						<code className="text-[var(--glow-violet)]">
							{"{{ request.query.* }}"}
						</code>{" "}
						- Query string
					</li>
					<li>
						<code className="text-[var(--glow-violet)]">
							{"{{ request.headers.* }}"}
						</code>{" "}
						- Request headers
					</li>
					<li>
						<code className="text-[var(--glow-violet)]">
							{"{{ request.body.* }}"}
						</code>{" "}
						- Request body
					</li>
				</ul>
			</Section>

			<Section title="Example">
				<p className="mb-2">
					Endpoint:{" "}
					<code className="text-[var(--glow-violet)]">GET /users/:id</code>
				</p>
				<CodeBlock>{`{
  "id": "{{ request.params.id }}",
  "filter": "{{ request.query.filter }}"
}`}</CodeBlock>
			</Section>

			<Section title="Fake Data Helpers">
				<p className="mb-4">Generate realistic data on each request:</p>

				<p className="font-semibold mb-2">Identity</p>
				<ul className="list-disc list-inside space-y-1 ml-4 mb-4">
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ uuid }}"}</code> -
						UUID v4
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ name }}"}</code> -
						Full name
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ firstName }}"}</code>
						,{" "}
						<code className="text-[var(--glow-pink)]">{"{{ lastName }}"}</code>
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ email }}"}</code> -
						Email address
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ username }}"}</code>{" "}
						- Username
					</li>
				</ul>

				<p className="font-semibold mb-2">Numbers</p>
				<ul className="list-disc list-inside space-y-1 ml-4 mb-4">
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ int }}"}</code>,{" "}
						<code className="text-[var(--glow-pink)]">{"{{ int 100 }}"}</code> -
						Random integer (optional max)
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ float }}"}</code>,{" "}
						<code className="text-[var(--glow-pink)]">{"{{ float 100 2 }}"}</code>{" "}
						- Float (optional max, precision)
					</li>
				</ul>

				<p className="font-semibold mb-2">Date & Time</p>
				<ul className="list-disc list-inside space-y-1 ml-4 mb-4">
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ now }}"}</code> -
						Current ISO timestamp
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ past }}"}</code>,{" "}
						<code className="text-[var(--glow-pink)]">{"{{ future }}"}</code>,{" "}
						<code className="text-[var(--glow-pink)]">{"{{ recent }}"}</code>
					</li>
				</ul>

				<p className="font-semibold mb-2">Content</p>
				<ul className="list-disc list-inside space-y-1 ml-4 mb-4">
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ sentence }}"}</code>,{" "}
						<code className="text-[var(--glow-pink)]">{"{{ paragraph }}"}</code>
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">{"{{ url }}"}</code>,{" "}
						<code className="text-[var(--glow-pink)]">{"{{ imageUrl }}"}</code>
					</li>
				</ul>
			</Section>

			<Section title="Full Example">
				<CodeBlock>{`{
  "id": "{{ uuid }}",
  "name": "{{ name }}",
  "email": "{{ email }}",
  "createdAt": "{{ past }}"
}`}</CodeBlock>
				<p className="mt-2 mb-2">Returns:</p>
				<CodeBlock>{`{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Sarah Johnson",
  "email": "sarah.johnson@example.com",
  "createdAt": "2024-08-15T14:32:00.000Z"
}`}</CodeBlock>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

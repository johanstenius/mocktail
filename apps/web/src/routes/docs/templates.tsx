import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/templates")({
	component: DocsTemplates,
});

function DocsTemplates() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Response Templates"
				description="Generate dynamic responses using request data and fake data helpers."
			/>

			<Section title="Template Syntax">
				<p className="mb-4">
					Templates use double curly braces. They're auto-detected when your
					response contains{" "}
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

				<p className="font-semibold mb-2">Person</p>
				<ul className="list-disc list-inside space-y-1 ml-4 mb-4">
					<li>
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_person_fullName }}"}
						</code>{" "}
						- "John Smith"
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_person_firstName }}"}
						</code>
						,{" "}
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_person_lastName }}"}
						</code>
					</li>
				</ul>

				<p className="font-semibold mb-2">Internet</p>
				<ul className="list-disc list-inside space-y-1 ml-4 mb-4">
					<li>
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_internet_email }}"}
						</code>{" "}
						- Email address
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_internet_username }}"}
						</code>
						,{" "}
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_internet_url }}"}
						</code>
					</li>
				</ul>

				<p className="font-semibold mb-2">String & Number</p>
				<ul className="list-disc list-inside space-y-1 ml-4 mb-4">
					<li>
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_string_uuid }}"}
						</code>{" "}
						- UUID v4
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_number_int }}"}
						</code>
						,{" "}
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_number_float }}"}
						</code>
					</li>
				</ul>

				<p className="font-semibold mb-2">Date & Text</p>
				<ul className="list-disc list-inside space-y-1 ml-4 mb-4">
					<li>
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_date_past }}"}
						</code>
						,{" "}
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_date_future }}"}
						</code>
						,{" "}
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_date_recent }}"}
						</code>
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_lorem_sentence }}"}
						</code>
						,{" "}
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_lorem_paragraph }}"}
						</code>
					</li>
					<li>
						<code className="text-[var(--glow-pink)]">
							{"{{ faker_image_url }}"}
						</code>
					</li>
				</ul>
			</Section>

			<Section title="Full Example">
				<CodeBlock>{`{
  "id": "{{ faker_string_uuid }}",
  "name": "{{ faker_person_fullName }}",
  "email": "{{ faker_internet_email }}",
  "createdAt": "{{ faker_date_past }}"
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

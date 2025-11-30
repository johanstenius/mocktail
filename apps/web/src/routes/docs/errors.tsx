import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/errors")({
	component: DocsErrors,
});

function DocsErrors() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Error Responses"
				description="Standard error responses returned by Mocktail."
			/>

			<Section title="401 Unauthorized">
				<p className="mb-2">Missing or invalid API key.</p>
				<CodeBlock>{`{
  "error": "Unauthorized",
  "message": "No API key provided"
}`}</CodeBlock>
				<p className="mt-4 mb-2">Or:</p>
				<CodeBlock>{`{
  "error": "Unauthorized",
  "message": "Invalid API key"
}`}</CodeBlock>
			</Section>

			<Section title="404 Not Found">
				<p className="mb-2">No endpoint matches the request.</p>
				<CodeBlock>{`{
  "error": "not_found",
  "message": "No endpoint configured for GET /unknown/path"
}`}</CodeBlock>
			</Section>

			<Section title="429 Too Many Requests">
				<p className="mb-2">Rate limit exceeded.</p>
				<CodeBlock>{`{
  "error": "Too many requests",
  "message": "Rate limit exceeded"
}`}</CodeBlock>
				<p className="mt-4 mb-2">Or monthly quota exceeded:</p>
				<CodeBlock>{`{
  "error": "Monthly request quota exceeded",
  "code": "QUOTA_EXCEEDED"
}`}</CodeBlock>
			</Section>

			<Section title="500 Simulated Failure">
				<p className="mb-2">When fail rate triggers a random failure:</p>
				<CodeBlock>{`{
  "error": "simulated_failure",
  "message": "Random failure triggered"
}`}</CodeBlock>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

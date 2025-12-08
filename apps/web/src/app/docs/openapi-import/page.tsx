import {
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

export default function DocsOpenAPIImport() {
	return (
		<DocsLayout>
			<DocsHeader
				title="OpenAPI Import"
				description="Generate mock endpoints from your OpenAPI specs instantly."
			/>

			<Section title="Supported Formats">
				<ul className="list-disc list-inside space-y-1 ml-4">
					<li>OpenAPI 3.0.x (JSON or YAML)</li>
					<li>OpenAPI 3.1.x (JSON or YAML)</li>
					<li>Swagger 2.0 (JSON or YAML)</li>
				</ul>
			</Section>

			<Section title="How to Import">
				<ol className="list-decimal list-inside space-y-2 ml-4">
					<li>Open your project and click &quot;Import Spec&quot;</li>
					<li>Paste your OpenAPI spec (JSON or YAML)</li>
					<li>Click &quot;Import&quot;</li>
					<li>Endpoints are created based on paths and methods</li>
				</ol>
			</Section>

			<Section title="Response Generation">
				<p className="mb-2">
					Mockspec generates mock responses from your spec:
				</p>
				<ul className="list-disc list-inside space-y-1 ml-4">
					<li>
						Uses <code>example</code> values from schemas when available
					</li>
					<li>Generates realistic data based on schema types and formats</li>
					<li>Respects required fields and default values</li>
				</ul>
			</Section>

			<Section title="Import Options">
				<ul className="list-disc list-inside space-y-1 ml-4">
					<li>
						<strong>Overwrite existing</strong> - Replace endpoints with
						matching method + path
					</li>
					<li>
						<strong>Skip duplicates</strong> - Keep existing endpoints, only add
						new ones
					</li>
				</ul>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

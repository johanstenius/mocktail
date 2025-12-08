import {
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

export default function DocsRequestLogs() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Request Logs"
				description="Debug and monitor all requests to your mock endpoints."
			/>

			<Section title="Logged Information">
				<p className="mb-2">Every request is logged with:</p>
				<ul className="list-disc list-inside space-y-1 ml-4">
					<li>Request method and path</li>
					<li>Request headers and body</li>
					<li>Response status code and body</li>
					<li>Response time (duration)</li>
					<li>Timestamp</li>
					<li>Matched endpoint (or &quot;unmatched&quot;)</li>
				</ul>
			</Section>

			<Section title="Filtering">
				<p className="mb-2">Filter logs by:</p>
				<ul className="list-disc list-inside space-y-1 ml-4">
					<li>HTTP method</li>
					<li>Status code</li>
					<li>Specific endpoint</li>
				</ul>
			</Section>

			<Section title="Unmatched Requests">
				<p>
					Requests that don&apos;t match any endpoint are logged with status 404. Use
					this to identify missing endpoints or incorrect paths in your
					application.
				</p>
			</Section>

			<Section title="Retention">
				<p>Log retention depends on your plan:</p>
				<ul className="list-disc list-inside space-y-1 ml-4 mt-2">
					<li>
						<strong>Free</strong> - 3 days
					</li>
					<li>
						<strong>Pro</strong> - 30 days
					</li>
				</ul>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

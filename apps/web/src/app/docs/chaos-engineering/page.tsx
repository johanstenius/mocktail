import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";

export default function DocsChaosEngineering() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Chaos Engineering"
				description="Test how your application handles slow or failing APIs."
			/>

			<Section title="Simulated Delay">
				<p className="mb-4">
					Add artificial latency to responses. Set delay in milliseconds
					(0-30000ms).
				</p>
				<ul className="list-disc list-inside space-y-1 ml-4">
					<li>
						<strong>0ms</strong> - No delay (default)
					</li>
					<li>
						<strong>100-500ms</strong> - Typical API latency
					</li>
					<li>
						<strong>1000-5000ms</strong> - Test loading states and timeouts
					</li>
				</ul>
				<p className="mt-4">
					Use this to test loading spinners, skeleton screens, and timeout
					handling.
				</p>
			</Section>

			<Section title="Failure Rate">
				<p className="mb-4">
					Configure a percentage of requests to fail with 500 error (0-100%).
				</p>
				<ul className="list-disc list-inside space-y-1 ml-4">
					<li>
						<strong>0%</strong> - All succeed (default)
					</li>
					<li>
						<strong>10-20%</strong> - Occasional failures for resilience testing
					</li>
					<li>
						<strong>50%</strong> - Heavy failure rate for stress testing
					</li>
					<li>
						<strong>100%</strong> - All requests fail
					</li>
				</ul>

				<p className="mt-4 mb-2">When a request fails:</p>
				<CodeBlock>{`{
  "error": "simulated_failure",
  "message": "Random failure triggered"
}`}</CodeBlock>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

import {
	CodeBlock,
	DocsFooter,
	DocsHeader,
	DocsLayout,
	Section,
} from "@/components/docs-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/rate-limits")({
	component: DocsRateLimits,
});

function DocsRateLimits() {
	return (
		<DocsLayout>
			<DocsHeader
				title="Rate Limits & Quotas"
				description="Understand the limits for each plan tier."
			/>

			<Section title="Plan Limits">
				<p className="mb-4">
					Limits are applied per organization (aggregate of all projects).
				</p>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-[var(--border-subtle)]">
								<th className="text-left py-3 px-4 text-[var(--text-muted)]">
									Limit
								</th>
								<th className="text-left py-3 px-4 text-[var(--text-muted)]">
									Free
								</th>
								<th className="text-left py-3 px-4 text-[var(--text-muted)]">
									Pro
								</th>
							</tr>
						</thead>
						<tbody className="text-[var(--text-secondary)]">
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-3 px-4">Projects</td>
								<td className="py-3 px-4">3</td>
								<td className="py-3 px-4">10</td>
							</tr>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-3 px-4">Endpoints/project</td>
								<td className="py-3 px-4">10</td>
								<td className="py-3 px-4">50</td>
							</tr>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-3 px-4">Monthly requests</td>
								<td className="py-3 px-4">5,000</td>
								<td className="py-3 px-4">100,000</td>
							</tr>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-3 px-4">Rate limit (req/sec)</td>
								<td className="py-3 px-4">5</td>
								<td className="py-3 px-4">50</td>
							</tr>
							<tr className="border-b border-[var(--border-subtle)]">
								<td className="py-3 px-4">Team members</td>
								<td className="py-3 px-4">3</td>
								<td className="py-3 px-4">10</td>
							</tr>
							<tr>
								<td className="py-3 px-4">Log retention</td>
								<td className="py-3 px-4">3 days</td>
								<td className="py-3 px-4">30 days</td>
							</tr>
						</tbody>
					</table>
				</div>
			</Section>

			<Section title="Rate Limit Headers">
				<p className="mb-2">Every response includes rate limit info:</p>
				<CodeBlock>{`X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200`}</CodeBlock>
			</Section>

			<DocsFooter />
		</DocsLayout>
	);
}

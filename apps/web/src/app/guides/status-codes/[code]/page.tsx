import {
	CodeBlock,
	GuidesFooter,
	GuidesLayout,
	GuidesSection,
} from "@/components/guides-layout";
import { getAllStatusCodes, getStatusCode } from "@/data/seo/http-reference";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
	params: Promise<{ code: string }>;
};

export async function generateStaticParams() {
	return getAllStatusCodes().map((code) => ({ code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { code } = await params;
	const statusCode = getStatusCode(code);
	if (!statusCode) return {};

	return {
		title: `HTTP ${statusCode.title} - Mock & Test | Mockspec`,
		description: statusCode.metaDescription,
		openGraph: {
			title: `HTTP ${statusCode.title} - Mock & Test | Mockspec`,
			description: statusCode.metaDescription,
		},
	};
}

function getCategoryBadge(category: string): { label: string; color: string } {
	switch (category) {
		case "success":
			return { label: "Success", color: "text-green-400 border-green-400/30" };
		case "client-error":
			return {
				label: "Client Error",
				color: "text-yellow-400 border-yellow-400/30",
			};
		case "server-error":
			return { label: "Server Error", color: "text-red-400 border-red-400/30" };
		default:
			return { label: category, color: "text-gray-400 border-gray-400/30" };
	}
}

export default async function StatusCodePage({ params }: Props) {
	const { code } = await params;
	const statusCode = getStatusCode(code);

	if (!statusCode) {
		notFound();
	}

	const badge = getCategoryBadge(statusCode.category);

	return (
		<GuidesLayout>
			<div className="mb-12">
				<div className="flex items-center gap-3 mb-4">
					<h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
						{statusCode.title}
					</h1>
					<span
						className={`px-2 py-0.5 text-xs font-medium rounded-full border ${badge.color}`}
					>
						{badge.label}
					</span>
				</div>
				<p className="text-lg text-[var(--text-secondary)]">
					{statusCode.description}
				</p>
			</div>

			<GuidesSection title="When to Use">
				<ul className="list-disc list-inside space-y-2 ml-4">
					{statusCode.whenToUse.map((use) => (
						<li key={use}>{use}</li>
					))}
				</ul>
			</GuidesSection>

			<GuidesSection title="Mock Example">
				<p className="mb-4">
					Create a mock endpoint in Mockspec that returns this status code:
				</p>
				<CodeBlock>{statusCode.mockExample}</CodeBlock>
			</GuidesSection>

			<GuidesSection title="Testing Tips">
				<ul className="list-disc list-inside space-y-2 ml-4">
					<li>
						Use Mockspec&apos;s chaos engineering to randomly return{" "}
						{statusCode.code} responses
					</li>
					<li>Test your error handling and retry logic</li>
					<li>Verify user-facing error messages are helpful</li>
					<li>Check that logging captures relevant details</li>
				</ul>
			</GuidesSection>

			<GuidesFooter />
		</GuidesLayout>
	);
}

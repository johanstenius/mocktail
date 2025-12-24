import {
	CodeBlock,
	GuidesFooter,
	GuidesHeader,
	GuidesLayout,
	GuidesSection,
} from "@/components/guides-layout";
import { getAllUseCaseSlugs, getUseCase } from "@/data/seo/use-cases";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
	return getAllUseCaseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const useCase = getUseCase(slug);
	if (!useCase) return {};

	return {
		title: `${useCase.title} | Mockspec`,
		description: useCase.metaDescription,
		openGraph: {
			title: `${useCase.title} | Mockspec`,
			description: useCase.metaDescription,
		},
	};
}

function featureToPath(feature: string): string {
	const mapping: Record<string, string> = {
		"Response Templates": "/docs/templates",
		"Request Logs": "/docs/request-logs",
		"Chaos Engineering": "/docs/chaos-engineering",
		"Stateful Mocks": "/docs/stateful-mocks",
		"Rate Limits": "/docs/rate-limits",
		Endpoints: "/docs/endpoints",
		"OpenAPI Import": "/docs/openapi-import",
	};
	return mapping[feature] || "/docs";
}

export default async function UseCasePage({ params }: Props) {
	const { slug } = await params;
	const useCase = getUseCase(slug);

	if (!useCase) {
		notFound();
	}

	return (
		<GuidesLayout>
			<GuidesHeader title={useCase.title} description={useCase.description} />

			<GuidesSection title="The Problem">
				<p>{useCase.problem}</p>
			</GuidesSection>

			<GuidesSection title="The Solution">
				<p>{useCase.solution}</p>
			</GuidesSection>

			<GuidesSection title="Benefits">
				<ul className="list-disc list-inside space-y-2 ml-4">
					{useCase.benefits.map((benefit) => (
						<li key={benefit}>{benefit}</li>
					))}
				</ul>
			</GuidesSection>

			<GuidesSection title="Example">
				<CodeBlock>{useCase.exampleCode}</CodeBlock>
			</GuidesSection>

			<GuidesSection title="Related Features">
				<div className="flex flex-wrap gap-2">
					{useCase.relatedFeatures.map((feature) => (
						<Link
							key={feature}
							href={featureToPath(feature)}
							className="px-3 py-1 text-sm rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition-colors"
						>
							{feature}
						</Link>
					))}
				</div>
			</GuidesSection>

			<GuidesFooter />
		</GuidesLayout>
	);
}

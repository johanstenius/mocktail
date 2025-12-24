import {
	CodeBlock,
	GuidesFooter,
	GuidesHeader,
	GuidesLayout,
	GuidesSection,
} from "@/components/guides-layout";
import {
	getAllIntegrationSlugs,
	getIntegration,
} from "@/data/seo/integrations";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
	return getAllIntegrationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const integration = getIntegration(slug);
	if (!integration) return {};

	return {
		title: `${integration.title} API Mocking | Mockspec`,
		description: integration.metaDescription,
		openGraph: {
			title: `${integration.title} API Mocking | Mockspec`,
			description: integration.metaDescription,
		},
	};
}

export default async function IntegrationPage({ params }: Props) {
	const { slug } = await params;
	const integration = getIntegration(slug);

	if (!integration) {
		notFound();
	}

	return (
		<GuidesLayout>
			<GuidesHeader
				title={`${integration.title} Integration`}
				description={integration.description}
			/>

			<GuidesSection title="Quick Start">
				<ol className="list-decimal list-inside space-y-2 ml-4">
					{integration.setupSteps.map((step) => (
						<li key={step}>{step}</li>
					))}
				</ol>
			</GuidesSection>

			<GuidesSection title="Installation">
				<CodeBlock>{integration.installCommand}</CodeBlock>
			</GuidesSection>

			<GuidesSection title="Example Code">
				<CodeBlock>{integration.exampleCode}</CodeBlock>
			</GuidesSection>

			<GuidesSection title="Features">
				<ul className="list-disc list-inside space-y-2 ml-4">
					{integration.features.map((feature) => (
						<li key={feature}>{feature}</li>
					))}
				</ul>
			</GuidesSection>

			<GuidesFooter />
		</GuidesLayout>
	);
}

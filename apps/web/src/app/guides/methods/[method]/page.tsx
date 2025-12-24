import {
	CodeBlock,
	GuidesFooter,
	GuidesHeader,
	GuidesLayout,
	GuidesSection,
} from "@/components/guides-layout";
import { getAllHttpMethods, getHttpMethod } from "@/data/seo/http-reference";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
	params: Promise<{ method: string }>;
};

export async function generateStaticParams() {
	return getAllHttpMethods().map((method) => ({ method }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { method } = await params;
	const httpMethod = getHttpMethod(method);
	if (!httpMethod) return {};

	return {
		title: `HTTP ${httpMethod.title} Method - Mock & Test | Mockspec`,
		description: httpMethod.metaDescription,
		openGraph: {
			title: `HTTP ${httpMethod.title} Method - Mock & Test | Mockspec`,
			description: httpMethod.metaDescription,
		},
	};
}

export default async function MethodPage({ params }: Props) {
	const { method } = await params;
	const httpMethod = getHttpMethod(method);

	if (!httpMethod) {
		notFound();
	}

	return (
		<GuidesLayout>
			<GuidesHeader
				title={`HTTP ${httpMethod.title}`}
				description={httpMethod.description}
			/>

			<GuidesSection title="Characteristics">
				<ul className="list-disc list-inside space-y-2 ml-4">
					{httpMethod.characteristics.map((char) => (
						<li key={char}>{char}</li>
					))}
				</ul>
			</GuidesSection>

			<GuidesSection title="When to Use">
				<ul className="list-disc list-inside space-y-2 ml-4">
					{httpMethod.whenToUse.map((use) => (
						<li key={use}>{use}</li>
					))}
				</ul>
			</GuidesSection>

			<GuidesSection title="Mock Example">
				<p className="mb-4">
					Create a {httpMethod.title} endpoint in Mockspec:
				</p>
				<CodeBlock>{httpMethod.mockExample}</CodeBlock>
			</GuidesSection>

			<GuidesSection title="Testing Tips">
				<ul className="list-disc list-inside space-y-2 ml-4">
					<li>
						Test both success and error responses for {httpMethod.title}{" "}
						requests
					</li>
					<li>Verify request headers and body are sent correctly</li>
					<li>Use request logs to debug issues</li>
					<li>Test edge cases like empty responses and large payloads</li>
				</ul>
			</GuidesSection>

			<GuidesFooter />
		</GuidesLayout>
	);
}

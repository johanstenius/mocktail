export function StructuredData() {
	const organizationSchema = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: "Mockspec",
		url: "https://mockspec.dev",
		logo: "https://mockspec.dev/og-image.png",
		sameAs: [],
	};

	const softwareSchema = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: "Mockspec",
		applicationCategory: "DeveloperApplication",
		operatingSystem: "Web",
		url: "https://mockspec.dev",
		description:
			"Instant mock servers with realistic auth, latency injection, and chaos engineering. Import OpenAPI specs, simulate auth flows, and share with your team.",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		featureList: [
			"OpenAPI Import",
			"Mock Server Generation",
			"Chaos Engineering",
			"Latency Injection",
			"Auth Simulation",
			"Team Collaboration",
		],
	};

	const websiteSchema = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "Mockspec",
		url: "https://mockspec.dev",
		potentialAction: {
			"@type": "SearchAction",
			target: "https://mockspec.dev/docs?q={search_term_string}",
			"query-input": "required name=search_term_string",
		},
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(organizationSchema),
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(softwareSchema),
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(websiteSchema),
				}}
			/>
		</>
	);
}

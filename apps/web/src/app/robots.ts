import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/dashboard",
				"/projects",
				"/billing",
				"/team",
				"/analytics",
				"/audit-logs",
				"/onboarding",
			],
		},
		sitemap: "https://mockspec.dev/sitemap.xml",
	};
}

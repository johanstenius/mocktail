import {
	getAllHttpMethods,
	getAllStatusCodes,
} from "@/data/seo/http-reference";
import { getAllIntegrationSlugs } from "@/data/seo/integrations";
import { getAllUseCaseSlugs } from "@/data/seo/use-cases";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = "https://mockspec.dev";

	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${baseUrl}/docs`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/docs/quickstart`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/docs/authentication`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/endpoints`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/templates`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/chaos-engineering`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/openapi-import`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/docs/request-logs`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.6,
		},
		{
			url: `${baseUrl}/docs/rate-limits`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.6,
		},
		{
			url: `${baseUrl}/docs/errors`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.6,
		},
		{
			url: `${baseUrl}/login`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.5,
		},
		{
			url: `${baseUrl}/register`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.5,
		},
	];

	const integrationPages: MetadataRoute.Sitemap = getAllIntegrationSlugs().map(
		(slug) => ({
			url: `${baseUrl}/guides/integrations/${slug}`,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: 0.7,
		}),
	);

	const useCasePages: MetadataRoute.Sitemap = getAllUseCaseSlugs().map(
		(slug) => ({
			url: `${baseUrl}/guides/use-cases/${slug}`,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: 0.7,
		}),
	);

	const statusCodePages: MetadataRoute.Sitemap = getAllStatusCodes().map(
		(code) => ({
			url: `${baseUrl}/guides/status-codes/${code}`,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: 0.6,
		}),
	);

	const methodPages: MetadataRoute.Sitemap = getAllHttpMethods().map(
		(method) => ({
			url: `${baseUrl}/guides/methods/${method}`,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: 0.6,
		}),
	);

	return [
		...staticPages,
		...integrationPages,
		...useCasePages,
		...statusCodePages,
		...methodPages,
	];
}

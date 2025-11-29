import type { Context } from "hono";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { apiKeyMiddleware, getApiKeyOrg } from "../middleware/api-key";
import { createMockRateLimiter } from "../middleware/rate-limit";
import * as limitsService from "../services/limits.service";
import * as mockService from "../services/mock.service";

export const mockRouter = new Hono();

const rateLimiter = createMockRateLimiter();

mockRouter.use("*", apiKeyMiddleware);
mockRouter.use("*", rateLimiter);

function extractQueryParams(url: URL): Record<string, string> {
	const query: Record<string, string> = {};
	url.searchParams.forEach((value, key) => {
		query[key] = value;
	});
	return query;
}

function extractHeaders(request: Request): Record<string, string> {
	const headers: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
}

async function extractBody(request: Request): Promise<unknown> {
	try {
		const text = await request.clone().text();
		if (!text) return null;
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	} catch {
		return null;
	}
}

function extractPath(c: Context): string {
	return `/${c.req.path.split("/").slice(4).join("/")}`;
}

mockRouter.all("/:orgSlug/:projectSlug/*", async (c) => {
	const orgId = getApiKeyOrg(c);

	// Track monthly request quota
	const quotaCheck = await limitsService.trackRequest(orgId);
	if (!quotaCheck.allowed) {
		return c.json(
			{ error: "Monthly request quota exceeded", code: "QUOTA_EXCEEDED" },
			429,
		);
	}

	const startTime = Date.now();
	const orgSlug = c.req.param("orgSlug");
	const projectSlug = c.req.param("projectSlug");
	const path = extractPath(c);
	const method = c.req.method;

	const url = new URL(c.req.url);
	const query = extractQueryParams(url);
	const headers = extractHeaders(c.req.raw);
	const body = await extractBody(c.req.raw);

	const result = await mockService.handleMockRequest(
		{ orgSlug, projectSlug, method, path, headers, query, body },
		startTime,
	);

	if (!result.success) {
		if (result.error === "project_not_found") {
			throw new HTTPException(404, { message: "Project not found" });
		}
		throw new HTTPException(404, {
			message: `No endpoint configured for ${method} ${path}`,
		});
	}

	for (const [key, value] of Object.entries(result.response.headers)) {
		c.header(key, value);
	}

	return c.json(result.response.body, result.response.status as 200);
});

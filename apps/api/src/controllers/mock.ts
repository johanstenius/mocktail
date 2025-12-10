import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";
import {
	getMockOrgId,
	getMockProjectId,
	getMockTier,
	mockAuthMiddleware,
} from "../middleware/mock-auth";
import * as limitsService from "../services/limits.service";
import * as mockService from "../services/mock.service";

export const mockRouter = new Hono();

mockRouter.use("*", mockAuthMiddleware);

const MAX_QUERY_PARAMS = 100;
const MAX_PARAM_LENGTH = 2000;

function extractQueryParams(url: URL): Record<string, string> {
	const query: Record<string, string> = {};
	let count = 0;
	for (const [key, value] of url.searchParams) {
		if (count >= MAX_QUERY_PARAMS) break;
		if (key.length <= MAX_PARAM_LENGTH && value.length <= MAX_PARAM_LENGTH) {
			query[key] = value;
			count++;
		}
	}
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

mockRouter.all("/*", async (c) => {
	const projectId = getMockProjectId(c);
	const orgId = getMockOrgId(c);
	const tier = getMockTier(c);

	// Quota check (org-level)
	const quotaCheck = await limitsService.trackRequest(orgId);
	if (!quotaCheck.allowed) {
		return c.json(
			{ error: "Monthly request quota exceeded", code: "QUOTA_EXCEEDED" },
			429,
		);
	}

	// Track for analytics (project-level)
	await limitsService.trackProjectRequest(projectId);

	const startTime = Date.now();
	const path = `/${c.req.path.split("/").slice(2).join("/")}`;
	const method = c.req.method;

	const url = new URL(c.req.url);
	const query = extractQueryParams(url);
	const headers = extractHeaders(c.req.raw);
	const body = await extractBody(c.req.raw);

	const result = await mockService.handleMockRequest(
		{ projectId, method, path, headers, query, body },
		tier,
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

	const status = result.response.status;

	// 204 No Content and 304 Not Modified must not have a body
	if (status === 204 || status === 304) {
		return c.body(null, status as StatusCode);
	}

	return c.json(result.response.body, status as ContentfulStatusCode);
});

import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../middleware/auth";
import { authMiddleware, requireVerifiedEmail } from "../middleware/auth";
import {
	createEndpointRoute,
	deleteEndpointRoute,
	getEndpointRoute,
	listEndpointsRoute,
	updateEndpointRoute,
} from "../schemas/endpoint";
import * as endpointService from "../services/endpoint.service";
import type { EndpointModel } from "../services/endpoint.service";
import * as limitsService from "../services/limits.service";
import { conflict, notFound } from "../utils/errors";

export const endpointsRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

endpointsRouter.use("*", authMiddleware(), requireVerifiedEmail());

function parseJson(str: string): unknown {
	try {
		return JSON.parse(str);
	} catch {
		return {};
	}
}

function mapEndpointToResponse(endpoint: EndpointModel) {
	return {
		id: endpoint.id,
		projectId: endpoint.projectId,
		method: endpoint.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
		path: endpoint.path,
		status: endpoint.status,
		headers: parseJson(endpoint.headers) as Record<string, string>,
		body:
			endpoint.bodyType === "template"
				? endpoint.body
				: parseJson(endpoint.body),
		bodyType: endpoint.bodyType as "static" | "template",
		delay: endpoint.delay,
		failRate: endpoint.failRate,
		createdAt: endpoint.createdAt.toISOString(),
		updatedAt: endpoint.updatedAt.toISOString(),
	};
}

endpointsRouter.openapi(listEndpointsRoute, async (c) => {
	const { projectId } = c.req.valid("param");
	const endpoints = await endpointService.findByProjectId(projectId);
	return c.json({ endpoints: endpoints.map(mapEndpointToResponse) }, 200);
});

// @ts-expect-error - OpenAPI response schema typing issue
endpointsRouter.openapi(getEndpointRoute, async (c) => {
	const { projectId, endpointId } = c.req.valid("param");
	const endpoint = await endpointService.findById(endpointId, projectId);

	if (!endpoint) {
		throw notFound("Endpoint");
	}

	return c.json(mapEndpointToResponse(endpoint), 200);
});

// @ts-expect-error - OpenAPI response schema typing issue
endpointsRouter.openapi(createEndpointRoute, async (c) => {
	const { projectId } = c.req.valid("param");
	const body = c.req.valid("json");

	await limitsService.requireEndpointLimit(projectId);

	const result = await endpointService.create(projectId, {
		method: body.method,
		path: body.path,
		status: body.status,
		headers: body.headers,
		body: body.body,
		bodyType: body.bodyType,
		delay: body.delay,
		failRate: body.failRate,
	});

	if ("error" in result) {
		if (result.error === "project_not_found") {
			throw notFound("Project");
		}
		throw conflict("Endpoint with this method and path already exists");
	}

	return c.json(mapEndpointToResponse(result.endpoint), 201);
});

// @ts-expect-error - OpenAPI response schema typing issue
endpointsRouter.openapi(updateEndpointRoute, async (c) => {
	const { projectId, endpointId } = c.req.valid("param");
	const body = c.req.valid("json");

	const endpoint = await endpointService.update(endpointId, projectId, body);

	if (!endpoint) {
		throw notFound("Endpoint");
	}

	return c.json(mapEndpointToResponse(endpoint), 200);
});

endpointsRouter.openapi(deleteEndpointRoute, async (c) => {
	const { projectId, endpointId } = c.req.valid("param");

	const deleted = await endpointService.remove(endpointId, projectId);
	if (!deleted) {
		throw notFound("Endpoint");
	}

	return c.body(null, 204);
});

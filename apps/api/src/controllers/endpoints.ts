import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../lib/auth";
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
import { badRequest, conflict, notFound } from "../utils/errors";

export const endpointsRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

function mapEndpointToResponse(endpoint: EndpointModel) {
	return {
		id: endpoint.id,
		projectId: endpoint.projectId,
		method: endpoint.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
		path: endpoint.path,
		status: endpoint.status,
		headers: endpoint.headers,
		body: endpoint.body,
		bodyType: endpoint.bodyType as "static" | "template",
		delay: endpoint.delay,
		failRate: endpoint.failRate,
		requestBodySchema: endpoint.requestBodySchema,
		validationMode: endpoint.validationMode as "none" | "warn" | "strict",
		proxyEnabled: endpoint.proxyEnabled,
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
		requestBodySchema: body.requestBodySchema,
		validationMode: body.validationMode,
		proxyEnabled: body.proxyEnabled,
	});

	if ("error" in result) {
		if (result.error === "project_not_found") {
			throw notFound("Project");
		}
		if (result.error === "invalid_schema") {
			throw badRequest(result.message ?? "Invalid JSON Schema");
		}
		throw conflict("Endpoint with this method and path already exists");
	}

	return c.json(mapEndpointToResponse(result.endpoint), 201);
});

// @ts-expect-error - OpenAPI response schema typing issue
endpointsRouter.openapi(updateEndpointRoute, async (c) => {
	const { projectId, endpointId } = c.req.valid("param");
	const body = c.req.valid("json");

	const result = await endpointService.update(endpointId, projectId, body);

	if (!result) {
		throw notFound("Endpoint");
	}

	if ("error" in result) {
		throw badRequest(result.message);
	}

	return c.json(mapEndpointToResponse(result), 200);
});

endpointsRouter.openapi(deleteEndpointRoute, async (c) => {
	const { projectId, endpointId } = c.req.valid("param");

	const deleted = await endpointService.remove(endpointId, projectId);
	if (!deleted) {
		throw notFound("Endpoint");
	}

	return c.body(null, 204);
});

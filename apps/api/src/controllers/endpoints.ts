import { OpenAPIHono } from "@hono/zod-openapi";
import { type AuthVariables, getAuth } from "../lib/auth";
import {
	type EndpointResponse,
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

function mapEndpointToResponse(endpoint: EndpointModel): EndpointResponse {
	return {
		id: endpoint.id,
		projectId: endpoint.projectId,
		method: endpoint.method as EndpointResponse["method"],
		path: endpoint.path,
		status: endpoint.status,
		headers: endpoint.headers,
		body: endpoint.body,
		bodyType: endpoint.bodyType as EndpointResponse["bodyType"],
		delay: endpoint.delay,
		failRate: endpoint.failRate,
		requestBodySchema: endpoint.requestBodySchema,
		validationMode:
			endpoint.validationMode as EndpointResponse["validationMode"],
		proxyEnabled: endpoint.proxyEnabled,
		isCrud: endpoint.isCrud,
		crudBucket: endpoint.crudBucket,
		crudIdField: endpoint.crudIdField,
		createdAt: endpoint.createdAt.toISOString(),
		updatedAt: endpoint.updatedAt.toISOString(),
	};
}

endpointsRouter.openapi(listEndpointsRoute, async (c) => {
	const { projectId } = c.req.valid("param");
	const endpoints = await endpointService.findByProjectId(projectId);
	return c.json({ endpoints: endpoints.map(mapEndpointToResponse) }, 200);
});

// @ts-expect-error - OpenAPI response type mismatch with unknown fields
endpointsRouter.openapi(getEndpointRoute, async (c) => {
	const { projectId, endpointId } = c.req.valid("param");
	const endpoint = await endpointService.findById(endpointId, projectId);

	if (!endpoint) {
		throw notFound("Endpoint");
	}

	return c.json(mapEndpointToResponse(endpoint), 200);
});

// @ts-expect-error - OpenAPI response type mismatch with unknown fields
endpointsRouter.openapi(createEndpointRoute, async (c) => {
	const { projectId } = c.req.valid("param");
	const body = c.req.valid("json");
	const auth = getAuth(c);

	await limitsService.requireEndpointLimit(projectId);

	if (body.proxyEnabled) {
		await limitsService.requireFeature(auth.orgId, "proxyMode");
	}

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

// @ts-expect-error - OpenAPI response type mismatch with unknown fields
endpointsRouter.openapi(updateEndpointRoute, async (c) => {
	const { projectId, endpointId } = c.req.valid("param");
	const body = c.req.valid("json");
	const auth = getAuth(c);

	if (body.proxyEnabled === true) {
		await limitsService.requireFeature(auth.orgId, "proxyMode");
	}
	if (body.isCrud === true) {
		await limitsService.requireFeature(auth.orgId, "statefulMocks");
	}

	const result = await endpointService.update(endpointId, projectId, {
		...body,
		crudBucket: body.crudBucket ?? undefined,
	});

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

import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import {
	endpointIdParamSchema,
	errorSchema,
	projectIdParamSchema,
} from "../schemas/common";
import {
	createEndpointSchema,
	endpointSchema,
	updateEndpointSchema,
} from "../schemas/endpoint";
import * as endpointService from "../services/endpoint.service";
import type { EndpointModel } from "../services/endpoint.service";
import * as limitsService from "../services/limits.service";
import { conflict, notFound, quotaExceeded } from "../utils/errors";

export const endpointsRouter = new OpenAPIHono();

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

// List endpoints for project
const listRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Endpoints"],
	request: {
		params: projectIdParamSchema,
	},
	responses: {
		200: {
			description: "List of endpoints",
			content: {
				"application/json": {
					schema: z.object({ endpoints: z.array(endpointSchema) }),
				},
			},
		},
	},
});

endpointsRouter.openapi(listRoute, async (c) => {
	const { projectId } = c.req.valid("param");
	const endpoints = await endpointService.findByProjectId(projectId);
	return c.json({ endpoints: endpoints.map(mapEndpointToResponse) });
});

// Get endpoint by ID
const getRoute = createRoute({
	method: "get",
	path: "/{endpointId}",
	tags: ["Endpoints"],
	request: {
		params: endpointIdParamSchema,
	},
	responses: {
		200: {
			description: "Endpoint details",
			content: {
				"application/json": {
					schema: endpointSchema,
				},
			},
		},
		404: {
			description: "Endpoint not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

endpointsRouter.openapi(getRoute, async (c) => {
	const { projectId, endpointId } = c.req.valid("param");
	const endpoint = await endpointService.findById(endpointId, projectId);

	if (!endpoint) {
		throw notFound("Endpoint");
	}

	return c.json(mapEndpointToResponse(endpoint));
});

// Create endpoint
const createEndpointRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Endpoints"],
	request: {
		params: projectIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: createEndpointSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Endpoint created",
			content: {
				"application/json": {
					schema: endpointSchema,
				},
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
		409: {
			description: "Endpoint already exists",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

endpointsRouter.openapi(createEndpointRoute, async (c) => {
	const { projectId } = c.req.valid("param");
	const body = c.req.valid("json");

	const limitCheck = await limitsService.checkEndpointLimit(projectId);
	if (!limitCheck.allowed) {
		throw quotaExceeded(limitCheck.reason ?? "Endpoint limit reached");
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
	});

	if ("error" in result) {
		if (result.error === "project_not_found") {
			throw notFound("Project");
		}
		throw conflict("Endpoint with this method and path already exists");
	}

	return c.json(mapEndpointToResponse(result.endpoint), 201);
});

// Update endpoint
const updateRoute = createRoute({
	method: "patch",
	path: "/{endpointId}",
	tags: ["Endpoints"],
	request: {
		params: endpointIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: updateEndpointSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Endpoint updated",
			content: {
				"application/json": {
					schema: endpointSchema,
				},
			},
		},
		404: {
			description: "Endpoint not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

endpointsRouter.openapi(updateRoute, async (c) => {
	const { projectId, endpointId } = c.req.valid("param");
	const body = c.req.valid("json");

	const endpoint = await endpointService.update(endpointId, projectId, body);

	if (!endpoint) {
		throw notFound("Endpoint");
	}

	return c.json(mapEndpointToResponse(endpoint));
});

// Delete endpoint
const deleteRoute = createRoute({
	method: "delete",
	path: "/{endpointId}",
	tags: ["Endpoints"],
	request: {
		params: endpointIdParamSchema,
	},
	responses: {
		204: {
			description: "Endpoint deleted",
		},
		404: {
			description: "Endpoint not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

endpointsRouter.openapi(deleteRoute, async (c) => {
	const { projectId, endpointId } = c.req.valid("param");

	const deleted = await endpointService.remove(endpointId, projectId);
	if (!deleted) {
		throw notFound("Endpoint");
	}

	return c.body(null, 204);
});

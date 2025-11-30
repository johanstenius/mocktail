import { createRoute, z } from "@hono/zod-openapi";
import {
	endpointIdParamSchema,
	errorSchema,
	projectIdParamSchema,
} from "./shared";

export const httpMethodSchema = z.enum([
	"GET",
	"POST",
	"PUT",
	"DELETE",
	"PATCH",
]);

export const bodyTypeSchema = z.enum(["static", "template"]);

export const endpointSchema = z.object({
	id: z.string(),
	projectId: z.string(),
	method: httpMethodSchema,
	path: z.string(),
	status: z.number(),
	headers: z.record(z.string()),
	body: z.unknown(),
	bodyType: bodyTypeSchema,
	delay: z.number(),
	failRate: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const createEndpointSchema = z.object({
	method: httpMethodSchema,
	path: z.string().min(1).regex(/^\//, "Path must start with /"),
	status: z.number().min(100).max(599).default(200),
	headers: z.record(z.string()).default({}),
	body: z.unknown().default({}),
	bodyType: bodyTypeSchema.default("static"),
	delay: z.number().min(0).max(30000).default(0),
	failRate: z.number().min(0).max(100).default(0),
});

export const updateEndpointSchema = z.object({
	method: httpMethodSchema.optional(),
	path: z.string().min(1).regex(/^\//, "Path must start with /").optional(),
	status: z.number().min(100).max(599).optional(),
	headers: z.record(z.string()).optional(),
	body: z.unknown().optional(),
	bodyType: bodyTypeSchema.optional(),
	delay: z.number().min(0).max(30000).optional(),
	failRate: z.number().min(0).max(100).optional(),
});

export const endpointListSchema = z.object({
	endpoints: z.array(endpointSchema),
});

// Route definitions
export const listEndpointsRoute = createRoute({
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
				"application/json": { schema: endpointListSchema },
			},
		},
	},
});

export const getEndpointRoute = createRoute({
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
				"application/json": { schema: endpointSchema },
			},
		},
		404: {
			description: "Endpoint not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const createEndpointRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Endpoints"],
	request: {
		params: projectIdParamSchema,
		body: {
			content: {
				"application/json": { schema: createEndpointSchema },
			},
		},
	},
	responses: {
		201: {
			description: "Endpoint created",
			content: {
				"application/json": { schema: endpointSchema },
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
		409: {
			description: "Endpoint already exists",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const updateEndpointRoute = createRoute({
	method: "patch",
	path: "/{endpointId}",
	tags: ["Endpoints"],
	request: {
		params: endpointIdParamSchema,
		body: {
			content: {
				"application/json": { schema: updateEndpointSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Endpoint updated",
			content: {
				"application/json": { schema: endpointSchema },
			},
		},
		404: {
			description: "Endpoint not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const deleteEndpointRoute = createRoute({
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
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export type EndpointResponse = z.infer<typeof endpointSchema>;
export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;
export type UpdateEndpointInput = z.infer<typeof updateEndpointSchema>;

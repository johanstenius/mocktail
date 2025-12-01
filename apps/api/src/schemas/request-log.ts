import { createRoute, z } from "@hono/zod-openapi";
import {
	errorSchema,
	projectIdParamSchema,
	requestLogIdParamSchema,
} from "./shared";

export const requestLogSchema = z.object({
	id: z.string(),
	projectId: z.string(),
	endpointId: z.string().nullable(),
	method: z.string(),
	path: z.string(),
	status: z.number(),
	requestHeaders: z.record(z.string()),
	requestBody: z.string().nullable(),
	responseBody: z.string().nullable(),
	validationErrors: z.array(z.string()).nullable(),
	duration: z.number(),
	createdAt: z.string(),
});

export const requestLogListQuerySchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(50).optional(),
	offset: z.coerce.number().min(0).default(0).optional(),
	method: z.string().optional(),
	status: z.coerce.number().optional(),
	endpointId: z.string().optional(),
});

export const requestLogListSchema = z.object({
	logs: z.array(requestLogSchema),
	total: z.number(),
});

export const deletedCountSchema = z.object({
	deleted: z.number(),
});

// Route definitions
export const listRequestLogsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Request Logs"],
	request: {
		params: projectIdParamSchema,
		query: requestLogListQuerySchema,
	},
	responses: {
		200: {
			description: "List of request logs",
			content: {
				"application/json": { schema: requestLogListSchema },
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const getRequestLogRoute = createRoute({
	method: "get",
	path: "/{id}",
	tags: ["Request Logs"],
	request: {
		params: requestLogIdParamSchema,
	},
	responses: {
		200: {
			description: "Request log details",
			content: {
				"application/json": { schema: requestLogSchema },
			},
		},
		404: {
			description: "Request log not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const deleteAllRequestLogsRoute = createRoute({
	method: "delete",
	path: "/",
	tags: ["Request Logs"],
	request: {
		params: projectIdParamSchema,
	},
	responses: {
		200: {
			description: "Request logs deleted",
			content: {
				"application/json": { schema: deletedCountSchema },
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export type RequestLogResponse = z.infer<typeof requestLogSchema>;
export type RequestLogListQuery = z.infer<typeof requestLogListQuerySchema>;

import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth";
import {
	errorSchema,
	projectIdParamSchema,
	requestLogIdParamSchema,
} from "../schemas/common";
import {
	requestLogListQuerySchema,
	requestLogSchema,
} from "../schemas/request-log";
import * as projectService from "../services/project.service";
import * as logService from "../services/request-log.service";
import type { RequestLogModel } from "../services/request-log.service";
import { notFound } from "../utils/errors";

export const requestLogsRouter = new OpenAPIHono();

requestLogsRouter.use("*", authMiddleware());

function mapRequestLogToResponse(log: RequestLogModel) {
	let requestHeaders: Record<string, string> = {};
	try {
		requestHeaders = JSON.parse(log.requestHeaders);
	} catch {
		// ignore
	}

	return {
		id: log.id,
		projectId: log.projectId,
		endpointId: log.endpointId,
		method: log.method,
		path: log.path,
		status: log.status,
		requestHeaders,
		requestBody: log.requestBody,
		responseBody: log.responseBody,
		duration: log.duration,
		createdAt: log.createdAt.toISOString(),
	};
}

// List request logs
const listRoute = createRoute({
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
				"application/json": {
					schema: z.object({
						logs: z.array(requestLogSchema),
						total: z.number(),
					}),
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
	},
});

requestLogsRouter.openapi(listRoute, async (c) => {
	const { projectId } = c.req.valid("param");
	const query = c.req.valid("query");

	const project = await projectService.findById(projectId);
	if (!project) {
		throw notFound("Project");
	}

	const { logs, total } = await logService.findByProjectId({
		projectId,
		limit: query.limit,
		offset: query.offset,
		method: query.method,
		status: query.status,
		endpointId: query.endpointId,
	});

	return c.json({
		logs: logs.map(mapRequestLogToResponse),
		total,
	});
});

// Get single request log
const getRoute = createRoute({
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
				"application/json": {
					schema: requestLogSchema,
				},
			},
		},
		404: {
			description: "Request log not found",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

requestLogsRouter.openapi(getRoute, async (c) => {
	const { projectId, id } = c.req.valid("param");

	const log = await logService.findById(id, projectId);

	if (!log) {
		throw notFound("Request log");
	}

	return c.json(mapRequestLogToResponse(log));
});

// Delete all request logs for project
const deleteAllRoute = createRoute({
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
				"application/json": {
					schema: z.object({ deleted: z.number() }),
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
	},
});

requestLogsRouter.openapi(deleteAllRoute, async (c) => {
	const { projectId } = c.req.valid("param");

	const project = await projectService.findById(projectId);
	if (!project) {
		throw notFound("Project");
	}

	const deleted = await logService.clearByProjectId(projectId);

	return c.json({ deleted });
});

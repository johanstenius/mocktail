import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../lib/auth";
import {
	type RequestLogResponse,
	deleteAllRequestLogsRoute,
	getRequestLogRoute,
	listRequestLogsRoute,
} from "../schemas/request-log";
import * as projectService from "../services/project.service";
import * as logService from "../services/request-log.service";
import type { RequestLogModel } from "../services/request-log.service";
import { notFound } from "../utils/errors";

export const requestLogsRouter = new OpenAPIHono<{
	Variables: AuthVariables;
}>();

function mapRequestLogToResponse(log: RequestLogModel): RequestLogResponse {
	return {
		id: log.id,
		projectId: log.projectId,
		endpointId: log.endpointId,
		method: log.method,
		path: log.path,
		status: log.status,
		source: log.source as RequestLogResponse["source"],
		requestHeaders: log.requestHeaders,
		requestBody: log.requestBody,
		responseBody: log.responseBody,
		validationErrors: log.validationErrors,
		duration: log.duration,
		createdAt: log.createdAt.toISOString(),
	};
}

requestLogsRouter.openapi(listRequestLogsRoute, async (c) => {
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
		source: query.source,
	});

	return c.json(
		{
			logs: logs.map(mapRequestLogToResponse),
			total,
		},
		200,
	);
});

// @ts-expect-error - OpenAPI response type mismatch with unknown fields
requestLogsRouter.openapi(getRequestLogRoute, async (c) => {
	const { projectId, id } = c.req.valid("param");

	const log = await logService.findById(id, projectId);

	if (!log) {
		throw notFound("Request log");
	}

	return c.json(mapRequestLogToResponse(log), 200);
});

requestLogsRouter.openapi(deleteAllRequestLogsRoute, async (c) => {
	const { projectId } = c.req.valid("param");

	const project = await projectService.findById(projectId);
	if (!project) {
		throw notFound("Project");
	}

	const deleted = await logService.clearByProjectId(projectId);

	return c.json({ deleted }, 200);
});

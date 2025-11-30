import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { errorSchema, projectIdParamSchema } from "../schemas/common";
import { statisticsSchema } from "../schemas/statistics";
import * as statisticsService from "../services/statistics.service";
import { notFound } from "../utils/errors";

export const statisticsRouter = new OpenAPIHono();

const getStatisticsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Statistics"],
	request: {
		params: projectIdParamSchema,
	},
	responses: {
		200: {
			description: "Project statistics",
			content: {
				"application/json": {
					schema: statisticsSchema,
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

statisticsRouter.openapi(getStatisticsRoute, async (c) => {
	const { projectId } = c.req.valid("param");

	const stats = await statisticsService.getProjectStatistics(projectId);

	if (!stats) {
		throw notFound("Project");
	}

	return c.json({
		endpoints: stats.endpoints.map((e) => ({
			...e,
			lastRequestAt: e.lastRequestAt?.toISOString() ?? null,
		})),
		unmatched: stats.unmatched.map((u) => ({
			...u,
			lastRequestAt: u.lastRequestAt?.toISOString() ?? null,
		})),
	});
});

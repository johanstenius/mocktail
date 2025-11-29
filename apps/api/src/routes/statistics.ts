import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { errorSchema, projectIdParamSchema } from "../schemas/common";
import { statisticsSchema } from "../schemas/statistics";
import * as statisticsService from "../services/statistics.service";

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
		return c.json({ error: "not_found", message: "Project not found" }, 404);
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

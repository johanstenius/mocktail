import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../middleware/auth";
import { getStatisticsRoute } from "../schemas/statistics";
import * as statisticsService from "../services/statistics.service";
import { notFound } from "../utils/errors";

export const statisticsRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

statisticsRouter.openapi(getStatisticsRoute, async (c) => {
	const { projectId } = c.req.valid("param");

	const stats = await statisticsService.getProjectStatistics(projectId);

	if (!stats) {
		throw notFound("Project");
	}

	return c.json(
		{
			endpoints: stats.endpoints.map((e) => ({
				...e,
				lastRequestAt: e.lastRequestAt?.toISOString() ?? null,
			})),
			unmatched: stats.unmatched.map((u) => ({
				...u,
				lastRequestAt: u.lastRequestAt?.toISOString() ?? null,
			})),
			avgLatency: stats.avgLatency,
		},
		200,
	);
});

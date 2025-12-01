import { OpenAPIHono } from "@hono/zod-openapi";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import * as batchJobRepo from "../repositories/batch-job.repository";
import {
	listJobsRoute,
	runGracePeriodRoute,
	runLogCleanupRoute,
} from "../schemas/admin";
import * as gracePeriodService from "../services/grace-period.service";
import * as retentionService from "../services/retention.service";

export const adminRouter = new OpenAPIHono();

adminRouter.use("*", adminAuthMiddleware());

adminRouter.openapi(runLogCleanupRoute, async (c) => {
	const result = await retentionService.cleanupExpiredLogs();
	return c.json(result, 200);
});

adminRouter.openapi(listJobsRoute, async (c) => {
	const { type, limit } = c.req.valid("query");
	const jobType = (type ?? "request_log_cleanup") as
		| "request_log_cleanup"
		| "usage_reset";
	const jobs = await batchJobRepo.findByType(jobType, Number(limit));

	return c.json(
		{
			jobs: jobs.map((j) => ({
				...j,
				startedAt: j.startedAt.toISOString(),
				endedAt: j.endedAt?.toISOString() ?? null,
			})),
		},
		200,
	);
});

adminRouter.openapi(runGracePeriodRoute, async (c) => {
	const result = await gracePeriodService.processGracePeriods();
	return c.json(result, 200);
});

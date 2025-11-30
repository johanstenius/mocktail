import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context, Next } from "hono";
import * as batchJobRepo from "../repositories/batch-job.repository";
import {
	listJobsRoute,
	runGracePeriodRoute,
	runLogCleanupRoute,
} from "../schemas/admin";
import * as gracePeriodService from "../services/grace-period.service";
import * as retentionService from "../services/retention.service";
import { unauthorized } from "../utils/errors";

export const adminRouter = new OpenAPIHono();

function adminAuthMiddleware() {
	return async (c: Context, next: Next) => {
		const secret = c.req.header("X-Admin-Secret");
		const expectedSecret = process.env.ADMIN_SECRET;

		if (!expectedSecret) {
			throw unauthorized("Admin endpoint not configured");
		}

		if (secret !== expectedSecret) {
			throw unauthorized();
		}

		await next();
	};
}

adminRouter.use("*", adminAuthMiddleware());

adminRouter.openapi(runLogCleanupRoute, async (c) => {
	const result = await retentionService.cleanupExpiredLogs();
	return c.json(result);
});

adminRouter.openapi(listJobsRoute, async (c) => {
	const { type, limit } = c.req.valid("query");
	const jobs = type
		? await batchJobRepo.findByType(type, Number(limit))
		: await batchJobRepo.findByType("log_cleanup", Number(limit));

	return c.json({
		jobs: jobs.map((j) => ({
			...j,
			startedAt: j.startedAt.toISOString(),
			endedAt: j.endedAt?.toISOString() ?? null,
		})),
	});
});

adminRouter.openapi(runGracePeriodRoute, async (c) => {
	const result = await gracePeriodService.processGracePeriods();
	return c.json(result);
});

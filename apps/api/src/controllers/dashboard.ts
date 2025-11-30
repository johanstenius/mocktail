import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../middleware/auth";
import {
	authMiddleware,
	getAuth,
	requireVerifiedEmail,
} from "../middleware/auth";
import { getActivityRoute, getDashboardStatsRoute } from "../schemas/dashboard";
import * as dashboardService from "../services/dashboard.service";

export const dashboardRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

dashboardRouter.use("*", authMiddleware(), requireVerifiedEmail());

dashboardRouter.openapi(getDashboardStatsRoute, async (c) => {
	const { orgId } = getAuth(c);
	const stats = await dashboardService.getStats(orgId);
	return c.json(stats, 200);
});

dashboardRouter.openapi(getActivityRoute, async (c) => {
	const { orgId } = getAuth(c);
	const { limit } = c.req.valid("query");
	const activity = await dashboardService.getActivity(orgId, Number(limit));
	return c.json({ activity }, 200);
});

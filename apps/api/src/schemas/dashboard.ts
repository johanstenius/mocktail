import { createRoute, z } from "@hono/zod-openapi";

export const dashboardStatsSchema = z.object({
	projects: z.number(),
	endpoints: z.number(),
	requestsToday: z.number(),
	requestsThisWeek: z.number(),
	teamMembers: z.number(),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

export const getDashboardStatsRoute = createRoute({
	method: "get",
	path: "/stats",
	tags: ["Dashboard"],
	summary: "Get dashboard statistics",
	responses: {
		200: {
			description: "Dashboard stats",
			content: {
				"application/json": { schema: dashboardStatsSchema },
			},
		},
	},
});

export const activityItemSchema = z.object({
	id: z.string(),
	type: z.enum(["project_created", "endpoint_created", "request"]),
	projectId: z.string().optional(),
	projectName: z.string().optional(),
	endpointId: z.string().optional(),
	endpointPath: z.string().optional(),
	method: z.string().optional(),
	status: z.number().optional(),
	createdAt: z.string(),
});

export const activityListSchema = z.array(activityItemSchema);

export type ActivityItem = z.infer<typeof activityItemSchema>;

export const getActivityRoute = createRoute({
	method: "get",
	path: "/activity",
	tags: ["Dashboard"],
	summary: "Get recent activity",
	request: {
		query: z.object({
			limit: z.string().optional().default("10"),
		}),
	},
	responses: {
		200: {
			description: "Recent activity",
			content: {
				"application/json": {
					schema: z.object({ activity: activityListSchema }),
				},
			},
		},
	},
});

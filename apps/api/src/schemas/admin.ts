import { createRoute, z } from "@hono/zod-openapi";

const orgCleanupResultSchema = z.object({
	orgId: z.string(),
	orgName: z.string(),
	projectsProcessed: z.number(),
	logsDeleted: z.number(),
});

const cleanupResultSchema = z.object({
	jobId: z.string(),
	results: z.array(orgCleanupResultSchema),
	totalDeleted: z.number(),
});

export type CleanupResultResponse = z.infer<typeof cleanupResultSchema>;

export const runLogCleanupRoute = createRoute({
	method: "post",
	path: "/jobs/log-cleanup",
	tags: ["Admin"],
	summary: "Run log cleanup job",
	responses: {
		200: {
			description: "Cleanup completed",
			content: { "application/json": { schema: cleanupResultSchema } },
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: z.object({ error: z.string() }),
				},
			},
		},
	},
});

const batchJobSchema = z.object({
	id: z.string(),
	type: z.string(),
	status: z.string(),
	result: z.string().nullable(),
	error: z.string().nullable(),
	startedAt: z.string(),
	endedAt: z.string().nullable(),
});

export type BatchJobResponse = z.infer<typeof batchJobSchema>;

export const listJobsRoute = createRoute({
	method: "get",
	path: "/jobs",
	tags: ["Admin"],
	summary: "List batch jobs",
	request: {
		query: z.object({
			type: z.string().optional(),
			limit: z.string().optional().default("20"),
		}),
	},
	responses: {
		200: {
			description: "Jobs list",
			content: {
				"application/json": {
					schema: z.object({ jobs: z.array(batchJobSchema) }),
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: z.object({ error: z.string() }),
				},
			},
		},
	},
});

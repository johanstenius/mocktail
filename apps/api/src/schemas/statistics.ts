import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema, projectIdParamSchema } from "./shared";

export const endpointStatSchema = z.object({
	endpointId: z.string(),
	requestCount: z.number(),
	lastRequestAt: z.string().nullable(),
});

export const unmatchedRequestSchema = z.object({
	method: z.string(),
	path: z.string(),
	count: z.number(),
	lastRequestAt: z.string().nullable(),
});

export const statisticsSchema = z.object({
	endpoints: z.array(endpointStatSchema),
	unmatched: z.array(unmatchedRequestSchema),
	avgLatency: z.number().nullable(),
});

// Route definitions
export const getStatisticsRoute = createRoute({
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
				"application/json": { schema: statisticsSchema },
			},
		},
		404: {
			description: "Project not found",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export type StatisticsResponse = z.infer<typeof statisticsSchema>;

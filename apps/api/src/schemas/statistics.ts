import { z } from "@hono/zod-openapi";

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

export type StatisticsResponse = z.infer<typeof statisticsSchema>;

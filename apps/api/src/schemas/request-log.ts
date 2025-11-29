import { z } from "@hono/zod-openapi";

export const requestLogSchema = z.object({
	id: z.string(),
	projectId: z.string(),
	endpointId: z.string().nullable(),
	method: z.string(),
	path: z.string(),
	status: z.number(),
	requestHeaders: z.record(z.string()),
	requestBody: z.string().nullable(),
	responseBody: z.string().nullable(),
	duration: z.number(),
	createdAt: z.string(),
});

export const requestLogListQuerySchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(50).optional(),
	offset: z.coerce.number().min(0).default(0).optional(),
	method: z.string().optional(),
	status: z.coerce.number().optional(),
	endpointId: z.string().optional(),
});

export type RequestLogResponse = z.infer<typeof requestLogSchema>;
export type RequestLogListQuery = z.infer<typeof requestLogListQuerySchema>;

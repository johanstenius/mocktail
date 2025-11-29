import { z } from "@hono/zod-openapi";

export const httpMethodSchema = z.enum([
	"GET",
	"POST",
	"PUT",
	"DELETE",
	"PATCH",
]);

export const bodyTypeSchema = z.enum(["static", "template"]);

export const endpointSchema = z.object({
	id: z.string(),
	projectId: z.string(),
	method: httpMethodSchema,
	path: z.string(),
	status: z.number(),
	headers: z.record(z.string()),
	body: z.unknown(),
	bodyType: bodyTypeSchema,
	delay: z.number(),
	failRate: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const createEndpointSchema = z.object({
	method: httpMethodSchema,
	path: z.string().min(1).regex(/^\//, "Path must start with /"),
	status: z.number().min(100).max(599).default(200),
	headers: z.record(z.string()).default({}),
	body: z.unknown().default({}),
	bodyType: bodyTypeSchema.default("static"),
	delay: z.number().min(0).max(30000).default(0),
	failRate: z.number().min(0).max(100).default(0),
});

export const updateEndpointSchema = z.object({
	method: httpMethodSchema.optional(),
	path: z.string().min(1).regex(/^\//, "Path must start with /").optional(),
	status: z.number().min(100).max(599).optional(),
	headers: z.record(z.string()).optional(),
	body: z.unknown().optional(),
	bodyType: bodyTypeSchema.optional(),
	delay: z.number().min(0).max(30000).optional(),
	failRate: z.number().min(0).max(100).optional(),
});

export type EndpointResponse = z.infer<typeof endpointSchema>;
export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;
export type UpdateEndpointInput = z.infer<typeof updateEndpointSchema>;

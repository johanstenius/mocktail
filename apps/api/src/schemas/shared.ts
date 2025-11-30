import { z } from "@hono/zod-openapi";

export const errorSchema = z.object({
	error: z.string(),
	code: z.string(),
	fields: z.record(z.string()).optional(),
});

export const idParamSchema = z.object({
	id: z.string(),
});

export const projectIdParamSchema = z.object({
	projectId: z.string(),
});

export const endpointIdParamSchema = z.object({
	projectId: z.string(),
	endpointId: z.string(),
});

export const requestLogIdParamSchema = z.object({
	projectId: z.string(),
	id: z.string(),
});

export const variantIdParamSchema = z.object({
	projectId: z.string(),
	endpointId: z.string(),
	variantId: z.string(),
});

export const memberIdParamSchema = z.object({
	memberId: z.string(),
});

export const inviteIdParamSchema = z.object({
	inviteId: z.string(),
});

export const successSchema = z.object({
	success: z.boolean(),
});

export const messageSchema = z.object({
	message: z.string(),
});

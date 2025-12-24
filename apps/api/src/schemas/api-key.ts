import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema, projectIdParamSchema } from "./shared";

export const apiKeyTypeSchema = z.enum(["project", "org"]);

export const apiKeySchema = z.object({
	id: z.string(),
	key: z.string(),
	type: apiKeyTypeSchema,
	name: z.string(),
	orgId: z.string(),
	projectId: z.string().nullable(),
	lastUsedAt: z.string().nullable(),
	expiresAt: z.string().nullable(),
	createdAt: z.string(),
});

export const apiKeyListSchema = z.object({
	keys: z.array(apiKeySchema),
});

export const createApiKeySchema = z.object({
	name: z.string().min(1).max(100),
	expiresAt: z.string().datetime().optional(),
});

export const apiKeyIdParamSchema = z.object({
	keyId: z.string(),
});

export const projectApiKeyParamSchema = z.object({
	projectId: z.string(),
	keyId: z.string(),
});

export type ApiKeyResponse = z.infer<typeof apiKeySchema>;
export type ApiKeyListResponse = z.infer<typeof apiKeyListSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

// Org API Key routes
export const listOrgApiKeysRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["API Keys"],
	responses: {
		200: {
			description: "List of org API keys",
			content: { "application/json": { schema: apiKeyListSchema } },
		},
	},
});

export const createOrgApiKeyRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["API Keys"],
	request: {
		body: { content: { "application/json": { schema: createApiKeySchema } } },
	},
	responses: {
		201: {
			description: "API key created",
			content: { "application/json": { schema: apiKeySchema } },
		},
	},
});

export const deleteOrgApiKeyRoute = createRoute({
	method: "delete",
	path: "/{keyId}",
	tags: ["API Keys"],
	request: { params: apiKeyIdParamSchema },
	responses: {
		204: { description: "API key deleted" },
		404: {
			description: "API key not found",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

// Project API Key routes
export const listProjectApiKeysRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Project API Keys"],
	request: { params: projectIdParamSchema },
	responses: {
		200: {
			description: "List of project API keys",
			content: { "application/json": { schema: apiKeyListSchema } },
		},
	},
});

export const createProjectApiKeyRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Project API Keys"],
	request: {
		params: projectIdParamSchema,
		body: { content: { "application/json": { schema: createApiKeySchema } } },
	},
	responses: {
		201: {
			description: "API key created",
			content: { "application/json": { schema: apiKeySchema } },
		},
		404: {
			description: "Project not found",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

export const deleteProjectApiKeyRoute = createRoute({
	method: "delete",
	path: "/{keyId}",
	tags: ["Project API Keys"],
	request: { params: projectApiKeyParamSchema },
	responses: {
		204: { description: "API key deleted" },
		404: {
			description: "API key not found",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

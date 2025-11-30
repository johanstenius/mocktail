import { createRoute, z } from "@hono/zod-openapi";

export const apiKeySchema = z.object({
	id: z.string(),
	key: z.string(),
	name: z.string(),
	createdBy: z.string().nullable(),
	createdAt: z.string(),
});

export const createApiKeySchema = z.object({
	name: z.string().min(1),
});

export type ApiKeyResponse = z.infer<typeof apiKeySchema>;
export type CreateApiKeyRequest = z.infer<typeof createApiKeySchema>;

export const listApiKeysRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["API Keys"],
	summary: "List API keys",
	responses: {
		200: {
			description: "List of API keys",
			content: {
				"application/json": {
					schema: z.object({ apiKeys: z.array(apiKeySchema) }),
				},
			},
		},
	},
});

export const createApiKeyRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["API Keys"],
	summary: "Create API key",
	request: {
		body: { content: { "application/json": { schema: createApiKeySchema } } },
	},
	responses: {
		201: {
			description: "API key created",
			content: {
				"application/json": {
					schema: z.object({
						apiKey: apiKeySchema,
						fullKey: z.string(),
					}),
				},
			},
		},
	},
});

export const deleteApiKeyRoute = createRoute({
	method: "delete",
	path: "/:apiKeyId",
	tags: ["API Keys"],
	summary: "Delete API key",
	request: {
		params: z.object({ apiKeyId: z.string() }),
	},
	responses: {
		204: {
			description: "API key deleted",
		},
	},
});

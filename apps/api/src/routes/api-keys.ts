import { OpenAPIHono } from "@hono/zod-openapi";
import { authMiddleware, getAuth, requireRole } from "../middleware/auth";
import {
	createApiKeyRoute,
	deleteApiKeyRoute,
	listApiKeysRoute,
} from "../schemas/api-key";
import * as apiKeyService from "../services/api-key.service";

export const apiKeysRouter = new OpenAPIHono();

apiKeysRouter.use("*", authMiddleware());
apiKeysRouter.use("*", requireRole("admin", "owner"));

apiKeysRouter.openapi(listApiKeysRoute, async (c) => {
	const auth = getAuth(c);
	const keys = await apiKeyService.listApiKeys(auth.orgId);
	return c.json({
		apiKeys: keys.map((k) => ({ ...k, createdAt: k.createdAt.toISOString() })),
	});
});

apiKeysRouter.openapi(createApiKeyRoute, async (c) => {
	const auth = getAuth(c);
	const body = c.req.valid("json");
	const result = await apiKeyService.createApiKey({
		...body,
		orgId: auth.orgId,
	});
	return c.json(
		{
			apiKey: {
				id: result.id,
				key: result.key,
				name: result.name,
				createdAt: result.createdAt.toISOString(),
			},
			fullKey: result.fullKey,
		},
		201,
	);
});

apiKeysRouter.openapi(deleteApiKeyRoute, async (c) => {
	const auth = getAuth(c);
	const { apiKeyId } = c.req.valid("param");
	await apiKeyService.deleteApiKey(apiKeyId, auth.orgId);
	return c.body(null, 204);
});

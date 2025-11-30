import type { Tier } from "@prisma/client";
import type { Context, Next } from "hono";
import { validateApiKey } from "../services/api-key.service";
import { unauthorized } from "../utils/errors";

export type ApiKeyContext = {
	orgId: string;
	tier: Tier;
};

export async function apiKeyMiddleware(c: Context, next: Next) {
	const apiKey = c.req.header("X-API-Key");

	if (!apiKey) {
		throw unauthorized("No API key provided");
	}

	const result = await validateApiKey(apiKey);

	if (!result) {
		throw unauthorized("Invalid API key");
	}

	c.set("apiKeyOrg", result.orgId);
	c.set("apiKeyTier", result.tier);
	await next();
}

export function getApiKeyOrg(c: Context): string {
	const orgId = c.get("apiKeyOrg") as string | undefined;
	if (!orgId) {
		throw new Error("Not authenticated");
	}
	return orgId;
}

export function getApiKeyTier(c: Context): Tier {
	const tier = c.get("apiKeyTier") as Tier | undefined;
	if (!tier) {
		throw new Error("Not authenticated");
	}
	return tier;
}

export function hasApiKey(c: Context): boolean {
	return c.req.header("X-API-Key") !== undefined;
}

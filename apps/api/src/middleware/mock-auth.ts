import type { Tier } from "@prisma/client";
import type { Context, Next } from "hono";
import * as apiKeyRepo from "../repositories/api-key.repository";
import * as subRepo from "../repositories/subscription.repository";
import { parseApiKeyType } from "../utils/api-key";
import { unauthorized } from "../utils/errors";
import { LRUCache } from "../utils/lru-cache";

export type MockAuthContext = {
	projectId: string;
	orgId: string;
	tier: Tier;
};

type CachedProject = {
	apiKeyId: string;
	projectId: string;
	orgId: string;
	tier: Tier;
};

const projectKeyCache = new LRUCache<CachedProject>(1000, 5 * 60 * 1000);

export async function mockAuthMiddleware(c: Context, next: Next) {
	const apiKey = extractApiKey(c);

	if (!apiKey) {
		throw unauthorized("No API key provided");
	}

	const result = await validateProjectApiKey(apiKey);

	if (!result) {
		throw unauthorized("Invalid API key");
	}

	c.set("mockProjectId", result.projectId);
	c.set("mockOrgId", result.orgId);
	c.set("mockTier", result.tier);

	// Update lastUsedAt in background (don't await)
	apiKeyRepo.updateLastUsed(result.apiKeyId).catch(() => {});

	await next();
}

function extractApiKey(c: Context): string | null {
	const explicit = c.req.header("X-API-Key");
	if (explicit) return explicit;

	const auth = c.req.header("Authorization");
	if (!auth) {
		return null;
	}

	const [scheme, value] = auth.split(" ");

	if (scheme === "Bearer" && value) {
		return value;
	}

	if (scheme === "Basic" && value) {
		try {
			const decoded = atob(value);
			const [username] = decoded.split(":");
			return username || null;
		} catch {
			return null;
		}
	}

	return null;
}

async function validateProjectApiKey(
	key: string,
): Promise<CachedProject | null> {
	const cached = projectKeyCache.get(key);
	if (cached) return cached;

	// Only accept project keys for mock auth
	const keyType = parseApiKeyType(key);
	if (keyType !== "project") return null;

	const apiKey = await apiKeyRepo.findByKey(key);
	if (!apiKey) return null;
	if (!apiKey.projectId) return null;

	// Check expiration
	if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
		return null;
	}

	const sub = await subRepo.findByOrgId(apiKey.orgId);

	const result: CachedProject = {
		apiKeyId: apiKey.id,
		projectId: apiKey.projectId,
		orgId: apiKey.orgId,
		tier: sub?.tier ?? "free",
	};
	projectKeyCache.set(key, result);
	return result;
}

export function invalidateProjectKeyCache(key: string): void {
	projectKeyCache.delete(key);
}

export function getMockProjectId(c: Context): string {
	const projectId = c.get("mockProjectId") as string | undefined;
	if (!projectId) {
		throw new Error("Not authenticated");
	}

	return projectId;
}

export function getMockOrgId(c: Context): string {
	const orgId = c.get("mockOrgId") as string | undefined;
	if (!orgId) {
		throw new Error("Not authenticated");
	}

	return orgId;
}

export function getMockTier(c: Context): Tier {
	const tier = c.get("mockTier") as Tier | undefined;
	if (!tier) {
		throw new Error("Not authenticated");
	}

	return tier;
}

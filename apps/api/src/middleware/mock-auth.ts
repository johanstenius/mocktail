import type { Tier } from "@prisma/client";
import type { Context, Next } from "hono";
import { LRUCache } from "../lib/lru-cache";
import * as projectRepo from "../repositories/project.repository";
import { unauthorized } from "../utils/errors";

export type MockAuthContext = {
	projectId: string;
	orgId: string;
	tier: Tier;
};

type CachedProject = {
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
	await next();
}

function extractApiKey(c: Context): string | null {
	const explicit = c.req.header("X-API-Key");
	if (explicit) return explicit;

	const auth = c.req.header("Authorization");
	if (!auth) return null;

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

	const project = await projectRepo.findByApiKey(key);
	if (!project) return null;

	const result: CachedProject = {
		projectId: project.id,
		orgId: project.org.id,
		tier: project.org.tier,
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

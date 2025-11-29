import type { Tier } from "@prisma/client";
import { LRUCache } from "../lib/lru-cache";
import * as apiKeyRepo from "../repositories/api-key.repository";
import { generateApiKey } from "../utils/api-key";

type ApiKeyValidation = { orgId: string; tier: Tier };
const apiKeyCache = new LRUCache<ApiKeyValidation>(1000, 5 * 60 * 1000); // 1000 keys, 5 min TTL

export type ApiKeyModel = {
	id: string;
	key: string;
	name: string;
	createdAt: Date;
};

export type CreateApiKeyInput = {
	name: string;
	orgId: string;
};

export async function listApiKeys(orgId: string): Promise<ApiKeyModel[]> {
	const keys = await apiKeyRepo.findByOrgId(orgId);
	return keys.map((k) => ({
		id: k.id,
		key: maskKey(k.key),
		name: k.name,
		createdAt: k.createdAt,
	}));
}

export async function createApiKey(
	input: CreateApiKeyInput,
): Promise<ApiKeyModel & { fullKey: string }> {
	const key = generateApiKey();
	const apiKey = await apiKeyRepo.create({
		key,
		name: input.name,
		orgId: input.orgId,
	});

	return {
		id: apiKey.id,
		key: maskKey(apiKey.key),
		fullKey: key,
		name: apiKey.name,
		createdAt: apiKey.createdAt,
	};
}

export async function deleteApiKey(id: string, orgId: string): Promise<void> {
	const keys = await apiKeyRepo.findByOrgId(orgId);
	const key = keys.find((k) => k.id === id);
	if (!key) {
		throw new Error("API Key not found");
	}

	await apiKeyRepo.remove(id);
	apiKeyCache.delete(key.key);
}

export async function validateApiKey(
	key: string,
): Promise<ApiKeyValidation | null> {
	const cached = apiKeyCache.get(key);
	if (cached) return cached;

	const apiKey = await apiKeyRepo.findByKey(key);
	if (!apiKey) return null;

	const result = { orgId: apiKey.orgId, tier: apiKey.org.tier };
	apiKeyCache.set(key, result);
	return result;
}

export function invalidateApiKeyCache(key: string): void {
	apiKeyCache.delete(key);
}

function maskKey(key: string): string {
	if (key.length <= 12) return key;
	return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

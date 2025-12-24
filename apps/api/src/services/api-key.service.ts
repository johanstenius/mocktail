import type { ApiKeyType } from "@prisma/client";
import * as apiKeyRepo from "../repositories/api-key.repository";
import { generateApiKey } from "../utils/api-key";
import * as auditService from "./audit.service";
import type { AuditContext } from "./audit.service";

export type ApiKeyModel = {
	id: string;
	key: string;
	type: ApiKeyType;
	name: string;
	orgId: string;
	projectId: string | null;
	lastUsedAt: Date | null;
	expiresAt: Date | null;
	createdAt: Date;
};

export type ApiKeyLookupResult = {
	id: string;
	key: string;
	type: ApiKeyType;
	orgId: string;
	projectId: string | null;
};

export async function findByKey(
	key: string,
): Promise<ApiKeyLookupResult | null> {
	const apiKey = await apiKeyRepo.findByKey(key);
	if (!apiKey) return null;

	// Check expiration
	if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
		return null;
	}

	return {
		id: apiKey.id,
		key: apiKey.key,
		type: apiKey.type,
		orgId: apiKey.orgId,
		projectId: apiKey.projectId,
	};
}

export function findByOrgId(orgId: string): Promise<ApiKeyModel[]> {
	return apiKeyRepo.findByOrgId(orgId);
}

export function findByProjectId(projectId: string): Promise<ApiKeyModel[]> {
	return apiKeyRepo.findByProjectId(projectId);
}

export async function createOrgKey(
	data: { name: string; orgId: string; expiresAt?: Date },
	ctx?: AuditContext,
): Promise<ApiKeyModel> {
	const key = generateApiKey("org");
	const apiKey = await apiKeyRepo.create({
		key,
		type: "org",
		name: data.name,
		orgId: data.orgId,
		expiresAt: data.expiresAt,
	});

	await auditService.log({
		orgId: data.orgId,
		action: "api_key_created",
		targetType: "api_key",
		targetId: apiKey.id,
		metadata: { name: data.name, type: "org" },
		ctx,
	});

	return apiKey;
}

export async function createProjectKey(
	data: { name: string; orgId: string; projectId: string; expiresAt?: Date },
	ctx?: AuditContext,
): Promise<ApiKeyModel> {
	const key = generateApiKey("project");
	const apiKey = await apiKeyRepo.create({
		key,
		type: "project",
		name: data.name,
		orgId: data.orgId,
		projectId: data.projectId,
		expiresAt: data.expiresAt,
	});

	await auditService.log({
		orgId: data.orgId,
		action: "api_key_created",
		targetType: "api_key",
		targetId: apiKey.id,
		metadata: { name: data.name, type: "project", projectId: data.projectId },
		ctx,
	});

	return apiKey;
}

export async function remove(
	id: string,
	orgId: string,
	ctx?: AuditContext,
): Promise<boolean> {
	const existing = await apiKeyRepo.findById(id);
	if (!existing || existing.orgId !== orgId) return false;

	await apiKeyRepo.remove(id);

	await auditService.log({
		orgId,
		action: "api_key_deleted",
		targetType: "api_key",
		targetId: id,
		metadata: { name: existing.name, type: existing.type },
		ctx,
	});

	return true;
}

export function updateLastUsed(id: string): Promise<ApiKeyModel> {
	return apiKeyRepo.updateLastUsed(id);
}

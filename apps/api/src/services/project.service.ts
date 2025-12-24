import * as apiKeyRepo from "../repositories/api-key.repository";
import * as projectRepo from "../repositories/project.repository";
import { generateApiKey } from "../utils/api-key";
import * as auditService from "./audit.service";
import type { AuditContext } from "./audit.service";

export type ProjectModel = {
	id: string;
	name: string;
	slug: string;
	apiKey: string;
	orgId: string;
	monthlyRequests: number;
	requestResetAt: Date | null;
	proxyBaseUrl: string | null;
	proxyTimeout: number;
	proxyAuthHeader: string | null;
	proxyPassThroughAuth: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export function findAll(): Promise<ProjectModel[]> {
	return projectRepo.findAll();
}

export function findByOrgId(orgId: string): Promise<ProjectModel[]> {
	return projectRepo.findByOrgId(orgId);
}

export function findById(id: string): Promise<ProjectModel | null> {
	return projectRepo.findById(id);
}

export function findBySlug(slug: string): Promise<ProjectModel | null> {
	return projectRepo.findBySlug(slug);
}

export function findBySlugAndOrgId(
	slug: string,
	orgId: string,
): Promise<ProjectModel | null> {
	return projectRepo.findBySlugAndOrgId(slug, orgId);
}

export async function create(
	data: {
		name: string;
		slug: string;
		orgId: string;
	},
	ctx?: AuditContext,
): Promise<ProjectModel> {
	// Create project with a temporary apiKey (will be deprecated)
	const tempKey = generateApiKey("project");
	const project = await projectRepo.create({ ...data, apiKey: tempKey });

	// Create the API key in the new table
	await apiKeyRepo.create({
		key: tempKey,
		type: "project",
		name: "Default",
		orgId: data.orgId,
		projectId: project.id,
	});

	await auditService.log({
		orgId: data.orgId,
		action: "project_created",
		targetType: "project",
		targetId: project.id,
		metadata: { name: project.name, slug: project.slug },
		ctx,
	});

	return project;
}

export async function update(
	id: string,
	data: {
		name?: string;
		slug?: string;
		proxyBaseUrl?: string | null;
		proxyTimeout?: number;
		proxyAuthHeader?: string | null;
		proxyPassThroughAuth?: boolean;
	},
	ctx?: AuditContext,
): Promise<ProjectModel | null> {
	const existing = await projectRepo.findById(id);
	if (!existing) return null;

	const updated = await projectRepo.update(id, data);
	if (!updated) return null;

	const diff = auditService.buildDiff(existing, data, [
		"name",
		"slug",
		"proxyBaseUrl",
		"proxyTimeout",
		"proxyPassThroughAuth",
	]);
	if (Object.keys(diff).length > 0) {
		await auditService.log({
			orgId: existing.orgId,
			action: "project_updated",
			targetType: "project",
			targetId: id,
			metadata: diff,
			ctx,
		});
	}

	return updated;
}

export async function remove(id: string, ctx?: AuditContext): Promise<boolean> {
	const existing = await projectRepo.findById(id);
	if (!existing) return false;

	await projectRepo.remove(id);

	await auditService.log({
		orgId: existing.orgId,
		action: "project_deleted",
		targetType: "project",
		targetId: id,
		metadata: { name: existing.name, slug: existing.slug },
		ctx,
	});

	return true;
}

export function findByApiKey(apiKey: string): Promise<ProjectModel | null> {
	return projectRepo.findByApiKey(apiKey);
}

export async function rotateApiKey(
	id: string,
	ctx?: AuditContext,
): Promise<ProjectModel | null> {
	const existing = await projectRepo.findById(id);
	if (!existing) return null;

	// Delete all existing project keys and create a new one
	await apiKeyRepo.removeByProjectId(id);

	const newApiKey = generateApiKey("project");

	// Create new key in ApiKey table
	await apiKeyRepo.create({
		key: newApiKey,
		type: "project",
		name: "Default",
		orgId: existing.orgId,
		projectId: id,
	});

	// Update project's apiKey field (for backwards compatibility)
	const updated = await projectRepo.updateApiKey(id, newApiKey);

	await auditService.log({
		orgId: existing.orgId,
		action: "api_key_rotated",
		targetType: "project",
		targetId: id,
		metadata: { projectName: existing.name },
		ctx,
	});

	return updated;
}

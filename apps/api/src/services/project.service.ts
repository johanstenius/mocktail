import { nanoid } from "nanoid";
import * as projectRepo from "../repositories/project.repository";
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
	const apiKey = `mk_${nanoid(24)}`;
	const project = await projectRepo.create({ ...data, apiKey });

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

	const newApiKey = `mk_${nanoid(24)}`;
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

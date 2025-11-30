import { nanoid } from "nanoid";
import * as projectRepo from "../repositories/project.repository";

export type ProjectModel = {
	id: string;
	name: string;
	slug: string;
	apiKey: string;
	orgId: string;
	monthlyRequests: number;
	requestResetAt: Date | null;
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

export async function create(data: {
	name: string;
	slug: string;
	orgId: string;
}): Promise<ProjectModel> {
	const apiKey = `mk_${nanoid(24)}`;
	return projectRepo.create({ ...data, apiKey });
}

export async function update(
	id: string,
	data: { name?: string; slug?: string },
): Promise<ProjectModel | null> {
	const existing = await projectRepo.findById(id);
	if (!existing) return null;
	return projectRepo.update(id, data);
}

export async function remove(id: string): Promise<boolean> {
	const existing = await projectRepo.findById(id);
	if (!existing) return false;
	await projectRepo.remove(id);
	return true;
}

export function findByApiKey(apiKey: string): Promise<ProjectModel | null> {
	return projectRepo.findByApiKey(apiKey);
}

export async function rotateApiKey(id: string): Promise<ProjectModel | null> {
	const existing = await projectRepo.findById(id);
	if (!existing) return null;
	const newApiKey = `mk_${nanoid(24)}`;
	return projectRepo.updateApiKey(id, newApiKey);
}

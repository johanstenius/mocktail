import type { ApiKeyType } from "@prisma/client";
import { prisma } from "./db/prisma";

export function findByKey(key: string) {
	return prisma.apiKey.findUnique({
		where: { key },
		include: {
			org: { select: { id: true } },
			project: { select: { id: true, orgId: true } },
		},
	});
}

export function findById(id: string) {
	return prisma.apiKey.findUnique({
		where: { id },
	});
}

export function findByOrgId(orgId: string) {
	return prisma.apiKey.findMany({
		where: { orgId, type: "org" },
		orderBy: { createdAt: "desc" },
	});
}

export function findByProjectId(projectId: string) {
	return prisma.apiKey.findMany({
		where: { projectId, type: "project" },
		orderBy: { createdAt: "desc" },
	});
}

export function create(data: {
	key: string;
	type: ApiKeyType;
	name: string;
	orgId: string;
	projectId?: string;
	expiresAt?: Date;
}) {
	return prisma.apiKey.create({ data });
}

export function remove(id: string) {
	return prisma.apiKey.delete({ where: { id } });
}

export function removeByProjectId(projectId: string) {
	return prisma.apiKey.deleteMany({ where: { projectId } });
}

export function updateLastUsed(id: string) {
	return prisma.apiKey.update({
		where: { id },
		data: { lastUsedAt: new Date() },
	});
}

export function countByOrgId(orgId: string, type: ApiKeyType) {
	return prisma.apiKey.count({ where: { orgId, type } });
}

export function countByProjectId(projectId: string) {
	return prisma.apiKey.count({ where: { projectId, type: "project" } });
}

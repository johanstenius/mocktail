import { prisma } from "./db/prisma";

export function findById(id: string) {
	return prisma.organization.findUnique({
		where: { id },
	});
}

export function findBySlug(slug: string) {
	return prisma.organization.findUnique({
		where: { slug },
	});
}

export function findByOwnerId(ownerId: string) {
	return prisma.organization.findFirst({
		where: { ownerId },
	});
}

export function create(data: { name: string; slug: string; ownerId: string }) {
	return prisma.organization.create({ data });
}

export function countProjectsByOrgId(orgId: string) {
	return prisma.project.count({
		where: { orgId },
	});
}

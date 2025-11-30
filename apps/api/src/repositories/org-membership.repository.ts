import type { OrgRole } from "@prisma/client";
import { prisma } from "./db/prisma";

export function findByUserAndOrg(userId: string, orgId: string) {
	return prisma.orgMembership.findUnique({
		where: { userId_orgId: { userId, orgId } },
	});
}

export function create(data: { userId: string; orgId: string; role: OrgRole }) {
	return prisma.orgMembership.create({ data });
}

export function findByUserId(userId: string) {
	return prisma.orgMembership.findMany({
		where: { userId },
		include: { org: true },
	});
}

export function findByOrgId(orgId: string) {
	return prisma.orgMembership.findMany({
		where: { orgId },
		include: { user: { select: { email: true } } },
		orderBy: { createdAt: "asc" },
	});
}

export function findById(id: string) {
	return prisma.orgMembership.findUnique({
		where: { id },
		include: { user: { select: { email: true } } },
	});
}

export function updateRole(id: string, role: OrgRole) {
	return prisma.orgMembership.update({
		where: { id },
		data: { role },
		include: { user: { select: { email: true } } },
	});
}

export function deleteById(id: string) {
	return prisma.orgMembership.delete({ where: { id } });
}

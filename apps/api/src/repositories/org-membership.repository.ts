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

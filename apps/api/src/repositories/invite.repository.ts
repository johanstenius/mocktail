import type { OrgRole } from "@prisma/client";
import { prisma } from "./db/prisma";

export type CreateInviteInput = {
	email: string;
	orgId: string;
	role: OrgRole;
	token: string;
	expiresAt: Date;
	invitedBy: string;
};

export function findActiveByOrgId(orgId: string) {
	return prisma.orgInvite.findMany({
		where: { orgId, expiresAt: { gt: new Date() } },
		orderBy: { createdAt: "desc" },
	});
}

export function findByToken(token: string) {
	return prisma.orgInvite.findUnique({
		where: { token },
		include: { org: { select: { name: true } } },
	});
}

export function findById(id: string) {
	return prisma.orgInvite.findUnique({ where: { id } });
}

export function findByEmailAndOrg(email: string, orgId: string) {
	return prisma.orgInvite.findUnique({
		where: { email_orgId: { email, orgId } },
	});
}

export function create(data: CreateInviteInput) {
	return prisma.orgInvite.create({ data });
}

export function deleteById(id: string) {
	return prisma.orgInvite.delete({ where: { id } });
}

export function deleteByToken(token: string) {
	return prisma.orgInvite.delete({ where: { token } });
}

export function deleteExpired() {
	return prisma.orgInvite.deleteMany({
		where: { expiresAt: { lt: new Date() } },
	});
}

export async function acceptForExistingUser(
	inviteId: string,
	userId: string,
	orgId: string,
	role: OrgRole,
) {
	return prisma.$transaction(async (tx) => {
		await tx.orgMembership.create({
			data: { userId, orgId, role },
		});
		await tx.orgInvite.delete({ where: { id: inviteId } });
	});
}

export async function acceptWithNewUser(
	inviteId: string,
	email: string,
	passwordHash: string,
	orgId: string,
	role: OrgRole,
) {
	return prisma.$transaction(async (tx) => {
		const user = await tx.user.create({
			data: { email, passwordHash },
		});

		await tx.orgMembership.create({
			data: { userId: user.id, orgId, role },
		});

		await tx.orgInvite.delete({ where: { id: inviteId } });

		return { user };
	});
}

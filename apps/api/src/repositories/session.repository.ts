import { prisma } from "./db/prisma";

export function findByToken(token: string) {
	return prisma.session.findUnique({
		where: { token },
		include: { user: { select: { id: true, email: true, name: true } } },
	});
}

export function findMembershipByOrgAndUser(orgId: string, userId: string) {
	return prisma.member.findUnique({
		where: {
			organizationId_userId: {
				organizationId: orgId,
				userId,
			},
		},
	});
}

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

export function countProjectsByOrgId(orgId: string) {
	return prisma.project.count({
		where: { orgId },
	});
}

export function countMembersByOrgId(orgId: string) {
	return prisma.member.count({
		where: { organizationId: orgId },
	});
}

export function countPendingInvitesByOrgId(orgId: string) {
	return prisma.invitation.count({
		where: {
			organizationId: orgId,
			status: "pending",
			expiresAt: { gt: new Date() },
		},
	});
}

export function findByIdWithUsage(id: string) {
	return prisma.organization.findUnique({
		where: { id },
		include: {
			subscription: true,
			_count: {
				select: {
					projects: true,
					members: true,
				},
			},
			projects: {
				include: {
					_count: { select: { endpoints: true } },
				},
			},
		},
	});
}

export function findAllWithProjectsForCleanup() {
	return prisma.organization.findMany({
		include: {
			subscription: { select: { tier: true } },
			projects: { select: { id: true } },
		},
	});
}

// Find owner of an organization (for billing emails etc)
export function findOwnerEmail(orgId: string) {
	return prisma.member.findFirst({
		where: { organizationId: orgId, role: "owner" },
		include: { user: { select: { email: true } } },
	});
}

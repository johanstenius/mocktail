import type { Tier } from "@prisma/client";
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

export function findByStripeCustomerId(stripeCustomerId: string) {
	return prisma.organization.findUnique({
		where: { stripeCustomerId },
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

export function countMembersByOrgId(orgId: string) {
	return prisma.orgMembership.count({
		where: { orgId },
	});
}

export function countPendingInvitesByOrgId(orgId: string) {
	return prisma.orgInvite.count({
		where: {
			orgId,
			expiresAt: { gt: new Date() },
		},
	});
}

export function updateStripeCustomerId(
	orgId: string,
	stripeCustomerId: string,
) {
	return prisma.organization.update({
		where: { id: orgId },
		data: { stripeCustomerId },
	});
}

export type SubscriptionUpdate = {
	tier?: Tier;
	stripeSubscriptionId?: string | null;
	stripeCancelAtPeriodEnd?: boolean;
	stripeCurrentPeriodEnd?: Date | null;
	paymentFailedAt?: Date | null;
	lastFailedInvoiceId?: string | null;
};

export function updateSubscription(orgId: string, data: SubscriptionUpdate) {
	return prisma.organization.update({
		where: { id: orgId },
		data,
	});
}

export function incrementMonthlyRequests(orgId: string) {
	return prisma.organization.update({
		where: { id: orgId },
		data: { monthlyRequests: { increment: 1 } },
	});
}

export function resetMonthlyRequests(orgId: string) {
	return prisma.organization.update({
		where: { id: orgId },
		data: {
			monthlyRequests: 0,
			requestResetAt: new Date(),
		},
	});
}

export function findOrgsWithExpiredGrace(graceDays: number) {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - graceDays);

	return prisma.organization.findMany({
		where: {
			paymentFailedAt: { lt: cutoff },
			tier: "pro",
		},
	});
}

export function findOrgsNeedingReminder(reminderDay: number) {
	const startOfWindow = new Date();
	startOfWindow.setDate(startOfWindow.getDate() - reminderDay);
	startOfWindow.setHours(0, 0, 0, 0);

	const endOfWindow = new Date();
	endOfWindow.setDate(endOfWindow.getDate() - reminderDay + 1);
	endOfWindow.setHours(0, 0, 0, 0);

	return prisma.organization.findMany({
		where: {
			paymentFailedAt: {
				gte: startOfWindow,
				lt: endOfWindow,
			},
			tier: "pro",
		},
		include: {
			owner: { select: { email: true } },
		},
	});
}

export function findByIdWithUsage(id: string) {
	return prisma.organization.findUnique({
		where: { id },
		include: {
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
		select: {
			id: true,
			name: true,
			tier: true,
			projects: { select: { id: true } },
		},
	});
}

export function findOwnerEmail(ownerId: string) {
	return prisma.user.findUnique({
		where: { id: ownerId },
		select: { email: true },
	});
}

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

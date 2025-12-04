import type { Tier } from "@prisma/client";
import { prisma } from "./db/prisma";

export function findByOrgId(orgId: string) {
	return prisma.subscription.findUnique({
		where: { organizationId: orgId },
	});
}

export function findByStripeCustomerId(stripeCustomerId: string) {
	return prisma.subscription.findFirst({
		where: { stripeCustomerId },
	});
}

export function create(orgId: string) {
	return prisma.subscription.create({
		data: { organizationId: orgId, tier: "free" },
	});
}

export function updateStripeCustomerId(
	orgId: string,
	stripeCustomerId: string,
) {
	return prisma.subscription.update({
		where: { organizationId: orgId },
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

export function update(orgId: string, data: SubscriptionUpdate) {
	return prisma.subscription.update({
		where: { organizationId: orgId },
		data,
	});
}

export function incrementMonthlyRequests(orgId: string) {
	return prisma.subscription.update({
		where: { organizationId: orgId },
		data: { monthlyRequests: { increment: 1 } },
	});
}

export function resetMonthlyRequests(orgId: string) {
	return prisma.subscription.update({
		where: { organizationId: orgId },
		data: {
			monthlyRequests: 0,
			requestResetAt: new Date(),
		},
	});
}

export function findWithExpiredGrace(graceDays: number) {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - graceDays);

	return prisma.subscription.findMany({
		where: {
			paymentFailedAt: { lt: cutoff },
			tier: "pro",
		},
		include: { organization: true },
	});
}

export function findNeedingReminder(reminderDay: number) {
	const startOfWindow = new Date();
	startOfWindow.setDate(startOfWindow.getDate() - reminderDay);
	startOfWindow.setHours(0, 0, 0, 0);

	const endOfWindow = new Date();
	endOfWindow.setDate(endOfWindow.getDate() - reminderDay + 1);
	endOfWindow.setHours(0, 0, 0, 0);

	return prisma.subscription.findMany({
		where: {
			paymentFailedAt: {
				gte: startOfWindow,
				lt: endOfWindow,
			},
			tier: "pro",
		},
		include: { organization: true },
	});
}

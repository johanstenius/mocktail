import type { Tier } from "@prisma/client";
import { getLimits } from "../config/limits";
import { prisma } from "../repositories/db/prisma";
import * as orgRepo from "../repositories/organization.repository";

export type LimitCheckResult = {
	allowed: boolean;
	reason?: string;
	current: number;
	limit: number;
};

export type UsageData = {
	tier: Tier;
	projects: { used: number; limit: number };
	endpoints: { used: number; limit: number };
	members: { used: number; limit: number };
	requests: { used: number; limit: number };
	cancelAtPeriodEnd: boolean;
	currentPeriodEnd: Date | null;
};

export async function getUsage(orgId: string): Promise<UsageData | null> {
	const org = await prisma.organization.findUnique({
		where: { id: orgId },
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

	if (!org) return null;

	const limits = getLimits(org.tier);
	const totalEndpoints = org.projects.reduce(
		(sum, p) => sum + p._count.endpoints,
		0,
	);

	return {
		tier: org.tier,
		projects: { used: org._count.projects, limit: limits.projects },
		endpoints: {
			used: totalEndpoints,
			limit: limits.endpointsPerProject * org._count.projects,
		},
		members: { used: org._count.members, limit: limits.teamMembers },
		requests: { used: org.monthlyRequests, limit: limits.monthlyRequests },
		cancelAtPeriodEnd: org.stripeCancelAtPeriodEnd,
		currentPeriodEnd: org.stripeCurrentPeriodEnd,
	};
}

export async function checkProjectLimit(
	orgId: string,
): Promise<LimitCheckResult> {
	const org = await orgRepo.findById(orgId);
	if (!org) {
		return { allowed: false, reason: "Org not found", current: 0, limit: 0 };
	}

	const limits = getLimits(org.tier);
	const count = await orgRepo.countProjectsByOrgId(orgId);

	if (count >= limits.projects) {
		return {
			allowed: false,
			reason: `Project limit reached (${limits.projects})`,
			current: count,
			limit: limits.projects,
		};
	}

	return { allowed: true, current: count, limit: limits.projects };
}

export async function checkMemberLimit(
	orgId: string,
): Promise<LimitCheckResult> {
	const org = await orgRepo.findById(orgId);
	if (!org) {
		return { allowed: false, reason: "Org not found", current: 0, limit: 0 };
	}

	const limits = getLimits(org.tier);
	const count = await orgRepo.countMembersByOrgId(orgId);

	if (count >= limits.teamMembers) {
		return {
			allowed: false,
			reason: `Team member limit reached (${limits.teamMembers})`,
			current: count,
			limit: limits.teamMembers,
		};
	}

	return { allowed: true, current: count, limit: limits.teamMembers };
}

export async function trackRequest(
	orgId: string,
): Promise<{ allowed: boolean; remaining: number }> {
	const org = await orgRepo.findById(orgId);
	if (!org) {
		return { allowed: false, remaining: 0 };
	}

	const limits = getLimits(org.tier);

	// Check if we need to reset (first of month)
	const now = new Date();
	const resetAt = org.requestResetAt;
	if (
		!resetAt ||
		resetAt.getMonth() !== now.getMonth() ||
		resetAt.getFullYear() !== now.getFullYear()
	) {
		await orgRepo.resetMonthlyRequests(orgId);
		return { allowed: true, remaining: limits.monthlyRequests - 1 };
	}

	// Check quota
	if (org.monthlyRequests >= limits.monthlyRequests) {
		return { allowed: false, remaining: 0 };
	}

	await orgRepo.incrementMonthlyRequests(orgId);
	return {
		allowed: true,
		remaining: limits.monthlyRequests - org.monthlyRequests - 1,
	};
}

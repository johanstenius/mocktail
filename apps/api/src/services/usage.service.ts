import type { Tier } from "@prisma/client";
import { TIER_LIMITS, isUnlimited } from "../config/tiers";
import * as orgRepo from "../repositories/organization.repository";
import * as usageRepo from "../repositories/usage.repository";

export type UsageSummary = {
	apiCalls: number;
	apiCallsLimit: number;
	projectCount: number;
	projectLimit: number;
};

export type LimitCheck = {
	allowed: boolean;
	reason?: string;
};

export async function recordApiCall(orgId: string): Promise<void> {
	const now = new Date();
	await usageRepo.incrementApiCalls(
		orgId,
		now.getFullYear(),
		now.getMonth() + 1,
	);
}

export async function checkApiCallLimit(
	orgId: string,
	tier: Tier,
): Promise<LimitCheck> {
	const limits = TIER_LIMITS[tier];
	if (isUnlimited(limits.apiCallsPerMonth)) {
		return { allowed: true };
	}

	const now = new Date();
	const usage = await usageRepo.findByOrgAndMonth(
		orgId,
		now.getFullYear(),
		now.getMonth() + 1,
	);
	const currentCalls = usage?.apiCalls ?? 0;

	if (currentCalls >= limits.apiCallsPerMonth) {
		return {
			allowed: false,
			reason: `Monthly API call limit (${limits.apiCallsPerMonth}) exceeded`,
		};
	}

	return { allowed: true };
}

export async function checkProjectLimit(
	orgId: string,
	tier: Tier,
): Promise<LimitCheck> {
	const limits = TIER_LIMITS[tier];
	if (isUnlimited(limits.maxProjects)) {
		return { allowed: true };
	}

	const projectCount = await orgRepo.countProjectsByOrgId(orgId);
	if (projectCount >= limits.maxProjects) {
		return {
			allowed: false,
			reason: `Project limit (${limits.maxProjects}) reached`,
		};
	}

	return { allowed: true };
}

export async function getUsageSummary(
	orgId: string,
	tier: Tier,
): Promise<UsageSummary> {
	const limits = TIER_LIMITS[tier];
	const now = new Date();

	const [usage, projectCount] = await Promise.all([
		usageRepo.findByOrgAndMonth(orgId, now.getFullYear(), now.getMonth() + 1),
		orgRepo.countProjectsByOrgId(orgId),
	]);

	return {
		apiCalls: usage?.apiCalls ?? 0,
		apiCallsLimit: limits.apiCallsPerMonth,
		projectCount,
		projectLimit: limits.maxProjects,
	};
}

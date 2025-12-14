import { type TierFeatures, getFeatures, getLimits } from "../config/limits";
import * as endpointRepo from "../repositories/endpoint.repository";
import * as orgRepo from "../repositories/organization.repository";
import * as projectRepo from "../repositories/project.repository";
import * as subRepo from "../repositories/subscription.repository";
import { featureGated, quotaExceeded } from "../utils/errors";
import { logger } from "../utils/logger";

export type Tier = "free" | "pro";

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
	features: TierFeatures;
	cancelAtPeriodEnd: boolean;
	currentPeriodEnd: Date | null;
	paymentFailedAt: Date | null;
};

async function getOrCreateSubscription(orgId: string) {
	const sub = await subRepo.findByOrgId(orgId);
	if (sub) return sub;

	logger.warn(
		{ orgId },
		"subscription missing for org, creating fallback free tier",
	);
	return subRepo.create(orgId);
}

export async function getUsage(orgId: string): Promise<UsageData | null> {
	const org = await orgRepo.findByIdWithUsage(orgId);

	if (!org) return null;

	const sub = org.subscription ?? (await getOrCreateSubscription(orgId));
	const limits = getLimits(sub.tier);
	const features = getFeatures(sub.tier);
	const totalEndpoints = org.projects.reduce(
		(sum, p) => sum + p._count.endpoints,
		0,
	);
	const pendingInvites = await orgRepo.countPendingInvitesByOrgId(orgId);

	return {
		tier: sub.tier as Tier,
		projects: { used: org._count.projects, limit: limits.projects },
		endpoints: {
			used: totalEndpoints,
			limit: limits.endpointsPerProject * limits.projects,
		},
		members: {
			used: org._count.members + pendingInvites,
			limit: limits.teamMembers,
		},
		requests: { used: sub.monthlyRequests, limit: limits.monthlyRequests },
		features,
		cancelAtPeriodEnd: sub.stripeCancelAtPeriodEnd,
		currentPeriodEnd: sub.stripeCurrentPeriodEnd,
		paymentFailedAt: sub.paymentFailedAt,
	};
}

export async function checkProjectLimit(
	orgId: string,
): Promise<LimitCheckResult> {
	const sub = await getOrCreateSubscription(orgId);
	const limits = getLimits(sub.tier);
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
	const sub = await getOrCreateSubscription(orgId);
	const limits = getLimits(sub.tier);
	const memberCount = await orgRepo.countMembersByOrgId(orgId);
	const inviteCount = await orgRepo.countPendingInvitesByOrgId(orgId);
	const total = memberCount + inviteCount;

	if (total >= limits.teamMembers) {
		return {
			allowed: false,
			reason: `Team member limit reached (${limits.teamMembers})`,
			current: total,
			limit: limits.teamMembers,
		};
	}

	return { allowed: true, current: total, limit: limits.teamMembers };
}

export async function checkEndpointLimit(
	projectId: string,
): Promise<LimitCheckResult> {
	const project = await projectRepo.findByIdWithOrg(projectId);
	if (!project) {
		return {
			allowed: false,
			reason: "Project not found",
			current: 0,
			limit: 0,
		};
	}

	const sub = await getOrCreateSubscription(project.orgId);
	const limits = getLimits(sub.tier);
	const count = await endpointRepo.countByProjectId(projectId);

	if (count >= limits.endpointsPerProject) {
		return {
			allowed: false,
			reason: `Endpoint limit reached (${limits.endpointsPerProject} per project)`,
			current: count,
			limit: limits.endpointsPerProject,
		};
	}

	return { allowed: true, current: count, limit: limits.endpointsPerProject };
}

export async function trackRequest(
	orgId: string,
): Promise<{ allowed: boolean; remaining: number }> {
	const sub = await getOrCreateSubscription(orgId);
	const limits = getLimits(sub.tier);

	const now = new Date();
	const resetAt = sub.requestResetAt;
	if (
		!resetAt ||
		resetAt.getMonth() !== now.getMonth() ||
		resetAt.getFullYear() !== now.getFullYear()
	) {
		await subRepo.resetMonthlyRequests(orgId);
		return { allowed: true, remaining: limits.monthlyRequests - 1 };
	}

	if (sub.monthlyRequests >= limits.monthlyRequests) {
		return { allowed: false, remaining: 0 };
	}

	await subRepo.incrementMonthlyRequests(orgId);
	return {
		allowed: true,
		remaining: limits.monthlyRequests - sub.monthlyRequests - 1,
	};
}

export async function trackProjectRequest(projectId: string): Promise<void> {
	const project = await projectRepo.findById(projectId);
	if (!project) return;

	const now = new Date();
	const resetAt = project.requestResetAt;
	if (
		!resetAt ||
		resetAt.getMonth() !== now.getMonth() ||
		resetAt.getFullYear() !== now.getFullYear()
	) {
		await projectRepo.resetMonthlyRequests(project.id);
		return;
	}

	await projectRepo.incrementMonthlyRequests(project.id);
}

function requireLimit(result: LimitCheckResult): void {
	if (!result.allowed) {
		throw quotaExceeded(result.reason ?? "Limit reached");
	}
}

export async function requireProjectLimit(orgId: string): Promise<void> {
	requireLimit(await checkProjectLimit(orgId));
}

export async function requireMemberLimit(orgId: string): Promise<void> {
	requireLimit(await checkMemberLimit(orgId));
}

export async function requireEndpointLimit(projectId: string): Promise<void> {
	requireLimit(await checkEndpointLimit(projectId));
}

export function checkFeature(tier: Tier, feature: keyof TierFeatures): boolean {
	const features = getFeatures(tier);
	return features[feature];
}

export async function requireFeature(
	orgId: string,
	feature: keyof TierFeatures,
): Promise<void> {
	const sub = await getOrCreateSubscription(orgId);
	const features = getFeatures(sub.tier);
	if (!features[feature]) {
		throw featureGated(feature);
	}
}

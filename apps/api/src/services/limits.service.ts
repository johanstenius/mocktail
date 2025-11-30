import { getLimits } from "../config/limits";
import * as endpointRepo from "../repositories/endpoint.repository";
import * as orgRepo from "../repositories/organization.repository";
import * as projectRepo from "../repositories/project.repository";
import { quotaExceeded } from "../utils/errors";

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
	cancelAtPeriodEnd: boolean;
	currentPeriodEnd: Date | null;
	paymentFailedAt: Date | null;
};

export async function getUsage(orgId: string): Promise<UsageData | null> {
	const org = await orgRepo.findByIdWithUsage(orgId);

	if (!org) return null;

	const limits = getLimits(org.tier);
	const totalEndpoints = org.projects.reduce(
		(sum, p) => sum + p._count.endpoints,
		0,
	);
	const pendingInvites = await orgRepo.countPendingInvitesByOrgId(orgId);

	return {
		tier: org.tier as Tier,
		projects: { used: org._count.projects, limit: limits.projects },
		endpoints: {
			used: totalEndpoints,
			limit: limits.endpointsPerProject * org._count.projects,
		},
		members: {
			used: org._count.members + pendingInvites,
			limit: limits.teamMembers,
		},
		requests: { used: org.monthlyRequests, limit: limits.monthlyRequests },
		cancelAtPeriodEnd: org.stripeCancelAtPeriodEnd,
		currentPeriodEnd: org.stripeCurrentPeriodEnd,
		paymentFailedAt: org.paymentFailedAt,
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

	const limits = getLimits(project.org.tier);
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
	const org = await orgRepo.findById(orgId);
	if (!org) {
		return { allowed: false, remaining: 0 };
	}

	const limits = getLimits(org.tier);

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

	if (org.monthlyRequests >= limits.monthlyRequests) {
		return { allowed: false, remaining: 0 };
	}

	await orgRepo.incrementMonthlyRequests(orgId);
	return {
		allowed: true,
		remaining: limits.monthlyRequests - org.monthlyRequests - 1,
	};
}

export async function trackProjectRequest(projectId: string): Promise<void> {
	const project = await projectRepo.findByIdWithOrg(projectId);
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

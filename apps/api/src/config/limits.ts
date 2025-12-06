import type { Tier } from "@prisma/client";

export type TierLimits = {
	projects: number;
	endpointsPerProject: number;
	teamMembers: number;
	monthlyRequests: number;
	rateLimit: number;
	requestLogRetentionDays: number;
	auditLogRetentionDays: number;
};

export const TIER_LIMITS: Record<Tier, TierLimits> = {
	free: {
		projects: 2,
		endpointsPerProject: 5,
		teamMembers: 1,
		monthlyRequests: 1_000,
		rateLimit: 5,
		requestLogRetentionDays: 1,
		auditLogRetentionDays: 3,
	},
	pro: {
		projects: 10,
		endpointsPerProject: 50,
		teamMembers: 10,
		monthlyRequests: 100_000,
		rateLimit: 50,
		requestLogRetentionDays: 30,
		auditLogRetentionDays: 30,
	},
} as const;

export const UNAUTHENTICATED_RATE_LIMIT = 10;

export function getLimits(tier: Tier): TierLimits {
	return TIER_LIMITS[tier];
}

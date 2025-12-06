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
		projects: 3,
		endpointsPerProject: 10,
		teamMembers: 3,
		monthlyRequests: 5_000,
		rateLimit: 5,
		requestLogRetentionDays: 3,
		auditLogRetentionDays: 7,
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

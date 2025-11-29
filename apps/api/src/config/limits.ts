import type { Tier } from "@prisma/client";

export type TierLimits = {
	projects: number;
	endpointsPerProject: number;
	teamMembers: number;
	monthlyRequests: number;
	rateLimit: number;
};

export const TIER_LIMITS: Record<Tier, TierLimits> = {
	free: {
		projects: 3,
		endpointsPerProject: 10,
		teamMembers: 3,
		monthlyRequests: 10_000,
		rateLimit: 10,
	},
	pro: {
		projects: 20,
		endpointsPerProject: 100,
		teamMembers: Number.POSITIVE_INFINITY,
		monthlyRequests: 500_000,
		rateLimit: 100,
	},
	enterprise: {
		projects: Number.POSITIVE_INFINITY,
		endpointsPerProject: Number.POSITIVE_INFINITY,
		teamMembers: Number.POSITIVE_INFINITY,
		monthlyRequests: Number.POSITIVE_INFINITY,
		rateLimit: 1000,
	},
} as const;

export const UNAUTHENTICATED_RATE_LIMIT = 20;

export function getLimits(tier: Tier): TierLimits {
	return TIER_LIMITS[tier];
}

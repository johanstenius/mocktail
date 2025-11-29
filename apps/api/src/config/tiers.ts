import type { Tier } from "@prisma/client";

export type TierLimits = {
	apiCallsPerMonth: number;
	maxProjects: number;
	maxEndpointsPerProject: number;
};

export const TIER_LIMITS: Record<Tier, TierLimits> = {
	free: { apiCallsPerMonth: 10000, maxProjects: 3, maxEndpointsPerProject: 20 },
	pro: {
		apiCallsPerMonth: 100000,
		maxProjects: 20,
		maxEndpointsPerProject: 100,
	},
	enterprise: {
		apiCallsPerMonth: -1,
		maxProjects: -1,
		maxEndpointsPerProject: -1,
	},
};

export function isUnlimited(limit: number): boolean {
	return limit === -1;
}

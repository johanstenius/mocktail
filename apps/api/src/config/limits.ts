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

export type TierFeatures = {
	proxyMode: boolean;
	statefulMocks: boolean;
};

export type TierConfig = {
	limits: TierLimits;
	features: TierFeatures;
};

export const TIER_CONFIG: Record<Tier, TierConfig> = {
	free: {
		limits: {
			projects: 1,
			endpointsPerProject: 5,
			teamMembers: 1,
			monthlyRequests: 1_000,
			rateLimit: 5,
			requestLogRetentionDays: 1,
			auditLogRetentionDays: 3,
		},
		features: {
			proxyMode: false,
			statefulMocks: false,
		},
	},
	pro: {
		limits: {
			projects: 10,
			endpointsPerProject: 50,
			teamMembers: 10,
			monthlyRequests: 100_000,
			rateLimit: 50,
			requestLogRetentionDays: 30,
			auditLogRetentionDays: 30,
		},
		features: {
			proxyMode: true,
			statefulMocks: true,
		},
	},
} as const;

export const UNAUTHENTICATED_RATE_LIMIT = 10;

export function getLimits(tier: Tier): TierLimits {
	return TIER_CONFIG[tier].limits;
}

export function getFeatures(tier: Tier): TierFeatures {
	return TIER_CONFIG[tier].features;
}

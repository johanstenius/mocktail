"use client";

import { getUsage } from "@/lib/api";
import type { Tier, TierFeatures } from "@/types";
import { useQuery } from "@tanstack/react-query";

export type FeaturesResult = {
	features: TierFeatures | undefined;
	tier: Tier | undefined;
	isLoading: boolean;
};

export function useFeatures(): FeaturesResult {
	const { data: usage, isLoading } = useQuery({
		queryKey: ["billing", "usage"],
		queryFn: getUsage,
		staleTime: 5 * 60 * 1000,
	});

	return {
		features: usage?.features,
		tier: usage?.tier,
		isLoading,
	};
}

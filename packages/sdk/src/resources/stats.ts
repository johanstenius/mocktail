import type { Statistics } from "../types";
import type { HttpClient } from "../utils/http";

export type StatsResource = {
	get(projectId: string): Promise<Statistics>;
};

export function createStatsResource(http: HttpClient): StatsResource {
	return {
		async get(projectId) {
			return http.request<Statistics>(`/projects/${projectId}/statistics`);
		},
	};
}

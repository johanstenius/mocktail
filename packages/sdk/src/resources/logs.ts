import type { RequestLog, RequestLogFilters } from "../types";
import type { HttpClient } from "../utils/http";

export type LogsResource = {
	list(
		projectId: string,
		filters?: RequestLogFilters,
	): Promise<{ logs: RequestLog[]; total: number }>;
	get(projectId: string, logId: string): Promise<RequestLog>;
	clear(projectId: string): Promise<{ deleted: number }>;
};

export function createLogsResource(http: HttpClient): LogsResource {
	return {
		async list(projectId, filters = {}) {
			return http.request<{ logs: RequestLog[]; total: number }>(
				`/projects/${projectId}/logs`,
				{
					query: filters as Record<string, string | number | undefined>,
				},
			);
		},

		async get(projectId, logId) {
			return http.request<RequestLog>(`/projects/${projectId}/logs/${logId}`);
		},

		async clear(projectId) {
			return http.request<{ deleted: number }>(`/projects/${projectId}/logs`, {
				method: "DELETE",
			});
		},
	};
}

import type { ImportOptions, ImportResult } from "../types";
import type { HttpClient } from "../utils/http";

export type ImportResource = {
	openapi(
		projectId: string,
		spec: string | object,
		options?: ImportOptions,
	): Promise<ImportResult>;
};

export function createImportResource(http: HttpClient): ImportResource {
	return {
		async openapi(projectId, spec, options = {}) {
			return http.request<ImportResult>(`/projects/${projectId}/import`, {
				method: "POST",
				body: { spec, options },
			});
		},
	};
}

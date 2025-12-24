import type { CreateVariantInput, UpdateVariantInput, Variant } from "../types";
import type { HttpClient } from "../utils/http";

export type VariantsResource = {
	list(projectId: string, endpointId: string): Promise<Variant[]>;
	get(
		projectId: string,
		endpointId: string,
		variantId: string,
	): Promise<Variant>;
	create(
		projectId: string,
		endpointId: string,
		input: CreateVariantInput,
	): Promise<Variant>;
	update(
		projectId: string,
		endpointId: string,
		variantId: string,
		input: UpdateVariantInput,
	): Promise<Variant>;
	delete(
		projectId: string,
		endpointId: string,
		variantId: string,
	): Promise<void>;
	reorder(
		projectId: string,
		endpointId: string,
		variantIds: string[],
	): Promise<Variant[]>;
};

export function createVariantsResource(http: HttpClient): VariantsResource {
	function basePath(projectId: string, endpointId: string) {
		return `/projects/${projectId}/endpoints/${endpointId}/variants`;
	}

	return {
		async list(projectId, endpointId) {
			const res = await http.request<{ variants: Variant[] }>(
				basePath(projectId, endpointId),
			);
			return res.variants;
		},

		async get(projectId, endpointId, variantId) {
			return http.request<Variant>(
				`${basePath(projectId, endpointId)}/${variantId}`,
			);
		},

		async create(projectId, endpointId, input) {
			return http.request<Variant>(basePath(projectId, endpointId), {
				method: "POST",
				body: input,
			});
		},

		async update(projectId, endpointId, variantId, input) {
			return http.request<Variant>(
				`${basePath(projectId, endpointId)}/${variantId}`,
				{
					method: "PATCH",
					body: input,
				},
			);
		},

		async delete(projectId, endpointId, variantId) {
			await http.request(`${basePath(projectId, endpointId)}/${variantId}`, {
				method: "DELETE",
			});
		},

		async reorder(projectId, endpointId, variantIds) {
			const res = await http.request<{ variants: Variant[] }>(
				`${basePath(projectId, endpointId)}/reorder`,
				{
					method: "POST",
					body: { variantIds },
				},
			);
			return res.variants;
		},
	};
}

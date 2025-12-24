import type {
	CreateEndpointInput,
	Endpoint,
	UpdateEndpointInput,
} from "../types";
import type { HttpClient } from "../utils/http";

export type EndpointsResource = {
	list(projectId: string): Promise<Endpoint[]>;
	get(projectId: string, endpointId: string): Promise<Endpoint>;
	create(projectId: string, input: CreateEndpointInput): Promise<Endpoint>;
	update(
		projectId: string,
		endpointId: string,
		input: UpdateEndpointInput,
	): Promise<Endpoint>;
	delete(projectId: string, endpointId: string): Promise<void>;
};

export function createEndpointsResource(http: HttpClient): EndpointsResource {
	return {
		async list(projectId) {
			const res = await http.request<{ endpoints: Endpoint[] }>(
				`/projects/${projectId}/endpoints`,
			);
			return res.endpoints;
		},

		async get(projectId, endpointId) {
			return http.request<Endpoint>(
				`/projects/${projectId}/endpoints/${endpointId}`,
			);
		},

		async create(projectId, input) {
			return http.request<Endpoint>(`/projects/${projectId}/endpoints`, {
				method: "POST",
				body: input,
			});
		},

		async update(projectId, endpointId, input) {
			return http.request<Endpoint>(
				`/projects/${projectId}/endpoints/${endpointId}`,
				{
					method: "PATCH",
					body: input,
				},
			);
		},

		async delete(projectId, endpointId) {
			await http.request(`/projects/${projectId}/endpoints/${endpointId}`, {
				method: "DELETE",
			});
		},
	};
}

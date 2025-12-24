import type { CreateProjectInput, Project, UpdateProjectInput } from "../types";
import type { HttpClient } from "../utils/http";

export type ProjectsResource = {
	list(): Promise<Project[]>;
	get(id: string): Promise<Project>;
	create(input: CreateProjectInput): Promise<Project>;
	update(id: string, input: UpdateProjectInput): Promise<Project>;
	delete(id: string): Promise<void>;
	rotateKey(id: string): Promise<Project>;
	resetState(id: string): Promise<void>;
};

export function createProjectsResource(http: HttpClient): ProjectsResource {
	return {
		async list() {
			const res = await http.request<{ projects: Project[] }>("/projects");
			return res.projects;
		},

		async get(id) {
			return http.request<Project>(`/projects/${id}`);
		},

		async create(input) {
			return http.request<Project>("/projects", {
				method: "POST",
				body: input,
			});
		},

		async update(id, input) {
			return http.request<Project>(`/projects/${id}`, {
				method: "PATCH",
				body: input,
			});
		},

		async delete(id) {
			await http.request(`/projects/${id}`, { method: "DELETE" });
		},

		async rotateKey(id) {
			return http.request<Project>(`/projects/${id}/rotate-key`, {
				method: "POST",
			});
		},

		async resetState(id) {
			await http.request(`/projects/${id}/state/reset`, { method: "POST" });
		},
	};
}

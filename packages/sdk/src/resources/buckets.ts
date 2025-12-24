import type { Bucket, CreateBucketInput } from "../types";
import type { HttpClient } from "../utils/http";

export type BucketsResource = {
	list(projectId: string): Promise<Bucket[]>;
	get(projectId: string, name: string): Promise<Bucket>;
	create(projectId: string, input: CreateBucketInput): Promise<Bucket>;
	set(projectId: string, name: string, data: unknown[]): Promise<Bucket>;
	delete(projectId: string, name: string): Promise<void>;
};

export function createBucketsResource(http: HttpClient): BucketsResource {
	return {
		async list(projectId) {
			const res = await http.request<{ buckets: Bucket[] }>(
				`/projects/${projectId}/buckets`,
			);
			return res.buckets;
		},

		async get(projectId, name) {
			return http.request<Bucket>(`/projects/${projectId}/buckets/${name}`);
		},

		async create(projectId, input) {
			return http.request<Bucket>(`/projects/${projectId}/buckets`, {
				method: "POST",
				body: input,
			});
		},

		async set(projectId, name, data) {
			return http.request<Bucket>(`/projects/${projectId}/buckets/${name}`, {
				method: "PUT",
				body: { data },
			});
		},

		async delete(projectId, name) {
			await http.request(`/projects/${projectId}/buckets/${name}`, {
				method: "DELETE",
			});
		},
	};
}

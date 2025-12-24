import {
	type BucketsResource,
	createBucketsResource,
} from "./resources/buckets";
import {
	type EndpointsResource,
	createEndpointsResource,
} from "./resources/endpoints";
import { type ImportResource, createImportResource } from "./resources/import";
import { type LogsResource, createLogsResource } from "./resources/logs";
import {
	type ProjectsResource,
	createProjectsResource,
} from "./resources/projects";
import { type StatsResource, createStatsResource } from "./resources/stats";
import {
	type VariantsResource,
	createVariantsResource,
} from "./resources/variants";
import type {
	Bucket,
	CreateBucketInput,
	CreateEndpointInput,
	CreateVariantInput,
	Endpoint,
	ImportOptions,
	ImportResult,
	MocktailConfig,
	RequestLog,
	RequestLogFilters,
	Statistics,
	UpdateEndpointInput,
	UpdateVariantInput,
	Variant,
} from "./types";
import { createHttpClient } from "./utils/http";

const DEFAULT_BASE_URL = "https://api.mockspec.dev";

export type ProjectClient = {
	endpoints: {
		list(): Promise<Endpoint[]>;
		get(endpointId: string): Promise<Endpoint>;
		create(input: CreateEndpointInput): Promise<Endpoint>;
		update(endpointId: string, input: UpdateEndpointInput): Promise<Endpoint>;
		delete(endpointId: string): Promise<void>;
	};
	variants: {
		list(endpointId: string): Promise<Variant[]>;
		get(endpointId: string, variantId: string): Promise<Variant>;
		create(endpointId: string, input: CreateVariantInput): Promise<Variant>;
		update(
			endpointId: string,
			variantId: string,
			input: UpdateVariantInput,
		): Promise<Variant>;
		delete(endpointId: string, variantId: string): Promise<void>;
		reorder(endpointId: string, variantIds: string[]): Promise<Variant[]>;
	};
	buckets: {
		list(): Promise<Bucket[]>;
		get(name: string): Promise<Bucket>;
		create(input: CreateBucketInput): Promise<Bucket>;
		set(name: string, data: unknown[]): Promise<Bucket>;
		delete(name: string): Promise<void>;
	};
	logs: {
		list(
			filters?: RequestLogFilters,
		): Promise<{ logs: RequestLog[]; total: number }>;
		get(logId: string): Promise<RequestLog>;
		clear(): Promise<{ deleted: number }>;
	};
	stats: {
		get(): Promise<Statistics>;
	};
	import: {
		openapi(
			spec: string | object,
			options?: ImportOptions,
		): Promise<ImportResult>;
	};
};

export class Mocktail {
	readonly projects: ProjectsResource;
	readonly endpoints: EndpointsResource;
	readonly variants: VariantsResource;
	readonly buckets: BucketsResource;
	readonly logs: LogsResource;
	readonly stats: StatsResource;
	readonly import: ImportResource;

	constructor(config: MocktailConfig) {
		const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
		const http = createHttpClient(baseUrl, config.apiKey);

		this.projects = createProjectsResource(http);
		this.endpoints = createEndpointsResource(http);
		this.variants = createVariantsResource(http);
		this.buckets = createBucketsResource(http);
		this.logs = createLogsResource(http);
		this.stats = createStatsResource(http);
		this.import = createImportResource(http);
	}

	project(projectId: string): ProjectClient {
		return {
			endpoints: {
				list: () => this.endpoints.list(projectId),
				get: (endpointId) => this.endpoints.get(projectId, endpointId),
				create: (input) => this.endpoints.create(projectId, input),
				update: (endpointId, input) =>
					this.endpoints.update(projectId, endpointId, input),
				delete: (endpointId) => this.endpoints.delete(projectId, endpointId),
			},
			variants: {
				list: (endpointId) => this.variants.list(projectId, endpointId),
				get: (endpointId, variantId) =>
					this.variants.get(projectId, endpointId, variantId),
				create: (endpointId, input) =>
					this.variants.create(projectId, endpointId, input),
				update: (endpointId, variantId, input) =>
					this.variants.update(projectId, endpointId, variantId, input),
				delete: (endpointId, variantId) =>
					this.variants.delete(projectId, endpointId, variantId),
				reorder: (endpointId, variantIds) =>
					this.variants.reorder(projectId, endpointId, variantIds),
			},
			buckets: {
				list: () => this.buckets.list(projectId),
				get: (name) => this.buckets.get(projectId, name),
				create: (input) => this.buckets.create(projectId, input),
				set: (name, data) => this.buckets.set(projectId, name, data),
				delete: (name) => this.buckets.delete(projectId, name),
			},
			logs: {
				list: (filters) => this.logs.list(projectId, filters),
				get: (logId) => this.logs.get(projectId, logId),
				clear: () => this.logs.clear(projectId),
			},
			stats: {
				get: () => this.stats.get(projectId),
			},
			import: {
				openapi: (spec, options) =>
					this.import.openapi(projectId, spec, options),
			},
		};
	}
}

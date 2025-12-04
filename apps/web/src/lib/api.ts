import type {
	ActivityItem,
	AuditLog,
	CreateEndpointInput,
	CreateProjectInput,
	CreateVariantInput,
	DashboardStats,
	Endpoint,
	GetAuditLogsParams,
	ImportResult,
	ImportSpecInput,
	Project,
	ProjectStatistics,
	RequestLog,
	RequestSource,
	SampleProjectResult,
	UpdateEndpointInput,
	UpdateProjectInput,
	UpdateVariantInput,
	Usage,
	Variant,
} from "@/types";
import { ApiError } from "./errors";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options?.headers as Record<string, string>),
	};

	const res = await fetch(url, {
		...options,
		headers,
		credentials: "include",
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new ApiError(
			data.error ?? "Request failed",
			data.code ?? "INTERNAL_ERROR",
			data.fields,
		);
	}
	return res.json();
}

async function fetchVoid(url: string, options?: RequestInit): Promise<void> {
	const headers: Record<string, string> = {
		...(options?.headers as Record<string, string>),
	};

	const res = await fetch(url, {
		...options,
		headers,
		credentials: "include",
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new ApiError(
			data.error ?? "Request failed",
			data.code ?? "INTERNAL_ERROR",
			data.fields,
		);
	}
}

// Projects
export async function getProjects(): Promise<Project[]> {
	const data = await fetchJson<{ projects: Project[] }>(
		`${API_BASE}/api/projects`,
	);
	return data.projects;
}

export async function getProject(id: string): Promise<Project> {
	return fetchJson<Project>(`${API_BASE}/api/projects/${id}`);
}

export async function createProject(
	input: CreateProjectInput,
): Promise<Project> {
	return fetchJson<Project>(`${API_BASE}/api/projects`, {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export async function updateProject(
	id: string,
	input: UpdateProjectInput,
): Promise<Project> {
	return fetchJson<Project>(`${API_BASE}/api/projects/${id}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
}

export async function deleteProject(id: string): Promise<void> {
	await fetchVoid(`${API_BASE}/api/projects/${id}`, { method: "DELETE" });
}

// Endpoints
export async function getEndpoints(projectId: string): Promise<Endpoint[]> {
	const data = await fetchJson<{ endpoints: Endpoint[] }>(
		`${API_BASE}/api/projects/${projectId}/endpoints`,
	);
	return data.endpoints;
}

export async function getEndpoint(
	projectId: string,
	endpointId: string,
): Promise<Endpoint> {
	return fetchJson<Endpoint>(
		`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}`,
	);
}

export async function createEndpoint(
	projectId: string,
	input: CreateEndpointInput,
): Promise<Endpoint> {
	return fetchJson<Endpoint>(
		`${API_BASE}/api/projects/${projectId}/endpoints`,
		{
			method: "POST",
			body: JSON.stringify(input),
		},
	);
}

export async function updateEndpoint(
	projectId: string,
	endpointId: string,
	input: UpdateEndpointInput,
): Promise<Endpoint> {
	return fetchJson<Endpoint>(
		`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}`,
		{
			method: "PATCH",
			body: JSON.stringify(input),
		},
	);
}

export async function deleteEndpoint(
	projectId: string,
	endpointId: string,
): Promise<void> {
	await fetchVoid(
		`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}`,
		{ method: "DELETE" },
	);
}

// Request Logs
type GetLogsParams = {
	limit?: number;
	offset?: number;
	method?: string;
	status?: number;
	endpointId?: string;
	source?: RequestSource;
};

export async function getRequestLogs(
	projectId: string,
	params?: GetLogsParams,
): Promise<{ logs: RequestLog[]; total: number }> {
	const searchParams = new URLSearchParams();
	if (params?.limit) searchParams.set("limit", String(params.limit));
	if (params?.offset) searchParams.set("offset", String(params.offset));
	if (params?.method) searchParams.set("method", params.method);
	if (params?.status) searchParams.set("status", String(params.status));
	if (params?.endpointId) searchParams.set("endpointId", params.endpointId);
	if (params?.source) searchParams.set("source", params.source);

	const query = searchParams.toString();
	const url = `${API_BASE}/api/projects/${projectId}/logs${query ? `?${query}` : ""}`;
	return fetchJson<{ logs: RequestLog[]; total: number }>(url);
}

// Import
export async function importOpenApiSpec(
	projectId: string,
	input: ImportSpecInput,
): Promise<ImportResult> {
	return fetchJson<ImportResult>(
		`${API_BASE}/api/projects/${projectId}/import`,
		{
			method: "POST",
			body: JSON.stringify(input),
		},
	);
}

// Statistics
export async function getProjectStatistics(
	projectId: string,
): Promise<ProjectStatistics> {
	return fetchJson<ProjectStatistics>(
		`${API_BASE}/api/projects/${projectId}/statistics`,
	);
}

export type GlobalStatistics = {
	totalRequests: number;
	totalUnmatched: number;
	projectStats: Array<{
		projectId: string;
		projectName: string;
		projectSlug: string;
		requestCount: number;
		endpointCount: number;
		unmatchedCount: number;
	}>;
};

export async function getGlobalStatistics(): Promise<GlobalStatistics> {
	return fetchJson<GlobalStatistics>(`${API_BASE}/api/statistics`);
}

// Billing
export async function getUsage(): Promise<Usage> {
	return fetchJson<Usage>(`${API_BASE}/api/billing/usage`);
}

export async function createCheckoutSession(): Promise<{ url: string }> {
	return fetchJson<{ url: string }>(`${API_BASE}/api/billing/checkout`, {
		method: "POST",
	});
}

export async function cancelSubscription(): Promise<void> {
	await fetchVoid(`${API_BASE}/api/billing/cancel`, { method: "POST" });
}

export async function reactivateSubscription(): Promise<void> {
	await fetchVoid(`${API_BASE}/api/billing/reactivate`, { method: "POST" });
}

export async function retryPayment(): Promise<void> {
	await fetchVoid(`${API_BASE}/api/billing/retry-payment`, { method: "POST" });
}

// Audit Logs
export async function getAuditLogs(
	params?: GetAuditLogsParams,
): Promise<{ logs: AuditLog[]; total: number }> {
	const searchParams = new URLSearchParams();
	if (params?.limit) searchParams.set("limit", String(params.limit));
	if (params?.offset) searchParams.set("offset", String(params.offset));
	if (params?.action) searchParams.set("action", params.action);
	if (params?.actorId) searchParams.set("actorId", params.actorId);
	if (params?.targetType) searchParams.set("targetType", params.targetType);
	if (params?.from) searchParams.set("from", params.from);
	if (params?.to) searchParams.set("to", params.to);

	const query = searchParams.toString();
	const url = `${API_BASE}/api/audit-logs${query ? `?${query}` : ""}`;
	return fetchJson<{ logs: AuditLog[]; total: number }>(url);
}

export async function exportAuditLogs(
	format: "csv" | "json",
	params?: GetAuditLogsParams,
): Promise<Blob> {
	const searchParams = new URLSearchParams();
	searchParams.set("format", format);
	if (params?.action) searchParams.set("action", params.action);
	if (params?.actorId) searchParams.set("actorId", params.actorId);
	if (params?.targetType) searchParams.set("targetType", params.targetType);
	if (params?.from) searchParams.set("from", params.from);
	if (params?.to) searchParams.set("to", params.to);

	const res = await fetch(
		`${API_BASE}/api/audit-logs/export?${searchParams.toString()}`,
		{ credentials: "include" },
	);
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new ApiError(
			data.error ?? "Export failed",
			data.code ?? "INTERNAL_ERROR",
		);
	}
	return res.blob();
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
	return fetchJson<DashboardStats>(`${API_BASE}/api/dashboard/stats`);
}

export async function getDashboardActivity(
	limit = 10,
): Promise<ActivityItem[]> {
	const data = await fetchJson<{ activity: ActivityItem[] }>(
		`${API_BASE}/api/dashboard/activity?limit=${limit}`,
	);
	return data.activity;
}

// Sample project
export async function createSampleProject(): Promise<SampleProjectResult> {
	return fetchJson<SampleProjectResult>(
		`${API_BASE}/api/onboarding/sample-project`,
		{ method: "POST" },
	);
}

// Project API Key
export async function rotateProjectApiKey(projectId: string): Promise<Project> {
	return fetchJson<Project>(
		`${API_BASE}/api/projects/${projectId}/rotate-key`,
		{
			method: "POST",
		},
	);
}

// Variants
export async function getVariants(
	projectId: string,
	endpointId: string,
): Promise<Variant[]> {
	const data = await fetchJson<{ variants: Variant[] }>(
		`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}/variants`,
	);
	return data.variants;
}

export async function getVariant(
	projectId: string,
	endpointId: string,
	variantId: string,
): Promise<Variant> {
	return fetchJson<Variant>(
		`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}/variants/${variantId}`,
	);
}

export async function createVariant(
	projectId: string,
	endpointId: string,
	input: CreateVariantInput,
): Promise<Variant> {
	return fetchJson<Variant>(
		`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}/variants`,
		{
			method: "POST",
			body: JSON.stringify(input),
		},
	);
}

export async function updateVariant(
	projectId: string,
	endpointId: string,
	variantId: string,
	input: UpdateVariantInput,
): Promise<Variant> {
	return fetchJson<Variant>(
		`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}/variants/${variantId}`,
		{
			method: "PATCH",
			body: JSON.stringify(input),
		},
	);
}

export async function deleteVariant(
	projectId: string,
	endpointId: string,
	variantId: string,
): Promise<void> {
	await fetchVoid(
		`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}/variants/${variantId}`,
		{ method: "DELETE" },
	);
}

export async function reorderVariants(
	projectId: string,
	endpointId: string,
	variantIds: string[],
): Promise<Variant[]> {
	const data = await fetchJson<{ variants: Variant[] }>(
		`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}/variants/reorder`,
		{
			method: "POST",
			body: JSON.stringify({ variantIds }),
		},
	);
	return data.variants;
}

// Clear request logs
export async function clearRequestLogs(
	projectId: string,
): Promise<{ deleted: number }> {
	return fetchJson<{ deleted: number }>(
		`${API_BASE}/api/projects/${projectId}/logs`,
		{ method: "DELETE" },
	);
}

// Get session token for SSE (need raw session token from auth package)
export function getSessionToken(): string | null {
	// The session token is in cookies, but we can't access httpOnly cookies from JS
	// SSE will need to use a different approach - pass the session ID or use cookies
	// For now, we'll get it from the auth context
	return null;
}

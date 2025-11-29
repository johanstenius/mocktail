import type {
	AuthResponse,
	CreateEndpointInput,
	CreateProjectInput,
	Endpoint,
	ImportResult,
	ImportSpecInput,
	LoginInput,
	MeResponse,
	Project,
	ProjectStatistics,
	RegisterInput,
	RequestLog,
	TokenResponse,
	UpdateEndpointInput,
} from "@/types";

const API_BASE = "http://localhost:4000";
const TOKEN_KEY = "mocktail_tokens";

function getAccessToken(): string | null {
	const stored = localStorage.getItem(TOKEN_KEY);
	if (!stored) return null;
	try {
		const tokens = JSON.parse(stored) as TokenResponse;
		return tokens.accessToken;
	} catch {
		return null;
	}
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
	const token = getAccessToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options?.headers as Record<string, string>),
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const res = await fetch(url, {
		...options,
		headers,
	});
	if (!res.ok) {
		const error = await res.json().catch(() => ({ message: "Request failed" }));
		throw new Error(error.message || `HTTP ${res.status}`);
	}
	return res.json();
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

export async function deleteProject(id: string): Promise<void> {
	const token = getAccessToken();
	await fetch(`${API_BASE}/api/projects/${id}`, {
		method: "DELETE",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
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
	const token = getAccessToken();
	await fetch(`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}`, {
		method: "DELETE",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
}

// Request Logs
type GetLogsParams = {
	limit?: number;
	offset?: number;
	method?: string;
	status?: number;
	endpointId?: string;
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

// Auth
export async function register(input: RegisterInput): Promise<AuthResponse> {
	return fetchJson<AuthResponse>(`${API_BASE}/api/auth/register`, {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export async function login(input: LoginInput): Promise<AuthResponse> {
	return fetchJson<AuthResponse>(`${API_BASE}/api/auth/login`, {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export async function logout(refreshToken: string): Promise<void> {
	await fetch(`${API_BASE}/api/auth/logout`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken }),
	});
}

export async function refreshTokens(
	refreshToken: string,
): Promise<TokenResponse> {
	return fetchJson<TokenResponse>(`${API_BASE}/api/auth/refresh`, {
		method: "POST",
		body: JSON.stringify({ refreshToken }),
	});
}

export async function getMe(accessToken: string): Promise<MeResponse> {
	return fetchJson<MeResponse>(`${API_BASE}/api/auth/me`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});
}

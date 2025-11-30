import type {
	AcceptInviteResponse,
	ActivityItem,
	ApiKey,
	AuthResponse,
	CreateApiKeyInput,
	CreateApiKeyResponse,
	CreateEndpointInput,
	CreateInviteInput,
	CreateProjectInput,
	DashboardStats,
	Endpoint,
	ImportResult,
	ImportSpecInput,
	Invite,
	InviteInfo,
	LoginInput,
	MeResponse,
	Member,
	OrgRole,
	Project,
	ProjectStatistics,
	RegisterInput,
	RequestLog,
	SampleProjectResult,
	TokenResponse,
	UpdateEndpointInput,
	Usage,
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

export async function forgotPassword(email: string): Promise<void> {
	await fetchJson<{ message: string }>(`${API_BASE}/api/auth/forgot-password`, {
		method: "POST",
		body: JSON.stringify({ email }),
	});
}

export async function resetPassword(
	token: string,
	password: string,
): Promise<void> {
	await fetchJson<{ message: string }>(`${API_BASE}/api/auth/reset-password`, {
		method: "POST",
		body: JSON.stringify({ token, password }),
	});
}

// Members
export async function getMembers(): Promise<Member[]> {
	const data = await fetchJson<{ members: Member[] }>(
		`${API_BASE}/api/members`,
	);
	return data.members;
}

export async function updateMemberRole(
	memberId: string,
	role: OrgRole,
): Promise<Member> {
	const data = await fetchJson<{ member: Member }>(
		`${API_BASE}/api/members/${memberId}`,
		{
			method: "PATCH",
			body: JSON.stringify({ role }),
		},
	);
	return data.member;
}

export async function removeMember(memberId: string): Promise<void> {
	const token = getAccessToken();
	await fetch(`${API_BASE}/api/members/${memberId}`, {
		method: "DELETE",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
}

// Invites
export async function getInvites(): Promise<Invite[]> {
	const data = await fetchJson<{ invites: Invite[] }>(
		`${API_BASE}/api/invites`,
	);
	return data.invites;
}

export async function createInvite(input: CreateInviteInput): Promise<Invite> {
	const data = await fetchJson<{ invite: Invite }>(`${API_BASE}/api/invites`, {
		method: "POST",
		body: JSON.stringify(input),
	});
	return data.invite;
}

export async function revokeInvite(inviteId: string): Promise<void> {
	const token = getAccessToken();
	await fetch(`${API_BASE}/api/invites/${inviteId}`, {
		method: "DELETE",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
}

export async function getInviteByToken(token: string): Promise<InviteInfo> {
	const data = await fetchJson<{ invite: InviteInfo }>(
		`${API_BASE}/api/invites/token?token=${encodeURIComponent(token)}`,
	);
	return data.invite;
}

export async function acceptInvite(
	token: string,
	password?: string,
): Promise<AcceptInviteResponse> {
	return fetchJson<AcceptInviteResponse>(`${API_BASE}/api/invites/accept`, {
		method: "POST",
		body: JSON.stringify({ token, password }),
	});
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
	await fetchJson<{ success: boolean }>(`${API_BASE}/api/billing/cancel`, {
		method: "POST",
	});
}

export async function reactivateSubscription(): Promise<void> {
	await fetchJson<{ success: boolean }>(`${API_BASE}/api/billing/reactivate`, {
		method: "POST",
	});
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

// Onboarding
export async function completeOnboarding(): Promise<{ success: boolean }> {
	return fetchJson<{ success: boolean }>(
		`${API_BASE}/api/onboarding/complete`,
		{
			method: "POST",
		},
	);
}

export async function createSampleProject(): Promise<SampleProjectResult> {
	return fetchJson<SampleProjectResult>(
		`${API_BASE}/api/onboarding/sample-project`,
		{ method: "POST" },
	);
}

// API Keys
export async function getApiKeys(): Promise<ApiKey[]> {
	const data = await fetchJson<{ apiKeys: ApiKey[] }>(
		`${API_BASE}/api/api-keys`,
	);
	return data.apiKeys;
}

export async function createApiKey(
	input: CreateApiKeyInput,
): Promise<CreateApiKeyResponse> {
	return fetchJson<CreateApiKeyResponse>(`${API_BASE}/api/api-keys`, {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export async function deleteApiKey(id: string): Promise<void> {
	const token = getAccessToken();
	await fetch(`${API_BASE}/api/api-keys/${id}`, {
		method: "DELETE",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
}

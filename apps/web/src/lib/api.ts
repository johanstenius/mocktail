import type {
	AcceptInviteResponse,
	ActivityItem,
	AuditLog,
	AuthResponse,
	CompleteOAuthOnboardingResponse,
	CreateEndpointInput,
	CreateInviteInput,
	CreateProjectInput,
	CreateVariantInput,
	DashboardStats,
	Endpoint,
	GetAuditLogsParams,
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
	UpdateVariantInput,
	Usage,
	Variant,
} from "@/types";
import { ApiError } from "./errors";

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
	const token = getAccessToken();
	const headers: Record<string, string> = {
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

export async function sendVerificationEmail(): Promise<void> {
	await fetchJson<{ message: string }>(
		`${API_BASE}/api/auth/send-verification`,
		{
			method: "POST",
		},
	);
}

export async function verifyEmail(token: string): Promise<void> {
	await fetchJson<{ message: string }>(`${API_BASE}/api/auth/verify-email`, {
		method: "POST",
		body: JSON.stringify({ token }),
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

	const token = getAccessToken();
	const res = await fetch(
		`${API_BASE}/api/audit-logs/export?${searchParams.toString()}`,
		{
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		},
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

// Onboarding
export async function createOrganization(name: string): Promise<{
	org: { id: string; name: string; slug: string };
}> {
	return fetchJson<{ org: { id: string; name: string; slug: string } }>(
		`${API_BASE}/api/onboarding/create-organization`,
		{
			method: "POST",
			body: JSON.stringify({ name }),
		},
	);
}

export async function completeOnboarding(): Promise<void> {
	await fetchVoid(`${API_BASE}/api/onboarding/complete`, { method: "POST" });
}

export async function createSampleProject(): Promise<SampleProjectResult> {
	return fetchJson<SampleProjectResult>(
		`${API_BASE}/api/onboarding/sample-project`,
		{ method: "POST" },
	);
}

export async function completeOAuthOnboarding(
	oauthToken: string,
	organizationName: string,
): Promise<CompleteOAuthOnboardingResponse> {
	return fetchJson<CompleteOAuthOnboardingResponse>(
		`${API_BASE}/api/onboarding/complete-oauth`,
		{
			method: "POST",
			body: JSON.stringify({ oauthToken, organizationName }),
		},
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
	const token = getAccessToken();
	await fetch(
		`${API_BASE}/api/projects/${projectId}/endpoints/${endpointId}/variants/${variantId}`,
		{
			method: "DELETE",
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		},
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

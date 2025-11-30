export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type BodyType = "static" | "template";

export type Project = {
	id: string;
	name: string;
	slug: string;
	apiKey: string | null;
	createdAt: string;
	updatedAt: string;
};

export type Endpoint = {
	id: string;
	projectId: string;
	method: HttpMethod;
	path: string;
	status: number;
	headers: Record<string, string>;
	body: unknown;
	bodyType: BodyType;
	delay: number;
	failRate: number;
	createdAt: string;
	updatedAt: string;
};

export type RequestLog = {
	id: string;
	projectId: string;
	endpointId: string | null;
	method: string;
	path: string;
	status: number;
	requestHeaders: Record<string, string>;
	requestBody: string | null;
	responseBody: string | null;
	duration: number;
	createdAt: string;
};

export type CreateProjectInput = {
	name: string;
	slug: string;
};

export type CreateEndpointInput = {
	method: HttpMethod;
	path: string;
	status?: number;
	headers?: Record<string, string>;
	body?: unknown;
	bodyType?: BodyType;
	delay?: number;
	failRate?: number;
};

export type UpdateEndpointInput = Partial<CreateEndpointInput>;

export type ImportSpecInput = {
	spec: string | Record<string, unknown>;
	options?: {
		overwrite?: boolean;
	};
};

export type ImportResult = {
	created: number;
	skipped: number;
	endpoints: Endpoint[];
};

export type EndpointStat = {
	endpointId: string;
	requestCount: number;
	lastRequestAt: string | null;
};

export type UnmatchedRequest = {
	method: string;
	path: string;
	count: number;
	lastRequestAt: string | null;
};

export type ProjectStatistics = {
	endpoints: EndpointStat[];
	unmatched: UnmatchedRequest[];
};

// Auth types
export type TokenResponse = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
};

export type AuthUser = {
	id: string;
	email: string;
};

export type AuthOrg = {
	id: string;
	name: string;
	slug: string;
};

export type AuthResponse = {
	user: AuthUser;
	org: AuthOrg;
	tokens: TokenResponse;
};

export type MeResponse = {
	id: string;
	email: string;
	hasCompletedOnboarding: boolean;
	org: {
		id: string;
		name: string;
		slug: string;
		tier: string;
	};
	role: string;
};

export type RegisterInput = {
	email: string;
	password: string;
	organization: string;
};

export type LoginInput = {
	email: string;
	password: string;
};

// Member types
export type OrgRole = "owner" | "admin" | "member";

export type Member = {
	id: string;
	userId: string;
	email: string;
	role: OrgRole;
	createdAt: string;
};

export type Invite = {
	id: string;
	email: string;
	role: OrgRole;
	expiresAt: string;
	invitedBy: string;
	createdAt: string;
};

export type InviteInfo = {
	email: string;
	orgName: string;
	role: OrgRole;
	expiresAt: string;
};

export type CreateInviteInput = {
	email: string;
	role?: OrgRole;
};

// Billing types
export type Tier = "free" | "pro" | "enterprise";

export type UsageItem = {
	current: number;
	limit: number | null;
};

export type Usage = {
	tier: Tier;
	projects: UsageItem;
	endpoints: UsageItem;
	members: UsageItem;
	requests: UsageItem;
	cancelAtPeriodEnd: boolean;
	currentPeriodEnd: string | null;
};

// Dashboard types
export type DashboardStats = {
	projects: number;
	endpoints: number;
	requestsToday: number;
	requestsThisWeek: number;
	teamMembers: number;
};

export type ActivityItem = {
	id: string;
	type: "project_created" | "endpoint_created" | "request";
	projectId?: string;
	projectName?: string;
	endpointId?: string;
	endpointPath?: string;
	method?: string;
	status?: number;
	createdAt: string;
};

export type SampleProjectResult = {
	project: { id: string; name: string; slug: string };
	endpointsCreated: number;
};

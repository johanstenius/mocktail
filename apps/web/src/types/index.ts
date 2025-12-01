export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type BodyType = "static" | "template";

// Variant types
export type MatchTarget = "header" | "query" | "param" | "body";
export type MatchOperator =
	| "equals"
	| "not_equals"
	| "contains"
	| "not_contains"
	| "exists"
	| "not_exists";
export type RuleLogic = "and" | "or";
export type ValidationMode = "none" | "warn" | "strict";

export type MatchRule = {
	target: MatchTarget;
	key: string;
	operator: MatchOperator;
	value?: string;
};

export type Variant = {
	id: string;
	endpointId: string;
	name: string;
	priority: number;
	isDefault: boolean;
	status: number;
	headers: Record<string, string>;
	body: unknown;
	bodyType: BodyType;
	delay: number;
	failRate: number;
	rules: MatchRule[];
	ruleLogic: RuleLogic;
	createdAt: string;
	updatedAt: string;
};

export type CreateVariantInput = {
	name?: string;
	isDefault?: boolean;
	status?: number;
	headers?: Record<string, string>;
	body?: unknown;
	bodyType?: BodyType;
	delay?: number;
	failRate?: number;
	rules?: MatchRule[];
	ruleLogic?: RuleLogic;
};

export type UpdateVariantInput = Partial<CreateVariantInput>;

export type Project = {
	id: string;
	name: string;
	slug: string;
	apiKey: string;
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
	requestBodySchema: unknown;
	validationMode: ValidationMode;
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
	validationErrors: string[] | null;
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
	requestBodySchema?: unknown;
	validationMode?: ValidationMode;
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
	avgLatency: number | null;
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
	emailVerifiedAt: string | null;
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

export type AcceptInviteResponse = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: {
		id: string;
		email: string;
		orgId: string;
		orgName: string;
		orgSlug: string;
		role: string;
		emailVerifiedAt: string | null;
	};
	isExistingUser: boolean;
};

export type MeResponse = {
	id: string;
	email: string;
	emailVerifiedAt: string | null;
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
	paymentFailedAt: string | null;
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

export type CompleteOAuthOnboardingResponse = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: { id: string; email: string };
	org: { id: string; name: string; slug: string };
};

// Audit Log types
export type AuditAction =
	| "org_created"
	| "org_updated"
	| "member_invited"
	| "member_joined"
	| "member_role_changed"
	| "member_removed"
	| "invite_cancelled"
	| "project_created"
	| "project_updated"
	| "project_deleted"
	| "api_key_rotated"
	| "endpoint_created"
	| "endpoint_updated"
	| "endpoint_deleted"
	| "variant_created"
	| "variant_updated"
	| "variant_deleted"
	| "subscription_created"
	| "subscription_updated"
	| "subscription_cancelled";

export type AuditLog = {
	id: string;
	orgId: string;
	actorId: string | null;
	action: AuditAction;
	targetType: string | null;
	targetId: string | null;
	metadata: Record<string, unknown>;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: string;
	actor: {
		id: string;
		email: string;
		name: string | null;
	} | null;
};

export type GetAuditLogsParams = {
	limit?: number;
	offset?: number;
	action?: AuditAction;
	actorId?: string;
	targetType?: string;
	from?: string;
	to?: string;
};

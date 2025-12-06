export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type BodyType = "static" | "template";
export type DelayType = "fixed" | "random";

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
	delayType: DelayType;
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
	delayType?: DelayType;
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
	proxyBaseUrl: string | null;
	proxyTimeout: number;
	proxyAuthHeader: string | null;
	proxyPassThroughAuth: boolean;
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
	proxyEnabled: boolean;
	createdAt: string;
	updatedAt: string;
};

export type RequestSource = "mock" | "proxy" | "proxy_fallback";

export type RequestLog = {
	id: string;
	projectId: string;
	endpointId: string | null;
	method: string;
	path: string;
	status: number;
	source: RequestSource;
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
	proxyEnabled?: boolean;
};

export type UpdateProjectInput = {
	name?: string;
	proxyBaseUrl?: string | null;
	proxyTimeout?: number;
	proxyAuthHeader?: string | null;
	proxyPassThroughAuth?: boolean;
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

// Billing types
export type Tier = "free" | "pro";

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

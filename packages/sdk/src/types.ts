export type MocktailConfig = {
	apiKey: string;
	baseUrl?: string;
};

export type Project = {
	id: string;
	name: string;
	slug: string;
	apiKey: string | null;
	proxyBaseUrl: string | null;
	proxyTimeout: number;
	proxyAuthHeader: string | null;
	proxyPassThroughAuth: boolean;
	createdAt: string;
	updatedAt: string;
};

export type CreateProjectInput = {
	name: string;
	slug: string;
	proxyBaseUrl?: string | null;
	proxyTimeout?: number;
};

export type UpdateProjectInput = {
	name?: string;
	proxyBaseUrl?: string | null;
	proxyTimeout?: number;
	proxyAuthHeader?: string | null;
	proxyPassThroughAuth?: boolean;
};

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type BodyType = "static" | "template";
export type ValidationMode = "none" | "warn" | "strict";

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
	isCrud: boolean;
	crudBucket: string | null;
	crudIdField: string;
	createdAt: string;
	updatedAt: string;
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
	isCrud?: boolean;
	crudBucket?: string;
	crudIdField?: string;
};

export type UpdateEndpointInput = Partial<CreateEndpointInput>;

export type MatchTarget = "header" | "query" | "param" | "body";
export type MatchOperator =
	| "equals"
	| "not_equals"
	| "contains"
	| "not_contains"
	| "exists"
	| "not_exists";
export type RuleLogic = "and" | "or";
export type DelayType = "fixed" | "random";

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
	sequenceIndex: number | null;
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
	sequenceIndex?: number | null;
};

export type UpdateVariantInput = Partial<CreateVariantInput>;

export type Bucket = {
	id: string;
	projectId: string;
	name: string;
	data: unknown[];
	createdAt: string;
	updatedAt: string;
};

export type CreateBucketInput = {
	name: string;
	data?: unknown[];
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
	requestHeaders: unknown;
	requestBody: unknown;
	responseBody: unknown;
	validationErrors: unknown;
	duration: number;
	createdAt: string;
};

export type RequestLogFilters = {
	limit?: number;
	offset?: number;
	method?: string;
	status?: number;
	endpointId?: string;
	source?: RequestSource;
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

export type Statistics = {
	endpoints: EndpointStat[];
	unmatched: UnmatchedRequest[];
	avgLatency: number | null;
};

export type ImportOptions = {
	overwrite?: boolean;
};

export type ImportedEndpoint = {
	id: string;
	projectId: string;
	method: string;
	path: string;
	createdAt: string;
	updatedAt: string;
};

export type ImportResult = {
	created: number;
	skipped: number;
	endpoints: ImportedEndpoint[];
};

export type ApiKey = {
	id: string;
	key: string;
	type: "project" | "org";
	name: string;
	orgId: string;
	projectId: string | null;
	lastUsedAt: string | null;
	expiresAt: string | null;
	createdAt: string;
};

export type CreateApiKeyInput = {
	name: string;
	expiresAt?: string | null;
};

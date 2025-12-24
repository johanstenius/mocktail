export type StatusCode = {
	code: string;
	title: string;
	category: "success" | "client-error" | "server-error";
	description: string;
	metaDescription: string;
	whenToUse: string[];
	mockExample: string;
};

export type HttpMethod = {
	method: string;
	title: string;
	description: string;
	metaDescription: string;
	characteristics: string[];
	whenToUse: string[];
	mockExample: string;
};

export const statusCodes: StatusCode[] = [
	{
		code: "200",
		title: "200 OK",
		category: "success",
		description:
			"The request succeeded. The response body contains the requested resource.",
		metaDescription:
			"Learn about HTTP 200 OK status code. When to use it, how to mock it with Mockspec, and best practices for API responses.",
		whenToUse: [
			"Successful GET requests returning data",
			"Successful PUT/PATCH requests that return updated resource",
			"Any successful request where you return a response body",
		],
		mockExample: `// Mockspec endpoint: GET /users
// Status: 200 OK

{
  "users": [
    {"id": 1, "name": "Alice", "email": "alice@example.com"},
    {"id": 2, "name": "Bob", "email": "bob@example.com"}
  ],
  "total": 2
}`,
	},
	{
		code: "201",
		title: "201 Created",
		category: "success",
		description:
			"The request succeeded and a new resource was created. Typically used for POST requests.",
		metaDescription:
			"Learn about HTTP 201 Created status code. When to use it, how to mock it with Mockspec, and best practices for resource creation.",
		whenToUse: [
			"Successful POST requests that create new resources",
			"When you want to indicate a resource was created, not just updated",
			"Include Location header pointing to the new resource",
		],
		mockExample: `// Mockspec endpoint: POST /users
// Status: 201 Created

{
  "id": "{{uuid}}",
  "name": "{{request.body.name}}",
  "email": "{{request.body.email}}",
  "createdAt": "{{now}}"
}`,
	},
	{
		code: "400",
		title: "400 Bad Request",
		category: "client-error",
		description:
			"The server cannot process the request due to client error (malformed syntax, invalid parameters).",
		metaDescription:
			"Learn about HTTP 400 Bad Request status code. When to use it, how to mock it with Mockspec, and best practices for validation errors.",
		whenToUse: [
			"Invalid JSON in request body",
			"Missing required parameters",
			"Validation errors (invalid email format, out of range values)",
			"Malformed request syntax",
		],
		mockExample: `// Mockspec endpoint: POST /users
// Status: 400 Bad Request

{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {"field": "email", "message": "Invalid email format"},
    {"field": "age", "message": "Must be a positive number"}
  ]
}`,
	},
	{
		code: "401",
		title: "401 Unauthorized",
		category: "client-error",
		description:
			"Authentication is required and has failed or not been provided.",
		metaDescription:
			"Learn about HTTP 401 Unauthorized status code. When to use it, how to mock it with Mockspec, and authentication error handling.",
		whenToUse: [
			"Missing authentication token",
			"Expired authentication token",
			"Invalid credentials",
			"API key not provided",
		],
		mockExample: `// Mockspec endpoint: GET /protected-resource
// Status: 401 Unauthorized

{
  "error": "Unauthorized",
  "message": "Authentication required",
  "code": "AUTH_REQUIRED"
}`,
	},
	{
		code: "403",
		title: "403 Forbidden",
		category: "client-error",
		description:
			"The server understood the request but refuses to authorize it. Unlike 401, authenticating won't help.",
		metaDescription:
			"Learn about HTTP 403 Forbidden status code. When to use it, how to mock it with Mockspec, and authorization error handling.",
		whenToUse: [
			"User authenticated but lacks permission",
			"Accessing another user's private resource",
			"Feature not available on user's plan",
			"IP blocked or rate limited",
		],
		mockExample: `// Mockspec endpoint: DELETE /admin/users/123
// Status: 403 Forbidden

{
  "error": "Forbidden",
  "message": "Admin privileges required",
  "code": "INSUFFICIENT_PERMISSIONS"
}`,
	},
	{
		code: "404",
		title: "404 Not Found",
		category: "client-error",
		description:
			"The requested resource could not be found. The endpoint exists but the specific resource doesn't.",
		metaDescription:
			"Learn about HTTP 404 Not Found status code. When to use it, how to mock it with Mockspec, and handling missing resources.",
		whenToUse: [
			"Resource with given ID doesn't exist",
			"Deleted resource that's no longer available",
			"Invalid resource path within a valid endpoint",
		],
		mockExample: `// Mockspec endpoint: GET /users/:id
// Status: 404 Not Found

{
  "error": "Not Found",
  "message": "User not found",
  "resourceType": "user",
  "resourceId": "{{request.params.id}}"
}`,
	},
	{
		code: "429",
		title: "429 Too Many Requests",
		category: "client-error",
		description:
			"The user has sent too many requests in a given time period (rate limiting).",
		metaDescription:
			"Learn about HTTP 429 Too Many Requests status code. How to mock rate limiting with Mockspec and handle rate limit errors.",
		whenToUse: [
			"Rate limit exceeded",
			"Too many login attempts",
			"API quota exhausted",
			"Burst protection triggered",
		],
		mockExample: `// Mockspec endpoint: ANY /api/*
// Status: 429 Too Many Requests
// Headers:
//   Retry-After: 60
//   X-RateLimit-Limit: 100
//   X-RateLimit-Remaining: 0

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "retryAfter": 60
}`,
	},
	{
		code: "500",
		title: "500 Internal Server Error",
		category: "server-error",
		description:
			"The server encountered an unexpected condition that prevented it from fulfilling the request.",
		metaDescription:
			"Learn about HTTP 500 Internal Server Error. How to mock server errors with Mockspec and test error handling.",
		whenToUse: [
			"Unhandled exception in server code",
			"Database connection failure",
			"Unexpected server-side error",
			"Generic catch-all for server errors",
		],
		mockExample: `// Mockspec endpoint: GET /api/data
// Status: 500 Internal Server Error
// Use chaos engineering to randomly trigger

{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "requestId": "{{uuid}}"
}`,
	},
	{
		code: "502",
		title: "502 Bad Gateway",
		category: "server-error",
		description:
			"The server received an invalid response from an upstream server while acting as a gateway or proxy.",
		metaDescription:
			"Learn about HTTP 502 Bad Gateway status code. How to mock gateway errors with Mockspec and test resilience.",
		whenToUse: [
			"Upstream service returned invalid response",
			"Microservice communication failure",
			"Load balancer couldn't reach backend",
			"Proxy received bad response",
		],
		mockExample: `// Mockspec endpoint: GET /api/external-data
// Status: 502 Bad Gateway

{
  "error": "Bad Gateway",
  "message": "Upstream service unavailable",
  "service": "payment-processor"
}`,
	},
	{
		code: "503",
		title: "503 Service Unavailable",
		category: "server-error",
		description:
			"The server is currently unable to handle the request due to maintenance or overload.",
		metaDescription:
			"Learn about HTTP 503 Service Unavailable status code. How to mock service outages with Mockspec and test fallbacks.",
		whenToUse: [
			"Server under maintenance",
			"Server overloaded",
			"Database temporarily unavailable",
			"Graceful degradation during high load",
		],
		mockExample: `// Mockspec endpoint: ANY /api/*
// Status: 503 Service Unavailable
// Headers: Retry-After: 300

{
  "error": "Service Unavailable",
  "message": "Service is temporarily unavailable for maintenance",
  "estimatedRecovery": "5 minutes"
}`,
	},
];

export const httpMethods: HttpMethod[] = [
	{
		method: "get",
		title: "GET",
		description:
			"Retrieve a resource or collection of resources. GET requests should be safe and idempotent.",
		metaDescription:
			"Learn about HTTP GET method. How to mock GET requests with Mockspec for reading data and listing resources.",
		characteristics: [
			"Safe - doesn't modify server state",
			"Idempotent - same result on repeated calls",
			"Cacheable - responses can be cached",
			"Request body typically not used",
		],
		whenToUse: [
			"Fetching a single resource by ID",
			"Listing collections with filters",
			"Search operations",
			"Reading configuration or status",
		],
		mockExample: `// Mockspec endpoint: GET /users
{
  "users": [
    {
      "id": "{{uuid}}",
      "name": "{{name}}",
      "email": "{{email}}"
    }
  ]
}

// GET /users/:id
{
  "id": "{{request.params.id}}",
  "name": "{{name}}",
  "email": "{{email}}"
}`,
	},
	{
		method: "post",
		title: "POST",
		description:
			"Create a new resource or trigger a process. POST requests are not idempotent.",
		metaDescription:
			"Learn about HTTP POST method. How to mock POST requests with Mockspec for creating resources and handling form submissions.",
		characteristics: [
			"Not safe - modifies server state",
			"Not idempotent - repeated calls may create duplicates",
			"Not cacheable by default",
			"Request body contains new resource data",
		],
		whenToUse: [
			"Creating new resources",
			"Submitting forms",
			"Triggering actions or processes",
			"Complex queries with large payloads",
		],
		mockExample: `// Mockspec endpoint: POST /users
// Echoes back submitted data with generated fields

{
  "id": "{{uuid}}",
  "name": "{{request.body.name}}",
  "email": "{{request.body.email}}",
  "createdAt": "{{now}}",
  "status": "active"
}`,
	},
	{
		method: "put",
		title: "PUT",
		description:
			"Replace an entire resource with new data. PUT requests are idempotent.",
		metaDescription:
			"Learn about HTTP PUT method. How to mock PUT requests with Mockspec for full resource replacement.",
		characteristics: [
			"Not safe - modifies server state",
			"Idempotent - same result on repeated calls",
			"Replaces entire resource",
			"Client must send complete resource representation",
		],
		whenToUse: [
			"Full resource replacement",
			"Uploading files to a specific URL",
			"Updating when client has complete new state",
			"Upsert operations (create or replace)",
		],
		mockExample: `// Mockspec endpoint: PUT /users/:id
// Returns the replaced resource

{
  "id": "{{request.params.id}}",
  "name": "{{request.body.name}}",
  "email": "{{request.body.email}}",
  "bio": "{{request.body.bio}}",
  "updatedAt": "{{now}}"
}`,
	},
	{
		method: "patch",
		title: "PATCH",
		description:
			"Apply partial modifications to a resource. Only changed fields need to be sent.",
		metaDescription:
			"Learn about HTTP PATCH method. How to mock PATCH requests with Mockspec for partial resource updates.",
		characteristics: [
			"Not safe - modifies server state",
			"Not necessarily idempotent",
			"Partial update - only send changed fields",
			"More bandwidth efficient than PUT",
		],
		whenToUse: [
			"Updating specific fields only",
			"Toggling boolean properties",
			"Incrementing counters",
			"Applying JSON Patch operations",
		],
		mockExample: `// Mockspec endpoint: PATCH /users/:id
// Merges with existing data (simulated)

{
  "id": "{{request.params.id}}",
  "name": "{{request.body.name}}",
  "email": "user@example.com",
  "updatedAt": "{{now}}",
  "updatedFields": ["name"]
}`,
	},
	{
		method: "delete",
		title: "DELETE",
		description:
			"Remove a resource. DELETE requests are idempotent - deleting twice has same effect as once.",
		metaDescription:
			"Learn about HTTP DELETE method. How to mock DELETE requests with Mockspec for removing resources.",
		characteristics: [
			"Not safe - modifies server state",
			"Idempotent - deleting twice = deleting once",
			"Response body often empty",
			"May return 204 No Content or 200 OK",
		],
		whenToUse: [
			"Removing resources by ID",
			"Canceling subscriptions or sessions",
			"Bulk deletion operations",
			"Soft delete (mark as deleted)",
		],
		mockExample: `// Mockspec endpoint: DELETE /users/:id
// Status: 200 OK (or 204 No Content with empty body)

{
  "deleted": true,
  "id": "{{request.params.id}}",
  "deletedAt": "{{now}}"
}`,
	},
	{
		method: "head",
		title: "HEAD",
		description:
			"Same as GET but returns only headers, no body. Used to check resource existence or metadata.",
		metaDescription:
			"Learn about HTTP HEAD method. How to mock HEAD requests with Mockspec for checking resource metadata.",
		characteristics: [
			"Safe - doesn't modify server state",
			"Idempotent - same result on repeated calls",
			"No response body",
			"Returns same headers as GET would",
		],
		whenToUse: [
			"Check if resource exists before downloading",
			"Get resource size (Content-Length)",
			"Check Last-Modified for caching",
			"Validate URLs without fetching content",
		],
		mockExample: `// Mockspec endpoint: HEAD /files/:id
// Status: 200 OK
// Headers:
//   Content-Length: 1048576
//   Content-Type: application/pdf
//   Last-Modified: 2025-01-15T10:30:00Z
//   ETag: "abc123"

// No response body for HEAD requests`,
	},
	{
		method: "options",
		title: "OPTIONS",
		description:
			"Describe communication options for the target resource. Used for CORS preflight requests.",
		metaDescription:
			"Learn about HTTP OPTIONS method. How to mock OPTIONS requests with Mockspec for CORS and API discovery.",
		characteristics: [
			"Safe - doesn't modify server state",
			"Used for CORS preflight checks",
			"Returns allowed methods and headers",
			"Browsers send automatically for cross-origin requests",
		],
		whenToUse: [
			"CORS preflight requests",
			"API discovery - what methods are allowed",
			"Check server capabilities",
			"WebDAV and other protocol negotiations",
		],
		mockExample: `// Mockspec endpoint: OPTIONS /api/*
// Status: 204 No Content
// Headers:
//   Access-Control-Allow-Origin: *
//   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
//   Access-Control-Allow-Headers: Content-Type, X-API-Key
//   Access-Control-Max-Age: 86400

// No response body needed`,
	},
];

export function getStatusCode(code: string): StatusCode | undefined {
	return statusCodes.find((s) => s.code === code);
}

export function getHttpMethod(method: string): HttpMethod | undefined {
	return httpMethods.find((m) => m.method === method.toLowerCase());
}

export function getAllStatusCodes(): string[] {
	return statusCodes.map((s) => s.code);
}

export function getAllHttpMethods(): string[] {
	return httpMethods.map((m) => m.method);
}

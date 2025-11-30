import { HTTPException } from "hono/http-exception";

export const ErrorCode = {
	// Auth
	UNAUTHORIZED: "UNAUTHORIZED",
	INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
	TOKEN_EXPIRED: "TOKEN_EXPIRED",

	// Resources
	NOT_FOUND: "NOT_FOUND",
	CONFLICT: "CONFLICT",
	FORBIDDEN: "FORBIDDEN",

	// Validation
	VALIDATION_ERROR: "VALIDATION_ERROR",
	BAD_REQUEST: "BAD_REQUEST",

	// Rate limiting
	RATE_LIMITED: "RATE_LIMITED",
	QUOTA_EXCEEDED: "QUOTA_EXCEEDED",

	// Server
	INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export function notFound(resource: string): HTTPException {
	return new HTTPException(404, {
		message: `${resource} not found`,
		cause: { code: ErrorCode.NOT_FOUND },
	});
}

export function badRequest(message: string): HTTPException {
	return new HTTPException(400, {
		message,
		cause: { code: ErrorCode.BAD_REQUEST },
	});
}

export function forbidden(message: string): HTTPException {
	return new HTTPException(403, {
		message,
		cause: { code: ErrorCode.FORBIDDEN },
	});
}

export function conflict(message: string): HTTPException {
	return new HTTPException(409, {
		message,
		cause: { code: ErrorCode.CONFLICT },
	});
}

export function unauthorized(message = "Unauthorized"): HTTPException {
	return new HTTPException(401, {
		message,
		cause: { code: ErrorCode.UNAUTHORIZED },
	});
}

export function invalidCredentials(
	message = "Invalid credentials",
): HTTPException {
	return new HTTPException(401, {
		message,
		cause: { code: ErrorCode.INVALID_CREDENTIALS },
	});
}

export function tokenExpired(message = "Token expired"): HTTPException {
	return new HTTPException(401, {
		message,
		cause: { code: ErrorCode.TOKEN_EXPIRED },
	});
}

export function rateLimited(message = "Too many requests"): HTTPException {
	return new HTTPException(429, {
		message,
		cause: { code: ErrorCode.RATE_LIMITED },
	});
}

export function quotaExceeded(message = "Quota exceeded"): HTTPException {
	return new HTTPException(429, {
		message,
		cause: { code: ErrorCode.QUOTA_EXCEEDED },
	});
}

export class ApiError extends Error {
	code: string;
	fields?: Record<string, string>;

	constructor(message: string, code: string, fields?: Record<string, string>) {
		super(message);
		this.name = "ApiError";
		this.code = code;
		this.fields = fields;
	}
}

export const ERROR_MESSAGES: Record<string, string> = {
	UNAUTHORIZED: "Please sign in to continue",
	INVALID_CREDENTIALS: "Email or password is incorrect",
	TOKEN_EXPIRED: "Session expired, please sign in again",
	NOT_FOUND: "Resource not found",
	CONFLICT: "This resource already exists",
	FORBIDDEN: "You don't have permission",
	VALIDATION_ERROR: "Please check your input",
	BAD_REQUEST: "Invalid request",
	RATE_LIMITED: "Too many requests, please wait",
	QUOTA_EXCEEDED: "Monthly quota exceeded, upgrade for more",
	INTERNAL_ERROR: "Something went wrong, please try again",
};

export function getErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		return ERROR_MESSAGES[error.code] ?? "An error occurred";
	}
	return "An error occurred";
}

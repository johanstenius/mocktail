export type ProxyRequest = {
	method: string;
	path: string;
	headers: Record<string, string>;
	query: Record<string, string>;
	body: unknown;
};

export type ProxyAuthConfig = {
	passThrough: boolean;
	header?: string | null;
};

export type ProxyResult =
	| {
			success: true;
			status: number;
			headers: Record<string, string>;
			body: unknown;
			duration: number;
	  }
	| {
			success: false;
			error: "timeout" | "connection_error" | "invalid_url";
			message: string;
			duration: number;
	  };

const HEADERS_TO_STRIP = new Set([
	"host",
	"x-api-key",
	"x-mock-api-key",
	"connection",
	"keep-alive",
	"transfer-encoding",
	"content-length",
]);

const HEADERS_TO_STRIP_WITH_AUTH = new Set([
	...HEADERS_TO_STRIP,
	"authorization",
]);

function buildTargetUrl(
	baseUrl: string,
	path: string,
	query: Record<string, string>,
): string {
	const url = new URL(path, baseUrl);
	for (const [key, value] of Object.entries(query)) {
		url.searchParams.set(key, value);
	}
	return url.toString();
}

function filterHeaders(
	headers: Record<string, string>,
	stripAuth: boolean,
): Record<string, string> {
	const toStrip = stripAuth ? HEADERS_TO_STRIP_WITH_AUTH : HEADERS_TO_STRIP;
	const filtered: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers)) {
		if (!toStrip.has(key.toLowerCase())) {
			filtered[key] = value;
		}
	}
	return filtered;
}

function parseResponseHeaders(headers: Headers): Record<string, string> {
	const result: Record<string, string> = {};
	headers.forEach((value, key) => {
		if (!HEADERS_TO_STRIP.has(key.toLowerCase())) {
			result[key] = value;
		}
	});
	return result;
}

async function parseResponseBody(response: Response): Promise<unknown> {
	const contentType = response.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		try {
			return await response.json();
		} catch {
			return await response.text();
		}
	}
	return await response.text();
}

export async function proxyRequest(
	proxyBaseUrl: string,
	request: ProxyRequest,
	timeout: number,
	authConfig: ProxyAuthConfig = { passThrough: true },
): Promise<ProxyResult> {
	const startTime = Date.now();

	let targetUrl: string;
	try {
		targetUrl = buildTargetUrl(proxyBaseUrl, request.path, request.query);
	} catch {
		return {
			success: false,
			error: "invalid_url",
			message: `Invalid proxy URL: ${proxyBaseUrl}${request.path}`,
			duration: Date.now() - startTime,
		};
	}

	const stripAuth = !authConfig.passThrough;
	const filteredHeaders = filterHeaders(request.headers, stripAuth);

	// If not passing through and custom header is set, add it
	if (stripAuth && authConfig.header) {
		filteredHeaders.Authorization = authConfig.header;
	}

	const fetchOptions: RequestInit = {
		method: request.method,
		headers: filteredHeaders,
		signal: AbortSignal.timeout(timeout),
	};

	if (
		request.body !== undefined &&
		request.body !== null &&
		!["GET", "HEAD"].includes(request.method.toUpperCase())
	) {
		fetchOptions.body =
			typeof request.body === "string"
				? request.body
				: JSON.stringify(request.body);
	}

	try {
		const response = await fetch(targetUrl, fetchOptions);
		const duration = Date.now() - startTime;

		const responseHeaders = parseResponseHeaders(response.headers);
		const responseBody = await parseResponseBody(response);

		return {
			success: true,
			status: response.status,
			headers: responseHeaders,
			body: responseBody,
			duration,
		};
	} catch (err) {
		const duration = Date.now() - startTime;

		if (err instanceof Error) {
			if (err.name === "TimeoutError" || err.name === "AbortError") {
				return {
					success: false,
					error: "timeout",
					message: `Proxy request timed out after ${timeout}ms`,
					duration,
				};
			}
			if (
				err.message.includes("fetch failed") ||
				err.message.includes("ECONNREFUSED") ||
				err.message.includes("ENOTFOUND")
			) {
				return {
					success: false,
					error: "connection_error",
					message: `Failed to connect to upstream: ${err.message}`,
					duration,
				};
			}
		}

		return {
			success: false,
			error: "connection_error",
			message: `Proxy request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
			duration,
		};
	}
}

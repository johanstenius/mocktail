export class MocktailError extends Error {
	code: string;
	status: number;
	fields?: Record<string, string>;

	constructor(
		message: string,
		code: string,
		status: number,
		fields?: Record<string, string>,
	) {
		super(message);
		this.name = "MocktailError";
		this.code = code;
		this.status = status;
		this.fields = fields;
	}
}

export type HttpOptions = {
	method?: string;
	body?: unknown;
	query?: Record<string, string | number | undefined>;
};

export type HttpClient = {
	request<T>(path: string, options?: HttpOptions): Promise<T>;
};

export function createHttpClient(baseUrl: string, apiKey: string): HttpClient {
	async function request<T>(
		path: string,
		options: HttpOptions = {},
	): Promise<T> {
		const { method = "GET", body, query } = options;

		let url = `${baseUrl}${path}`;
		if (query) {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(query)) {
				if (value !== undefined) {
					params.set(key, String(value));
				}
			}
			const queryString = params.toString();
			if (queryString) {
				url += `?${queryString}`;
			}
		}

		const headers: Record<string, string> = {
			"X-API-Key": apiKey,
			"Content-Type": "application/json",
		};

		const response = await fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!response.ok) {
			let errorData: {
				error?: string;
				code?: string;
				fields?: Record<string, string>;
			} = {
				error: response.statusText,
			};
			try {
				const json = (await response.json()) as typeof errorData;
				errorData = json;
			} catch {
				// keep default
			}

			throw new MocktailError(
				errorData.error ?? "Request failed",
				errorData.code ?? "UNKNOWN_ERROR",
				response.status,
				errorData.fields,
			);
		}

		if (response.status === 204) {
			return undefined as T;
		}

		return (await response.json()) as T;
	}

	return { request };
}

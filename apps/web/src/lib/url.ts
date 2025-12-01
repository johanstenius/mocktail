import { API_URL } from "./config";

const MOCK_API_URL = API_URL;

export function getMockBaseUrl(): string {
	return `${MOCK_API_URL}/mock`;
}

export function getMockUrl(endpointPath: string): string {
	const path = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
	return `${getMockBaseUrl()}${path}`;
}

export function getCurlCommand(
	method: string,
	url: string,
	apiKey: string,
	body?: unknown,
): string {
	let cmd = `curl -X ${method} "${url}" \\\n  -H "X-API-Key: ${apiKey}"`;
	if (body && method !== "GET") {
		cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body)}'`;
	}
	return cmd;
}

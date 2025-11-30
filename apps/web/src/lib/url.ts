const MOCK_API_URL = "http://localhost:4000";

export function getProjectBaseUrl(projectSlug: string): string {
	return `${MOCK_API_URL}/mock/${projectSlug}`;
}

export function getMockUrl(projectSlug: string, endpointPath: string): string {
	const path = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
	return `${getProjectBaseUrl(projectSlug)}${path}`;
}

export function getCurlCommand(
	method: string,
	url: string,
	body?: unknown,
): string {
	let cmd = `curl -X ${method} "${url}"`;
	if (body && method !== "GET") {
		cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`;
	}
	return cmd;
}

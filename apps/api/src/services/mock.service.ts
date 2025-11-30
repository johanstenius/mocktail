import { findBestMatch } from "../lib/path-matcher";
import * as projectRepo from "../repositories/project.repository";
import * as logRepo from "../repositories/request-log.repository";
import { type RequestContext, processTemplate } from "./template-engine";

type Endpoint = {
	id: string;
	method: string;
	path: string;
	status: number;
	headers: string;
	body: string;
	bodyType: string;
	delay: number;
	failRate: number;
};

export type MockRequest = {
	projectId: string;
	method: string;
	path: string;
	headers: Record<string, string>;
	query: Record<string, string>;
	body: unknown;
};

export type MockResponse = {
	status: number;
	headers: Record<string, string>;
	body: unknown;
};

export type MockResult =
	| { success: true; response: MockResponse; endpointId: string }
	| { success: false; error: "project_not_found" | "endpoint_not_found" };

export async function handleMockRequest(
	request: MockRequest,
	startTime: number,
): Promise<MockResult> {
	const project = await projectRepo.findByIdWithEndpoints(
		request.projectId,
		request.method,
	);

	if (!project) {
		return { success: false, error: "project_not_found" };
	}

	const match = findBestMatch(project.endpoints as Endpoint[], request.path);

	if (!match) {
		const duration = Date.now() - startTime;
		const errorResponse = {
			error: "not_found",
			message: `No endpoint configured for ${request.method} ${request.path}`,
		};

		await logRepo.create({
			projectId: project.id,
			endpointId: null,
			method: request.method,
			path: request.path,
			status: 404,
			requestHeaders: JSON.stringify(request.headers),
			requestBody:
				typeof request.body === "string"
					? request.body
					: JSON.stringify(request.body),
			responseBody: JSON.stringify(errorResponse),
			duration,
		});

		return { success: false, error: "endpoint_not_found" };
	}

	const { endpoint, params } = match;

	const templateContext: RequestContext = {
		params,
		query: request.query,
		headers: request.headers,
		body: request.body,
	};

	// Parse response body
	let body: unknown;
	try {
		if (endpoint.bodyType === "template") {
			const processed = processTemplate(endpoint.body, templateContext);
			try {
				body = JSON.parse(processed);
			} catch {
				body = processed;
			}
		} else {
			body = JSON.parse(endpoint.body);
			body = interpolateParams(body, params);
		}
	} catch {
		body = endpoint.body;
	}

	// Parse headers
	let headers: Record<string, string> = {};
	try {
		headers = JSON.parse(endpoint.headers);
	} catch {
		// ignore
	}

	// Apply delay
	if (endpoint.delay > 0) {
		await new Promise((resolve) => setTimeout(resolve, endpoint.delay));
	}

	// Determine status (apply fail rate)
	let status = endpoint.status;
	let responseBody = body;

	if (endpoint.failRate > 0 && Math.random() * 100 < endpoint.failRate) {
		status = 500;
		responseBody = {
			error: "simulated_failure",
			message: "Random failure triggered",
		};
	}

	// Log request
	const duration = Date.now() - startTime;
	await logRepo.create({
		projectId: project.id,
		endpointId: endpoint.id,
		method: request.method,
		path: request.path,
		status,
		requestHeaders: JSON.stringify(request.headers),
		requestBody:
			typeof request.body === "string"
				? request.body
				: JSON.stringify(request.body),
		responseBody: JSON.stringify(responseBody),
		duration,
	});

	return {
		success: true,
		response: { status, headers, body: responseBody },
		endpointId: endpoint.id,
	};
}

function interpolateParams(
	obj: unknown,
	params: Record<string, string>,
): unknown {
	if (typeof obj === "string") {
		return obj.replace(/:(\w+)/g, (_, key) => params[key] ?? `:${key}`);
	}
	if (Array.isArray(obj)) {
		return obj.map((item) => interpolateParams(item, params));
	}
	if (obj !== null && typeof obj === "object") {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			result[key] = interpolateParams(value, params);
		}
		return result;
	}
	return obj;
}

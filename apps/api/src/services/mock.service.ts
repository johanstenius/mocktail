import { eventBus } from "../events/event-bus";
import { createEvent } from "../events/types";
import * as projectRepo from "../repositories/project.repository";
import * as logRepo from "../repositories/request-log.repository";
import { findBestMatch } from "../utils/path-matcher";
import type { ValidationMode } from "./endpoint.service";
import { proxyRequest } from "./proxy.service";
import {
	isEmptySchema,
	validateRequestBody,
} from "./request-validator.service";
import { type MatchContext, findMatchingVariant } from "./rule-matcher.service";
import { type RequestContext, processTemplate } from "./template-engine";
import type { MatchRule, RuleLogic, VariantModel } from "./variant.service";

export type RequestSource = "mock" | "proxy" | "proxy_fallback";

type Variant = {
	id: string;
	endpointId: string;
	name: string;
	priority: number;
	isDefault: boolean;
	status: number;
	headers: unknown;
	body: unknown;
	bodyType: string;
	delay: number;
	delayType: string;
	failRate: number;
	rules: unknown;
	ruleLogic: string;
	createdAt: Date;
	updatedAt: Date;
};

type Endpoint = {
	id: string;
	method: string;
	path: string;
	requestBodySchema: unknown;
	validationMode: string;
	proxyEnabled: boolean;
	variants: Variant[];
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
	| {
			success: true;
			response: MockResponse;
			endpointId: string;
			variantId: string | null;
	  }
	| { success: false; error: "project_not_found" | "endpoint_not_found" };

function dbVariantToModel(variant: Variant): VariantModel {
	return {
		...variant,
		headers: variant.headers as Record<string, string>,
		rules: variant.rules as MatchRule[],
		ruleLogic: variant.ruleLogic as RuleLogic,
		delayType: variant.delayType as "fixed" | "random",
	};
}

function getEffectiveVariant(
	endpoint: Endpoint,
	matchContext: MatchContext,
): VariantModel | null {
	if (endpoint.variants.length === 0) return null;
	const variants = endpoint.variants.map(dbVariantToModel);
	return findMatchingVariant(variants, matchContext);
}

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

	// No endpoint match - try proxy fallback or 404
	if (!match) {
		if (project.proxyBaseUrl) {
			return handleProxyRequest(
				project,
				null,
				request,
				startTime,
				"proxy_fallback",
			);
		}

		const duration = Date.now() - startTime;
		const errorResponse = {
			error: "not_found",
			message: `No endpoint configured for ${request.method} ${request.path}`,
		};

		await logRepo.create({
			projectId: project.id,
			endpointId: null,
			variantId: null,
			method: request.method,
			path: request.path,
			status: 404,
			source: "mock",
			requestHeaders: request.headers,
			requestBody: request.body,
			responseBody: errorResponse,
			duration,
		});

		emitStatsUpdate(project.id, null);
		return { success: false, error: "endpoint_not_found" };
	}

	const { endpoint, params } = match;

	// Endpoint matched - check if proxy enabled
	if (endpoint.proxyEnabled && project.proxyBaseUrl) {
		return handleProxyRequest(
			project,
			endpoint.id,
			request,
			startTime,
			"proxy",
		);
	}

	// Mock response path
	const matchContext: MatchContext = {
		params,
		query: request.query,
		headers: request.headers,
		body: request.body,
	};

	const variant = getEffectiveVariant(endpoint, matchContext);

	if (!variant) {
		const duration = Date.now() - startTime;
		const errorResponse = {
			error: "no_variant",
			message: "No response variant configured for this endpoint",
		};

		await logRepo.create({
			projectId: project.id,
			endpointId: endpoint.id,
			variantId: null,
			method: request.method,
			path: request.path,
			status: 500,
			source: "mock",
			requestHeaders: request.headers,
			requestBody: request.body,
			responseBody: errorResponse,
			duration,
		});

		emitStatsUpdate(project.id, endpoint.id);
		return { success: false, error: "endpoint_not_found" };
	}

	// Request body validation (from endpoint, not variant)
	let validationErrors: string[] | null = null;
	const validationMode = (endpoint.validationMode ?? "none") as ValidationMode;
	const schema = endpoint.requestBodySchema;

	if (validationMode !== "none" && !isEmptySchema(schema)) {
		const validationResult = validateRequestBody(schema, request.body);
		if (!validationResult.valid) {
			validationErrors = validationResult.errors;

			if (validationMode === "strict") {
				const duration = Date.now() - startTime;
				const errorResponse = {
					error: "validation_failed",
					message: "Request body validation failed",
					validationErrors,
				};

				await logRepo.create({
					projectId: project.id,
					endpointId: endpoint.id,
					variantId: variant.id,
					method: request.method,
					path: request.path,
					status: 400,
					source: "mock",
					requestHeaders: request.headers,
					requestBody: request.body,
					responseBody: errorResponse,
					validationErrors,
					duration,
				});

				emitStatsUpdate(project.id, endpoint.id);
				return {
					success: true,
					response: {
						status: 400,
						headers: { "Content-Type": "application/json" },
						body: errorResponse,
					},
					endpointId: endpoint.id,
					variantId: variant.id,
				};
			}
		}
	}

	const templateContext: RequestContext = {
		params,
		query: request.query,
		headers: request.headers,
		body: request.body,
	};

	// Process response body
	let body: unknown;
	if (variant.bodyType === "template" && typeof variant.body === "string") {
		const processed = processTemplate(variant.body, templateContext);
		try {
			body = JSON.parse(processed);
		} catch {
			body = processed;
		}
	} else {
		body = interpolateParams(variant.body, params);
	}

	const headers = variant.headers;

	// Apply delay
	if (variant.delay > 0) {
		const actualDelay =
			variant.delayType === "random"
				? Math.floor(Math.random() * (variant.delay + 1))
				: variant.delay;
		await new Promise((resolve) => setTimeout(resolve, actualDelay));
	}

	// Determine status (apply fail rate)
	let status = variant.status;
	let responseBody = body;

	if (variant.failRate > 0 && Math.random() * 100 < variant.failRate) {
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
		variantId: variant.id,
		method: request.method,
		path: request.path,
		status,
		source: "mock",
		requestHeaders: request.headers,
		requestBody: request.body,
		responseBody,
		validationErrors,
		duration,
	});

	emitStatsUpdate(project.id, endpoint.id);
	return {
		success: true,
		response: { status, headers, body: responseBody },
		endpointId: endpoint.id,
		variantId: variant.id,
	};
}

async function handleProxyRequest(
	project: {
		id: string;
		proxyBaseUrl: string | null;
		proxyTimeout: number;
		proxyAuthHeader: string | null;
		proxyPassThroughAuth: boolean;
	},
	endpointId: string | null,
	request: MockRequest,
	startTime: number,
	source: "proxy" | "proxy_fallback",
): Promise<MockResult> {
	if (!project.proxyBaseUrl) {
		return { success: false, error: "endpoint_not_found" };
	}

	const proxyResult = await proxyRequest(
		project.proxyBaseUrl,
		{
			method: request.method,
			path: request.path,
			headers: request.headers,
			query: request.query,
			body: request.body,
		},
		project.proxyTimeout,
		{
			passThrough: project.proxyPassThroughAuth,
			header: project.proxyAuthHeader,
		},
	);

	if (proxyResult.success) {
		await logRepo.create({
			projectId: project.id,
			endpointId,
			variantId: null,
			method: request.method,
			path: request.path,
			status: proxyResult.status,
			source,
			requestHeaders: request.headers,
			requestBody: request.body,
			responseBody: proxyResult.body,
			duration: proxyResult.duration,
		});

		emitStatsUpdate(project.id, endpointId);
		return {
			success: true,
			response: {
				status: proxyResult.status,
				headers: proxyResult.headers,
				body: proxyResult.body,
			},
			endpointId: endpointId ?? "",
			variantId: null,
		};
	}

	// Proxy failed - return 502 Bad Gateway
	const errorResponse = {
		error: "proxy_error",
		message: proxyResult.message,
		type: proxyResult.error,
	};

	await logRepo.create({
		projectId: project.id,
		endpointId,
		variantId: null,
		method: request.method,
		path: request.path,
		status: 502,
		source,
		requestHeaders: request.headers,
		requestBody: request.body,
		responseBody: errorResponse,
		duration: proxyResult.duration,
	});

	emitStatsUpdate(project.id, endpointId);
	return {
		success: true,
		response: {
			status: 502,
			headers: { "Content-Type": "application/json" },
			body: errorResponse,
		},
		endpointId: endpointId ?? "",
		variantId: null,
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

function emitStatsUpdate(projectId: string, endpointId: string | null): void {
	const event = createEvent("stats.updated", "project", projectId, {
		projectId,
		endpointId,
	});
	eventBus.emitDebounced(event, 500);
}

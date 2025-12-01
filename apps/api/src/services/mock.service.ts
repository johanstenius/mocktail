import * as projectRepo from "../repositories/project.repository";
import * as logRepo from "../repositories/request-log.repository";
import { findBestMatch } from "../utils/path-matcher";
import type { ValidationMode } from "./endpoint.service";
import {
	isEmptySchema,
	validateRequestBody,
} from "./request-validator.service";
import { type MatchContext, findMatchingVariant } from "./rule-matcher.service";
import { type RequestContext, processTemplate } from "./template-engine";
import type { MatchRule, RuleLogic, VariantModel } from "./variant.service";

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

	if (!match) {
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
			requestHeaders: request.headers,
			requestBody: request.body,
			responseBody: errorResponse,
			duration,
		});

		return { success: false, error: "endpoint_not_found" };
	}

	const { endpoint, params } = match;

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
			requestHeaders: request.headers,
			requestBody: request.body,
			responseBody: errorResponse,
			duration,
		});

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
					requestHeaders: request.headers,
					requestBody: request.body,
					responseBody: errorResponse,
					validationErrors,
					duration,
				});

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
		await new Promise((resolve) => setTimeout(resolve, variant.delay));
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
		requestHeaders: request.headers,
		requestBody: request.body,
		responseBody,
		validationErrors,
		duration,
	});

	return {
		success: true,
		response: { status, headers, body: responseBody },
		endpointId: endpoint.id,
		variantId: variant.id,
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

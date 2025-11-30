import * as projectRepo from "../repositories/project.repository";
import * as logRepo from "../repositories/request-log.repository";
import { findBestMatch } from "../utils/path-matcher";
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
	headers: string;
	body: string;
	bodyType: string;
	delay: number;
	failRate: number;
	rules: string;
	ruleLogic: string;
	createdAt: Date;
	updatedAt: Date;
};

type Endpoint = {
	id: string;
	method: string;
	path: string;
	variants: Variant[];
	// Legacy fields for backwards compat
	status?: number | null;
	headers?: string | null;
	body?: string | null;
	bodyType?: string | null;
	delay?: number | null;
	failRate?: number | null;
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
		rules: JSON.parse(variant.rules) as MatchRule[],
		ruleLogic: variant.ruleLogic as RuleLogic,
		requestBodySchema: null,
		validationMode: "none",
	};
}

function getEffectiveVariant(
	endpoint: Endpoint,
	matchContext: MatchContext,
): { variant: VariantModel | null; useLegacy: boolean } {
	if (endpoint.variants.length > 0) {
		const variants = endpoint.variants.map(dbVariantToModel);
		const matched = findMatchingVariant(variants, matchContext);
		return { variant: matched, useLegacy: false };
	}
	// Legacy fallback: use endpoint fields directly
	if (endpoint.status != null) {
		return {
			variant: {
				id: "legacy",
				endpointId: endpoint.id,
				name: "Default",
				priority: 0,
				isDefault: true,
				status: endpoint.status,
				headers: endpoint.headers ?? "{}",
				body: endpoint.body ?? "{}",
				bodyType: endpoint.bodyType ?? "static",
				delay: endpoint.delay ?? 0,
				failRate: endpoint.failRate ?? 0,
				rules: [],
				ruleLogic: "and",
				requestBodySchema: null,
				validationMode: "none",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			useLegacy: true,
		};
	}
	return { variant: null, useLegacy: false };
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

	const matchContext: MatchContext = {
		params,
		query: request.query,
		headers: request.headers,
		body: request.body,
	};

	const { variant, useLegacy } = getEffectiveVariant(endpoint, matchContext);

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

	const templateContext: RequestContext = {
		params,
		query: request.query,
		headers: request.headers,
		body: request.body,
	};

	// Parse response body
	let body: unknown;
	try {
		if (variant.bodyType === "template") {
			const processed = processTemplate(variant.body, templateContext);
			try {
				body = JSON.parse(processed);
			} catch {
				body = processed;
			}
		} else {
			body = JSON.parse(variant.body);
			body = interpolateParams(body, params);
		}
	} catch {
		body = variant.body;
	}

	// Parse headers
	let headers: Record<string, string> = {};
	try {
		headers = JSON.parse(variant.headers);
	} catch {
		// ignore
	}

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
		variantId: useLegacy ? null : variant.id,
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
		variantId: useLegacy ? null : variant.id,
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

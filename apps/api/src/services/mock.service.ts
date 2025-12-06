import { z } from "zod";
import { eventBus } from "../events/event-bus";
import { createEvent } from "../events/types";
import * as projectRepo from "../repositories/project.repository";
import * as logRepo from "../repositories/request-log.repository";
import { logger } from "../utils/logger";
import { findBestMatch } from "../utils/path-matcher";
import type { ValidationMode } from "./endpoint.service";
import { proxyRequest } from "./proxy.service";
import {
	isEmptySchema,
	validateRequestBody,
} from "./request-validator.service";
import { type MatchContext, findMatchingVariant } from "./rule-matcher.service";
import { type RequestContext, processTemplate } from "./template-engine";
import type { VariantModel } from "./variant.service";

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

const matchRuleSchema = z.object({
	target: z.enum(["header", "query", "param", "body"]),
	key: z.string(),
	operator: z.enum([
		"equals",
		"not_equals",
		"contains",
		"not_contains",
		"exists",
		"not_exists",
	]),
	value: z.string().optional(),
});

const dbVariantSchema = z.object({
	headers: z.record(z.string()).catch({}),
	rules: z.array(matchRuleSchema).catch([]),
	ruleLogic: z.enum(["and", "or"]).catch("and"),
	delayType: z.enum(["fixed", "random"]).catch("fixed"),
});

function dbVariantToModel(variant: Variant): VariantModel {
	const parsed = dbVariantSchema.safeParse({
		headers: variant.headers,
		rules: variant.rules,
		ruleLogic: variant.ruleLogic,
		delayType: variant.delayType,
	});

	if (!parsed.success) {
		logger.warn(
			{ variantId: variant.id, errors: parsed.error.issues },
			"Invalid variant data in database, using defaults",
		);
	}

	const validated = parsed.success ? parsed.data : dbVariantSchema.parse({});

	return {
		...variant,
		headers: validated.headers,
		rules: validated.rules,
		ruleLogic: validated.ruleLogic,
		delayType: validated.delayType,
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

type LogContext = {
	projectId: string;
	endpointId: string | null;
	variantId: string | null;
	request: MockRequest;
	startTime: number;
};

async function logAndEmit(
	ctx: LogContext,
	status: number,
	source: RequestSource,
	responseBody: unknown,
	validationErrors?: string[] | null,
): Promise<void> {
	await logRepo.create({
		projectId: ctx.projectId,
		endpointId: ctx.endpointId,
		variantId: ctx.variantId,
		method: ctx.request.method,
		path: ctx.request.path,
		status,
		source,
		requestHeaders: ctx.request.headers,
		requestBody: ctx.request.body,
		responseBody,
		validationErrors,
		duration: Date.now() - ctx.startTime,
	});
	emitStatsUpdate(ctx.projectId, ctx.endpointId);
}

function validateRequest(
	endpoint: Endpoint,
	body: unknown,
): { valid: true } | { valid: false; errors: string[] } {
	const validationMode = (endpoint.validationMode ?? "none") as ValidationMode;
	if (validationMode === "none" || isEmptySchema(endpoint.requestBodySchema)) {
		return { valid: true };
	}
	const result = validateRequestBody(endpoint.requestBodySchema, body);
	return result.valid
		? { valid: true }
		: { valid: false, errors: result.errors };
}

function processResponseBody(
	variant: VariantModel,
	context: RequestContext,
): unknown {
	if (variant.bodyType === "template" && typeof variant.body === "string") {
		const processed = processTemplate(variant.body, context);
		try {
			return JSON.parse(processed);
		} catch {
			return processed;
		}
	}
	return interpolateParams(variant.body, context.params);
}

async function applyDelay(variant: VariantModel): Promise<void> {
	if (variant.delay <= 0) return;
	const delay =
		variant.delayType === "random"
			? Math.floor(Math.random() * (variant.delay + 1))
			: variant.delay;
	await new Promise((resolve) => setTimeout(resolve, delay));
}

function applyFailRate(
	variant: VariantModel,
	body: unknown,
): { status: number; body: unknown } {
	if (variant.failRate > 0 && Math.random() * 100 < variant.failRate) {
		return {
			status: 500,
			body: { error: "simulated_failure", message: "Random failure triggered" },
		};
	}
	return { status: variant.status, body };
}

async function handleNoEndpointMatch(
	project: { id: string; proxyBaseUrl: string | null },
	request: MockRequest,
	startTime: number,
): Promise<MockResult> {
	if (project.proxyBaseUrl) {
		return handleProxyRequest(
			project as Parameters<typeof handleProxyRequest>[0],
			null,
			request,
			startTime,
			"proxy_fallback",
		);
	}

	const errorResponse = {
		error: "not_found",
		message: `No endpoint configured for ${request.method} ${request.path}`,
	};

	await logAndEmit(
		{
			projectId: project.id,
			endpointId: null,
			variantId: null,
			request,
			startTime,
		},
		404,
		"mock",
		errorResponse,
	);

	return { success: false, error: "endpoint_not_found" };
}

async function handleNoVariant(
	projectId: string,
	endpointId: string,
	request: MockRequest,
	startTime: number,
): Promise<MockResult> {
	const errorResponse = {
		error: "no_variant",
		message: "No response variant configured for this endpoint",
	};

	await logAndEmit(
		{ projectId, endpointId, variantId: null, request, startTime },
		500,
		"mock",
		errorResponse,
	);

	return { success: false, error: "endpoint_not_found" };
}

async function handleValidationFailure(
	ctx: LogContext,
	variant: VariantModel,
	errors: string[],
): Promise<MockResult> {
	const errorResponse = {
		error: "validation_failed",
		message: "Request body validation failed",
		validationErrors: errors,
	};

	await logAndEmit(ctx, 400, "mock", errorResponse, errors);

	return {
		success: true,
		response: {
			status: 400,
			headers: { "Content-Type": "application/json" },
			body: errorResponse,
		},
		endpointId: ctx.endpointId ?? "",
		variantId: variant.id,
	};
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
		return handleNoEndpointMatch(project, request, startTime);
	}

	const { endpoint, params } = match;

	if (endpoint.proxyEnabled && project.proxyBaseUrl) {
		return handleProxyRequest(
			project,
			endpoint.id,
			request,
			startTime,
			"proxy",
		);
	}

	const matchContext: MatchContext = {
		params,
		query: request.query,
		headers: request.headers,
		body: request.body,
	};

	const variant = getEffectiveVariant(endpoint, matchContext);
	if (!variant) {
		return handleNoVariant(project.id, endpoint.id, request, startTime);
	}

	const ctx: LogContext = {
		projectId: project.id,
		endpointId: endpoint.id,
		variantId: variant.id,
		request,
		startTime,
	};

	const validation = validateRequest(endpoint, request.body);
	const validationMode = (endpoint.validationMode ?? "none") as ValidationMode;

	if (!validation.valid && validationMode === "strict") {
		return handleValidationFailure(ctx, variant, validation.errors);
	}

	const validationErrors = validation.valid ? null : validation.errors;

	const templateContext: RequestContext = {
		params,
		query: request.query,
		headers: request.headers,
		body: request.body,
	};

	const body = processResponseBody(variant, templateContext);
	await applyDelay(variant);
	const { status, body: responseBody } = applyFailRate(variant, body);

	await logAndEmit(ctx, status, "mock", responseBody, validationErrors);

	return {
		success: true,
		response: { status, headers: variant.headers, body: responseBody },
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
	_startTime: number,
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

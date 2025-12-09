import * as endpointRepo from "../repositories/endpoint.repository";
import * as projectRepo from "../repositories/project.repository";
import * as variantRepo from "../repositories/variant.repository";
import * as auditService from "./audit.service";
import type { AuditContext } from "./audit.service";
import { validateJsonSchema } from "./request-validator.service";

export type ValidationMode = "none" | "warn" | "strict";

export type EndpointModel = {
	id: string;
	projectId: string;
	method: string;
	path: string;
	requestBodySchema: unknown;
	validationMode: ValidationMode;
	proxyEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
	// For API response, we include the default variant's response config
	status: number;
	headers: Record<string, string>;
	body: unknown;
	bodyType: string;
	delay: number;
	failRate: number;
};

type PrismaEndpoint = {
	id: string;
	projectId: string;
	method: string;
	path: string;
	requestBodySchema: unknown;
	validationMode: string;
	proxyEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
};

type PrismaVariant = {
	status: number;
	headers: unknown;
	body: unknown;
	bodyType: string;
	delay: number;
	failRate: number;
};

function toEndpointModel(
	e: PrismaEndpoint,
	defaultVariant?: PrismaVariant | null,
): EndpointModel {
	return {
		id: e.id,
		projectId: e.projectId,
		method: e.method,
		path: e.path,
		requestBodySchema: e.requestBodySchema,
		validationMode: e.validationMode as ValidationMode,
		proxyEnabled: e.proxyEnabled,
		createdAt: e.createdAt,
		updatedAt: e.updatedAt,
		// Response config from default variant or defaults
		status: defaultVariant?.status ?? 200,
		headers: (defaultVariant?.headers as Record<string, string>) ?? {},
		body: defaultVariant?.body ?? {},
		bodyType: defaultVariant?.bodyType ?? "static",
		delay: defaultVariant?.delay ?? 0,
		failRate: defaultVariant?.failRate ?? 0,
	};
}

export type CreateEndpointInput = {
	method: string;
	path: string;
	status: number;
	headers: Record<string, string>;
	body: unknown;
	bodyType: string;
	delay: number;
	failRate: number;
	requestBodySchema?: unknown;
	validationMode?: ValidationMode;
	proxyEnabled?: boolean;
};

export type UpdateEndpointInput = Partial<CreateEndpointInput>;

export async function findByProjectId(
	projectId: string,
): Promise<EndpointModel[]> {
	const endpoints = await endpointRepo.findByProjectId(projectId);
	const result: EndpointModel[] = [];
	for (const e of endpoints) {
		const defaultVariant = await variantRepo.findDefaultByEndpoint(e.id);
		result.push(toEndpointModel(e, defaultVariant));
	}
	return result;
}

export async function findById(
	endpointId: string,
	projectId: string,
): Promise<EndpointModel | null> {
	const endpoint = await endpointRepo.findByIdAndProject(endpointId, projectId);
	if (!endpoint) return null;
	const defaultVariant = await variantRepo.findDefaultByEndpoint(endpointId);
	return toEndpointModel(endpoint, defaultVariant);
}

export async function create(
	projectId: string,
	input: CreateEndpointInput,
	ctx?: AuditContext,
): Promise<
	| { endpoint: EndpointModel }
	| {
			error: "project_not_found" | "conflict" | "invalid_schema";
			message?: string;
	  }
> {
	const project = await projectRepo.findById(projectId);
	if (!project) return { error: "project_not_found" };

	const existing = await endpointRepo.findByMethodAndPath(
		projectId,
		input.method,
		input.path,
	);
	if (existing) return { error: "conflict" };

	if (input.requestBodySchema !== undefined) {
		const schemaValidation = validateJsonSchema(input.requestBodySchema);
		if (!schemaValidation.valid) {
			return { error: "invalid_schema", message: schemaValidation.error };
		}
	}

	const endpoint = await endpointRepo.create({
		projectId,
		method: input.method,
		path: input.path,
		requestBodySchema: input.requestBodySchema ?? {},
		validationMode: input.validationMode ?? "none",
		proxyEnabled: input.proxyEnabled ?? false,
	});

	const variant = await variantRepo.create({
		endpointId: endpoint.id,
		name: "Default",
		priority: 0,
		isDefault: true,
		status: input.status,
		headers: input.headers,
		body: input.body,
		bodyType: input.bodyType,
		delay: input.delay,
		failRate: input.failRate,
		rules: [],
		ruleLogic: "and",
		sequenceIndex: null,
	});

	await auditService.log({
		orgId: project.orgId,
		action: "endpoint_created",
		targetType: "endpoint",
		targetId: endpoint.id,
		metadata: { method: input.method, path: input.path },
		ctx,
	});

	return { endpoint: toEndpointModel(endpoint, variant) };
}

export async function update(
	endpointId: string,
	projectId: string,
	input: UpdateEndpointInput,
	ctx?: AuditContext,
): Promise<
	EndpointModel | { error: "invalid_schema"; message: string } | null
> {
	const existing = await endpointRepo.findByIdAndProject(endpointId, projectId);
	if (!existing) return null;

	const project = await projectRepo.findById(projectId);
	if (!project) return null;

	if (input.requestBodySchema !== undefined) {
		const schemaValidation = validateJsonSchema(input.requestBodySchema);
		if (!schemaValidation.valid) {
			return { error: "invalid_schema", message: schemaValidation.error };
		}
	}

	// Update endpoint (only method, path, validation fields, proxyEnabled)
	const endpoint = await endpointRepo.update(endpointId, {
		...(input.method && { method: input.method }),
		...(input.path && { path: input.path }),
		...(input.requestBodySchema !== undefined && {
			requestBodySchema: input.requestBodySchema,
		}),
		...(input.validationMode !== undefined && {
			validationMode: input.validationMode,
		}),
		...(input.proxyEnabled !== undefined && {
			proxyEnabled: input.proxyEnabled,
		}),
	});

	// Update default variant if response-related fields provided
	const defaultVariant = await variantRepo.findDefaultByEndpoint(endpointId);
	let updatedVariant = defaultVariant;

	const hasResponseUpdates =
		input.status !== undefined ||
		input.headers !== undefined ||
		input.body !== undefined ||
		input.bodyType !== undefined ||
		input.delay !== undefined ||
		input.failRate !== undefined;

	if (defaultVariant && hasResponseUpdates) {
		updatedVariant = await variantRepo.update(defaultVariant.id, {
			...(input.status !== undefined && { status: input.status }),
			...(input.headers !== undefined && { headers: input.headers }),
			...(input.body !== undefined && { body: input.body }),
			...(input.bodyType !== undefined && { bodyType: input.bodyType }),
			...(input.delay !== undefined && { delay: input.delay }),
			...(input.failRate !== undefined && { failRate: input.failRate }),
		});
	}

	const changedFields: string[] = [];
	if (input.method && input.method !== existing.method)
		changedFields.push("method");
	if (input.path && input.path !== existing.path) changedFields.push("path");
	if (input.status !== undefined) changedFields.push("status");
	if (input.bodyType !== undefined) changedFields.push("bodyType");
	if (input.delay !== undefined) changedFields.push("delay");
	if (input.failRate !== undefined) changedFields.push("failRate");
	if (input.headers !== undefined) changedFields.push("headers");
	if (input.body !== undefined) changedFields.push("body");
	if (input.requestBodySchema !== undefined)
		changedFields.push("requestBodySchema");
	if (input.validationMode !== undefined) changedFields.push("validationMode");
	if (input.proxyEnabled !== undefined) changedFields.push("proxyEnabled");

	if (changedFields.length > 0) {
		await auditService.log({
			orgId: project.orgId,
			action: "endpoint_updated",
			targetType: "endpoint",
			targetId: endpointId,
			metadata: {
				method: endpoint?.method,
				path: endpoint?.path,
				changedFields,
			},
			ctx,
		});
	}

	return endpoint ? toEndpointModel(endpoint, updatedVariant) : null;
}

export async function remove(
	endpointId: string,
	projectId: string,
	ctx?: AuditContext,
): Promise<boolean> {
	const existing = await endpointRepo.findByIdAndProject(endpointId, projectId);
	if (!existing) return false;

	const project = await projectRepo.findById(projectId);
	if (!project) return false;

	await endpointRepo.remove(endpointId);

	await auditService.log({
		orgId: project.orgId,
		action: "endpoint_deleted",
		targetType: "endpoint",
		targetId: endpointId,
		metadata: { method: existing.method, path: existing.path },
		ctx,
	});

	return true;
}

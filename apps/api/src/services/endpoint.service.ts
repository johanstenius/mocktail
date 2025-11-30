import * as endpointRepo from "../repositories/endpoint.repository";
import * as projectRepo from "../repositories/project.repository";
import * as variantRepo from "../repositories/variant.repository";
import * as auditService from "./audit.service";
import type { AuditContext } from "./audit.service";

export type EndpointModel = {
	id: string;
	projectId: string;
	method: string;
	path: string;
	status: number;
	headers: string;
	body: string;
	bodyType: string;
	delay: number;
	failRate: number;
	createdAt: Date;
	updatedAt: Date;
};

type PrismaEndpoint = {
	id: string;
	projectId: string;
	method: string;
	path: string;
	status: number | null;
	headers: string | null;
	body: string | null;
	bodyType: string | null;
	delay: number | null;
	failRate: number | null;
	createdAt: Date;
	updatedAt: Date;
};

function toEndpointModel(e: PrismaEndpoint): EndpointModel {
	return {
		id: e.id,
		projectId: e.projectId,
		method: e.method,
		path: e.path,
		status: e.status ?? 200,
		headers: e.headers ?? "{}",
		body: e.body ?? "",
		bodyType: e.bodyType ?? "static",
		delay: e.delay ?? 0,
		failRate: e.failRate ?? 0,
		createdAt: e.createdAt,
		updatedAt: e.updatedAt,
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
};

export type UpdateEndpointInput = Partial<CreateEndpointInput>;

export async function findByProjectId(
	projectId: string,
): Promise<EndpointModel[]> {
	const endpoints = await endpointRepo.findByProjectId(projectId);
	return endpoints.map(toEndpointModel);
}

export async function findById(
	endpointId: string,
	projectId: string,
): Promise<EndpointModel | null> {
	const endpoint = await endpointRepo.findByIdAndProject(endpointId, projectId);
	return endpoint ? toEndpointModel(endpoint) : null;
}

export async function create(
	projectId: string,
	input: CreateEndpointInput,
	ctx?: AuditContext,
): Promise<
	{ endpoint: EndpointModel } | { error: "project_not_found" | "conflict" }
> {
	const project = await projectRepo.findById(projectId);
	if (!project) return { error: "project_not_found" };

	const existing = await endpointRepo.findByMethodAndPath(
		projectId,
		input.method,
		input.path,
	);
	if (existing) return { error: "conflict" };

	const bodyString =
		input.bodyType === "template"
			? String(input.body)
			: JSON.stringify(input.body);
	const headersString = JSON.stringify(input.headers);

	const endpoint = await endpointRepo.create({
		projectId,
		method: input.method,
		path: input.path,
		status: input.status,
		headers: headersString,
		body: bodyString,
		bodyType: input.bodyType,
		delay: input.delay,
		failRate: input.failRate,
	});

	await variantRepo.create({
		endpointId: endpoint.id,
		name: "Default",
		priority: 0,
		isDefault: true,
		status: input.status,
		headers: headersString,
		body: bodyString,
		bodyType: input.bodyType,
		delay: input.delay,
		failRate: input.failRate,
		rules: "[]",
		ruleLogic: "and",
	});

	await auditService.log({
		orgId: project.orgId,
		action: "endpoint_created",
		targetType: "endpoint",
		targetId: endpoint.id,
		metadata: { method: input.method, path: input.path },
		ctx,
	});

	return { endpoint: toEndpointModel(endpoint) };
}

export async function update(
	endpointId: string,
	projectId: string,
	input: UpdateEndpointInput,
	ctx?: AuditContext,
): Promise<EndpointModel | null> {
	const existing = await endpointRepo.findByIdAndProject(endpointId, projectId);
	if (!existing) return null;

	const project = await projectRepo.findById(projectId);
	if (!project) return null;

	const bodyType = input.bodyType ?? existing.bodyType;

	const endpoint = await endpointRepo.update(endpointId, {
		...(input.method && { method: input.method }),
		...(input.path && { path: input.path }),
		...(input.status !== undefined && { status: input.status }),
		...(input.headers && { headers: JSON.stringify(input.headers) }),
		...(input.body !== undefined && {
			body:
				bodyType === "template"
					? String(input.body)
					: JSON.stringify(input.body),
		}),
		...(input.bodyType && { bodyType: input.bodyType }),
		...(input.delay !== undefined && { delay: input.delay }),
		...(input.failRate !== undefined && { failRate: input.failRate }),
	});

	const changedFields: string[] = [];
	if (input.method && input.method !== existing.method)
		changedFields.push("method");
	if (input.path && input.path !== existing.path) changedFields.push("path");
	if (input.status !== undefined && input.status !== existing.status)
		changedFields.push("status");
	if (input.bodyType && input.bodyType !== existing.bodyType)
		changedFields.push("bodyType");
	if (input.delay !== undefined && input.delay !== existing.delay)
		changedFields.push("delay");
	if (input.failRate !== undefined && input.failRate !== existing.failRate)
		changedFields.push("failRate");
	if (input.headers) changedFields.push("headers");
	if (input.body !== undefined) changedFields.push("body");

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

	return endpoint ? toEndpointModel(endpoint) : null;
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

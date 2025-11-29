import * as endpointRepo from "../repositories/endpoint.repository";
import * as projectRepo from "../repositories/project.repository";

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

export function findByProjectId(projectId: string): Promise<EndpointModel[]> {
	return endpointRepo.findByProjectId(projectId);
}

export function findById(
	endpointId: string,
	projectId: string,
): Promise<EndpointModel | null> {
	return endpointRepo.findByIdAndProject(endpointId, projectId);
}

export async function create(
	projectId: string,
	input: CreateEndpointInput,
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

	const endpoint = await endpointRepo.create({
		projectId,
		method: input.method,
		path: input.path,
		status: input.status,
		headers: JSON.stringify(input.headers),
		body:
			input.bodyType === "template"
				? String(input.body)
				: JSON.stringify(input.body),
		bodyType: input.bodyType,
		delay: input.delay,
		failRate: input.failRate,
	});

	return { endpoint };
}

export async function update(
	endpointId: string,
	projectId: string,
	input: UpdateEndpointInput,
): Promise<EndpointModel | null> {
	const existing = await endpointRepo.findByIdAndProject(endpointId, projectId);
	if (!existing) return null;

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

	return endpoint;
}

export async function remove(
	endpointId: string,
	projectId: string,
): Promise<boolean> {
	const existing = await endpointRepo.findByIdAndProject(endpointId, projectId);
	if (!existing) return false;
	await endpointRepo.remove(endpointId);
	return true;
}

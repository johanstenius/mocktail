import { prisma } from "./db/prisma";

type CreateEndpointData = {
	projectId: string;
	method: string;
	path: string;
	status: number;
	headers: string;
	body: string;
	bodyType: string;
	delay: number;
	failRate: number;
};

type UpdateEndpointData = Partial<Omit<CreateEndpointData, "projectId">>;

export function findByProjectId(projectId: string) {
	return prisma.endpoint.findMany({
		where: { projectId },
		orderBy: { createdAt: "desc" },
	});
}

export function findById(id: string) {
	return prisma.endpoint.findUnique({
		where: { id },
	});
}

export function findByIdAndProject(id: string, projectId: string) {
	return prisma.endpoint.findFirst({
		where: { id, projectId },
	});
}

export function findByMethodAndPath(
	projectId: string,
	method: string,
	path: string,
) {
	return prisma.endpoint.findFirst({
		where: { projectId, method, path },
	});
}

export function create(data: CreateEndpointData) {
	return prisma.endpoint.create({ data });
}

export function update(id: string, data: UpdateEndpointData) {
	return prisma.endpoint.update({
		where: { id },
		data,
	});
}

export function remove(id: string) {
	return prisma.endpoint.delete({
		where: { id },
	});
}

export function upsert(
	projectId: string,
	method: string,
	path: string,
	data: Omit<CreateEndpointData, "projectId">,
) {
	return prisma.endpoint.upsert({
		where: {
			projectId_method_path: { projectId, method, path },
		},
		update: data,
		create: { projectId, ...data },
	});
}

export function countByProjectId(projectId: string) {
	return prisma.endpoint.count({
		where: { projectId },
	});
}

export function findByIdWithProject(id: string) {
	return prisma.endpoint.findUnique({
		where: { id },
		include: { project: { select: { orgId: true } } },
	});
}

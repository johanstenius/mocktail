import type { Prisma } from "@prisma/client";
import { prisma } from "./db/prisma";

type CreateEndpointData = {
	projectId: string;
	method: string;
	path: string;
	requestBodySchema?: unknown;
	validationMode?: string;
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
	return prisma.endpoint.create({
		data: {
			projectId: data.projectId,
			method: data.method,
			path: data.path,
			requestBodySchema:
				(data.requestBodySchema as Prisma.InputJsonValue) ?? {},
			validationMode: data.validationMode ?? "none",
		},
	});
}

export function update(id: string, data: UpdateEndpointData) {
	return prisma.endpoint.update({
		where: { id },
		data: {
			...(data.method && { method: data.method }),
			...(data.path && { path: data.path }),
			...(data.requestBodySchema !== undefined && {
				requestBodySchema: data.requestBodySchema as Prisma.InputJsonValue,
			}),
			...(data.validationMode && { validationMode: data.validationMode }),
		},
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
	const prismaData = {
		method: data.method,
		path: data.path,
		...(data.requestBodySchema !== undefined && {
			requestBodySchema: data.requestBodySchema as Prisma.InputJsonValue,
		}),
		...(data.validationMode && { validationMode: data.validationMode }),
	};
	return prisma.endpoint.upsert({
		where: {
			projectId_method_path: { projectId, method, path },
		},
		update: prismaData,
		create: { projectId, ...prismaData },
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

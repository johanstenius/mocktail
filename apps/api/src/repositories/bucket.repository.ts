import { prisma } from "./db/prisma";

export type CreateBucketData = {
	projectId: string;
	name: string;
	data: string;
};

export type UpdateBucketData = {
	data: string;
};

export function findByProjectId(projectId: string) {
	return prisma.dataBucket.findMany({
		where: { projectId },
		orderBy: { name: "asc" },
	});
}

export function findByName(projectId: string, name: string) {
	return prisma.dataBucket.findUnique({
		where: { projectId_name: { projectId, name } },
	});
}

export function create(data: CreateBucketData) {
	return prisma.dataBucket.create({
		data: {
			projectId: data.projectId,
			name: data.name,
			data: data.data,
		},
	});
}

export function update(
	projectId: string,
	name: string,
	data: UpdateBucketData,
) {
	return prisma.dataBucket.update({
		where: { projectId_name: { projectId, name } },
		data: { data: data.data },
	});
}

export function remove(projectId: string, name: string) {
	return prisma.dataBucket.delete({
		where: { projectId_name: { projectId, name } },
	});
}

export function removeByProjectId(projectId: string) {
	return prisma.dataBucket.deleteMany({
		where: { projectId },
	});
}

export function countByProjectId(projectId: string) {
	return prisma.dataBucket.count({
		where: { projectId },
	});
}

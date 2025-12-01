import type { BatchJobStatus, BatchJobType, Prisma } from "@prisma/client";
import { prisma } from "./db/prisma";

type CreateJobData = {
	type: BatchJobType;
	status: BatchJobStatus;
};

export function create(data: CreateJobData) {
	return prisma.batchJob.create({ data });
}

export function findById(id: string) {
	return prisma.batchJob.findUnique({ where: { id } });
}

export function findByType(type: BatchJobType, limit = 20) {
	return prisma.batchJob.findMany({
		where: { type },
		orderBy: { startedAt: "desc" },
		take: limit,
	});
}

export function markCompleted(id: string, result: Prisma.InputJsonValue) {
	return prisma.batchJob.update({
		where: { id },
		data: { status: "completed", result, endedAt: new Date() },
	});
}

export function markFailed(id: string, error: string) {
	return prisma.batchJob.update({
		where: { id },
		data: { status: "failed", error, endedAt: new Date() },
	});
}

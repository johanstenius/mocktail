import { Prisma } from "@prisma/client";
import { prisma } from "./db/prisma";

type CreateLogData = {
	projectId: string;
	endpointId: string | null;
	variantId: string | null;
	method: string;
	path: string;
	status: number;
	source?: string;
	requestHeaders: unknown;
	requestBody: unknown;
	responseBody: unknown;
	validationErrors?: unknown;
	duration: number;
};

function toJsonOrDbNull(
	val: unknown,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
	return val === null || val === undefined
		? Prisma.DbNull
		: (val as Prisma.InputJsonValue);
}

type FindLogsOptions = {
	projectId: string;
	limit?: number;
	offset?: number;
	method?: string;
	status?: number;
	endpointId?: string;
	source?: string;
};

export function findByProjectId(options: FindLogsOptions) {
	const {
		projectId,
		limit = 50,
		offset = 0,
		method,
		status,
		endpointId,
		source,
	} = options;

	return prisma.requestLog.findMany({
		where: {
			projectId,
			...(method && { method }),
			...(status && { status }),
			...(endpointId && { endpointId }),
			...(source && { source }),
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
	});
}

export function countByProjectId(
	options: Omit<FindLogsOptions, "limit" | "offset">,
) {
	const { projectId, method, status, endpointId, source } = options;

	return prisma.requestLog.count({
		where: {
			projectId,
			...(method && { method }),
			...(status && { status }),
			...(endpointId && { endpointId }),
			...(source && { source }),
		},
	});
}

export function findById(id: string) {
	return prisma.requestLog.findUnique({
		where: { id },
	});
}

export function findByIdAndProject(id: string, projectId: string) {
	return prisma.requestLog.findFirst({
		where: { id, projectId },
	});
}

export function create(data: CreateLogData) {
	return prisma.requestLog.create({
		data: {
			projectId: data.projectId,
			endpointId: data.endpointId,
			variantId: data.variantId,
			method: data.method,
			path: data.path,
			status: data.status,
			source: data.source ?? "mock",
			requestHeaders: data.requestHeaders as Prisma.InputJsonValue,
			requestBody: toJsonOrDbNull(data.requestBody),
			responseBody: toJsonOrDbNull(data.responseBody),
			validationErrors: toJsonOrDbNull(data.validationErrors),
			duration: data.duration,
		},
	});
}

export function removeByProjectId(projectId: string) {
	return prisma.requestLog.deleteMany({
		where: { projectId },
	});
}

export async function removeOlderThan(
	projectId: string,
	cutoffDate: Date,
	chunkSize = 1000,
): Promise<number> {
	let totalDeleted = 0;

	while (true) {
		const toDelete = await prisma.requestLog.findMany({
			where: { projectId, createdAt: { lt: cutoffDate } },
			select: { id: true },
			take: chunkSize,
		});

		if (toDelete.length === 0) break;

		const { count } = await prisma.requestLog.deleteMany({
			where: { id: { in: toDelete.map((r) => r.id) } },
		});

		totalDeleted += count;
	}

	return totalDeleted;
}

export function getEndpointStats(projectId: string) {
	return prisma.requestLog.groupBy({
		by: ["endpointId"],
		where: { projectId, endpointId: { not: null } },
		_count: { id: true },
		_max: { createdAt: true },
	});
}

export function getUnmatchedRequests(projectId: string) {
	return prisma.requestLog.groupBy({
		by: ["method", "path"],
		where: { projectId, endpointId: null },
		_count: { id: true },
		_max: { createdAt: true },
		orderBy: { _count: { id: "desc" } },
	});
}

export function getAvgLatency(projectId: string) {
	return prisma.requestLog.aggregate({
		where: { projectId },
		_avg: { duration: true },
	});
}

export function findRecentByProjectIds(projectIds: string[], limit: number) {
	return prisma.requestLog.findMany({
		where: { projectId: { in: projectIds } },
		orderBy: { createdAt: "desc" },
		take: limit,
		include: {
			project: { select: { id: true, name: true } },
			endpoint: { select: { id: true, path: true } },
		},
	});
}

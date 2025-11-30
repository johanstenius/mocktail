import type { AuditAction } from "@prisma/client";
import { prisma } from "./db/prisma";

type CreateAuditLogData = {
	orgId: string;
	actorId: string | null;
	action: AuditAction;
	targetType?: string;
	targetId?: string;
	metadata?: string;
	ipAddress?: string;
	userAgent?: string;
};

type FindAuditLogsOptions = {
	orgId: string;
	limit?: number;
	offset?: number;
	action?: AuditAction;
	actorId?: string;
	targetType?: string;
	from?: Date;
	to?: Date;
};

export function create(data: CreateAuditLogData) {
	return prisma.auditLog.create({
		data: {
			orgId: data.orgId,
			actorId: data.actorId,
			action: data.action,
			targetType: data.targetType ?? null,
			targetId: data.targetId ?? null,
			metadata: data.metadata ?? "{}",
			ipAddress: data.ipAddress ?? null,
			userAgent: data.userAgent ?? null,
		},
	});
}

export function findByOrgId(options: FindAuditLogsOptions) {
	const {
		orgId,
		limit = 50,
		offset = 0,
		action,
		actorId,
		targetType,
		from,
		to,
	} = options;

	return prisma.auditLog.findMany({
		where: {
			orgId,
			...(action && { action }),
			...(actorId && { actorId }),
			...(targetType && { targetType }),
			...((from || to) && {
				createdAt: {
					...(from && { gte: from }),
					...(to && { lte: to }),
				},
			}),
		},
		include: {
			actor: { select: { id: true, email: true, name: true } },
		},
		orderBy: { createdAt: "desc" },
		take: limit,
		skip: offset,
	});
}

export function countByOrgId(
	options: Omit<FindAuditLogsOptions, "limit" | "offset">,
) {
	const { orgId, action, actorId, targetType, from, to } = options;

	return prisma.auditLog.count({
		where: {
			orgId,
			...(action && { action }),
			...(actorId && { actorId }),
			...(targetType && { targetType }),
			...((from || to) && {
				createdAt: {
					...(from && { gte: from }),
					...(to && { lte: to }),
				},
			}),
		},
	});
}

export async function removeOlderThan(
	orgId: string,
	cutoffDate: Date,
	chunkSize = 1000,
): Promise<number> {
	let totalDeleted = 0;

	while (true) {
		const toDelete = await prisma.auditLog.findMany({
			where: { orgId, createdAt: { lt: cutoffDate } },
			select: { id: true },
			take: chunkSize,
		});

		if (toDelete.length === 0) break;

		const { count } = await prisma.auditLog.deleteMany({
			where: { id: { in: toDelete.map((r) => r.id) } },
		});

		totalDeleted += count;
	}

	return totalDeleted;
}

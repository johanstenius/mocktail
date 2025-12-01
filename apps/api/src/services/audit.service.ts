import type { AuditAction } from "@prisma/client";
import * as auditRepo from "../repositories/audit.repository";

export type AuditContext = {
	actorId: string | null;
	ipAddress?: string;
	userAgent?: string;
};

export type AuditLogModel = {
	id: string;
	orgId: string;
	actorId: string | null;
	action: AuditAction;
	targetType: string | null;
	targetId: string | null;
	metadata: unknown;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: Date;
	actor: { id: string; email: string; name: string | null } | null;
};

export type FindAuditLogsOptions = {
	orgId: string;
	limit?: number;
	offset?: number;
	action?: AuditAction;
	actorId?: string;
	targetType?: string;
	from?: Date;
	to?: Date;
};

export type LogInput = {
	orgId: string;
	action: AuditAction;
	targetType?: string;
	targetId?: string;
	metadata?: Record<string, unknown>;
	ctx?: AuditContext;
};

export async function log(input: LogInput): Promise<void> {
	await auditRepo.create({
		orgId: input.orgId,
		actorId: input.ctx?.actorId ?? null,
		action: input.action,
		targetType: input.targetType,
		targetId: input.targetId,
		metadata: input.metadata,
		ipAddress: input.ctx?.ipAddress,
		userAgent: input.ctx?.userAgent,
	});
}

export async function findByOrgId(
	options: FindAuditLogsOptions,
): Promise<{ logs: AuditLogModel[]; total: number }> {
	const [logs, total] = await Promise.all([
		auditRepo.findByOrgId(options),
		auditRepo.countByOrgId(options),
	]);
	return { logs, total };
}

export function removeOlderThan(
	orgId: string,
	cutoffDate: Date,
): Promise<number> {
	return auditRepo.removeOlderThan(orgId, cutoffDate);
}

export function buildDiff<T extends Record<string, unknown>>(
	oldObj: T,
	newObj: Partial<T>,
	fields: (keyof T)[],
): Record<string, { old: unknown; new: unknown }> {
	const diff: Record<string, { old: unknown; new: unknown }> = {};

	for (const field of fields) {
		const oldVal = oldObj[field];
		const newVal = newObj[field];
		if (newVal !== undefined && oldVal !== newVal) {
			diff[field as string] = { old: oldVal, new: newVal };
		}
	}

	return diff;
}

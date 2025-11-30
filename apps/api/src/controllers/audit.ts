import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../middleware/auth";
import {
	authMiddleware,
	getAuth,
	requireVerifiedEmail,
} from "../middleware/auth";
import type { AuditLogResponse } from "../schemas/audit";
import { exportAuditLogsRoute, listAuditLogsRoute } from "../schemas/audit";
import * as auditService from "../services/audit.service";
import type { AuditLogModel } from "../services/audit.service";
import { forbidden } from "../utils/errors";

export const auditRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

auditRouter.use("*", authMiddleware(), requireVerifiedEmail());

function mapAuditLogToResponse(log: AuditLogModel): AuditLogResponse {
	let metadata: Record<string, unknown> = {};
	try {
		metadata = JSON.parse(log.metadata);
	} catch {
		// ignore
	}

	return {
		id: log.id,
		orgId: log.orgId,
		actorId: log.actorId,
		action: log.action,
		targetType: log.targetType,
		targetId: log.targetId,
		metadata,
		ipAddress: log.ipAddress,
		userAgent: log.userAgent,
		createdAt: log.createdAt.toISOString(),
		actor: log.actor,
	};
}

auditRouter.openapi(listAuditLogsRoute, async (c) => {
	const { orgId, role } = getAuth(c);
	const query = c.req.valid("query");

	if (role !== "owner" && role !== "admin") {
		throw forbidden("Only admins and owners can view audit logs");
	}

	const { logs, total } = await auditService.findByOrgId({
		orgId,
		limit: query.limit,
		offset: query.offset,
		action: query.action,
		actorId: query.actorId,
		targetType: query.targetType,
		from: query.from ? new Date(query.from) : undefined,
		to: query.to ? new Date(query.to) : undefined,
	});

	return c.json({
		logs: logs.map(mapAuditLogToResponse),
		total,
	});
});

auditRouter.openapi(exportAuditLogsRoute, async (c) => {
	const { orgId, role } = getAuth(c);
	const query = c.req.valid("query");

	if (role !== "owner" && role !== "admin") {
		throw forbidden("Only admins and owners can export audit logs");
	}

	const { logs, total } = await auditService.findByOrgId({
		orgId,
		limit: 1000,
		offset: 0,
		action: query.action,
		actorId: query.actorId,
		targetType: query.targetType,
		from: query.from ? new Date(query.from) : undefined,
		to: query.to ? new Date(query.to) : undefined,
	});

	const mapped = logs.map(mapAuditLogToResponse);

	if (query.format === "csv") {
		const headers = [
			"id",
			"createdAt",
			"action",
			"actorEmail",
			"targetType",
			"targetId",
			"metadata",
			"ipAddress",
		];
		const rows = mapped.map((log) => [
			log.id,
			log.createdAt,
			log.action,
			log.actor?.email ?? "",
			log.targetType ?? "",
			log.targetId ?? "",
			JSON.stringify(log.metadata),
			log.ipAddress ?? "",
		]);

		const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
			"\n",
		);

		return c.text(csv, 200, {
			"Content-Type": "text/csv",
			"Content-Disposition": "attachment; filename=audit-logs.csv",
		});
	}

	return c.json({ logs: mapped, total });
});

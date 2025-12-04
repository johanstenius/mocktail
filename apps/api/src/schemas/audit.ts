import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema } from "./shared";

export const auditActionSchema = z.enum([
	"org_created",
	"org_updated",
	"member_invited",
	"member_joined",
	"member_role_changed",
	"member_removed",
	"invite_cancelled",
	"project_created",
	"project_updated",
	"project_deleted",
	"api_key_rotated",
	"endpoint_created",
	"endpoint_updated",
	"endpoint_deleted",
	"variant_created",
	"variant_updated",
	"variant_deleted",
	"subscription_created",
	"subscription_updated",
	"subscription_cancelled",
]);

export const auditLogSchema = z.object({
	id: z.string(),
	orgId: z.string(),
	actorId: z.string().nullable(),
	action: auditActionSchema,
	targetType: z.string().nullable(),
	targetId: z.string().nullable(),
	metadata: z.record(z.unknown()),
	ipAddress: z.string().nullable(),
	userAgent: z.string().nullable(),
	createdAt: z.string(),
	actor: z
		.object({
			id: z.string(),
			email: z.string(),
		})
		.nullable(),
});

export const auditLogListQuerySchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(50).optional(),
	offset: z.coerce.number().min(0).default(0).optional(),
	action: auditActionSchema.optional(),
	actorId: z.string().optional(),
	targetType: z.string().optional(),
	from: z.string().datetime().optional(),
	to: z.string().datetime().optional(),
});

export const auditLogListSchema = z.object({
	logs: z.array(auditLogSchema),
	total: z.number(),
});

export const listAuditLogsRoute = createRoute({
	method: "get",
	path: "/audit-logs",
	tags: ["Audit Logs"],
	request: {
		query: auditLogListQuerySchema,
	},
	responses: {
		200: {
			description: "List of audit logs",
			content: {
				"application/json": { schema: auditLogListSchema },
			},
		},
		403: {
			description: "Forbidden",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const exportAuditLogsRoute = createRoute({
	method: "get",
	path: "/audit-logs/export",
	tags: ["Audit Logs"],
	request: {
		query: auditLogListQuerySchema.extend({
			format: z.enum(["json", "csv"]).default("json").optional(),
		}),
	},
	responses: {
		200: {
			description: "Exported audit logs",
			content: {
				"application/json": { schema: auditLogListSchema },
				"text/csv": { schema: z.string() },
			},
		},
		403: {
			description: "Forbidden",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export type AuditLogResponse = z.infer<typeof auditLogSchema>;
export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;

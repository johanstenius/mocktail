import { createRoute, z } from "@hono/zod-openapi";
import {
	errorSchema,
	inviteIdParamSchema,
	memberIdParamSchema,
} from "./shared";

export const orgRoleSchema = z.enum(["owner", "admin", "member"]);

export const memberSchema = z.object({
	id: z.string(),
	userId: z.string(),
	email: z.string().email(),
	role: orgRoleSchema,
	createdAt: z.string(),
});

export const memberListSchema = z.array(memberSchema);

export const updateMemberSchema = z.object({
	role: orgRoleSchema,
});

export const inviteSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	role: orgRoleSchema,
	expiresAt: z.string(),
	invitedBy: z.string(),
	createdAt: z.string(),
});

export const inviteListSchema = z.array(inviteSchema);

export const createInviteSchema = z.object({
	email: z.string().email(),
	role: orgRoleSchema.optional().default("member"),
});

export const acceptInviteSchema = z.object({
	token: z.string(),
	password: z.string().min(8).optional(),
});

export const inviteInfoSchema = z.object({
	email: z.string().email(),
	orgName: z.string(),
	role: orgRoleSchema,
	expiresAt: z.string(),
});

export type OrgRoleApi = z.infer<typeof orgRoleSchema>;
export type MemberResponse = z.infer<typeof memberSchema>;
export type UpdateMemberRequest = z.infer<typeof updateMemberSchema>;
export type InviteResponse = z.infer<typeof inviteSchema>;
export type CreateInviteRequest = z.infer<typeof createInviteSchema>;
export type AcceptInviteRequest = z.infer<typeof acceptInviteSchema>;
export type InviteInfoResponse = z.infer<typeof inviteInfoSchema>;

export const listMembersRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Members"],
	summary: "List org members",
	responses: {
		200: {
			description: "List of members",
			content: {
				"application/json": { schema: z.object({ members: memberListSchema }) },
			},
		},
	},
});

export const updateMemberRoute = createRoute({
	method: "patch",
	path: "/{memberId}",
	tags: ["Members"],
	summary: "Update member role",
	request: {
		params: memberIdParamSchema,
		body: { content: { "application/json": { schema: updateMemberSchema } } },
	},
	responses: {
		200: {
			description: "Member updated",
			content: {
				"application/json": { schema: z.object({ member: memberSchema }) },
			},
		},
		404: {
			description: "Member not found",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

export const deleteMemberRoute = createRoute({
	method: "delete",
	path: "/{memberId}",
	tags: ["Members"],
	summary: "Remove member",
	request: {
		params: memberIdParamSchema,
	},
	responses: {
		204: { description: "Member removed" },
		404: {
			description: "Member not found",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

export const listInvitesRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Invites"],
	summary: "List pending invites",
	responses: {
		200: {
			description: "List of invites",
			content: {
				"application/json": { schema: z.object({ invites: inviteListSchema }) },
			},
		},
	},
});

export const createInviteRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Invites"],
	summary: "Create invite",
	request: {
		body: { content: { "application/json": { schema: createInviteSchema } } },
	},
	responses: {
		201: {
			description: "Invite created",
			content: {
				"application/json": { schema: z.object({ invite: inviteSchema }) },
			},
		},
	},
});

export const deleteInviteRoute = createRoute({
	method: "delete",
	path: "/{inviteId}",
	tags: ["Invites"],
	summary: "Revoke invite",
	request: {
		params: inviteIdParamSchema,
	},
	responses: {
		204: { description: "Invite revoked" },
		404: {
			description: "Invite not found",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

export const getInviteByTokenRoute = createRoute({
	method: "get",
	path: "/token",
	tags: ["Invites"],
	summary: "Get invite by token (public)",
	request: {
		query: z.object({ token: z.string() }),
	},
	responses: {
		200: {
			description: "Invite info",
			content: {
				"application/json": { schema: z.object({ invite: inviteInfoSchema }) },
			},
		},
		404: {
			description: "Invite not found or expired",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

const acceptInviteUserSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	orgId: z.string(),
	orgName: z.string(),
	role: orgRoleSchema,
	emailVerifiedAt: z.string().nullable(),
});

export const acceptInviteResponseSchema = z.object({
	user: acceptInviteUserSchema,
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresIn: z.number(),
	isExistingUser: z.boolean(),
});

export const acceptInviteRoute = createRoute({
	method: "post",
	path: "/accept",
	tags: ["Invites"],
	summary: "Accept invite and create account",
	request: {
		body: { content: { "application/json": { schema: acceptInviteSchema } } },
	},
	responses: {
		201: {
			description: "Account created and invite accepted",
			content: { "application/json": { schema: acceptInviteResponseSchema } },
		},
		400: {
			description: "Invalid invite or missing password",
			content: { "application/json": { schema: errorSchema } },
		},
		404: {
			description: "Invite not found or expired",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

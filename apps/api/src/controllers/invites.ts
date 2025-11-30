import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../middleware/auth";
import {
	authMiddleware,
	getAuth,
	requireVerifiedEmail,
} from "../middleware/auth";
import * as orgRepo from "../repositories/organization.repository";
import * as userRepo from "../repositories/user.repository";
import {
	acceptInviteRoute,
	createInviteRoute,
	deleteInviteRoute,
	getInviteByTokenRoute,
	listInvitesRoute,
} from "../schemas/members";
import * as emailService from "../services/email.service";
import * as limitsService from "../services/limits.service";
import * as memberService from "../services/member.service";
import { logger } from "../utils/logger";

export const invitesRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

// Auth for protected routes (list, create, delete)
invitesRouter.use("/", authMiddleware(), requireVerifiedEmail());
invitesRouter.use("/:inviteId", authMiddleware(), requireVerifiedEmail());

// Public routes
invitesRouter.openapi(getInviteByTokenRoute, async (c) => {
	const { token } = c.req.valid("query");
	const invite = await memberService.getInviteByToken(token);
	return c.json({ invite });
});

invitesRouter.openapi(acceptInviteRoute, async (c) => {
	const { token, password } = c.req.valid("json");
	const result = await memberService.acceptInvite(token, password);
	return c.json(result, 201);
});

invitesRouter.openapi(listInvitesRoute, async (c) => {
	const { orgId } = getAuth(c);
	const invites = await memberService.listInvites(orgId);
	return c.json({ invites });
});

invitesRouter.openapi(createInviteRoute, async (c) => {
	const { orgId, userId, role } = getAuth(c);
	const { email, role: inviteRole } = c.req.valid("json");

	await limitsService.requireMemberLimit(orgId);

	const { invite, token } = await memberService.createInvite(
		email,
		inviteRole,
		role,
		userId,
		orgId,
	);

	const org = await orgRepo.findById(orgId);
	const inviter = await userRepo.findById(userId);

	if (org && inviter) {
		logger.info("invite sent");

		await emailService.sendInviteEmail({
			to: email,
			orgName: org.name,
			inviterEmail: inviter.email,
			token,
			role: inviteRole,
		});
	} else {
		logger.info("no invite sent");
	}

	return c.json({ invite }, 201);
});

invitesRouter.openapi(deleteInviteRoute, async (c) => {
	const { orgId, role } = getAuth(c);
	const { inviteId } = c.req.valid("param");

	await memberService.revokeInvite(inviteId, role, orgId);

	return c.body(null, 204);
});

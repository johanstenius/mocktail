import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../middleware/auth";
import { getAuth } from "../middleware/auth";
import {
	deleteMemberRoute,
	listMembersRoute,
	updateMemberRoute,
} from "../schemas/members";
import * as memberService from "../services/member.service";

export const membersRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

membersRouter.openapi(listMembersRoute, async (c) => {
	const { orgId } = getAuth(c);
	const members = await memberService.listMembers(orgId);
	return c.json({ members }, 200);
});

membersRouter.openapi(updateMemberRoute, async (c) => {
	const { orgId, userId, role } = getAuth(c);
	const { memberId } = c.req.valid("param");
	const { role: newRole } = c.req.valid("json");

	const member = await memberService.updateMemberRole(
		memberId,
		newRole,
		role,
		userId,
		orgId,
	);

	return c.json({ member }, 200);
});

membersRouter.openapi(deleteMemberRoute, async (c) => {
	const { orgId, userId, role } = getAuth(c);
	const { memberId } = c.req.valid("param");

	await memberService.removeMember(memberId, role, userId, orgId);

	return c.body(null, 204);
});

import type { OrgRole } from "@prisma/client";
import type { Context, MiddlewareHandler } from "hono";
import * as orgMembershipRepo from "../repositories/org-membership.repository";
import * as tokenService from "../services/token.service";

export type AuthContext = {
	userId: string;
	orgId: string;
	role: OrgRole;
};

type AuthVariables = {
	auth: AuthContext;
};

export function authMiddleware(): MiddlewareHandler<{
	Variables: AuthVariables;
}> {
	return async (c, next) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return c.json({ error: "Missing or invalid authorization header" }, 401);
		}

		const token = authHeader.slice(7);
		const payload = await tokenService.verifyAccessToken(token);
		if (!payload) {
			return c.json({ error: "Invalid or expired token" }, 401);
		}

		const membership = await orgMembershipRepo.findByUserAndOrg(
			payload.userId,
			payload.orgId,
		);
		if (!membership) {
			return c.json({ error: "Not a member of this organization" }, 403);
		}

		c.set("auth", {
			userId: payload.userId,
			orgId: payload.orgId,
			role: membership.role,
		});

		await next();
	};
}

export function requireRole(
	...roles: OrgRole[]
): MiddlewareHandler<{ Variables: AuthVariables }> {
	return async (c, next) => {
		const auth = c.get("auth");
		if (!auth) {
			return c.json({ error: "Not authenticated" }, 401);
		}

		if (!roles.includes(auth.role)) {
			return c.json({ error: "Insufficient permissions" }, 403);
		}

		await next();
	};
}

export function getAuth(c: Context<{ Variables: AuthVariables }>): AuthContext {
	return c.get("auth");
}

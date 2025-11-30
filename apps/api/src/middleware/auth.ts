import type { Context, MiddlewareHandler } from "hono";
import * as orgRepo from "../repositories/organization.repository";
import * as userRepo from "../repositories/user.repository";
import * as tokenService from "../services/token.service";
import { forbidden, unauthorized } from "../utils/errors";
import type { OrgRole } from "../utils/permissions";

export type AuthContext = {
	userId: string;
	orgId: string;
	role: OrgRole;
};

export type AuthVariables = {
	auth: AuthContext;
};

export function authMiddleware(): MiddlewareHandler<{
	Variables: AuthVariables;
}> {
	return async (c, next) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			throw unauthorized("Missing or invalid authorization header");
		}

		const token = authHeader.slice(7);
		const payload = await tokenService.verifyAccessToken(token);
		if (!payload) {
			throw unauthorized("Invalid or expired token");
		}

		const membership = await orgRepo.findMembershipByUserAndOrg(
			payload.userId,
			payload.orgId,
		);
		if (!membership) {
			throw forbidden("Not a member of this organization");
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
			throw unauthorized("Not authenticated");
		}

		if (!roles.includes(auth.role)) {
			throw forbidden("Insufficient permissions");
		}

		await next();
	};
}

export function getAuth(c: Context<{ Variables: AuthVariables }>): AuthContext {
	return c.get("auth");
}

export function requireVerifiedEmail(): MiddlewareHandler<{
	Variables: AuthVariables;
}> {
	return async (c, next) => {
		const auth = c.get("auth");
		if (!auth) {
			throw unauthorized("Not authenticated");
		}

		const user = await userRepo.findById(auth.userId);
		if (!user?.emailVerifiedAt) {
			throw forbidden("Email verification required");
		}

		await next();
	};
}

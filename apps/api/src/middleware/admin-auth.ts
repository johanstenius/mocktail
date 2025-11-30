import type { MiddlewareHandler } from "hono";
import { unauthorized } from "../utils/errors";

export function adminAuthMiddleware(): MiddlewareHandler {
	return async (c, next) => {
		const secret = c.req.header("X-Admin-Secret");
		const expectedSecret = process.env.ADMIN_SECRET;

		if (!expectedSecret) {
			throw unauthorized("Admin endpoint not configured");
		}

		if (secret !== expectedSecret) {
			throw unauthorized();
		}

		await next();
	};
}

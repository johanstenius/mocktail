import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../middleware/auth";
import { authMiddleware, getAuth } from "../middleware/auth";
import {
	checkAuthEmailRateLimit,
	createAuthRateLimiter,
} from "../middleware/rate-limit";
import {
	forgotPasswordRoute,
	loginRoute,
	logoutRoute,
	meRoute,
	refreshRoute,
	registerRoute,
	resetPasswordRoute,
	sendVerificationRoute,
	verifyEmailRoute,
} from "../schemas/auth";
import * as authService from "../services/auth.service";
import { rateLimited } from "../utils/errors";

export const authRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

const loginRateLimiter = createAuthRateLimiter({ ipLimit: 5 });
const registerRateLimiter = createAuthRateLimiter({ ipLimit: 3 });
const forgotPasswordRateLimiter = createAuthRateLimiter({ ipLimit: 3 });
const resetPasswordRateLimiter = createAuthRateLimiter({ ipLimit: 5 });

authRouter.openapi(
	{ ...registerRoute, middleware: [registerRateLimiter] },
	async (c) => {
		const { email, password, organization } = c.req.valid("json");
		const result = await authService.register(email, password, organization);
		const userWithOrg = await authService.getCurrentUser(
			result.userId,
			result.orgId,
		);

		return c.json(
			{
				user: {
					id: userWithOrg.id,
					email: userWithOrg.email,
					emailVerifiedAt: userWithOrg.emailVerifiedAt?.toISOString() ?? null,
				},
				org: {
					id: userWithOrg.org.id,
					name: userWithOrg.org.name,
					slug: userWithOrg.org.slug,
				},
				tokens: result.tokens,
			},
			201,
		);
	},
);

authRouter.openapi(
	{ ...loginRoute, middleware: [loginRateLimiter] },
	async (c) => {
		const { email, password } = c.req.valid("json");

		const emailCheck = checkAuthEmailRateLimit("/auth/login", email, 5);
		if (!emailCheck.allowed) {
			throw rateLimited("Too many login attempts. Please try again later.");
		}

		const result = await authService.login(email, password);
		const userWithOrg = await authService.getCurrentUser(
			result.userId,
			result.orgId,
		);

		return c.json(
			{
				user: {
					id: userWithOrg.id,
					email: userWithOrg.email,
					emailVerifiedAt: userWithOrg.emailVerifiedAt?.toISOString() ?? null,
				},
				org: {
					id: userWithOrg.org.id,
					name: userWithOrg.org.name,
					slug: userWithOrg.org.slug,
				},
				tokens: result.tokens,
			},
			200,
		);
	},
);

authRouter.openapi(logoutRoute, async (c) => {
	const { refreshToken } = c.req.valid("json");
	await authService.logout(refreshToken);
	return c.body(null, 204);
});

authRouter.openapi(refreshRoute, async (c) => {
	const { refreshToken } = c.req.valid("json");
	const result = await authService.refresh(refreshToken);
	return c.json(result.tokens, 200);
});

authRouter.use("/me", authMiddleware());
authRouter.openapi(meRoute, async (c) => {
	const auth = getAuth(c);
	const user = await authService.getCurrentUser(auth.userId, auth.orgId);
	return c.json(
		{
			...user,
			emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
		},
		200,
	);
});

authRouter.openapi(
	{ ...forgotPasswordRoute, middleware: [forgotPasswordRateLimiter] },
	async (c) => {
		const { email } = c.req.valid("json");

		const emailCheck = checkAuthEmailRateLimit(
			"/auth/forgot-password",
			email,
			3,
		);
		if (!emailCheck.allowed) {
			throw rateLimited("Too many requests. Please try again later.");
		}

		await authService.forgotPassword(email);
		return c.json(
			{ message: "If an account exists, a reset email was sent" },
			200,
		);
	},
);

authRouter.openapi(
	{ ...resetPasswordRoute, middleware: [resetPasswordRateLimiter] },
	async (c) => {
		const { token, password } = c.req.valid("json");
		await authService.resetPassword(token, password);
		return c.json({ message: "Password reset successful" }, 200);
	},
);

authRouter.use("/send-verification", authMiddleware());
authRouter.openapi(sendVerificationRoute, async (c) => {
	const { userId } = getAuth(c);
	await authService.sendVerificationEmail(userId);
	return c.json({ message: "Verification email sent" }, 200);
});

authRouter.openapi(verifyEmailRoute, async (c) => {
	const { token } = c.req.valid("json");
	await authService.verifyEmail(token);
	return c.json({ message: "Email verified" }, 200);
});

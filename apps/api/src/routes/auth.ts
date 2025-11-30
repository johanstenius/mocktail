import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware, getAuth } from "../middleware/auth";
import {
	checkAuthEmailRateLimit,
	createAuthRateLimiter,
} from "../middleware/rate-limit";
import {
	authErrorSchema,
	authResponseSchema,
	loginSchema,
	logoutSchema,
	meResponseSchema,
	refreshSchema,
	registerSchema,
	tokenResponseSchema,
} from "../schemas/auth";
import * as authService from "../services/auth.service";
import { rateLimited } from "../utils/errors";

export const authRouter = new OpenAPIHono();

const loginRateLimiter = createAuthRateLimiter({ ipLimit: 5 });
const registerRateLimiter = createAuthRateLimiter({ ipLimit: 3 });
const forgotPasswordRateLimiter = createAuthRateLimiter({ ipLimit: 3 });
const resetPasswordRateLimiter = createAuthRateLimiter({ ipLimit: 5 });

const registerRoute = createRoute({
	method: "post",
	path: "/register",
	tags: ["Auth"],
	middleware: [registerRateLimiter],
	request: {
		body: {
			content: {
				"application/json": { schema: registerSchema },
			},
		},
	},
	responses: {
		201: {
			description: "User registered",
			content: {
				"application/json": { schema: authResponseSchema },
			},
		},
		400: {
			description: "Invalid input",
			content: {
				"application/json": { schema: authErrorSchema },
			},
		},
		429: {
			description: "Too many requests",
			content: {
				"application/json": { schema: authErrorSchema },
			},
		},
	},
});

authRouter.openapi(registerRoute, async (c) => {
	const { email, password, organization } = c.req.valid("json");
	const result = await authService.register(email, password, organization);
	const userWithOrg = await authService.getCurrentUser(
		result.userId,
		result.orgId,
	);

	return c.json(
		{
			user: { id: userWithOrg.id, email: userWithOrg.email },
			org: {
				id: userWithOrg.org.id,
				name: userWithOrg.org.name,
				slug: userWithOrg.org.slug,
			},
			tokens: result.tokens,
		},
		201,
	);
});

const loginRoute = createRoute({
	method: "post",
	path: "/login",
	tags: ["Auth"],
	middleware: [loginRateLimiter],
	request: {
		body: {
			content: {
				"application/json": { schema: loginSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Login successful",
			content: {
				"application/json": { schema: authResponseSchema },
			},
		},
		401: {
			description: "Invalid credentials",
			content: {
				"application/json": { schema: authErrorSchema },
			},
		},
		429: {
			description: "Too many requests",
			content: {
				"application/json": { schema: authErrorSchema },
			},
		},
	},
});

authRouter.openapi(loginRoute, async (c) => {
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

	return c.json({
		user: { id: userWithOrg.id, email: userWithOrg.email },
		org: {
			id: userWithOrg.org.id,
			name: userWithOrg.org.name,
			slug: userWithOrg.org.slug,
		},
		tokens: result.tokens,
	});
});

const logoutRoute = createRoute({
	method: "post",
	path: "/logout",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": { schema: logoutSchema },
			},
		},
	},
	responses: {
		204: {
			description: "Logged out",
		},
	},
});

authRouter.openapi(logoutRoute, async (c) => {
	const { refreshToken } = c.req.valid("json");
	await authService.logout(refreshToken);
	return c.body(null, 204);
});

const refreshRoute = createRoute({
	method: "post",
	path: "/refresh",
	tags: ["Auth"],
	request: {
		body: {
			content: {
				"application/json": { schema: refreshSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Tokens refreshed",
			content: {
				"application/json": { schema: tokenResponseSchema },
			},
		},
		401: {
			description: "Invalid refresh token",
			content: {
				"application/json": { schema: authErrorSchema },
			},
		},
	},
});

authRouter.openapi(refreshRoute, async (c) => {
	const { refreshToken } = c.req.valid("json");
	const result = await authService.refresh(refreshToken);
	return c.json(result.tokens);
});

const meRoute = createRoute({
	method: "get",
	path: "/me",
	tags: ["Auth"],
	middleware: [authMiddleware()],
	responses: {
		200: {
			description: "Current user",
			content: {
				"application/json": { schema: meResponseSchema },
			},
		},
		401: {
			description: "Not authenticated",
			content: {
				"application/json": { schema: authErrorSchema },
			},
		},
	},
});

authRouter.openapi(meRoute, async (c) => {
	const auth = getAuth(c);
	const user = await authService.getCurrentUser(auth.userId, auth.orgId);
	return c.json(user);
});

const forgotPasswordSchema = z.object({
	email: z.string().email(),
});

const forgotPasswordRoute = createRoute({
	method: "post",
	path: "/forgot-password",
	tags: ["Auth"],
	middleware: [forgotPasswordRateLimiter],
	request: {
		body: {
			content: { "application/json": { schema: forgotPasswordSchema } },
		},
	},
	responses: {
		200: {
			description: "Password reset email sent",
			content: {
				"application/json": {
					schema: z.object({ message: z.string() }),
				},
			},
		},
		429: {
			description: "Too many requests",
			content: {
				"application/json": { schema: authErrorSchema },
			},
		},
	},
});

authRouter.openapi(forgotPasswordRoute, async (c) => {
	const { email } = c.req.valid("json");

	const emailCheck = checkAuthEmailRateLimit("/auth/forgot-password", email, 3);
	if (!emailCheck.allowed) {
		throw rateLimited("Too many requests. Please try again later.");
	}

	await authService.forgotPassword(email);
	return c.json({ message: "If an account exists, a reset email was sent" });
});

const resetPasswordSchema = z.object({
	token: z.string(),
	password: z.string().min(8),
});

const resetPasswordRoute = createRoute({
	method: "post",
	path: "/reset-password",
	tags: ["Auth"],
	middleware: [resetPasswordRateLimiter],
	request: {
		body: {
			content: { "application/json": { schema: resetPasswordSchema } },
		},
	},
	responses: {
		200: {
			description: "Password reset successful",
			content: {
				"application/json": {
					schema: z.object({ message: z.string() }),
				},
			},
		},
		429: {
			description: "Too many requests",
			content: {
				"application/json": { schema: authErrorSchema },
			},
		},
	},
});

authRouter.openapi(resetPasswordRoute, async (c) => {
	const { token, password } = c.req.valid("json");
	await authService.resetPassword(token, password);
	return c.json({ message: "Password reset successful" });
});

const sendVerificationRoute = createRoute({
	method: "post",
	path: "/send-verification",
	tags: ["Auth"],
	middleware: [authMiddleware()],
	responses: {
		200: {
			description: "Verification email sent",
			content: {
				"application/json": {
					schema: z.object({ message: z.string() }),
				},
			},
		},
	},
});

authRouter.openapi(sendVerificationRoute, async (c) => {
	const { userId } = getAuth(c);
	await authService.sendVerificationEmail(userId);
	return c.json({ message: "Verification email sent" });
});

const verifyEmailSchema = z.object({
	token: z.string(),
});

const verifyEmailRoute = createRoute({
	method: "post",
	path: "/verify-email",
	tags: ["Auth"],
	request: {
		body: {
			content: { "application/json": { schema: verifyEmailSchema } },
		},
	},
	responses: {
		200: {
			description: "Email verified",
			content: {
				"application/json": {
					schema: z.object({ message: z.string() }),
				},
			},
		},
	},
});

authRouter.openapi(verifyEmailRoute, async (c) => {
	const { token } = c.req.valid("json");
	await authService.verifyEmail(token);
	return c.json({ message: "Email verified" });
});

import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { authMiddleware, getAuth } from "../middleware/auth";
import * as userRepo from "../repositories/user.repository";
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

export const authRouter = new OpenAPIHono();

const registerRoute = createRoute({
	method: "post",
	path: "/register",
	tags: ["Auth"],
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
	},
});

authRouter.openapi(registerRoute, async (c) => {
	const { email, password, organization } = c.req.valid("json");
	const result = await authService.register(email, password, organization);

	if (!result.success) {
		return c.json({ error: result.error }, 400);
	}

	const user = await userRepo.findById(result.userId);
	const userWithOrg = await authService.getCurrentUser(
		result.userId,
		result.orgId,
	);

	return c.json(
		{
			user: { id: user?.id, email: user?.email },
			org: {
				id: userWithOrg?.org.id,
				name: userWithOrg?.org.name,
				slug: userWithOrg?.org.slug,
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
	},
});

authRouter.openapi(loginRoute, async (c) => {
	const { email, password } = c.req.valid("json");
	const result = await authService.login(email, password);

	if (!result.success) {
		return c.json({ error: result.error }, 401);
	}

	const user = await userRepo.findById(result.userId);
	const userWithOrg = await authService.getCurrentUser(
		result.userId,
		result.orgId,
	);

	return c.json({
		user: { id: user?.id, email: user?.email },
		org: {
			id: userWithOrg?.org.id,
			name: userWithOrg?.org.name,
			slug: userWithOrg?.org.slug,
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

	if (!result.success) {
		return c.json({ error: result.error }, 401);
	}

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

	if (!user) {
		return c.json({ error: "User not found" }, 401);
	}

	return c.json(user);
});

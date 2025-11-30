import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema, messageSchema } from "./common";

export const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	organization: z.string().min(1).max(100),
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export const refreshSchema = z.object({
	refreshToken: z.string(),
});

export const logoutSchema = z.object({
	refreshToken: z.string(),
});

export const tokenResponseSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresIn: z.number(),
});

export const authResponseSchema = z.object({
	user: z.object({
		id: z.string(),
		email: z.string(),
		emailVerifiedAt: z.string().nullable(),
	}),
	org: z.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
	}),
	tokens: tokenResponseSchema,
});

export const meResponseSchema = z.object({
	id: z.string(),
	email: z.string(),
	emailVerifiedAt: z.string().nullable(),
	hasCompletedOnboarding: z.boolean(),
	org: z.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
		tier: z.string(),
	}),
	role: z.string(),
});

export const forgotPasswordSchema = z.object({
	email: z.string().email(),
});

export const resetPasswordSchema = z.object({
	token: z.string(),
	password: z.string().min(8),
});

export const verifyEmailSchema = z.object({
	token: z.string(),
});

// Route definitions
export const registerRoute = createRoute({
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
				"application/json": { schema: errorSchema },
			},
		},
		429: {
			description: "Too many requests",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const loginRoute = createRoute({
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
				"application/json": { schema: errorSchema },
			},
		},
		429: {
			description: "Too many requests",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const logoutRoute = createRoute({
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

export const refreshRoute = createRoute({
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
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const meRoute = createRoute({
	method: "get",
	path: "/me",
	tags: ["Auth"],
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
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const forgotPasswordRoute = createRoute({
	method: "post",
	path: "/forgot-password",
	tags: ["Auth"],
	request: {
		body: {
			content: { "application/json": { schema: forgotPasswordSchema } },
		},
	},
	responses: {
		200: {
			description: "Password reset email sent",
			content: {
				"application/json": { schema: messageSchema },
			},
		},
		429: {
			description: "Too many requests",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const resetPasswordRoute = createRoute({
	method: "post",
	path: "/reset-password",
	tags: ["Auth"],
	request: {
		body: {
			content: { "application/json": { schema: resetPasswordSchema } },
		},
	},
	responses: {
		200: {
			description: "Password reset successful",
			content: {
				"application/json": { schema: messageSchema },
			},
		},
		429: {
			description: "Too many requests",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

export const sendVerificationRoute = createRoute({
	method: "post",
	path: "/send-verification",
	tags: ["Auth"],
	responses: {
		200: {
			description: "Verification email sent",
			content: {
				"application/json": { schema: messageSchema },
			},
		},
	},
});

export const verifyEmailRoute = createRoute({
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
				"application/json": { schema: messageSchema },
			},
		},
	},
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;

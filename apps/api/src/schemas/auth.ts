import { z } from "@hono/zod-openapi";

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
	org: z.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
		tier: z.string(),
	}),
	role: z.string(),
});

export const authErrorSchema = z.object({
	error: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;

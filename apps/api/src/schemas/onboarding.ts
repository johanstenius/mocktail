import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema } from "./shared";

export const createOrganizationSchema = z.object({
	name: z.string().min(1).max(100),
});

export const createOrganizationRoute = createRoute({
	method: "post",
	path: "/create-organization",
	tags: ["Onboarding"],
	summary: "Create organization for OAuth users",
	request: {
		body: {
			content: {
				"application/json": { schema: createOrganizationSchema },
			},
		},
	},
	responses: {
		201: {
			description: "Organization created",
			content: {
				"application/json": {
					schema: z.object({
						org: z.object({
							id: z.string(),
							name: z.string(),
							slug: z.string(),
						}),
					}),
				},
			},
		},
	},
});

export const completeOnboardingRoute = createRoute({
	method: "post",
	path: "/complete",
	tags: ["Onboarding"],
	summary: "Mark onboarding complete",
	responses: {
		204: { description: "Onboarding completed" },
	},
});

export const sampleProjectResponseSchema = z.object({
	project: z.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
	}),
	endpointsCreated: z.number(),
});

export const createSampleProjectRoute = createRoute({
	method: "post",
	path: "/sample-project",
	tags: ["Onboarding"],
	summary: "Create sample project with demo endpoints",
	responses: {
		201: {
			description: "Sample project created",
			content: {
				"application/json": { schema: sampleProjectResponseSchema },
			},
		},
	},
});

export const completeOAuthOnboardingSchema = z.object({
	oauthToken: z.string(),
	organizationName: z.string().min(1).max(100),
});

export const completeOAuthOnboardingResponseSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresIn: z.number(),
	user: z.object({
		id: z.string(),
		email: z.string(),
	}),
	org: z.object({
		id: z.string(),
		name: z.string(),
		slug: z.string(),
	}),
});

export const completeOAuthOnboardingRoute = createRoute({
	method: "post",
	path: "/complete-oauth",
	tags: ["Onboarding"],
	summary: "Complete OAuth onboarding with organization creation",
	request: {
		body: {
			content: {
				"application/json": { schema: completeOAuthOnboardingSchema },
			},
		},
	},
	responses: {
		201: {
			description: "OAuth onboarding completed",
			content: {
				"application/json": { schema: completeOAuthOnboardingResponseSchema },
			},
		},
		400: {
			description: "Invalid or expired OAuth token",
			content: {
				"application/json": { schema: errorSchema },
			},
		},
	},
});

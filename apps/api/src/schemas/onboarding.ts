import { createRoute, z } from "@hono/zod-openapi";
import { successSchema } from "./common";

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
		200: {
			description: "Onboarding completed",
			content: {
				"application/json": { schema: successSchema },
			},
		},
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

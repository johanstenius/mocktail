import { createRoute, z } from "@hono/zod-openapi";

export const completeOnboardingRoute = createRoute({
	method: "post",
	path: "/complete",
	tags: ["Onboarding"],
	summary: "Mark onboarding complete",
	responses: {
		200: {
			description: "Onboarding completed",
			content: {
				"application/json": {
					schema: z.object({ success: z.boolean() }),
				},
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

import { createRoute, z } from "@hono/zod-openapi";

const tierSchema = z.enum(["free", "pro", "enterprise"]);

const usageItemSchema = z.object({
	current: z.number(),
	limit: z.number().nullable(),
});

export const usageSchema = z.object({
	tier: tierSchema,
	projects: usageItemSchema,
	endpoints: usageItemSchema,
	members: usageItemSchema,
	requests: usageItemSchema,
	cancelAtPeriodEnd: z.boolean(),
	currentPeriodEnd: z.string().nullable(),
});

export type UsageResponse = z.infer<typeof usageSchema>;

export const getUsageRoute = createRoute({
	method: "get",
	path: "/usage",
	tags: ["Billing"],
	summary: "Get current usage and limits",
	responses: {
		200: {
			description: "Usage data",
			content: { "application/json": { schema: usageSchema } },
		},
	},
});

const checkoutResponseSchema = z.object({
	url: z.string(),
});

export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;

export const createCheckoutRoute = createRoute({
	method: "post",
	path: "/checkout",
	tags: ["Billing"],
	summary: "Create Stripe checkout session",
	responses: {
		200: {
			description: "Checkout session URL",
			content: { "application/json": { schema: checkoutResponseSchema } },
		},
	},
});

const successResponseSchema = z.object({
	success: z.boolean(),
});

export const cancelSubscriptionRoute = createRoute({
	method: "post",
	path: "/cancel",
	tags: ["Billing"],
	summary: "Cancel subscription at period end",
	responses: {
		200: {
			description: "Subscription cancelled",
			content: { "application/json": { schema: successResponseSchema } },
		},
	},
});

export const reactivateSubscriptionRoute = createRoute({
	method: "post",
	path: "/reactivate",
	tags: ["Billing"],
	summary: "Reactivate cancelled subscription",
	responses: {
		200: {
			description: "Subscription reactivated",
			content: { "application/json": { schema: successResponseSchema } },
		},
	},
});

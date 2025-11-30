import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema, successSchema } from "./shared";

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
	paymentFailedAt: z.string().nullable(),
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

export const cancelSubscriptionRoute = createRoute({
	method: "post",
	path: "/cancel",
	tags: ["Billing"],
	summary: "Cancel subscription at period end",
	responses: {
		200: {
			description: "Subscription cancelled",
			content: { "application/json": { schema: successSchema } },
		},
		400: {
			description: "No active subscription",
			content: { "application/json": { schema: errorSchema } },
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
			content: { "application/json": { schema: successSchema } },
		},
		400: {
			description: "No cancelled subscription to reactivate",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

export const retryPaymentRoute = createRoute({
	method: "post",
	path: "/retry-payment",
	tags: ["Billing"],
	summary: "Retry failed payment",
	responses: {
		200: {
			description: "Payment retry initiated",
			content: { "application/json": { schema: successSchema } },
		},
		400: {
			description: "No failed payment to retry",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

import { createRoute, z } from "@hono/zod-openapi";
import { errorSchema } from "./shared";

const tierSchema = z.enum(["free", "pro"]);

const usageItemSchema = z.object({
	current: z.number(),
	limit: z.number().nullable(),
});

const tierFeaturesSchema = z.object({
	proxyMode: z.boolean(),
	statefulMocks: z.boolean(),
});

export const usageSchema = z.object({
	tier: tierSchema,
	projects: usageItemSchema,
	endpoints: usageItemSchema,
	members: usageItemSchema,
	requests: usageItemSchema,
	features: tierFeaturesSchema,
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
		204: { description: "Subscription cancelled" },
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
		204: { description: "Subscription reactivated" },
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
		204: { description: "Payment retry initiated" },
		400: {
			description: "No failed payment to retry",
			content: { "application/json": { schema: errorSchema } },
		},
	},
});

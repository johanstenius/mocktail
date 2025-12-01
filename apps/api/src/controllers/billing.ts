import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthVariables } from "../middleware/auth";
import { getAuth, requireRole } from "../middleware/auth";
import * as orgRepo from "../repositories/organization.repository";
import * as userRepo from "../repositories/user.repository";
import {
	cancelSubscriptionRoute,
	createCheckoutRoute,
	getUsageRoute,
	reactivateSubscriptionRoute,
	retryPaymentRoute,
} from "../schemas/billing";
import * as limitsService from "../services/limits.service";
import * as stripeService from "../services/stripe.service";
import { badRequest, notFound } from "../utils/errors";
import { logger } from "../utils/logger";

export const billingRouter = new OpenAPIHono<{ Variables: AuthVariables }>();

// Role checks for admin-only routes
billingRouter.use("/checkout", requireRole("admin", "owner"));
billingRouter.use("/cancel", requireRole("admin", "owner"));
billingRouter.use("/reactivate", requireRole("admin", "owner"));
billingRouter.use("/retry-payment", requireRole("admin", "owner"));

function toLimit(value: number): number | null {
	return Number.isFinite(value) ? value : null;
}

billingRouter.openapi(getUsageRoute, async (c) => {
	const auth = getAuth(c);
	const usage = await limitsService.getUsage(auth.orgId);

	if (!usage) {
		return c.json(
			{
				tier: "free" as const,
				projects: { current: 0, limit: 3 },
				endpoints: { current: 0, limit: 30 },
				members: { current: 0, limit: 3 },
				requests: { current: 0, limit: 10000 },
				cancelAtPeriodEnd: false,
				currentPeriodEnd: null,
				paymentFailedAt: null,
			},
			200,
		);
	}

	return c.json(
		{
			tier: usage.tier,
			projects: {
				current: usage.projects.used,
				limit: toLimit(usage.projects.limit),
			},
			endpoints: {
				current: usage.endpoints.used,
				limit: toLimit(usage.endpoints.limit),
			},
			members: {
				current: usage.members.used,
				limit: toLimit(usage.members.limit),
			},
			requests: {
				current: usage.requests.used,
				limit: toLimit(usage.requests.limit),
			},
			cancelAtPeriodEnd: usage.cancelAtPeriodEnd,
			currentPeriodEnd: usage.currentPeriodEnd?.toISOString() ?? null,
			paymentFailedAt: usage.paymentFailedAt?.toISOString() ?? null,
		},
		200,
	);
});

billingRouter.openapi(createCheckoutRoute, async (c) => {
	const auth = getAuth(c);

	const [org, user] = await Promise.all([
		orgRepo.findById(auth.orgId),
		userRepo.findById(auth.userId),
	]);

	if (!org) {
		throw notFound("Organization");
	}

	if (!user) {
		throw notFound("User");
	}

	const result = await stripeService.createCheckoutSession({
		orgId: auth.orgId,
		orgName: org.name,
		userEmail: user.email,
	});

	return c.json(result, 200);
});

billingRouter.openapi(cancelSubscriptionRoute, async (c) => {
	const auth = getAuth(c);
	await stripeService.cancelSubscription(auth.orgId);

	return c.body(null, 204);
});

billingRouter.openapi(reactivateSubscriptionRoute, async (c) => {
	const auth = getAuth(c);
	await stripeService.reactivateSubscription(auth.orgId);

	return c.body(null, 204);
});

billingRouter.openapi(retryPaymentRoute, async (c) => {
	const auth = getAuth(c);
	await stripeService.retryPayment(auth.orgId);

	return c.body(null, 204);
});

billingRouter.post("/webhook", async (c) => {
	const signature = c.req.header("stripe-signature");

	if (!signature) {
		throw badRequest("Missing signature");
	}

	const payload = await c.req.text();

	try {
		await stripeService.handleWebhookEvent(payload, signature);
		return c.json({ received: true });
	} catch (err) {
		logger.error({ err }, "webhook error");
		throw badRequest("Webhook error");
	}
});

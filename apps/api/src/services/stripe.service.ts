import Stripe from "stripe";
import { config } from "../config";
import * as orgRepo from "../repositories/organization.repository";
import * as subRepo from "../repositories/subscription.repository";
import { logger } from "../utils/logger";
import * as auditService from "./audit.service";
import type { AuditContext } from "./audit.service";
import { sendPaymentFailedEmail } from "./email.service";

const stripe = config.stripeSecretKey
	? new Stripe(config.stripeSecretKey)
	: null;

export type CreateCheckoutSessionParams = {
	orgId: string;
	orgName: string;
	userEmail: string;
};

export async function createCheckoutSession(
	params: CreateCheckoutSessionParams,
): Promise<{ url: string }> {
	if (!stripe) {
		throw new Error("Stripe not configured");
	}

	if (!config.stripeProPriceId) {
		throw new Error("Stripe Pro price ID not configured");
	}

	const sub = await subRepo.findByOrgId(params.orgId);

	if (!sub) {
		throw new Error("Subscription not found");
	}

	let customerId = sub.stripeCustomerId;

	if (!customerId) {
		const customer = await stripe.customers.create({
			email: params.userEmail,
			name: params.orgName,
			metadata: { orgId: params.orgId },
		});
		customerId = customer.id;

		await subRepo.updateStripeCustomerId(params.orgId, customerId);
	}

	const successUrl = `${config.appUrl}/billing?success=true`;
	const cancelUrl = `${config.appUrl}/billing?canceled=true`;

	const session = await stripe.checkout.sessions.create({
		customer: customerId,
		mode: "subscription",
		line_items: [{ price: config.stripeProPriceId, quantity: 1 }],
		success_url: successUrl,
		cancel_url: cancelUrl,
		metadata: { orgId: params.orgId },
	});

	if (!session.url) {
		throw new Error("Failed to create checkout session");
	}

	return { url: session.url };
}

export async function cancelSubscription(
	orgId: string,
	ctx?: AuditContext,
): Promise<void> {
	if (!stripe) {
		throw new Error("Stripe not configured");
	}

	const sub = await subRepo.findByOrgId(orgId);

	if (!sub?.stripeSubscriptionId) {
		throw new Error("No active subscription found");
	}

	await stripe.subscriptions.update(sub.stripeSubscriptionId, {
		cancel_at_period_end: true,
	});

	const subscription = await stripe.subscriptions.retrieve(
		sub.stripeSubscriptionId,
	);
	const periodEnd = subscription.cancel_at
		? new Date(subscription.cancel_at * 1000)
		: null;

	await subRepo.update(orgId, {
		stripeCancelAtPeriodEnd: true,
		stripeCurrentPeriodEnd: periodEnd,
	});

	await auditService.log({
		orgId,
		action: "subscription_cancelled",
		targetType: "subscription",
		targetId: sub.stripeSubscriptionId,
		metadata: { cancelAtPeriodEnd: periodEnd?.toISOString() },
		ctx,
	});
}

export async function reactivateSubscription(
	orgId: string,
	ctx?: AuditContext,
): Promise<void> {
	if (!stripe) {
		throw new Error("Stripe not configured");
	}

	const sub = await subRepo.findByOrgId(orgId);

	if (!sub?.stripeSubscriptionId) {
		throw new Error("No subscription found");
	}

	await stripe.subscriptions.update(sub.stripeSubscriptionId, {
		cancel_at_period_end: false,
	});

	await subRepo.update(orgId, {
		stripeCancelAtPeriodEnd: false,
	});

	await auditService.log({
		orgId,
		action: "subscription_updated",
		targetType: "subscription",
		targetId: sub.stripeSubscriptionId,
		metadata: { action: "reactivated" },
		ctx,
	});
}

export async function retryPayment(orgId: string): Promise<void> {
	if (!stripe) {
		throw new Error("Stripe not configured");
	}

	const sub = await subRepo.findByOrgId(orgId);

	if (!sub?.lastFailedInvoiceId) {
		throw new Error("No failed invoice found");
	}

	await stripe.invoices.pay(sub.lastFailedInvoiceId);
}

export async function handleWebhookEvent(
	payload: string,
	signature: string,
): Promise<void> {
	if (!stripe) {
		throw new Error("Stripe not configured");
	}

	if (!config.stripeWebhookSecret) {
		throw new Error("Stripe webhook secret not configured");
	}

	const event = stripe.webhooks.constructEvent(
		payload,
		signature,
		config.stripeWebhookSecret,
	);

	switch (event.type) {
		case "checkout.session.completed":
			await handleCheckoutCompleted(event.data.object);
			break;
		case "customer.subscription.updated":
			await handleSubscriptionUpdated(event.data.object);
			break;
		case "customer.subscription.deleted":
			await handleSubscriptionDeleted(event.data.object);
			break;
		case "invoice.payment_failed":
			await handlePaymentFailed(event.data.object);
			break;
		case "invoice.payment_succeeded":
			await handlePaymentSucceeded(event.data.object);
			break;
	}
}

async function handleCheckoutCompleted(
	session: Stripe.Checkout.Session,
): Promise<void> {
	const orgId = session.metadata?.orgId;
	if (!orgId) {
		logger.error("checkout.session.completed missing orgId");
		return;
	}

	const subscriptionId =
		typeof session.subscription === "string"
			? session.subscription
			: session.subscription?.id;

	await subRepo.update(orgId, {
		tier: "pro",
		stripeSubscriptionId: subscriptionId ?? null,
	});

	await auditService.log({
		orgId,
		action: "subscription_created",
		targetType: "subscription",
		targetId: subscriptionId ?? undefined,
		metadata: { tier: "pro" },
	});

	logger.info({ orgId }, "org upgraded to PRO");
}

async function handleSubscriptionUpdated(
	subscription: Stripe.Subscription,
): Promise<void> {
	const customerId =
		typeof subscription.customer === "string"
			? subscription.customer
			: subscription.customer.id;

	const sub = await subRepo.findByStripeCustomerId(customerId);

	if (!sub) {
		logger.error({ customerId }, "no subscription found for customer");
		return;
	}

	const oldTier = sub.tier;
	const status = subscription.status;
	const tier = status === "active" || status === "trialing" ? "pro" : "free";
	const cancelAtPeriodEnd = subscription.cancel_at_period_end;
	const cancelAt = subscription.cancel_at;
	const currentPeriodEnd = cancelAt ? new Date(cancelAt * 1000) : null;

	await subRepo.update(sub.organizationId, {
		tier,
		stripeCancelAtPeriodEnd: cancelAtPeriodEnd,
		stripeCurrentPeriodEnd: currentPeriodEnd,
	});

	if (oldTier !== tier || sub.stripeCancelAtPeriodEnd !== cancelAtPeriodEnd) {
		await auditService.log({
			orgId: sub.organizationId,
			action: "subscription_updated",
			targetType: "subscription",
			targetId: subscription.id,
			metadata: {
				tier: { old: oldTier, new: tier },
				status,
				cancelAtPeriodEnd,
			},
		});
	}

	logger.info({ orgId: sub.organizationId, tier }, "subscription updated");
}

async function handleSubscriptionDeleted(
	subscription: Stripe.Subscription,
): Promise<void> {
	const customerId =
		typeof subscription.customer === "string"
			? subscription.customer
			: subscription.customer.id;

	const sub = await subRepo.findByStripeCustomerId(customerId);

	if (!sub) {
		logger.error({ customerId }, "no subscription found for customer");
		return;
	}

	await subRepo.update(sub.organizationId, {
		tier: "free",
		stripeSubscriptionId: null,
		stripeCancelAtPeriodEnd: false,
		stripeCurrentPeriodEnd: null,
	});

	await auditService.log({
		orgId: sub.organizationId,
		action: "subscription_cancelled",
		targetType: "subscription",
		targetId: subscription.id,
		metadata: { tier: { old: sub.tier, new: "free" }, reason: "deleted" },
	});

	logger.info(
		{ orgId: sub.organizationId },
		"subscription deleted, downgraded to FREE",
	);
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
	const customerId =
		typeof invoice.customer === "string"
			? invoice.customer
			: invoice.customer?.id;

	if (!customerId) return;

	const sub = await subRepo.findByStripeCustomerId(customerId);

	if (!sub) {
		logger.error({ customerId }, "no subscription found for customer");
		return;
	}

	if (sub.paymentFailedAt) {
		logger.info(
			{ orgId: sub.organizationId },
			"payment failed again, already in grace",
		);
		return;
	}

	await subRepo.update(sub.organizationId, {
		paymentFailedAt: new Date(),
		lastFailedInvoiceId: invoice.id,
	});

	const owner = await getOrgOwnerEmail(sub.organizationId);
	if (owner) {
		const org = await orgRepo.findById(sub.organizationId);
		await sendPaymentFailedEmail({
			to: owner.email,
			orgName: org?.name ?? "Your organization",
			graceDays: 7,
		});
	}

	logger.warn(
		{ orgId: sub.organizationId },
		"payment failed, grace period started",
	);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
	const customerId =
		typeof invoice.customer === "string"
			? invoice.customer
			: invoice.customer?.id;

	if (!customerId) return;

	const sub = await subRepo.findByStripeCustomerId(customerId);

	if (!sub) {
		logger.error({ customerId }, "no subscription found for customer");
		return;
	}

	if (!sub.paymentFailedAt) return;

	await subRepo.update(sub.organizationId, {
		paymentFailedAt: null,
		lastFailedInvoiceId: null,
	});

	logger.info(
		{ orgId: sub.organizationId },
		"payment succeeded, grace period cleared",
	);
}

async function getOrgOwnerEmail(
	orgId: string,
): Promise<{ email: string } | null> {
	const owner = await orgRepo.findOwnerEmail(orgId);
	if (!owner) return null;
	return { email: owner.user.email };
}

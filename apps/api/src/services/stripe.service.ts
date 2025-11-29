import Stripe from "stripe";
import { config } from "../config";
import * as orgRepo from "../repositories/organization.repository";

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

	const org = await orgRepo.findById(params.orgId);

	if (!org) {
		throw new Error("Organization not found");
	}

	let customerId = org.stripeCustomerId;

	if (!customerId) {
		const customer = await stripe.customers.create({
			email: params.userEmail,
			name: params.orgName,
			metadata: { orgId: params.orgId },
		});
		customerId = customer.id;

		await orgRepo.updateStripeCustomerId(params.orgId, customerId);
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

export async function cancelSubscription(orgId: string): Promise<void> {
	if (!stripe) {
		throw new Error("Stripe not configured");
	}

	const org = await orgRepo.findById(orgId);

	if (!org?.stripeSubscriptionId) {
		throw new Error("No active subscription found");
	}

	await stripe.subscriptions.update(org.stripeSubscriptionId, {
		cancel_at_period_end: true,
	});

	const subscription = await stripe.subscriptions.retrieve(
		org.stripeSubscriptionId,
	);
	const periodEnd = subscription.cancel_at
		? new Date(subscription.cancel_at * 1000)
		: null;

	await orgRepo.updateSubscription(orgId, {
		stripeCancelAtPeriodEnd: true,
		stripeCurrentPeriodEnd: periodEnd,
	});
}

export async function reactivateSubscription(orgId: string): Promise<void> {
	if (!stripe) {
		throw new Error("Stripe not configured");
	}

	const org = await orgRepo.findById(orgId);

	if (!org?.stripeSubscriptionId) {
		throw new Error("No subscription found");
	}

	await stripe.subscriptions.update(org.stripeSubscriptionId, {
		cancel_at_period_end: false,
	});

	await orgRepo.updateSubscription(orgId, {
		stripeCancelAtPeriodEnd: false,
	});
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
	}
}

async function handleCheckoutCompleted(
	session: Stripe.Checkout.Session,
): Promise<void> {
	const orgId = session.metadata?.orgId;
	if (!orgId) {
		console.error("stripe checkout.session.completed missing orgId");
		return;
	}

	const subscriptionId =
		typeof session.subscription === "string"
			? session.subscription
			: session.subscription?.id;

	await orgRepo.updateSubscription(orgId, {
		tier: "pro",
		stripeSubscriptionId: subscriptionId ?? null,
	});

	console.log(`stripe org ${orgId} upgraded to PRO`);
}

async function handleSubscriptionUpdated(
	subscription: Stripe.Subscription,
): Promise<void> {
	const customerId =
		typeof subscription.customer === "string"
			? subscription.customer
			: subscription.customer.id;

	const org = await orgRepo.findByStripeCustomerId(customerId);

	if (!org) {
		console.error(`stripe no org found for customer ${customerId}`);
		return;
	}

	const status = subscription.status;
	const tier = status === "active" || status === "trialing" ? "pro" : "free";
	const cancelAtPeriodEnd = subscription.cancel_at_period_end;
	const cancelAt = subscription.cancel_at;
	const currentPeriodEnd = cancelAt ? new Date(cancelAt * 1000) : null;

	await orgRepo.updateSubscription(org.id, {
		tier,
		stripeCancelAtPeriodEnd: cancelAtPeriodEnd,
		stripeCurrentPeriodEnd: currentPeriodEnd,
	});

	console.log(`stripe subscription updated for org ${org.id}: ${tier}`);
}

async function handleSubscriptionDeleted(
	subscription: Stripe.Subscription,
): Promise<void> {
	const customerId =
		typeof subscription.customer === "string"
			? subscription.customer
			: subscription.customer.id;

	const org = await orgRepo.findByStripeCustomerId(customerId);

	if (!org) {
		console.error(`stripe no org found for customer ${customerId}`);
		return;
	}

	await orgRepo.updateSubscription(org.id, {
		tier: "free",
		stripeSubscriptionId: null,
		stripeCancelAtPeriodEnd: false,
		stripeCurrentPeriodEnd: null,
	});

	console.log(`stripe subscription deleted, org ${org.id} downgraded to FREE`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
	const customerId =
		typeof invoice.customer === "string"
			? invoice.customer
			: invoice.customer?.id;

	if (!customerId) return;

	const org = await orgRepo.findByStripeCustomerId(customerId);

	if (!org) {
		console.error(`stripe no org found for customer ${customerId}`);
		return;
	}

	console.warn(`stripe payment failed for org ${org.id}`);
}

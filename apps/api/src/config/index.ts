export const config = {
	port: Number(process.env.PORT) || 4000,
	isProduction: process.env.NODE_ENV === "production",
	appUrl: process.env.APP_URL || "http://localhost:3000",
	apiUrl: process.env.API_URL || "http://localhost:4000",
	// Feature flags
	billingEnabled: process.env.BILLING_ENABLED !== "false",
	// Stripe
	stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
	stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
	stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID || "",
	// Email
	resendApiKey: process.env.RESEND_API_KEY || "",
	// OAuth
	githubClientId: process.env.GITHUB_CLIENT_ID || "",
	githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",
	googleClientId: process.env.GOOGLE_CLIENT_ID || "",
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
};

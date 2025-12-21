export const config = {
	port: Number(process.env.PORT) || 4000,
	isProduction: process.env.NODE_ENV === "production",
	appUrl: process.env.APP_URL || "http://localhost:4001",
	apiUrl: process.env.API_URL || "http://localhost:4000",
	// Auth
	authSecret:
		process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
	cookieDomain: process.env.COOKIE_DOMAIN || undefined, // ".mockspec.dev" in prod
	// Feature flags
	billingEnabled: process.env.BILLING_ENABLED === "true",
	emailEnabled: process.env.EMAIL_ENABLED === "true",
	proxyEnabled: process.env.PROXY_ENABLED === "true",
	// Stripe
	stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
	stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
	stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID || "",
	// Email
	sendpigeonApiKey: process.env.SENDPIGEON_API_KEY || "",
	// OAuth
	githubClientId: process.env.GITHUB_CLIENT_ID || "",
	githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",
	googleClientId: process.env.GOOGLE_CLIENT_ID || "",
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
};

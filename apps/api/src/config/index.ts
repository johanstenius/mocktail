export const config = {
	port: Number(process.env.PORT) || 4000,
	jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
	jwtExpiresIn: "7d",
	isProduction: process.env.NODE_ENV === "production",
	appUrl: process.env.APP_URL || "http://localhost:3000",
	apiUrl: process.env.API_URL || "http://localhost:4000",
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

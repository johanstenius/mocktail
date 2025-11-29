export const config = {
	port: Number(process.env.PORT) || 4000,
	jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
	jwtExpiresIn: "7d",
	isProduction: process.env.NODE_ENV === "production",
	appUrl: process.env.APP_URL || "http://localhost:3000",
	// Stripe
	stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
	stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
	stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID || "",
};

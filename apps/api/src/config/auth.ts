export const AUTH_CONFIG = {
	jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
	accessTokenExpiry: 3600, // 1 hour in seconds
	refreshTokenExpiry: 30 * 24 * 3600, // 30 days in seconds
	passwordMinLength: 8,
} as const;

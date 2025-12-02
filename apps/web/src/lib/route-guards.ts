import { redirect } from "@tanstack/react-router";
import { BILLING_ENABLED } from "./config";

const TOKEN_KEY = "mocktail_tokens";

function hasStoredTokens(): boolean {
	const stored = localStorage.getItem(TOKEN_KEY);
	if (!stored) return false;
	try {
		const tokens = JSON.parse(stored);
		return Boolean(tokens?.accessToken);
	} catch {
		return false;
	}
}

export function requireAuth() {
	if (!hasStoredTokens()) {
		throw redirect({ to: "/login" });
	}
}

export function requireBilling() {
	if (!BILLING_ENABLED) {
		throw redirect({ to: "/dashboard" });
	}
}

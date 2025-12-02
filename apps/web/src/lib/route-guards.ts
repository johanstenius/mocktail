import { redirect } from "@tanstack/react-router";
import { BILLING_ENABLED } from "./config";

const TOKEN_KEY = "mocktail_tokens";

type StoredTokens = {
	accessToken?: string;
};

function getStoredTokens(): StoredTokens | null {
	const stored = localStorage.getItem(TOKEN_KEY);
	if (!stored) return null;
	try {
		return JSON.parse(stored) as StoredTokens;
	} catch {
		return null;
	}
}

export function requireAuth() {
	const tokens = getStoredTokens();
	if (!tokens?.accessToken) {
		throw redirect({ to: "/login" });
	}
	// Email verification is checked in AuthProvider after /me returns
}

export function requireBilling() {
	if (!BILLING_ENABLED) {
		throw redirect({ to: "/dashboard" });
	}
}

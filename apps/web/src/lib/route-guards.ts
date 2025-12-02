import { redirect } from "@tanstack/react-router";
import { BILLING_ENABLED } from "./config";

const TOKEN_KEY = "mocktail_tokens";

type StoredData = {
	accessToken?: string;
	emailVerifiedAt?: string | null;
};

function getStoredData(): StoredData | null {
	const stored = localStorage.getItem(TOKEN_KEY);
	if (!stored) return null;
	try {
		return JSON.parse(stored) as StoredData;
	} catch {
		return null;
	}
}

export function requireAuth() {
	const data = getStoredData();
	if (!data?.accessToken) {
		throw redirect({ to: "/login" });
	}
	if (!data.emailVerifiedAt) {
		throw redirect({ to: "/check-email" });
	}
}

export function requireBilling() {
	if (!BILLING_ENABLED) {
		throw redirect({ to: "/dashboard" });
	}
}

import { redirect } from "@tanstack/react-router";
import { BILLING_ENABLED } from "./config";

// Auth is handled by cookie sessions - components use useAuth hook for redirects
export function requireAuth() {}

export function requireBilling() {
	if (!BILLING_ENABLED) {
		throw redirect({ to: "/dashboard" });
	}
}

import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const authClient = createAuthClient({
	baseURL: API_URL,
	basePath: "/auth",
	plugins: [organizationClient()],
});

export const {
	useSession,
	signIn,
	signUp,
	signOut,
	useActiveOrganization,
	useListOrganizations,
} = authClient;

export const { organization } = authClient;

// Export password/email functions directly from authClient
// @ts-expect-error - better-auth types may be incomplete
export const forgetPassword =
	authClient.forgetPassword || authClient.requestPasswordReset;
export const resetPassword = authClient.resetPassword;
export const sendVerificationEmail = authClient.sendVerificationEmail;
export const verifyEmail = authClient.verifyEmail;

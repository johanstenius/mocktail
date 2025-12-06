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

// These methods exist on the client but may not be fully typed
export const {
	requestPasswordReset,
	resetPassword,
	sendVerificationEmail,
	verifyEmail,
	changePassword,
} = authClient as typeof authClient & {
	requestPasswordReset: (opts: {
		email: string;
		redirectTo?: string;
	}) => Promise<{ data?: unknown; error?: { message: string } }>;
	resetPassword: (opts: {
		newPassword: string;
		token: string;
	}) => Promise<{ data?: unknown; error?: { message: string } }>;
	sendVerificationEmail: (opts: {
		email: string;
		callbackURL?: string;
	}) => Promise<{ data?: unknown; error?: { message: string } }>;
	verifyEmail: (opts: {
		token: string;
	}) => Promise<{ data?: unknown; error?: { message: string } }>;
	changePassword: (opts: {
		newPassword: string;
		currentPassword: string;
		revokeOtherSessions?: boolean;
	}) => Promise<{ data?: unknown; error?: { message: string } }>;
};

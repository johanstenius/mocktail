import { config } from "../config";
import * as inviteRepo from "../repositories/invite.repository";
import * as orgRepo from "../repositories/organization.repository";
import * as userRepo from "../repositories/user.repository";
import { badRequest, unauthorized } from "../utils/errors";
import { createOAuthPendingToken } from "./oauth-pending-token";
import * as tokenService from "./token.service";

export type OAuthProvider = "github" | "google";

type GitHubUser = {
	id: number;
	email: string;
	name: string | null;
	login: string;
};

type GoogleUser = {
	sub: string;
	email: string;
	name: string;
	email_verified: boolean;
};

type OAuthUserProfile = {
	provider: OAuthProvider;
	oauthId: string;
	email: string;
	name: string;
};

type OAuthLoginSuccess = {
	type: "login";
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	userId: string;
	orgId: string;
};

type OAuthPendingOnboarding = {
	type: "pending_onboarding";
	pendingToken: string;
	suggestedOrgName: string;
};

export type OAuthResult = OAuthLoginSuccess | OAuthPendingOnboarding;

async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
	const response = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/vnd.github.v3+json",
		},
	});

	if (!response.ok) {
		throw unauthorized("Failed to fetch GitHub user");
	}

	return response.json();
}

async function fetchGoogleUser(accessToken: string): Promise<GoogleUser> {
	const response = await fetch(
		"https://www.googleapis.com/oauth2/v3/userinfo",
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		throw unauthorized("Failed to fetch Google user");
	}

	return response.json();
}

export async function exchangeGitHubCode(
	code: string,
	inviteToken?: string,
): Promise<OAuthResult> {
	const tokenResponse = await fetch(
		"https://github.com/login/oauth/access_token",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				client_id: config.githubClientId,
				client_secret: config.githubClientSecret,
				code,
			}),
		},
	);

	if (!tokenResponse.ok) {
		throw badRequest("Failed to exchange GitHub code");
	}

	const tokenData = await tokenResponse.json();

	if (tokenData.error) {
		throw badRequest(`GitHub OAuth error: ${tokenData.error_description}`);
	}

	const githubUser = await fetchGitHubUser(tokenData.access_token);

	const profile: OAuthUserProfile = {
		provider: "github",
		oauthId: String(githubUser.id),
		email: githubUser.email,
		name: githubUser.name || githubUser.login,
	};

	return handleOAuthCallback(profile, inviteToken);
}

export async function exchangeGoogleCode(
	code: string,
	inviteToken?: string,
): Promise<OAuthResult> {
	const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			client_id: config.googleClientId,
			client_secret: config.googleClientSecret,
			code,
			grant_type: "authorization_code",
			redirect_uri: `${config.apiUrl}/auth/google/callback`,
		}),
	});

	if (!tokenResponse.ok) {
		throw badRequest("Failed to exchange Google code");
	}

	const tokenData = await tokenResponse.json();

	if (tokenData.error) {
		throw badRequest(`Google OAuth error: ${tokenData.error_description}`);
	}

	const googleUser = await fetchGoogleUser(tokenData.access_token);

	const profile: OAuthUserProfile = {
		provider: "google",
		oauthId: googleUser.sub,
		email: googleUser.email,
		name: googleUser.name,
	};

	return handleOAuthCallback(profile, inviteToken);
}

async function handleOAuthCallback(
	profile: OAuthUserProfile,
	inviteToken?: string,
): Promise<OAuthResult> {
	// 1. Check if user exists by OAuth provider (returning user)
	const existingOAuthUser = await userRepo.findByOAuthProvider(
		profile.provider,
		profile.oauthId,
	);

	if (existingOAuthUser) {
		// If invite token provided, try to accept invite for existing user
		if (inviteToken) {
			const invite = await inviteRepo.findByToken(inviteToken);
			if (invite && invite.email === profile.email) {
				await inviteRepo.acceptForExistingUser(
					invite.id,
					existingOAuthUser.id,
					invite.orgId,
					invite.role,
				);
				const tokens = await tokenService.generateTokenPair(
					existingOAuthUser.id,
					invite.orgId,
				);
				return {
					type: "login",
					...tokens,
					userId: existingOAuthUser.id,
					orgId: invite.orgId,
				};
			}
		}

		const membership = await orgRepo.findMembershipsByUserId(
			existingOAuthUser.id,
		);
		if (membership.length === 0) {
			// Existing OAuth user but no org - send to onboarding
			const pendingToken = await createOAuthPendingToken(profile);
			return {
				type: "pending_onboarding",
				pendingToken,
				suggestedOrgName: profile.name,
			};
		}
		// Has org - login
		const tokens = await tokenService.generateTokenPair(
			existingOAuthUser.id,
			membership[0].orgId,
		);
		return {
			type: "login",
			...tokens,
			userId: existingOAuthUser.id,
			orgId: membership[0].orgId,
		};
	}

	// 2. Check if email already registered with password
	const existingEmailUser = await userRepo.findByEmail(profile.email);
	if (existingEmailUser) {
		throw badRequest(
			"An account with this email already exists. Please sign in with email/password.",
		);
	}

	// 3. Check for invite (explicit token or by email)
	const invite = inviteToken
		? await inviteRepo.findByToken(inviteToken)
		: await inviteRepo.findActiveByEmail(profile.email);

	if (invite && invite.email === profile.email) {
		// Create OAuth user and accept invite atomically
		const { user } = await inviteRepo.acceptWithOAuthUser(
			invite.id,
			{
				email: profile.email,
				name: profile.name,
				oauthProvider: profile.provider,
				oauthId: profile.oauthId,
			},
			invite.orgId,
			invite.role,
		);
		const tokens = await tokenService.generateTokenPair(user.id, invite.orgId);
		return {
			type: "login",
			...tokens,
			userId: user.id,
			orgId: invite.orgId,
		};
	}

	// 4. New user, no invite - create pending token for onboarding
	const pendingToken = await createOAuthPendingToken(profile);
	return {
		type: "pending_onboarding",
		pendingToken,
		suggestedOrgName: profile.name,
	};
}

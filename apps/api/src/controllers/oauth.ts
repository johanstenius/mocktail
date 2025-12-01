import { OpenAPIHono } from "@hono/zod-openapi";
import { config } from "../config";
import * as oauthService from "../services/oauth.service";
import { getErrorMessage } from "../utils/errors";
import { logger } from "../utils/logger";

export const oauthRouter = new OpenAPIHono();

// GitHub OAuth
oauthRouter.get("/github", async (c) => {
	const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
	githubAuthUrl.searchParams.set("client_id", config.githubClientId);
	githubAuthUrl.searchParams.set("scope", "user:email");
	githubAuthUrl.searchParams.set(
		"redirect_uri",
		`${config.apiUrl}/auth/github/callback`,
	);

	return c.redirect(githubAuthUrl.toString());
});

oauthRouter.get("/github/callback", async (c) => {
	const code = c.req.query("code");
	const error = c.req.query("error");

	if (error || !code) {
		const errorMsg = error || "No code provided";
		return c.redirect(
			`${config.appUrl}/login?error=${encodeURIComponent(errorMsg)}`,
		);
	}

	try {
		const result = await oauthService.exchangeGitHubCode(code);

		if (result.type === "pending_onboarding") {
			const params = new URLSearchParams({
				oauth_token: result.pendingToken,
				suggested_org_name: result.suggestedOrgName,
			});
			return c.redirect(`${config.appUrl}/onboarding?${params.toString()}`);
		}

		const params = new URLSearchParams({
			access_token: result.accessToken,
			refresh_token: result.refreshToken,
			expires_in: String(result.expiresIn),
		});
		return c.redirect(`${config.appUrl}/dashboard?${params.toString()}`);
	} catch (err) {
		const errorMsg = getErrorMessage(err);
		return c.redirect(
			`${config.appUrl}/login?error=${encodeURIComponent(errorMsg)}`,
		);
	}
});

// Google OAuth
oauthRouter.get("/google", async (c) => {
	logger.info({apiUrl: config.apiUrl}, "URL")
	const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	googleAuthUrl.searchParams.set("client_id", config.googleClientId);
	googleAuthUrl.searchParams.set("response_type", "code");
	googleAuthUrl.searchParams.set(
		"redirect_uri",
		`${config.apiUrl}/auth/google/callback`,
	);
	googleAuthUrl.searchParams.set("scope", "openid email profile");

	return c.redirect(googleAuthUrl.toString());
});

oauthRouter.get("/google/callback", async (c) => {
	const code = c.req.query("code");
	const error = c.req.query("error");

	if (error || !code) {
		const errorMsg = error || "No code provided";
		return c.redirect(
			`${config.appUrl}/login?error=${encodeURIComponent(errorMsg)}`,
		);
	}

	try {
		const result = await oauthService.exchangeGoogleCode(code);

		if (result.type === "pending_onboarding") {
			const params = new URLSearchParams({
				oauth_token: result.pendingToken,
				suggested_org_name: result.suggestedOrgName,
			});
			return c.redirect(`${config.appUrl}/onboarding?${params.toString()}`);
		}

		const params = new URLSearchParams({
			access_token: result.accessToken,
			refresh_token: result.refreshToken,
			expires_in: String(result.expiresIn),
		});
		return c.redirect(`${config.appUrl}/dashboard?${params.toString()}`);
	} catch (err) {
		const errorMsg = getErrorMessage(err);
		return c.redirect(
			`${config.appUrl}/login?error=${encodeURIComponent(errorMsg)}`,
		);
	}
});

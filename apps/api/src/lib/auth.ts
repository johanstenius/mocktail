import { createAuth } from "@johanstenius/auth-hono";
import { Resend } from "resend";
import { config } from "../config";
import { prisma } from "../repositories/db/prisma";
import { inviteEmailTemplate } from "../templates/emails/invite";
import { passwordResetEmailTemplate } from "../templates/emails/password-reset";
import { verifyEmailTemplate } from "../templates/emails/verify-email";
import { logger } from "../utils/logger";

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

export const auth = createAuth({
	database: prisma,
	baseUrl: config.apiUrl,
	webUrl: config.appUrl,

	oauth: {
		google: {
			clientId: config.googleClientId,
			clientSecret: config.googleClientSecret,
		},
		github: {
			clientId: config.githubClientId,
			clientSecret: config.githubClientSecret,
		},
	},

	session: {
		cookieName: "mocktail_session",
		expiresInSeconds: 30 * 24 * 3600, // 30 days
		secure: config.isProduction,
		sameSite: "lax",
	},

	password: {
		minLength: 8,
	},

	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		autoLoginAfterVerification: true,
		sendVerificationEmail: async ({ user, token, url }) => {
			if (!resend) {
				logger.warn(
					{ url },
					"resend not configured - verification email not sent",
				);
				return;
			}

			const { error } = await resend.emails.send({
				from: "Mocktail <noreply@mocktail.stenius.me>",
				to: user.email,
				subject: "Verify your email",
				html: verifyEmailTemplate({ verifyUrl: url }),
			});

			if (error) {
				logger.error(
					{ error, to: user.email },
					"failed to send verification email",
				);
			}
		},
		sendPasswordResetEmail: async ({ user, token, url }) => {
			if (!resend) {
				logger.warn(
					{ url },
					"resend not configured - password reset email not sent",
				);
				return;
			}

			const { error } = await resend.emails.send({
				from: "Mocktail <noreply@mocktail.stenius.me>",
				to: user.email,
				subject: "Reset your password",
				html: passwordResetEmailTemplate({ resetUrl: url }),
			});

			if (error) {
				logger.error(
					{ error, to: user.email },
					"failed to send password reset email",
				);
			}
		},
	},

	organization: {
		enabled: true,
		requireOrganization: true,
		allowPersonalAccounts: false,
		invitationExpiresInSeconds: 48 * 60 * 60, // 48 hours
		sendInviteEmail: async ({
			email,
			token,
			url,
			organization,
			inviter,
			role,
		}) => {
			if (!resend) {
				logger.warn({ url }, "resend not configured - invite email not sent");
				return;
			}

			const { error } = await resend.emails.send({
				from: "Mocktail <noreply@mocktail.stenius.me>",
				to: email,
				subject: `Join ${organization.name} on Mocktail`,
				html: inviteEmailTemplate({
					orgName: organization.name,
					inviterEmail: inviter.email,
					role,
					inviteUrl: url,
				}),
			});

			if (error) {
				logger.error({ error, to: email }, "failed to send invite email");
			}
		},
	},

	hooks: {
		organization: {
			afterCreate: async (org) => {
				// Create default free subscription for new organizations
				await prisma.subscription.create({
					data: {
						organizationId: org.id,
						tier: "free",
					},
				});
				logger.info({ orgId: org.id }, "created default subscription for org");
			},
		},
	},

	// Rate limiting (uses in-memory store, defaults: 10 login/15min, 5 register/15min, etc.)
	rateLimit: {
		enabled: true,
	},
});

import type { AuthVariables as PackageAuthVariables } from "@johanstenius/auth-hono";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export type AuthVariables = PackageAuthVariables;

type AuthContext = Context<{ Variables: AuthVariables }>;

/**
 * Get authenticated session or throw 401
 */
export function getSession(c: AuthContext) {
	const authSession = c.get("session");
	if (!authSession) {
		throw new HTTPException(401, { message: "Not authenticated" });
	}
	return authSession;
}

/**
 * Get authenticated session with active organization or throw
 */
export function getAuth(c: AuthContext) {
	const { user, session } = getSession(c);
	if (!session.activeOrganizationId) {
		throw new HTTPException(403, { message: "No active organization" });
	}
	return {
		userId: user.id,
		orgId: session.activeOrganizationId,
		user,
		session,
	};
}

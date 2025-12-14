import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Resend } from "resend";
import { config } from "../config";
import { getLimits } from "../config/limits";
import { prisma } from "../repositories/db/prisma";
import * as subRepo from "../repositories/subscription.repository";
import { inviteEmailTemplate } from "../templates/emails/invite";
import { passwordResetEmailTemplate } from "../templates/emails/password-reset";
import { verifyEmailTemplate } from "../templates/emails/verify-email";
import { logger } from "../utils/logger";

const resend =
	config.emailEnabled && config.resendApiKey
		? new Resend(config.resendApiKey)
		: null;

async function createDefaultSubscription(orgId: string) {
	try {
		await subRepo.create(orgId);
		logger.info({ orgId }, "created default subscription for org");
	} catch (err) {
		logger.error(
			{ orgId, err },
			"failed to create default subscription for org",
		);
	}
}

async function checkMemberLimit(orgId: string): Promise<{
	allowed: boolean;
	current: number;
	limit: number;
}> {
	const sub = await prisma.subscription.findUnique({
		where: { organizationId: orgId },
	});
	if (!sub) {
		return { allowed: false, current: 0, limit: 0 };
	}

	const limits = getLimits(sub.tier);
	const memberCount = await prisma.member.count({
		where: { organizationId: orgId },
	});
	const inviteCount = await prisma.invitation.count({
		where: { organizationId: orgId, status: "pending" },
	});
	const total = memberCount + inviteCount;

	return {
		allowed: total < limits.teamMembers,
		current: total,
		limit: limits.teamMembers,
	};
}

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	baseURL: config.apiUrl,
	basePath: "/auth",
	trustedOrigins: [config.appUrl],
	secret: config.authSecret,

	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
		expiresIn: 30 * 24 * 60 * 60, // 30 days
		updateAge: 24 * 60 * 60, // 1 day
	},

	advanced: {
		crossSubDomainCookies: {
			enabled: !!config.cookieDomain,
			domain: config.cookieDomain,
		},
	},

	emailAndPassword: {
		enabled: true,
		requireEmailVerification: config.emailEnabled,
		minPasswordLength: 8,
		autoSignIn: true,
		sendResetPassword: async ({ user, url }) => {
			if (!resend) {
				logger.warn(
					{ url },
					"resend not configured - password reset email not sent",
				);
				return;
			}

			void resend.emails
				.send({
					from: "Mockspec <noreply@mockspec.dev>",
					to: user.email,
					subject: "Reset your password",
					html: passwordResetEmailTemplate({ resetUrl: url }),
				})
				.then(({ error }) => {
					if (error) {
						logger.error(
							{ error, to: user.email },
							"failed to send password reset email",
						);
					}
				});
		},
	},

	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			if (!resend) {
				logger.warn(
					{ url },
					"resend not configured - verification email not sent",
				);
				return;
			}

			void resend.emails
				.send({
					from: "Mockspec <noreply@mockspec.dev>",
					to: user.email,
					subject: "Verify your email",
					html: verifyEmailTemplate({ verifyUrl: url }),
				})
				.then(({ error }) => {
					if (error) {
						logger.error(
							{ error, to: user.email },
							"failed to send verification email",
						);
					}
				});
		},
	},

	socialProviders: {
		google: {
			clientId: config.googleClientId,
			clientSecret: config.googleClientSecret,
			enabled: Boolean(config.googleClientId && config.googleClientSecret),
		},
		github: {
			clientId: config.githubClientId,
			clientSecret: config.githubClientSecret,
			enabled: Boolean(config.githubClientId && config.githubClientSecret),
		},
	},

	plugins: [
		organization({
			allowUserToCreateOrganization: true,
			organizationLimit: 5,
			creatorRole: "owner",
			invitationExpiresIn: 48 * 60 * 60, // 48 hours
			async inviteUser({ data }: { data: { organizationId: string } }) {
				const check = await checkMemberLimit(data.organizationId);
				if (!check.allowed) {
					return {
						error: `Team member limit reached (${check.limit})`,
					};
				}
				return { data };
			},
			async sendInvitationEmail({ invitation, inviter }) {
				if (!resend) {
					logger.warn("resend not configured - invite email not sent");
					return;
				}

				const org = await prisma.organization.findUnique({
					where: { id: invitation.organizationId },
				});

				if (!org) {
					logger.error(
						{ orgId: invitation.organizationId },
						"org not found for invite",
					);
					return;
				}

				const inviteUrl = `${config.appUrl}/accept-invite?token=${invitation.id}`;
				const inviterUser = await prisma.user.findUnique({
					where: { id: inviter.id },
					select: { email: true },
				});

				void resend.emails
					.send({
						from: "Mockspec <noreply@mockspec.dev>",
						to: invitation.email,
						subject: `Join ${org.name} on Mockspec`,
						html: inviteEmailTemplate({
							orgName: org.name,
							inviterEmail: inviterUser?.email ?? "Unknown",
							role: invitation.role,
							inviteUrl,
						}),
					})
					.then(({ error }) => {
						if (error) {
							logger.error(
								{ error, to: invitation.email },
								"failed to send invite email",
							);
						}
					});
			},
			async onOrganizationCreated({
				organization,
			}: { organization: { id: string } }) {
				await createDefaultSubscription(organization.id);
			},
		}),
	],
});

export type Session = typeof auth.$Infer.Session;

export type AuthVariables = {
	user: Session["user"] | null;
	session: Session["session"] | null;
};

type AuthContext = Context<{ Variables: AuthVariables }>;

export function getSession(c: AuthContext) {
	const user = c.get("user");
	const session = c.get("session");
	if (!user || !session) {
		throw new HTTPException(401, { message: "Not authenticated" });
	}
	return { user, session };
}

export function getAuth(c: AuthContext) {
	const { user, session } = getSession(c);
	const activeOrgId = (session as { activeOrganizationId?: string })
		.activeOrganizationId;
	if (!activeOrgId) {
		throw new HTTPException(403, { message: "No active organization" });
	}
	return {
		userId: user.id,
		orgId: activeOrgId,
		user,
		session,
	};
}

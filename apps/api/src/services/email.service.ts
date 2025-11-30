import { Resend } from "resend";
import { config } from "../config";
import { logger } from "../lib/logger";
import { inviteEmailTemplate } from "../templates/emails/invite";
import { passwordResetEmailTemplate } from "../templates/emails/password-reset";
import { verifyEmailTemplate } from "../templates/emails/verify-email";

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

type SendInviteEmailParams = {
	to: string;
	orgName: string;
	inviterEmail: string;
	token: string;
	role: string;
};

export async function sendInviteEmail(
	params: SendInviteEmailParams,
): Promise<void> {
	const inviteUrl = `${config.appUrl}/invite?token=${params.token}`;

	if (!resend) {
		logger.error({ inviteUrl }, "resend not configured");
		return;
	}

	const { error } = await resend.emails.send({
		from: "Mocktail <noreply@mocktail.stenius.me>",
		to: params.to,
		subject: `Join ${params.orgName} on Mocktail`,
		html: inviteEmailTemplate({
			orgName: params.orgName,
			inviterEmail: params.inviterEmail,
			role: params.role,
			inviteUrl,
		}),
	});

	if (error) {
		logger.error({ error, to: params.to }, "failed to send invite email");
	}
}

type SendPasswordResetEmailParams = {
	to: string;
	token: string;
};

export async function sendPasswordResetEmail(
	params: SendPasswordResetEmailParams,
): Promise<void> {
	const resetUrl = `${config.appUrl}/reset-password?token=${params.token}`;

	if (!resend) {
		logger.warn({ resetUrl }, "resend not configured");
		return;
	}

	const { error } = await resend.emails.send({
		from: "Mocktail <noreply@mocktail.stenius.me>",
		to: params.to,
		subject: "Reset your password",
		html: passwordResetEmailTemplate({ resetUrl }),
	});

	if (error) {
		logger.error(
			{ error, to: params.to },
			"failed to send password reset email",
		);
	}
}

type SendVerificationEmailParams = {
	to: string;
	token: string;
};

export async function sendVerificationEmail(
	params: SendVerificationEmailParams,
): Promise<void> {
	const verifyUrl = `${config.appUrl}/verify-email?token=${params.token}`;

	if (!resend) {
		logger.warn({ verifyUrl }, "resend not configured");
		return;
	}

	const { error } = await resend.emails.send({
		from: "Mocktail <noreply@mocktail.stenius.me>",
		to: params.to,
		subject: "Verify your email",
		html: verifyEmailTemplate({ verifyUrl }),
	});

	if (error) {
		logger.error({ error, to: params.to }, "failed to send verification email");
	}
}

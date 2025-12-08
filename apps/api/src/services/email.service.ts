import { Resend } from "resend";
import { config } from "../config";
import { downgradedEmailTemplate } from "../templates/emails/downgraded";
import { inviteEmailTemplate } from "../templates/emails/invite";
import { passwordResetEmailTemplate } from "../templates/emails/password-reset";
import { paymentFailedEmailTemplate } from "../templates/emails/payment-failed";
import { paymentReminderEmailTemplate } from "../templates/emails/payment-reminder";
import { verifyEmailTemplate } from "../templates/emails/verify-email";
import { logger } from "../utils/logger";

const resend =
	config.emailEnabled && config.resendApiKey
		? new Resend(config.resendApiKey)
		: null;

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
		from: "Mockspec <noreply@mockspec.dev>",
		to: params.to,
		subject: `Join ${params.orgName} on Mockspec`,
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
		from: "Mockspec <noreply@mockspec.dev>",
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
		from: "Mockspec <noreply@mockspec.dev>",
		to: params.to,
		subject: "Verify your email",
		html: verifyEmailTemplate({ verifyUrl }),
	});

	if (error) {
		logger.error({ error, to: params.to }, "failed to send verification email");
	}
}

type SendPaymentFailedEmailParams = {
	to: string;
	orgName: string;
	graceDays: number;
};

export async function sendPaymentFailedEmail(
	params: SendPaymentFailedEmailParams,
): Promise<void> {
	const billingUrl = `${config.appUrl}/billing`;

	if (!resend) {
		logger.warn({ billingUrl }, "resend not configured");
		return;
	}

	const { error } = await resend.emails.send({
		from: "Mockspec <noreply@mockspec.dev>",
		to: params.to,
		subject: `Payment failed for ${params.orgName}`,
		html: paymentFailedEmailTemplate({
			orgName: params.orgName,
			graceDays: params.graceDays,
			billingUrl,
		}),
	});

	if (error) {
		logger.error(
			{ error, to: params.to },
			"failed to send payment failed email",
		);
	}
}

type SendPaymentReminderEmailParams = {
	to: string;
	orgName: string;
	daysRemaining: number;
};

export async function sendPaymentReminderEmail(
	params: SendPaymentReminderEmailParams,
): Promise<void> {
	const billingUrl = `${config.appUrl}/billing`;

	if (!resend) {
		logger.warn({ billingUrl }, "resend not configured");
		return;
	}

	const { error } = await resend.emails.send({
		from: "Mockspec <noreply@mockspec.dev>",
		to: params.to,
		subject: `${params.daysRemaining} days left to update payment`,
		html: paymentReminderEmailTemplate({
			orgName: params.orgName,
			daysRemaining: params.daysRemaining,
			billingUrl,
		}),
	});

	if (error) {
		logger.error(
			{ error, to: params.to },
			"failed to send payment reminder email",
		);
	}
}

type SendDowngradedEmailParams = {
	to: string;
	orgName: string;
};

export async function sendDowngradedEmail(
	params: SendDowngradedEmailParams,
): Promise<void> {
	const billingUrl = `${config.appUrl}/billing`;

	if (!resend) {
		logger.warn({ billingUrl }, "resend not configured");
		return;
	}

	const { error } = await resend.emails.send({
		from: "Mockspec <noreply@mockspec.dev>",
		to: params.to,
		subject: `${params.orgName} downgraded to Free`,
		html: downgradedEmailTemplate({
			orgName: params.orgName,
			billingUrl,
		}),
	});

	if (error) {
		logger.error({ error, to: params.to }, "failed to send downgraded email");
	}
}

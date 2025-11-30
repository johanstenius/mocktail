import { Resend } from "resend";
import { config } from "../config";
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
		console.warn("resend not configured, invite url:", inviteUrl);
		return;
	}

	await resend.emails.send({
		from: "Mocktail <onboarding@resend.dev>",
		to: params.to,
		subject: `Join ${params.orgName} on Mocktail`,
		html: inviteEmailTemplate({
			orgName: params.orgName,
			inviterEmail: params.inviterEmail,
			role: params.role,
			inviteUrl,
		}),
	});
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
		console.warn("resend not configured, reset url:", resetUrl);
		return;
	}

	try {
		const result = await resend.emails.send({
			from: "Mocktail <onboarding@resend.dev>",
			to: params.to,
			subject: "Reset your password",
			html: passwordResetEmailTemplate({ resetUrl }),
		});
		console.log("Password reset email sent:", result);
	} catch (err) {
		console.error("Failed to send password reset email:", err);
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
		console.warn("resend not configured, verify url:", verifyUrl);
		return;
	}

	await resend.emails.send({
		from: "Mocktail <onboarding@resend.dev>",
		to: params.to,
		subject: "Verify your email",
		html: verifyEmailTemplate({ verifyUrl }),
	});
}

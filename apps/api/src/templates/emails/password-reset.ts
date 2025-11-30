import { emailLayout, emailStyles, primaryButton } from "./base";

type PasswordResetEmailParams = {
	resetUrl: string;
};

export function passwordResetEmailTemplate(
	params: PasswordResetEmailParams,
): string {
	const content = `
<h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${emailStyles.textPrimary}; line-height: 1.3;">
	Reset your password
</h1>

<p style="margin: 20px 0 0 0; font-size: 15px; color: ${emailStyles.textSecondary}; line-height: 1.6;">
	You requested to reset your password. Click the button below to set a new one.
</p>

${primaryButton("Reset Password", params.resetUrl)}

<p style="margin: 24px 0 0 0; font-size: 13px; color: ${emailStyles.textMuted}; line-height: 1.5;">
	This link expires in 1 hour.<br>
	If you didn't request this, you can safely ignore this email.
</p>
`.trim();

	return emailLayout({
		content,
		previewText: "Reset your Mocktail password",
	});
}

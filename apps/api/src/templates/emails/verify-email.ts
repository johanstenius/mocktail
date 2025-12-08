import { emailLayout, emailStyles, primaryButton } from "./base";

type VerifyEmailParams = {
	verifyUrl: string;
};

export function verifyEmailTemplate(params: VerifyEmailParams): string {
	const content = `
<h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${emailStyles.textPrimary}; line-height: 1.3;">
	Verify your email
</h1>

<p style="margin: 20px 0 0 0; font-size: 15px; color: ${emailStyles.textSecondary}; line-height: 1.6;">
	Thanks for signing up! Click the button below to verify your email address.
</p>

${primaryButton("Verify Email", params.verifyUrl)}

<p style="margin: 24px 0 0 0; font-size: 13px; color: ${emailStyles.textMuted}; line-height: 1.5;">
	This link expires in 24 hours.<br>
	If you didn't create an account, you can safely ignore this email.
</p>
`.trim();

	return emailLayout({
		content,
		previewText: "Verify your Mockspec email address",
	});
}

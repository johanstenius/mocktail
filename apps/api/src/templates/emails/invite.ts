import { emailLayout, emailStyles, primaryButton } from "./base";

type InviteEmailParams = {
	orgName: string;
	inviterEmail: string;
	role: string;
	inviteUrl: string;
};

export function inviteEmailTemplate(params: InviteEmailParams): string {
	const content = `
<h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${emailStyles.textPrimary}; line-height: 1.3;">
	You're invited to join <span style="color: ${emailStyles.primary};">${params.orgName}</span>
</h1>

<p style="margin: 20px 0 0 0; font-size: 15px; color: ${emailStyles.textSecondary}; line-height: 1.6;">
	<strong style="color: ${emailStyles.textPrimary};">${params.inviterEmail}</strong> has invited you to join their organization on Mocktail as a <strong style="color: ${emailStyles.primary};">${params.role.toLowerCase()}</strong>.
</p>

${primaryButton("Accept Invitation", params.inviteUrl)}

<p style="margin: 24px 0 0 0; font-size: 13px; color: ${emailStyles.textMuted}; line-height: 1.5;">
	This invitation expires in 7 days.<br>
	If you didn't expect this, you can safely ignore this email.
</p>
`.trim();

	return emailLayout({
		content,
		previewText: `${params.inviterEmail} invited you to join ${params.orgName} on Mocktail`,
	});
}

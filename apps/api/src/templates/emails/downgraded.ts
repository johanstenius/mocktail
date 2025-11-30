import { emailLayout, emailStyles, primaryButton } from "./base";

type DowngradedEmailParams = {
	orgName: string;
	billingUrl: string;
};

export function downgradedEmailTemplate(params: DowngradedEmailParams): string {
	const content = `
<h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${emailStyles.textPrimary}; line-height: 1.3;">
	Account downgraded
</h1>

<p style="margin: 20px 0 0 0; font-size: 15px; color: ${emailStyles.textSecondary}; line-height: 1.6;">
	<strong style="color: ${emailStyles.textPrimary};">${params.orgName}</strong> has been downgraded to the Free plan due to payment issues.
</p>

<p style="margin: 16px 0 0 0; font-size: 15px; color: ${emailStyles.textSecondary}; line-height: 1.6;">
	Your existing projects, endpoints, and data are preserved. However, you won't be able to create new resources above Free tier limits until you upgrade.
</p>

${primaryButton("Upgrade to Pro", params.billingUrl)}

<p style="margin: 24px 0 0 0; font-size: 13px; color: ${emailStyles.textMuted}; line-height: 1.5;">
	Free limits: 3 projects, 10 endpoints per project, 3 team members.
</p>
`.trim();

	return emailLayout({
		content,
		previewText: `${params.orgName} downgraded to Free plan`,
	});
}

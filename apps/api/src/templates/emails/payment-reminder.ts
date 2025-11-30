import { emailLayout, emailStyles, primaryButton } from "./base";

type PaymentReminderEmailParams = {
	orgName: string;
	daysRemaining: number;
	billingUrl: string;
};

export function paymentReminderEmailTemplate(
	params: PaymentReminderEmailParams,
): string {
	const content = `
<h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${emailStyles.textPrimary}; line-height: 1.3;">
	${params.daysRemaining} days left
</h1>

<p style="margin: 20px 0 0 0; font-size: 15px; color: ${emailStyles.textSecondary}; line-height: 1.6;">
	Your payment for <strong style="color: ${emailStyles.textPrimary};">${params.orgName}</strong> is still outstanding.
</p>

<p style="margin: 16px 0 0 0; font-size: 15px; color: ${emailStyles.textSecondary}; line-height: 1.6;">
	Update your payment method within <strong style="color: ${emailStyles.accent};">${params.daysRemaining} days</strong> to keep your Pro features.
</p>

${primaryButton("Update Payment", params.billingUrl)}

<p style="margin: 24px 0 0 0; font-size: 13px; color: ${emailStyles.textMuted}; line-height: 1.5;">
	After the grace period, your account will be downgraded to Free and new resource creation will be limited.
</p>
`.trim();

	return emailLayout({
		content,
		previewText: `${params.daysRemaining} days left to update payment for ${params.orgName}`,
	});
}

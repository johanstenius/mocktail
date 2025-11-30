import { emailLayout, emailStyles, primaryButton } from "./base";

type PaymentFailedEmailParams = {
	orgName: string;
	graceDays: number;
	billingUrl: string;
};

export function paymentFailedEmailTemplate(
	params: PaymentFailedEmailParams,
): string {
	const content = `
<h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: ${emailStyles.textPrimary}; line-height: 1.3;">
	Payment failed
</h1>

<p style="margin: 20px 0 0 0; font-size: 15px; color: ${emailStyles.textSecondary}; line-height: 1.6;">
	We couldn't process your payment for <strong style="color: ${emailStyles.textPrimary};">${params.orgName}</strong>.
</p>

<p style="margin: 16px 0 0 0; font-size: 15px; color: ${emailStyles.textSecondary}; line-height: 1.6;">
	You have <strong style="color: ${emailStyles.primary};">${params.graceDays} days</strong> to update your payment method before your account is downgraded to the Free plan.
</p>

${primaryButton("Update Payment", params.billingUrl)}

<p style="margin: 24px 0 0 0; font-size: 13px; color: ${emailStyles.textMuted}; line-height: 1.5;">
	Your Pro features will remain active during this period.
</p>
`.trim();

	return emailLayout({
		content,
		previewText: `Payment failed for ${params.orgName} - ${params.graceDays} days to fix`,
	});
}

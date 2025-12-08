export const emailStyles = {
	bgColor: "#0a0a0a",
	bgSecondary: "#141414",
	bgTertiary: "#1a1a1a",
	primary: "#10b981",
	primaryHover: "#059669",
	secondary: "#3b82f6",
	accent: "#8b5cf6",
	textPrimary: "#f8fafc",
	textSecondary: "#94a3b8",
	textMuted: "#64748b",
	borderColor: "#262626",
} as const;

type EmailLayoutParams = {
	content: string;
	previewText?: string;
};

export function emailLayout({
	content,
	previewText,
}: EmailLayoutParams): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<title>Mockspec</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${emailStyles.bgColor}; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
	${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>` : ""}

	<div style="background-color: ${emailStyles.bgColor}; width: 100%; height: 100%;">
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${emailStyles.bgColor}; width: 100%; margin: 0; padding: 0;">
			<tr>
				<td align="center" style="padding: 40px 20px;">
					<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
						<tr>
							<td align="center" style="padding-bottom: 32px;">
								<table role="presentation" cellpadding="0" cellspacing="0">
									<tr>
										<td style="font-size: 28px; font-weight: 800; color: ${emailStyles.textPrimary}; letter-spacing: -0.03em;">
											<span style="color: ${emailStyles.primary};">Mockspec</span>
										</td>
									</tr>
								</table>
							</td>
						</tr>
						<tr>
							<td>
								<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${emailStyles.bgSecondary}; border: 1px solid ${emailStyles.borderColor}; border-radius: 16px;">
									<tr>
										<td style="padding: 40px;">
											${content}
										</td>
									</tr>
								</table>
							</td>
						</tr>
						<tr>
							<td align="center" style="padding-top: 32px;">
								<p style="margin: 0; font-size: 13px; color: ${emailStyles.textMuted};">
									&copy; ${new Date().getFullYear()} Mockspec. Mock APIs made simple.
								</p>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</div>
</body>
</html>
`.trim();
}

export function primaryButton(text: string, href: string): string {
	return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
	<tr>
		<td style="background: ${emailStyles.primary}; border-radius: 8px;">
			<a href="${href}" target="_blank" style="display: inline-block; padding: 14px 32px; color: ${emailStyles.textPrimary} !important; text-decoration: none; font-weight: 600; font-size: 15px;">${text}</a>
		</td>
	</tr>
</table>
`.trim();
}

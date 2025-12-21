import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { StructuredData } from "./structured-data";

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Mockspec - Mock APIs in Minutes",
	description:
		"Instant mock servers with realistic auth, latency injection, and chaos engineering.",
	metadataBase: new URL("https://mockspec.dev"),
	alternates: {
		canonical: "https://mockspec.dev",
	},
	openGraph: {
		type: "website",
		url: "https://mockspec.dev",
		title: "Mockspec - Mock APIs in Minutes",
		description:
			"Instant mock servers with realistic auth, latency injection, and chaos engineering. Import OpenAPI specs, simulate auth flows, and share with your team.",
		siteName: "Mockspec",
		images: ["/og-image.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Mockspec - Mock APIs in Minutes",
		description:
			"Instant mock servers with realistic auth, latency injection, and chaos engineering.",
		images: ["/og-image.png"],
	},
	keywords: [
		"mock api",
		"api mocking",
		"mock server",
		"openapi",
		"swagger",
		"api testing",
		"frontend development",
	],
	authors: [{ name: "Mockspec" }],
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	other: {
		"theme-color": "#050507",
		"msapplication-TileColor": "#050507",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<StructuredData />
			</head>
			<body
				className={`${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
			>
				<Providers>{children}</Providers>
				<Analytics />
			</body>
		</html>
	);
}

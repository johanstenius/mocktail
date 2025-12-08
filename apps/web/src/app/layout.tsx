import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
	display: "swap",
});

const outfit = Outfit({
	variable: "--font-outfit",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Mocktail - Mock APIs in Minutes",
	description:
		"Instant mock servers with realistic auth, latency injection, and chaos engineering.",
	metadataBase: new URL("https://mocktail.dev"),
	openGraph: {
		type: "website",
		url: "https://mocktail.dev",
		title: "Mocktail - Mock APIs in Minutes",
		description:
			"Instant mock servers with realistic auth, latency injection, and chaos engineering. Import OpenAPI specs, simulate auth flows, and share with your team.",
		siteName: "Mocktail",
		images: ["/og-image.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Mocktail - Mock APIs in Minutes",
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
	authors: [{ name: "Mocktail" }],
	robots: "noindex, nofollow",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${inter.variable} ${jetbrainsMono.variable} ${outfit.variable} antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}

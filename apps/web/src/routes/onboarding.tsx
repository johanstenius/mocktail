import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import type { TokenResponse } from "@/types";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingPage,
});

function OnboardingPage() {
	const navigate = useNavigate();
	const { setTokens, setOnboardingComplete } = useAuth();
	const [organization, setOrganization] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isInitializing, setIsInitializing] = useState(true);
	const [oauthToken, setOauthToken] = useState<string | null>(null);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const oauthTokenParam = params.get("oauth_token");
		const suggestedOrgName = params.get("suggested_org_name");

		if (oauthTokenParam) {
			setOauthToken(oauthTokenParam);
			if (suggestedOrgName) {
				setOrganization(suggestedOrgName);
			}
			window.history.replaceState({}, document.title, "/onboarding");
			setIsInitializing(false);
		} else {
			// No OAuth token and no existing auth - redirect to login
			const tokens = localStorage.getItem("mocktail_tokens");
			if (!tokens || !JSON.parse(tokens).accessToken) {
				navigate({ to: "/login" });
				return;
			}
			setIsInitializing(false);
		}
	}, [navigate]);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			if (oauthToken) {
				// OAuth flow - complete onboarding with pending token
				const result = await api.completeOAuthOnboarding(
					oauthToken,
					organization,
				);
				const tokens: TokenResponse = {
					accessToken: result.accessToken,
					refreshToken: result.refreshToken,
					expiresIn: result.expiresIn,
				};
				setTokens(
					tokens,
					{
						id: result.user.id,
						email: result.user.email,
						emailVerifiedAt: new Date().toISOString(),
					},
					result.org,
				);
				setOnboardingComplete();
				navigate({ to: "/dashboard" });
			} else {
				// Legacy authenticated flow
				const tokens = JSON.parse(
					localStorage.getItem("mocktail_tokens") || "{}",
				) as TokenResponse;
				if (!tokens.accessToken) {
					throw new Error("No authentication tokens found");
				}

				const { org } = await api.createOrganization(organization);
				await api.completeOnboarding();
				const me = await api.getMe(tokens.accessToken);

				setTokens(
					tokens,
					{
						id: me.id,
						email: me.email,
						emailVerifiedAt: me.emailVerifiedAt,
					},
					{
						id: org.id,
						name: org.name,
						slug: org.slug,
					},
				);
				setOnboardingComplete();
				navigate({ to: "/dashboard" });
			}
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setIsLoading(false);
		}
	}

	if (isInitializing) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col">
			<header className="container mx-auto px-8 py-8 flex justify-between items-center relative z-10">
				<Link to="/">
					<Logo />
				</Link>
			</header>

			<main className="flex-1 flex items-center justify-center px-4 relative z-10">
				<div className="w-full max-w-md">
					<Card className="backdrop-blur-xl border-[var(--border-subtle)]">
						<CardHeader className="text-center pb-2">
							<CardTitle className="text-3xl mb-2">Welcome! 👋</CardTitle>
							<CardDescription>Let's set up your organization</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-6">
								{error && (
									<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
										{error}
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="organization">Organization</Label>
									<Input
										id="organization"
										type="text"
										value={organization}
										onChange={(e) => setOrganization(e.target.value)}
										placeholder="Acme Inc"
										required
										autoComplete="organization"
										autoFocus
									/>
								</div>

								<Button type="submit" disabled={isLoading} className="w-full">
									{isLoading ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Creating organization...
										</>
									) : (
										"Continue"
									)}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

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
import { z } from "zod";

const onboardingSearchSchema = z.object({
	oauth_token: z.string().optional(),
	suggested_org_name: z.string().optional(),
});

export const Route = createFileRoute("/onboarding")({
	validateSearch: onboardingSearchSchema,
	component: OnboardingPage,
});

function OnboardingPage() {
	const navigate = useNavigate();
	const { oauth_token, suggested_org_name } = Route.useSearch();
	const { setTokens, setOnboardingComplete } = useAuth();
	const [organization, setOrganization] = useState(suggested_org_name ?? "");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!oauth_token) {
			const tokens = localStorage.getItem("mocktail_tokens");
			if (!tokens || !JSON.parse(tokens).accessToken) {
				navigate({ to: "/login" });
			}
		}
	}, [oauth_token, navigate]);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			if (oauth_token) {
				const result = await api.completeOAuthOnboarding(
					oauth_token,
					organization,
				);
				const tokens: TokenResponse = {
					accessToken: result.accessToken,
					refreshToken: result.refreshToken,
					expiresIn: result.expiresIn,
				};
				const me = await api.getMe(tokens.accessToken);
				setTokens(
					tokens,
					{
						id: me.id,
						email: me.email,
						emailVerifiedAt: me.emailVerifiedAt,
					},
					result.org,
					me.role,
				);
				setOnboardingComplete();
				navigate({ to: "/dashboard" });
			} else {
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
					me.role,
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

	if (!oauth_token) {
		const tokens = localStorage.getItem("mocktail_tokens");
		if (!tokens || !JSON.parse(tokens).accessToken) {
			return (
				<div className="min-h-screen flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
				</div>
			);
		}
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

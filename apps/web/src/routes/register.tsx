import { Logo } from "@/components/logo";
import { OAuthButtons } from "@/components/oauth-buttons";
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
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const {
		register,
		isAuthenticated,
		emailVerifiedAt,
		isLoading: authLoading,
	} = useAuth();
	const navigate = useNavigate();
	const [organization, setOrganization] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	if (isAuthenticated) {
		if (!emailVerifiedAt) {
			navigate({ to: "/check-email" });
		} else {
			navigate({ to: "/dashboard" });
		}
		return null;
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords don't match");
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		setIsLoading(true);

		try {
			await register(email, password, organization);
			navigate({ to: "/check-email" });
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex flex-col">
			<header className="container mx-auto px-8 py-8 flex justify-between items-center relative z-10">
				<Link to="/">
					<Logo />
				</Link>
				<Link
					to="/login"
					className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
				>
					Sign In
				</Link>
			</header>

			<main className="flex-1 flex items-center justify-center px-4 relative z-10">
				<div className="w-full max-w-md">
					<Card className="backdrop-blur-xl border-[var(--border-subtle)]">
						<CardHeader className="text-center pb-2">
							<CardTitle className="text-3xl mb-2">Create account</CardTitle>
							<CardDescription>Start mocking your APIs today</CardDescription>
						</CardHeader>
						<CardContent>
							<OAuthButtons />

							<form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="you@example.com"
										required
										autoComplete="email"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="password">Password</Label>
									<Input
										id="password"
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="••••••••"
										required
										autoComplete="new-password"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirm Password</Label>
									<Input
										id="confirmPassword"
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="••••••••"
										required
										autoComplete="new-password"
									/>
								</div>

								<Button type="submit" disabled={isLoading} className="w-full">
									{isLoading ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Creating account...
										</>
									) : (
										"Create account"
									)}
								</Button>
							</form>

							<p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
								Already have an account?{" "}
								<Link
									to="/login"
									className="text-[var(--glow-violet)] hover:underline font-medium"
								>
									Sign in
								</Link>
							</p>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

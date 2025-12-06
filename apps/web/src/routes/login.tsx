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
import { signIn, useSession } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/errors";
import {
	Link,
	Navigate,
	createFileRoute,
	useNavigate,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const { data: session, isPending: authLoading } = useSession();
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loginLoading, setLoginLoading] = useState(false);

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	if (session) {
		return <Navigate to="/dashboard" />;
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");
		setLoginLoading(true);

		try {
			const result = await signIn.email({ email, password });
			if (result.error) {
				if (result.error.code === "EMAIL_NOT_VERIFIED") {
					navigate({ to: "/check-email", search: { email } });
				} else {
					setError(result.error.message ?? "Login failed");
				}
			} else {
				navigate({ to: "/dashboard" });
			}
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setLoginLoading(false);
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
							<CardTitle className="text-3xl mb-2">Welcome back</CardTitle>
							<CardDescription>Sign in to your account</CardDescription>
						</CardHeader>
						<CardContent>
							<OAuthButtons />

							<form onSubmit={handleSubmit} className="space-y-6 mt-6">
								{error && (
									<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
										{error}
									</div>
								)}

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
									<div className="flex items-center justify-between">
										<Label htmlFor="password">Password</Label>
										<Link
											to="/forgot-password"
											className="text-sm text-[var(--glow-violet)] hover:underline"
										>
											Forgot password?
										</Link>
									</div>
									<Input
										id="password"
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="••••••••"
										required
										autoComplete="current-password"
									/>
								</div>

								<Button
									type="submit"
									disabled={loginLoading}
									className="w-full"
								>
									{loginLoading ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Signing in...
										</>
									) : (
										"Sign in"
									)}
								</Button>
							</form>

							<p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
								Don't have an account?{" "}
								<Link
									to="/register"
									className="text-[var(--glow-violet)] hover:underline font-medium"
								>
									Sign up
								</Link>
							</p>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

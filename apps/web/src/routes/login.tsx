import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const { login, isAuthenticated, isLoading: authLoading } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
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
		navigate({ to: "/dashboard" });
		return null;
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await login(email, password);
			navigate({ to: "/dashboard" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
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
			</header>

			<main className="flex-1 flex items-center justify-center px-4 relative z-10">
				<div className="w-full max-w-md">
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-8">
						<div className="text-center mb-8">
							<h1 className="text-3xl font-bold mb-2 font-['Outfit']">
								Welcome back
							</h1>
							<p className="text-[var(--text-secondary)]">
								Sign in to your account
							</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-6">
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

							<Button type="submit" disabled={isLoading} className="w-full">
								{isLoading ? (
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
					</div>
				</div>
			</main>
		</div>
	);
}

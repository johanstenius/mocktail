import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const { register, isAuthenticated, isLoading: authLoading } = useAuth();
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
				<Loader2 className="h-8 w-8 animate-spin text-white/50" />
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
			navigate({ to: "/dashboard" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Registration failed");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex flex-col">
			<header className="container mx-auto px-8 py-8 flex justify-between items-center relative z-10">
				<Link
					to="/"
					className="font-extrabold text-2xl tracking-tight uppercase text-white"
				>
					Mocktail
				</Link>
			</header>

			<main className="flex-1 flex items-center justify-center px-4 relative z-10">
				<div className="w-full max-w-md">
					<div className="glass-card rounded-2xl p-8">
						<div className="text-center mb-8">
							<h1 className="text-3xl font-bold mb-2">Create account</h1>
							<p className="text-white/60">Start mocking your APIs today</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-6">
							{error && (
								<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
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
									className="bg-white/5 border-white/10 focus:border-white/20"
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
									className="bg-white/5 border-white/10 focus:border-white/20"
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
									className="bg-white/5 border-white/10 focus:border-white/20"
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
									className="bg-white/5 border-white/10 focus:border-white/20"
								/>
							</div>

							<Button
								type="submit"
								disabled={isLoading}
								className="w-full bg-white text-black hover:bg-gray-200 font-semibold"
							>
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

						<p className="mt-6 text-center text-sm text-white/60">
							Already have an account?{" "}
							<Link
								to="/login"
								className="text-[var(--color-accent-2)] hover:underline font-medium"
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}

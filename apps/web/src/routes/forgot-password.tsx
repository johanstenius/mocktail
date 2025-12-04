import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/errors";
import { useForgotPassword } from "@johanstenius/auth-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const { sendResetEmail, isLoading, error: forgotError } = useForgotPassword();
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");

		try {
			await sendResetEmail(email);
			setIsSubmitted(true);
		} catch (err) {
			setError(getErrorMessage(err));
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
						{isSubmitted ? (
							<div className="text-center">
								<div className="w-16 h-16 rounded-full bg-[var(--glow-emerald)]/10 flex items-center justify-center mx-auto mb-6">
									<Mail className="w-8 h-8 text-[var(--glow-emerald)]" />
								</div>
								<h1 className="text-2xl font-bold mb-2 font-['Outfit']">
									Check your email
								</h1>
								<p className="text-[var(--text-secondary)] mb-6">
									If an account exists for {email}, you'll receive a password
									reset link shortly.
								</p>
								<Link
									to="/login"
									className="inline-flex items-center gap-2 text-[var(--glow-violet)] hover:underline font-medium"
								>
									<ArrowLeft className="w-4 h-4" />
									Back to login
								</Link>
							</div>
						) : (
							<>
								<div className="text-center mb-8">
									<h1 className="text-3xl font-bold mb-2 font-['Outfit']">
										Forgot password?
									</h1>
									<p className="text-[var(--text-secondary)]">
										Enter your email and we'll send you a reset link
									</p>
								</div>

								<form onSubmit={handleSubmit} className="space-y-6">
									{(error || forgotError) && (
										<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
											{error || forgotError?.message}
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

									<Button type="submit" disabled={isLoading} className="w-full">
										{isLoading ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Sending...
											</>
										) : (
											"Send reset link"
										)}
									</Button>
								</form>

								<p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
									<Link
										to="/login"
										className="inline-flex items-center gap-2 text-[var(--glow-violet)] hover:underline font-medium"
									>
										<ArrowLeft className="w-4 h-4" />
										Back to login
									</Link>
								</p>
							</>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

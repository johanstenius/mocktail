"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth-client";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";

function ResetPasswordContent() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		if (!token) {
			setError("Invalid reset link");
			return;
		}

		setIsLoading(true);
		const result = await resetPassword({ token, newPassword: password });
		if (result.error) {
			setError(result.error.message ?? "Reset failed");
		} else {
			setIsSuccess(true);
		}
		setIsLoading(false);
	}

	if (!token) {
		return (
			<div className="min-h-screen flex flex-col">
				<header className="container mx-auto px-8 py-8 flex justify-between items-center relative z-10">
					<Link href="/">
						<Logo />
					</Link>
				</header>

				<main className="flex-1 flex items-center justify-center px-4 relative z-10">
					<div className="w-full max-w-md">
						<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-8 text-center">
							<h1 className="text-2xl font-bold mb-4 font-['Outfit']">
								Invalid reset link
							</h1>
							<p className="text-[var(--text-secondary)] mb-6">
								This password reset link is invalid or has expired.
							</p>
							<Link
								href="/forgot-password"
								className="inline-flex items-center gap-2 text-[var(--glow-violet)] hover:underline font-medium"
							>
								Request a new link
							</Link>
						</div>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col">
			<header className="container mx-auto px-8 py-8 flex justify-between items-center relative z-10">
				<Link href="/">
					<Logo />
				</Link>
			</header>

			<main className="flex-1 flex items-center justify-center px-4 relative z-10">
				<div className="w-full max-w-md">
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-8">
						{isSuccess ? (
							<div className="text-center">
								<div className="w-16 h-16 rounded-full bg-[var(--glow-emerald)]/10 flex items-center justify-center mx-auto mb-6">
									<CheckCircle className="w-8 h-8 text-[var(--glow-emerald)]" />
								</div>
								<h1 className="text-2xl font-bold mb-2 font-['Outfit']">
									Password reset!
								</h1>
								<p className="text-[var(--text-secondary)] mb-6">
									Your password has been successfully reset.
								</p>
								<Button onClick={() => router.push("/login")}>
									Sign in
								</Button>
							</div>
						) : (
							<>
								<div className="text-center mb-8">
									<h1 className="text-3xl font-bold mb-2 font-['Outfit']">
										Set new password
									</h1>
									<p className="text-[var(--text-secondary)]">
										Enter your new password below
									</p>
								</div>

								<form onSubmit={handleSubmit} className="space-y-6">
									{error && (
										<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
											{error}
										</div>
									)}

									<div className="space-y-2">
										<Label htmlFor="password">New password</Label>
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
										<Label htmlFor="confirmPassword">Confirm password</Label>
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
												Resetting...
											</>
										) : (
											"Reset password"
										)}
									</Button>
								</form>

								<p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
									<Link
										href="/login"
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

export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
				</div>
			}
		>
			<ResetPasswordContent />
		</Suspense>
	);
}

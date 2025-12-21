"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { sendVerificationEmail, useSession } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/errors";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function CheckEmailContent() {
	const searchParams = useSearchParams();
	const queryEmail = searchParams.get("email");
	const { data: session, isPending: authLoading } = useSession();
	const [isResending, setIsResending] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);
	const [error, setError] = useState("");

	const isAuthenticated = !!session;
	const user = session?.user;

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	const displayEmail = user?.email ?? queryEmail;

	if (!displayEmail) {
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
							<p className="text-[var(--text-secondary)] mb-4">
								No email to verify.
							</p>
							<Link
								href="/login"
								className="text-[var(--glow-violet)] hover:underline font-medium"
							>
								Go to login
							</Link>
						</div>
					</div>
				</main>
			</div>
		);
	}

	async function handleResend() {
		if (!displayEmail) return;
		setIsResending(true);
		setError("");
		setResendSuccess(false);

		try {
			await sendVerificationEmail({ email: displayEmail });
			setResendSuccess(true);
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setIsResending(false);
		}
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
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-8 text-center">
						<div className="w-16 h-16 rounded-full bg-[var(--glow-violet)]/10 flex items-center justify-center mx-auto mb-6">
							<Mail className="w-8 h-8 text-[var(--glow-violet)]" />
						</div>
						<h1 className="text-2xl font-bold mb-2 ">Check your email</h1>
						<p className="text-[var(--text-secondary)] mb-2">
							We sent a verification link to
						</p>
						<p className="text-[var(--text-primary)] font-medium mb-6">
							{displayEmail}
						</p>
						<p className="text-[var(--text-secondary)] text-sm mb-6">
							Click the link in the email to verify your account and get
							started.
						</p>

						{error && (
							<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
								{error}
							</div>
						)}

						{resendSuccess && (
							<div className="p-3 rounded-xl bg-[var(--glow-emerald)]/10 border border-[var(--glow-emerald)]/20 text-[var(--glow-emerald)] text-sm mb-4">
								Verification email sent!
							</div>
						)}

						{isAuthenticated && (
							<Button
								variant="outline"
								onClick={handleResend}
								disabled={isResending}
								className="w-full"
							>
								{isResending ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Sending...
									</>
								) : (
									<>
										<RefreshCw className="h-4 w-4 mr-2" />
										Resend verification email
									</>
								)}
							</Button>
						)}

						<p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
							Wrong email?{" "}
							<Link
								href="/register"
								className="text-[var(--glow-violet)] hover:underline font-medium"
							>
								Try again
							</Link>
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}

export default function CheckEmailPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
				</div>
			}
		>
			<CheckEmailContent />
		</Suspense>
	);
}

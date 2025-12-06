import { Logo } from "@/components/logo";
import { useSession, verifyEmail } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/errors";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
	token: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
	validateSearch: searchSchema,
	component: VerifyEmailPage,
});

function VerifyEmailPage() {
	const { token } = Route.useSearch();
	const navigate = useNavigate();
	const { refetch } = useSession();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);

	useEffect(() => {
		if (!token) {
			setIsLoading(false);
			setError("Invalid verification link");
			return;
		}

		verifyEmail({ token })
			.then(async (result) => {
				if (result.error) {
					setError(result.error.message ?? "Verification failed");
				} else {
					await refetch();
					setIsSuccess(true);
					setTimeout(() => navigate({ to: "/dashboard" }), 1500);
				}
			})
			.catch((err: unknown) => {
				setError(getErrorMessage(err));
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [token, refetch, navigate]);

	return (
		<div className="min-h-screen flex flex-col">
			<header className="container mx-auto px-8 py-8 flex justify-between items-center relative z-10">
				<Link to="/">
					<Logo />
				</Link>
			</header>

			<main className="flex-1 flex items-center justify-center px-4 relative z-10">
				<div className="w-full max-w-md">
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-8 text-center">
						{isLoading ? (
							<>
								<Loader2 className="w-12 h-12 animate-spin text-[var(--text-muted)] mx-auto mb-4" />
								<h1 className="text-2xl font-bold mb-2 font-['Outfit']">
									Verifying email...
								</h1>
								<p className="text-[var(--text-secondary)]">
									Please wait while we verify your email address.
								</p>
							</>
						) : isSuccess ? (
							<>
								<div className="w-16 h-16 rounded-full bg-[var(--glow-emerald)]/10 flex items-center justify-center mx-auto mb-6">
									<CheckCircle className="w-8 h-8 text-[var(--glow-emerald)]" />
								</div>
								<h1 className="text-2xl font-bold mb-2 font-['Outfit']">
									Email verified!
								</h1>
								<p className="text-[var(--text-secondary)]">
									Redirecting to dashboard...
								</p>
							</>
						) : (
							<>
								<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
									<XCircle className="w-8 h-8 text-red-400" />
								</div>
								<h1 className="text-2xl font-bold mb-2 font-['Outfit']">
									Verification failed
								</h1>
								<p className="text-[var(--text-secondary)] mb-6">{error}</p>
								<Link
									to="/login"
									className="inline-flex items-center gap-2 text-[var(--glow-violet)] hover:underline font-medium"
								>
									Go to login
								</Link>
							</>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

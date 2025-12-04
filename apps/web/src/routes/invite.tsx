import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	useAcceptInvite,
	useAuth,
	useInviteDetails,
} from "@johanstenius/auth-react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle, Loader2, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
	token: z.string().optional(),
});

export const Route = createFileRoute("/invite")({
	validateSearch: searchSchema,
	component: InvitePage,
});

function InvitePage() {
	const { token } = Route.useSearch();
	const navigate = useNavigate();
	const { isAuthenticated, user, isLoading: authLoading } = useAuth();

	const {
		invite: inviteInfo,
		isLoading: isLoadingInvite,
		error: inviteError,
	} = useInviteDetails(token ?? "");

	const {
		acceptInvite,
		isLoading: isAccepting,
		error: acceptError,
	} = useAcceptInvite();

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);

	const isExistingUser = inviteInfo && user?.email === inviteInfo.email;
	const needsPassword = inviteInfo && !isExistingUser && !isAuthenticated;

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");

		if (needsPassword) {
			if (password !== confirmPassword) {
				setError("Passwords do not match");
				return;
			}
			if (password.length < 8) {
				setError("Password must be at least 8 characters");
				return;
			}
		}

		if (!token) {
			setError("Invalid invite link");
			return;
		}

		try {
			await acceptInvite(token);
			setIsSuccess(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to accept invite");
		}
	}

	if (authLoading || isLoadingInvite) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	if (!token || inviteError || !inviteInfo) {
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
							<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
								<AlertCircle className="w-8 h-8 text-red-400" />
							</div>
							<h1 className="text-2xl font-bold mb-4 font-['Outfit']">
								Invalid invite
							</h1>
							<p className="text-[var(--text-secondary)] mb-6">
								{inviteError?.message ||
									"This invite link is invalid or has expired."}
							</p>
							<Link
								to="/login"
								className="inline-flex items-center gap-2 text-[var(--glow-violet)] hover:underline font-medium"
							>
								Go to login
							</Link>
						</div>
					</div>
				</main>
			</div>
		);
	}

	if (isSuccess) {
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
							<div className="w-16 h-16 rounded-full bg-[var(--glow-emerald)]/10 flex items-center justify-center mx-auto mb-6">
								<CheckCircle className="w-8 h-8 text-[var(--glow-emerald)]" />
							</div>
							<h1 className="text-2xl font-bold mb-2 font-['Outfit']">
								Welcome to {inviteInfo.organization.name}!
							</h1>
							<p className="text-[var(--text-secondary)] mb-6">
								You've joined as {inviteInfo.role}.
							</p>
							<Button onClick={() => navigate({ to: "/dashboard" })}>
								Go to Dashboard
							</Button>
						</div>
					</div>
				</main>
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
					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-8">
						<div className="text-center mb-8">
							<div className="w-16 h-16 rounded-full bg-[var(--glow-violet)]/10 flex items-center justify-center mx-auto mb-6">
								<Users className="w-8 h-8 text-[var(--glow-violet)]" />
							</div>
							<h1 className="text-2xl font-bold mb-2 font-['Outfit']">
								Join {inviteInfo.organization.name}
							</h1>
							<p className="text-[var(--text-secondary)]">
								You've been invited to join as{" "}
								<strong>{inviteInfo.role}</strong>
							</p>
							<p className="text-sm text-[var(--text-muted)] mt-2">
								{inviteInfo.email}
							</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-6">
							{(error || acceptError) && (
								<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
									{error || acceptError?.message}
								</div>
							)}

							{needsPassword && (
								<>
									<div className="space-y-2">
										<Label htmlFor="password">Create password</Label>
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
								</>
							)}

							{isExistingUser && (
								<p className="text-sm text-[var(--text-secondary)] text-center">
									You're signed in as {user?.email}. Click below to join.
								</p>
							)}

							<Button type="submit" disabled={isAccepting} className="w-full">
								{isAccepting ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Joining...
									</>
								) : (
									"Accept Invite"
								)}
							</Button>
						</form>

						{!isAuthenticated && (
							<p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
								Already have an account?{" "}
								<Link
									to="/login"
									className="text-[var(--glow-violet)] hover:underline font-medium"
								>
									Sign in first
								</Link>
							</p>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { organization, useSession } from "@/lib/auth-client";
import { AlertCircle, CheckCircle, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useState } from "react";

type InviteInfo = {
	email: string;
	role: string;
	organization: { name: string };
};

function InviteContent() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const router = useRouter();
	const { data: session, isPending: authLoading } = useSession();

	const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
	const [isLoadingInvite, setIsLoadingInvite] = useState(true);
	const [inviteError, setInviteError] = useState<string | null>(null);
	const [isAccepting, setIsAccepting] = useState(false);
	const [acceptError, setAcceptError] = useState<string | null>(null);

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);

	const isAuthenticated = !!session;
	const user = session?.user;

	useEffect(() => {
		if (!token) {
			setIsLoadingInvite(false);
			setInviteError("Invalid invite link");
			return;
		}

		organization
			.getInvitation({ query: { id: token } })
			.then((result) => {
				if (result.data) {
					setInviteInfo({
						email: result.data.email,
						role: result.data.role,
						organization: { name: result.data.organizationName },
					});
				} else {
					setInviteError("Invalid or expired invite");
				}
			})
			.catch(() => {
				setInviteError("Failed to load invite");
			})
			.finally(() => {
				setIsLoadingInvite(false);
			});
	}, [token]);

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

		setIsAccepting(true);
		try {
			await organization.acceptInvitation({ invitationId: token });
			setIsSuccess(true);
		} catch (err) {
			setAcceptError(
				err instanceof Error ? err.message : "Failed to accept invite",
			);
		} finally {
			setIsAccepting(false);
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
					<Link href="/">
						<Logo />
					</Link>
				</header>

				<main className="flex-1 flex items-center justify-center px-4 relative z-10">
					<div className="w-full max-w-md">
						<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-8 text-center">
							<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
								<AlertCircle className="w-8 h-8 text-red-400" />
							</div>
							<h1 className="text-2xl font-bold mb-4 ">
								Invalid invite
							</h1>
							<p className="text-[var(--text-secondary)] mb-6">
								{inviteError || "This invite link is invalid or has expired."}
							</p>
							<Link
								href="/login"
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
					<Link href="/">
						<Logo />
					</Link>
				</header>

				<main className="flex-1 flex items-center justify-center px-4 relative z-10">
					<div className="w-full max-w-md">
						<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] backdrop-blur-xl rounded-2xl p-8 text-center">
							<div className="w-16 h-16 rounded-full bg-[var(--glow-emerald)]/10 flex items-center justify-center mx-auto mb-6">
								<CheckCircle className="w-8 h-8 text-[var(--glow-emerald)]" />
							</div>
							<h1 className="text-2xl font-bold mb-2 ">
								Welcome to {inviteInfo.organization.name}!
							</h1>
							<p className="text-[var(--text-secondary)] mb-6">
								You&apos;ve joined as {inviteInfo.role}.
							</p>
							<Button onClick={() => router.push("/dashboard")}>
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
				<Link href="/">
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
							<h1 className="text-2xl font-bold mb-2 ">
								Join {inviteInfo.organization.name}
							</h1>
							<p className="text-[var(--text-secondary)]">
								You&apos;ve been invited to join as{" "}
								<strong>{inviteInfo.role}</strong>
							</p>
							<p className="text-sm text-[var(--text-muted)] mt-2">
								{inviteInfo.email}
							</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-6">
							{(error || acceptError) && (
								<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
									{error || acceptError}
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
									You&apos;re signed in as {user?.email}. Click below to join.
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
									href="/login"
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

export default function InvitePage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
				</div>
			}
		>
			<InviteContent />
		</Suspense>
	);
}
